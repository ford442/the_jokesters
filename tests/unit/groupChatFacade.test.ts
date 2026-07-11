import { describe, expect, it } from 'vitest'
import { categorizeChatError } from '../../src/chat/chatErrors'
import { GroupChatManager } from '../../src/GroupChatManager'
import { ConversationStore } from '../../src/chat/ConversationStore'
import { DynamicContextManager } from '../../src/utils/dynamicContext'
import { MockLLMEngine } from '../../src/llm/MockLLMEngine'
import { agents } from '../../src/config/agents'

describe('categorizeChatError / GroupChatManager.getErrorCategory', () => {
  it('classifies webgpu errors', () => {
    expect(categorizeChatError(new Error('WebGPU not available'))).toBe('webgpu')
    expect(GroupChatManager.getErrorCategory('GPU not supported in this browser')).toBe('webgpu')
  })

  it('classifies OOM errors', () => {
    expect(categorizeChatError(new Error('GPU OOM during CreateBuffer'))).toBe('oom')
    expect(categorizeChatError(new Error('mapAsync failed: buffer was unmapped'))).toBe('oom')
  })

  it('classifies network errors', () => {
    expect(categorizeChatError(new Error('fetch failed: ERR_CONNECTION_REFUSED'))).toBe('network')
  })

  it('classifies llamacpp mismatch', () => {
    expect(categorizeChatError(new Error('llama.cpp runtime mismatch'))).toBe('llamacpp_mismatch')
  })

  it('returns unknown for non-errors', () => {
    expect(categorizeChatError(42)).toBe('unknown')
  })
})

describe('ConversationStore', () => {
  it('reconciles history when context window shrinks', () => {
    const store = new ConversationStore(
      agents.map((a) => ({ ...a, systemPrompt: a.systemPrompt.slice(0, 80) })),
    )
    for (let i = 0; i < 20; i++) {
      store.addTurn(`user turn ${i} with some padding text`, `assistant reply ${i} with padding`)
    }
    expect(store.getHistoryLength()).toBe(40)

    const mgr = new DynamicContextManager(256)
    store.reconcileHistoryAfterContextChange(mgr, 32)
    expect(store.getHistoryLength()).toBeLessThan(40)
    expect(store.getHistoryLength()).toBeGreaterThan(0)
  })
})

describe('LLMEngine interrupt semantics', () => {
  it('MockLLMEngine interrupt is idempotent', async () => {
    const engine = new MockLLMEngine()
    await engine.initialize({
      id: 'mock-model',
      name: 'Mock',
      vram_required_MB: 0,
      context_window_size: 2048,
    })
    engine.queueResponses('Hello world from mock.')
    const gen = engine.chat([{ role: 'user', content: 'hi' }], { max_tokens: 32 })
    await engine.interrupt()
    await engine.interrupt()
    expect(engine.getInterruptCount()).toBe(2)
    for await (const _ of gen) {
      /* drain */
    }
  })

  it('hot-swap preserves reconciled history via facade', async () => {
    const gcm = new GroupChatManager(agents.map((a) => ({ ...a })))
    const small = new MockLLMEngine('mock-small', 'Small')
    await small.initialize({
      id: 'small',
      name: 'Small',
      vram_required_MB: 0,
      context_window_size: 512,
    })
    small.setContextWindowSize(512)
    gcm.attachSessionForTests(small, 'small')

    for (let i = 0; i < 12; i++) {
      gcm.addToHistory(`Question ${i} with extra words`, `Answer ${i} with extra words`)
    }
    const before = gcm.getHistoryLength()

    const large = new MockLLMEngine('mock-large', 'Large')
    await large.initialize({
      id: 'large',
      name: 'Large',
      vram_required_MB: 0,
      context_window_size: 8192,
    })
    gcm.attachSessionForTests(large, 'large')

    expect(gcm.getLoadedModelId()).toBe('large')
    expect(gcm.getContextManager().getMaxContextTokens()).toBe(8192)
    expect(gcm.getHistoryLength()).toBeLessThanOrEqual(before)
  })
})
