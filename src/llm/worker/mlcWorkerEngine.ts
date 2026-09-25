/**
 * Main-thread client for the MLC Web Worker (`./mlc.worker.ts`).
 *
 * `JokestersWorkerMLCEngine` extends web-llm's stock `WebWorkerMLCEngine` (same
 * `chat.completions` / `interruptGenerate` / `unload` surface as `MLCEngine`) and adds:
 * - device-lost events from the worker (fails the in-flight load / generation → OOM path)
 * - worker crash / startup failure detection (never leaves a promise hanging)
 * - `countTokens()` via the worker-side tokenizer
 * - `dispose()`: interrupt → unload (bounded) → `worker.terminate()`, so a hot-swap or
 *   OOM retry never leaks a second engine / GPUDevice.
 *
 * Opt-out: `?legacyLlm` keeps in-process `CreateMLCEngine` on the main thread.
 */
import * as webllm from '@mlc-ai/web-llm'
import { deviceLostErrorMessage } from '../webgpuLimits'
import {
  MLC_WORKER_COUNT_TOKENS,
  MLC_WORKER_DEVICE_LOST,
  MLC_WORKER_SET_LOGIT_PROCESSORS,
  type MlcWorkerDeviceLostContent,
} from './mlcWorkerProtocol'

export type MlcRuntime = 'worker' | 'main'

/** Query param that forces the legacy in-process (main-thread) MLC engine. */
export const LEGACY_LLM_QUERY_PARAM = 'legacyLlm'

/**
 * Pick where MLC runs. Worker by default; main thread when `Worker` is unavailable
 * (Node / Vitest) or when `?legacyLlm` (any value except `0` / `false`) is present.
 */
export function resolveMlcRuntime(
  env: { search?: string; hasWorker?: boolean } = {},
): MlcRuntime {
  const hasWorker = env.hasWorker ?? typeof Worker !== 'undefined'
  if (!hasWorker) return 'main'

  let search = env.search
  if (search === undefined) {
    try {
      search = typeof location !== 'undefined' ? location.search : ''
    } catch {
      search = ''
    }
  }
  const params = new URLSearchParams(search)
  if (params.has(LEGACY_LLM_QUERY_PARAM)) {
    const value = (params.get(LEGACY_LLM_QUERY_PARAM) ?? '').toLowerCase()
    if (value !== '0' && value !== 'false') return 'main'
  }
  return 'worker'
}

/**
 * Keep `new URL(...)` inlined inside `new Worker(...)`: Vite only bundles the worker
 * (to `assets/mlc.worker-[hash].js`) when it can see that exact pattern.
 */
export function spawnMlcWorker(): Worker {
  return new Worker(new URL('./mlc.worker.ts', import.meta.url), {
    type: 'module',
    name: 'jokesters-mlc',
  })
}

/** The worker script never came up (bad bundle, CSP, 404) — caller may fall back to main thread. */
export class MlcWorkerStartupError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MlcWorkerStartupError'
  }
}

/** Minimal Worker surface used here (lets unit tests pass a fake). */
export interface MlcWorkerLike {
  onmessage: ((event: MessageEvent) => void) | null | undefined
  postMessage(message: unknown): void
  terminate(): void
  addEventListener(type: 'error' | 'messageerror', listener: (event: Event) => void): void
  removeEventListener(type: 'error' | 'messageerror', listener: (event: Event) => void): void
}

type PendingCallback = (msg: { kind: 'throw'; uuid: string; content: unknown }) => void

function toError(reason: unknown): Error {
  if (reason instanceof Error) return reason
  // web-llm's handler posts `err.toString()` → "Error: <message>"
  const text = String(reason).replace(/^Error:\s*/, '')
  return new Error(text)
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | undefined> {
  return Promise.race([
    promise,
    new Promise<undefined>((resolve) => setTimeout(() => resolve(undefined), ms)),
  ])
}

export class JokestersWorkerMLCEngine extends webllm.WebWorkerMLCEngine {
  private readonly rawWorker: MlcWorkerLike
  /** True once any message arrived — the worker module evaluated successfully. */
  private workerAlive = false
  private loaded = false
  private disposed = false
  private fatalError: Error | null = null

  constructor(worker: MlcWorkerLike, engineConfig?: webllm.MLCEngineConfig) {
    super(worker as unknown as ConstructorParameters<typeof webllm.WebWorkerMLCEngine>[0], engineConfig)
    this.rawWorker = worker
    worker.addEventListener('error', this.onWorkerError)
    worker.addEventListener('messageerror', this.onWorkerMessageError)
  }

  /** Stock web-llm routing, plus Jokesters worker → main events. */
  onmessage(event: unknown): void {
    const msg = (event instanceof MessageEvent ? event.data : event) as {
      kind?: string
      uuid?: string
      content?: unknown
    }
    this.workerAlive = true

    if (msg?.kind === MLC_WORKER_DEVICE_LOST) {
      this.handleDeviceLost(msg.content as MlcWorkerDeviceLostContent)
      return
    }
    // A reply for a request we already failed (terminate / device lost): drop it instead
    // of letting web-llm throw "return from a unknown uuid".
    if ((msg?.kind === 'return' || msg?.kind === 'throw') && !this.pending().has(msg.uuid ?? '')) {
      return
    }
    super.onmessage(event)
  }

  /** Rejects immediately once the worker is dead, and normalizes worker string errors. */
  protected getPromise<T>(msg: webllm.WorkerRequest): Promise<T> {
    if (this.fatalError) return Promise.reject(this.fatalError)
    return (super.getPromise(msg) as unknown as Promise<T>).catch((reason: unknown) => {
      throw toError(reason)
    })
  }

  /** Fire-and-forget like the base class, but never produces an unhandled rejection. */
  interruptGenerate(): void {
    if (this.fatalError) return
    this.getPromise<null>({
      kind: 'interruptGenerate',
      uuid: crypto.randomUUID(),
      content: null,
    }).catch(() => {
      /* worker already gone — nothing to interrupt */
    })
  }

  /**
   * Set up the worker-side logit processors, then load weights. Any failure before the
   * worker answers at all surfaces as `MlcWorkerStartupError`.
   */
  async load(modelId: string, chatOpts?: webllm.ChatOptions): Promise<void> {
    await this.getPromise<null>({
      kind: MLC_WORKER_SET_LOGIT_PROCESSORS,
      uuid: crypto.randomUUID(),
      content: { modelId },
    } as unknown as webllm.WorkerRequest)
    await this.reload(modelId, chatOpts)
    this.loaded = true
  }

  /** Token count from the worker-side tokenizer (0 when unavailable). */
  async countTokens(text: string): Promise<number> {
    if (!text) return 0
    const count = await this.getPromise<number>({
      kind: MLC_WORKER_COUNT_TOKENS,
      uuid: crypto.randomUUID(),
      content: { text },
    } as unknown as webllm.WorkerRequest)
    return typeof count === 'number' && count > 0 ? count : 0
  }

  isDisposed(): boolean {
    return this.disposed
  }

  /**
   * Graceful teardown for hot-swap: interrupt, try to `unload()` (frees the GPUDevice
   * immediately) with a bound, then terminate the worker regardless.
   */
  async dispose(unloadTimeoutMs = 3000): Promise<void> {
    if (this.disposed) return
    if (!this.fatalError) {
      this.interruptGenerate()
      try {
        await withTimeout(this.unload(), unloadTimeoutMs)
      } catch (error) {
        console.warn('[MLC worker] unload before terminate failed (non-fatal):', error)
      }
    }
    this.terminateWorker('MLC worker terminated')
  }

  /** Hard kill: terminates the worker and rejects every pending request. Idempotent. */
  terminateWorker(reason = 'MLC worker terminated'): void {
    if (this.disposed) return
    this.disposed = true
    this.rawWorker.removeEventListener('error', this.onWorkerError)
    this.rawWorker.removeEventListener('messageerror', this.onWorkerMessageError)
    this.rawWorker.terminate()
    this.fail(new Error(reason))
  }

  private pending(): Map<string, PendingCallback> {
    return (this as unknown as { pendingPromise: Map<string, PendingCallback> }).pendingPromise
  }

  private fail(error: Error): void {
    if (!this.fatalError) this.fatalError = error
    const pending = this.pending()
    const callbacks = [...pending.values()]
    pending.clear()
    for (const cb of callbacks) cb({ kind: 'throw', uuid: '', content: error })
  }

  private handleDeviceLost(info: MlcWorkerDeviceLostContent): void {
    // `destroyed` = our own unload(); anything else is a real loss (OOM, driver reset).
    if (info?.reason === 'destroyed') return
    const error = new Error(
      deviceLostErrorMessage(
        { message: info?.message ?? '', reason: info?.reason ?? 'unknown' },
        this.loaded ? 'runtime' : 'init',
      ),
    )
    console.warn('[MLC worker]', error.message)
    this.fail(error)
  }

  private readonly onWorkerError = (event: Event): void => {
    const detail = (event as ErrorEvent).message || 'unknown error'
    if (!this.workerAlive) {
      this.fail(new MlcWorkerStartupError(`MLC worker failed to start: ${detail}`))
      return
    }
    // Uncaught error inside a live worker — web-llm tasks report their own failures via
    // `throw` messages, so keep the engine but surface it.
    console.error('[MLC worker] uncaught error:', detail)
  }

  private readonly onWorkerMessageError = (): void => {
    console.error('[MLC worker] message could not be deserialized')
  }
}

/**
 * Spawn a worker and load `modelId` in it. On any failure the worker is terminated
 * before rethrowing, so its GPU memory is released before the OOM step-down retries.
 */
export async function createMlcWorkerEngine(
  modelId: string,
  engineConfig: Pick<webllm.MLCEngineConfig, 'appConfig' | 'initProgressCallback'>,
  chatOpts?: webllm.ChatOptions,
  spawn: () => MlcWorkerLike = spawnMlcWorker,
): Promise<JokestersWorkerMLCEngine> {
  const engine = new JokestersWorkerMLCEngine(spawn(), engineConfig)
  try {
    await engine.load(modelId, chatOpts)
    return engine
  } catch (error) {
    engine.terminateWorker('MLC worker load failed')
    throw error
  }
}

export function isWorkerMlcEngine(engine: unknown): engine is JokestersWorkerMLCEngine {
  return engine instanceof JokestersWorkerMLCEngine
}
