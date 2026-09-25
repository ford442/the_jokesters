/**
 * MLC WebLLM Web Worker — runs `MLCEngine` (weights fetch, prefill, decode) off the
 * main thread so Three.js rAF, lip-sync and the Director loop keep ticking during
 * long prefills.
 *
 * Spawned by `spawnMlcWorker()` in `./mlcWorkerEngine.ts`. That call MUST keep
 * `new Worker(new URL('./mlc.worker.ts', import.meta.url), …)` inlined so Vite bundles
 * this file to `assets/mlc.worker-[hash].js` (see tests/unit/mlcWorkerBundling.test.ts).
 *
 * Main-thread-only state that web-llm relies on is re-installed here, because a worker
 * has its own globals:
 * - VPS `/resolve/main/` fetch + Cache.add rewrites (`installVpsFetch`)
 * - WebGPU max-buffer-limit intercept + device-lost reporting (`webgpuLimits`)
 * - Comedy logit-processor registry (functions cannot cross postMessage)
 */
import '../../utils/installVpsFetch'
import { WebWorkerMLCEngineHandler } from '@mlc-ai/web-llm'
import type { LogitProcessor } from '@mlc-ai/web-llm'
import { buildComedyLogitProcessorRegistry } from '../webllmComedyExtensions'
import { interceptWebGpuAdapterLimits } from '../webgpuLimits'
import {
  MLC_WORKER_COUNT_TOKENS,
  MLC_WORKER_DEVICE_LOST,
  MLC_WORKER_SET_LOGIT_PROCESSORS,
  type MlcWorkerCountTokensContent,
  type MlcWorkerDeviceLostContent,
  type MlcWorkerSetLogitProcessorsContent,
} from './mlcWorkerProtocol'

interface WorkerMessage {
  kind?: string
  uuid?: string
  content?: unknown
}

type TokenizerPipelineMap = Map<string, { tokenizer?: { encode: (s: string) => { length: number } } }>

class JokestersMlcWorkerHandler extends WebWorkerMLCEngineHandler {
  onmessage(event: unknown, onComplete?: (value: unknown) => void, onError?: () => void): void {
    const msg = (event instanceof MessageEvent ? event.data : event) as WorkerMessage
    switch (msg?.kind) {
      case MLC_WORKER_SET_LOGIT_PROCESSORS: {
        const { modelId } = msg.content as MlcWorkerSetLogitProcessorsContent
        void this.handleTask(msg.uuid ?? '', async () => {
          const registry = buildComedyLogitProcessorRegistry(modelId)
          this.setLogitProcessorRegistry(registry as Map<string, LogitProcessor> | undefined)
          return null
        })
        return
      }
      case MLC_WORKER_COUNT_TOKENS: {
        const { text } = msg.content as MlcWorkerCountTokensContent
        void this.handleTask(msg.uuid ?? '', async () => {
          const pipelineMap = (this.engine as unknown as { loadedModelIdToPipeline?: TokenizerPipelineMap })
            .loadedModelIdToPipeline
          const pipeline = pipelineMap?.values().next().value
          return pipeline?.tokenizer?.encode(text).length ?? 0
        })
        return
      }
      default:
        super.onmessage(event, onComplete, onError)
    }
  }
}

const handler = new JokestersMlcWorkerHandler()

const workerNav = navigator as unknown as { gpu?: Parameters<typeof interceptWebGpuAdapterLimits>[0] }
if (workerNav.gpu) {
  // One worker hosts one engine for its whole lifetime, so the intercept is never restored.
  interceptWebGpuAdapterLimits(workerNav.gpu, (info) => {
    const content: MlcWorkerDeviceLostContent = { message: info.message, reason: info.reason }
    handler.postMessage({ kind: MLC_WORKER_DEVICE_LOST, uuid: '', content })
  })
}

self.onmessage = (event: MessageEvent) => {
  handler.onmessage(event)
}

self.addEventListener('unhandledrejection', (event) => {
  console.warn('[MLC worker] unhandled rejection:', (event as PromiseRejectionEvent).reason)
})
