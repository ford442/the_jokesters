/**
 * Optional comedy extensions from the custom @mlc-ai/web-llm fork.
 * Duck-typed so the default npm package path is unchanged.
 */
import * as webllm from '@mlc-ai/web-llm'

type ComedyLogitProcessorCtor = new (options?: {
  ngramSize?: number
  ngramPenalty?: number
  clichéTokenIds?: number[]
  clichéPenalty?: number
}) => unknown

/**
 * When the custom fork is loaded, register a ComedyLogitProcessor per model id.
 */
export function buildComedyLogitProcessorRegistry(
  modelId: string,
): Map<string, unknown> | undefined {
  const ComedyLP = (webllm as { ComedyLogitProcessor?: ComedyLogitProcessorCtor })
    .ComedyLogitProcessor
  if (typeof ComedyLP !== 'function') {
    return undefined
  }

  return new Map([
    [
      modelId,
      new ComedyLP({
        ngramSize: 4,
        ngramPenalty: 2.5,
        clichéPenalty: 1.5,
      }),
    ],
  ])
}
