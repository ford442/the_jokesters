/**
 * Jokesters-specific messages layered on top of web-llm's worker protocol
 * (`WebWorkerMLCEngine` ⇄ `WebWorkerMLCEngineHandler`).
 *
 * Requests (main → worker) reuse web-llm's `{ kind, uuid, content }` envelope and are
 * answered with web-llm's own `return` / `throw` messages, so they resolve through the
 * client's normal `getPromise()` bookkeeping. Events (worker → main) have no uuid.
 */

/** main → worker: build the comedy logit-processor registry for `modelId` before `reload`. */
export const MLC_WORKER_SET_LOGIT_PROCESSORS = 'jokesters:setLogitProcessors'
/** main → worker: tokenize `text` with the loaded model's tokenizer; returns the token count. */
export const MLC_WORKER_COUNT_TOKENS = 'jokesters:countTokens'
/** worker → main: a GPUDevice created inside the worker was lost. */
export const MLC_WORKER_DEVICE_LOST = 'jokesters:deviceLost'

export interface MlcWorkerSetLogitProcessorsContent {
  modelId: string
}

export interface MlcWorkerCountTokensContent {
  text: string
}

export interface MlcWorkerDeviceLostContent {
  message: string
  reason: string
}
