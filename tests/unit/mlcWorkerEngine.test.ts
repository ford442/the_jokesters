import { describe, expect, it } from 'vitest'
import {
  JokestersWorkerMLCEngine,
  MlcWorkerStartupError,
  createMlcWorkerEngine,
  resolveMlcRuntime,
  type MlcWorkerLike,
} from '../../src/llm/worker/mlcWorkerEngine'
import {
  MLC_WORKER_COUNT_TOKENS,
  MLC_WORKER_DEVICE_LOST,
  MLC_WORKER_SET_LOGIT_PROCESSORS,
} from '../../src/llm/worker/mlcWorkerProtocol'
import { MlcEngineAdapter } from '../../src/llm/MlcEngineAdapter'
import { getMlcEngineContextWindow } from '../../src/llm/mlcEngineCreate'
import { categorizeChatError } from '../../src/chat/chatErrors'

interface Msg {
  kind: string
  uuid: string
  content: any
}

type Handler = (msg: Msg, worker: FakeWorker) => void

/**
 * Stand-in for a dedicated Worker running `WebWorkerMLCEngineHandler`: replies with
 * web-llm's `{ kind: 'return' | 'throw', uuid, content }` protocol on a microtask.
 */
class FakeWorker implements MlcWorkerLike {
  onmessage: ((event: any) => void) | null = null
  readonly sent: Msg[] = []
  terminated = false
  private readonly listeners = new Map<string, Set<(event: Event) => void>>()

  constructor(private readonly handler: Handler = replyNull) {}

  postMessage(message: unknown): void {
    if (this.terminated) return
    const msg = message as Msg
    this.sent.push(msg)
    queueMicrotask(() => this.handler(msg, this))
  }

  emit(msg: Partial<Msg>): void {
    if (!this.terminated) this.onmessage?.(msg)
  }

  reply(uuid: string, content: unknown): void {
    this.emit({ kind: 'return', uuid, content })
  }

  fail(uuid: string, content: string): void {
    this.emit({ kind: 'throw', uuid, content })
  }

  dispatchError(message: string): void {
    for (const l of this.listeners.get('error') ?? []) l({ message } as unknown as Event)
  }

  terminate(): void {
    this.terminated = true
  }

  addEventListener(type: string, listener: (event: Event) => void): void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set())
    this.listeners.get(type)!.add(listener)
  }

  removeEventListener(type: string, listener: (event: Event) => void): void {
    this.listeners.get(type)?.delete(listener)
  }

  kinds(): string[] {
    return this.sent.map((m) => m.kind)
  }
}

/** Fire-and-forget config messages get no reply (like the real handler); everything else returns null. */
function replyNull(msg: Msg, worker: FakeWorker): void {
  if (msg.kind === 'setAppConfig' || msg.kind === 'setLogLevel') return
  worker.reply(msg.uuid, null)
}

const APP_CONFIG = { model_list: [{ model_id: 'Test-3B', model: 'https://x/', model_lib: 'https://x/lib.wasm' }] }

describe('resolveMlcRuntime', () => {
  it('defaults to the worker when Worker exists', () => {
    expect(resolveMlcRuntime({ hasWorker: true, search: '' })).toBe('worker')
    expect(resolveMlcRuntime({ hasWorker: true, search: '?mode=party' })).toBe('worker')
  })

  it('?legacyLlm keeps the main-thread engine (unless explicitly 0/false)', () => {
    expect(resolveMlcRuntime({ hasWorker: true, search: '?legacyLlm' })).toBe('main')
    expect(resolveMlcRuntime({ hasWorker: true, search: '?legacyLlm=1' })).toBe('main')
    expect(resolveMlcRuntime({ hasWorker: true, search: '?legacyLlm=0' })).toBe('worker')
    expect(resolveMlcRuntime({ hasWorker: true, search: '?legacyLlm=false' })).toBe('worker')
  })

  it('falls back to main thread without Worker (Node / Vitest)', () => {
    expect(resolveMlcRuntime({ hasWorker: false, search: '' })).toBe('main')
    expect(resolveMlcRuntime()).toBe('main')
  })
})

describe('JokestersWorkerMLCEngine load', () => {
  it('sets up worker-side logit processors, then reloads with the dynamic appConfig + chatOpts', async () => {
    const worker = new FakeWorker()
    const progress: string[] = []
    const engine = await createMlcWorkerEngine(
      'Test-3B',
      { appConfig: APP_CONFIG, initProgressCallback: (r) => progress.push(r.text) },
      { context_window_size: 2048, prefill_chunk_size: 512 },
      () => worker,
    )

    expect(worker.kinds()).toEqual(['setAppConfig', MLC_WORKER_SET_LOGIT_PROCESSORS, 'reload'])
    expect(worker.sent[0].content).toEqual(APP_CONFIG)
    expect(worker.sent[1].content).toEqual({ modelId: 'Test-3B' })
    expect(worker.sent[2].content).toEqual({
      modelId: ['Test-3B'],
      chatOpts: [{ context_window_size: 2048, prefill_chunk_size: 512 }],
    })

    // initProgressCallback still reaches the main-thread loading UI
    worker.emit({ kind: 'initProgressCallback', uuid: '', content: { progress: 0.5, timeElapsed: 1, text: 'Fetching' } })
    expect(progress).toEqual(['Fetching'])

    expect(worker.terminated).toBe(false)
    expect(getMlcEngineContextWindow(engine)).toBe(2048) // array chatOpts on the worker client
  })

  it('device loss during load rejects as OOM and terminates the worker (frees VRAM before step-down)', async () => {
    const worker = new FakeWorker((msg, w) => {
      if (msg.kind === 'reload') {
        w.emit({ kind: MLC_WORKER_DEVICE_LOST, uuid: '', content: { message: 'out of memory', reason: 'unknown' } })
        return
      }
      replyNull(msg, w)
    })

    const err = await createMlcWorkerEngine('Test-3B', { appConfig: APP_CONFIG }, {}, () => worker).catch((e) => e)
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toMatch(/during model initialization.*device is lost/)
    expect(categorizeChatError(err)).toBe('oom')
    expect(worker.terminated).toBe(true)
  })

  it('normalizes web-llm string errors from the worker into Error objects', async () => {
    const worker = new FakeWorker((msg, w) => {
      if (msg.kind === 'reload') return w.fail(msg.uuid, 'Error: createBuffer failed: size too large')
      replyNull(msg, w)
    })

    const err = await createMlcWorkerEngine('Test-3B', { appConfig: APP_CONFIG }, {}, () => worker).catch((e) => e)
    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe('createBuffer failed: size too large')
    expect(categorizeChatError(err)).toBe('oom')
    expect(worker.terminated).toBe(true)
  })

  it('reports a worker that never started as MlcWorkerStartupError (caller falls back to main thread)', async () => {
    const worker = new FakeWorker(() => {
      /* bundle failed to evaluate: never answers */
    })
    const pending = createMlcWorkerEngine('Test-3B', { appConfig: APP_CONFIG }, {}, () => worker)
    await Promise.resolve()
    worker.dispatchError("Unexpected token ':'")

    const err = await pending.catch((e) => e)
    expect(err).toBeInstanceOf(MlcWorkerStartupError)
    expect(err.message).toMatch(/failed to start/)
    expect(worker.terminated).toBe(true)
  })

  it('ignores device-lost with reason "destroyed" (our own unload)', async () => {
    const worker = new FakeWorker()
    const engine = await createMlcWorkerEngine('Test-3B', { appConfig: APP_CONFIG }, {}, () => worker)
    worker.emit({ kind: MLC_WORKER_DEVICE_LOST, uuid: '', content: { message: '', reason: 'destroyed' } })
    await expect(engine.countTokens('still alive')).resolves.toBe(0)
  })
})

describe('JokestersWorkerMLCEngine teardown', () => {
  it('dispose() interrupts, unloads, terminates, and fails later calls fast', async () => {
    const worker = new FakeWorker()
    const engine = await createMlcWorkerEngine('Test-3B', { appConfig: APP_CONFIG }, {}, () => worker)

    await engine.dispose()
    expect(worker.kinds().slice(-2)).toEqual(['interruptGenerate', 'unload'])
    expect(worker.terminated).toBe(true)
    expect(engine.isDisposed()).toBe(true)

    await expect(engine.countTokens('hello')).rejects.toThrow(/terminated/)
    await engine.dispose() // idempotent
  })

  it('dispose() is bounded when the worker never answers unload (stuck prefill)', async () => {
    const worker = new FakeWorker((msg, w) => {
      if (msg.kind === 'unload') return // hung
      replyNull(msg, w)
    })
    const engine = await createMlcWorkerEngine('Test-3B', { appConfig: APP_CONFIG }, {}, () => worker)

    await engine.dispose(20)
    expect(worker.terminated).toBe(true)
  })

  it('rejects in-flight requests on terminate and drops their late replies', async () => {
    let heldUuid = ''
    const worker = new FakeWorker((msg, w) => {
      if (msg.kind === MLC_WORKER_COUNT_TOKENS) {
        heldUuid = msg.uuid
        return
      }
      replyNull(msg, w)
    })
    const engine = await createMlcWorkerEngine('Test-3B', { appConfig: APP_CONFIG }, {}, () => worker)

    const inFlight = engine.countTokens('never answered')
    await Promise.resolve()
    engine.terminateWorker()
    await expect(inFlight).rejects.toThrow(/terminated/)

    // A reply that was already queued when we terminated must not throw "unknown uuid".
    expect(() => engine.onmessage({ kind: 'return', uuid: heldUuid, content: 3 })).not.toThrow()
  })

  it('post-load device loss fails the in-flight generation request (runtime OOM path)', async () => {
    const worker = new FakeWorker((msg, w) => {
      if (msg.kind === MLC_WORKER_COUNT_TOKENS) {
        w.emit({ kind: MLC_WORKER_DEVICE_LOST, uuid: '', content: { message: 'driver reset', reason: 'unknown' } })
        return
      }
      replyNull(msg, w)
    })
    const engine = await createMlcWorkerEngine('Test-3B', { appConfig: APP_CONFIG }, {}, () => worker)

    const err = await engine.countTokens('x').catch((e) => e)
    expect(err.message).toBe('GPU device lost: driver reset — device is lost')
    expect(categorizeChatError(err)).toBe('oom')
  })
})

describe('MlcEngineAdapter over the worker client', () => {
  /** Simulates the worker-side chat generator, honouring interruptGenerate between chunks. */
  function streamingWorker(chunks: string[]) {
    const state = { interrupted: false, index: 0, finished: false }
    const chunk = (content: string) => ({ choices: [{ delta: { content } }] })
    const worker = new FakeWorker((msg, w) => {
      switch (msg.kind) {
        case 'interruptGenerate':
          state.interrupted = true
          return w.reply(msg.uuid, null)
        case 'chatCompletionStreamInit':
          state.index = 0
          state.interrupted = false
          state.finished = false
          return w.reply(msg.uuid, null)
        case 'completionStreamNextChunk': {
          if (state.finished) return w.reply(msg.uuid, undefined)
          if (state.interrupted || state.index >= chunks.length) {
            state.finished = true // web-llm releases its per-model lock here
            return w.reply(msg.uuid, chunk(''))
          }
          return w.reply(msg.uuid, chunk(chunks[state.index++]))
        }
        case MLC_WORKER_COUNT_TOKENS:
          return w.reply(msg.uuid, Math.ceil((msg.content.text as string).length / 4))
        default:
          return replyNull(msg, w)
      }
    })
    return { worker, state }
  }

  async function adapterWith(worker: FakeWorker): Promise<MlcEngineAdapter> {
    const engine = await createMlcWorkerEngine('Test-3B', { appConfig: APP_CONFIG }, { context_window_size: 1024 }, () => worker)
    const adapter = new MlcEngineAdapter()
    ;(adapter as unknown as { engine: JokestersWorkerMLCEngine }).engine = engine
    ;(adapter as unknown as { initialized: boolean }).initialized = true
    return adapter
  }

  it('streams chunks from the worker', async () => {
    const { worker } = streamingWorker(['Hello ', 'there.'])
    const adapter = await adapterWith(worker)

    let text = ''
    for await (const event of adapter.chat([{ role: 'user', content: 'hi' }], {})) {
      text += typeof event === 'string' ? event : event.content
    }
    expect(text).toBe('Hello there.')
    expect(adapter.getRuntime()).toBe('worker')
    expect(adapter.getContextWindowSize()).toBe(1024)
  })

  it('an abandoned stream is interrupted and drained so the next request is not deadlocked', async () => {
    const { worker, state } = streamingWorker(['one ', 'two ', 'three ', 'four '])
    const adapter = await adapterWith(worker)

    for await (const _event of adapter.chat([{ role: 'user', content: 'hi' }], {})) {
      break // consumer bails after the first chunk
    }
    expect(worker.kinds()).toContain('interruptGenerate')
    expect(state.finished).toBe(true)
  })

  it('countTokensAsync tokenizes in the worker; sync countTokens defers (null)', async () => {
    const { worker } = streamingWorker([])
    const adapter = await adapterWith(worker)
    expect(adapter.countTokens('twelve chars')).toBeNull()
    await expect(adapter.countTokensAsync('twelve chars')).resolves.toBe(3)
  })

  it('terminate() disposes the worker (hot-swap leaves no second engine)', async () => {
    const { worker } = streamingWorker([])
    const adapter = await adapterWith(worker)

    await adapter.terminate()
    expect(worker.kinds()).toContain('unload')
    expect(worker.terminated).toBe(true)
    expect(adapter.isInitialized()).toBe(false)
    expect(adapter.getRuntime()).toBeNull()
  })
})
