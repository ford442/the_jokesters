import { describe, it, expect, vi } from 'vitest'
import { GroupChatManager } from '../../src/GroupChatManager'
import { LlamaCppEngineAdapter } from '../../src/llm/LlamaCppEngineAdapter'
import { normalizeOptions } from '../../src/llm/LLMEngine'

describe('Repetition Penalty Bug #398', () => {
    it('GroupChatManager sets a repetition penalty > 1.0', () => {
        // We can inspect the private property by casting to any
        const manager = new GroupChatManager([]) as any
        expect(manager.REPETITION_PENALTY).toBeGreaterThan(1.0)
    })

    it('LlamaCppEngineAdapter sets penalty_repeat to > 1.0 when fallback is needed', async () => {
        const adapter = new LlamaCppEngineAdapter() as any

        // Mock the internal wllama instance to avoid throwing
        adapter.wllama = {
            createChatCompletion: vi.fn().mockResolvedValue({ choices: [{ message: { content: 'test' } }] })
        }
        adapter.initialized = true

        await adapter.chatComplete([{ role: 'user', content: 'hello' }], { max_tokens: 10 })

        expect(adapter.wllama.createChatCompletion).toHaveBeenCalled()
        const callArgs = adapter.wllama.createChatCompletion.mock.calls[0][0]

        expect(callArgs.penalty_repeat).toBeGreaterThan(1.0)
    })
})
