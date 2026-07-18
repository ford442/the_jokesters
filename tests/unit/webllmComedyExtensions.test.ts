import { describe, expect, it } from 'vitest'
import { buildComedyLogitProcessorRegistry } from '../../src/llm/webllmComedyExtensions'

describe('buildComedyLogitProcessorRegistry', () => {
  it('returns undefined when ComedyLogitProcessor is not on the runtime module', () => {
    // Default npm @mlc-ai/web-llm in unit tests does not export ComedyLogitProcessor.
    expect(buildComedyLogitProcessorRegistry('hermes-3-llama-3.2-3b')).toBeUndefined()
  })
})
