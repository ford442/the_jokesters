import { describe, expect, it } from 'vitest'
import { GroupChatManager } from '../../src/GroupChatManager'
import { MockLLMEngine } from '../../src/llm/MockLLMEngine'
import { agents } from '../../src/config/agents'
import { EMPTY_TURN_RETRY_SUFFIX } from '../../src/chat/speakableText'

async function makeManager(engineId = 'mock') {
  const manager = new GroupChatManager(agents.map((a) => ({ ...a })))
  const engine = new MockLLMEngine(engineId, 'Mock')
  await engine.initialize({
    id: engineId,
    name: 'Mock',
    vram_required_MB: 0,
    context_window_size: 2048,
  })
  manager.attachSessionForTests(engine, engineId)
  return { manager, engine }
}

describe('empty-turn retry / skip', () => {
  it('retries once with English suffix and max_tokens >= 96, then speaks the retry', async () => {
    const { manager, engine } = await makeManager()
    engine.queueResponses('😂', 'The banana is a contract.')
    const spoken: string[] = []

    const result = await manager.chat('Setup line', (s) => spoken.push(s), { maxTokens: 48 })

    expect(engine.chatCalls).toHaveLength(2)
    expect(engine.chatCalls[1].options.max_tokens).toBeGreaterThanOrEqual(96)
    const retryUser = engine.chatCalls[1].messages.filter((m) => m.role === 'user').at(-1)
    expect(String(retryUser?.content)).toContain(EMPTY_TURN_RETRY_SUFFIX.trim())
    expect(result.response).toMatch(/banana/i)
    expect(spoken.join(' ')).toMatch(/banana/i)
    expect(spoken.some((s) => /😂/.test(s))).toBe(false)
    const history = manager.getHistory()
    expect(history.some((m) => m.role === 'assistant' && /banana/i.test(m.content))).toBe(true)
    expect(history.some((m) => m.role === 'assistant' && m.content.includes('😂'))).toBe(false)
  })

  it('skips the agent and does not poison history when retry is still emoji-only', async () => {
    const { manager, engine } = await makeManager()
    engine.queueResponses('😂', '🤣')
    const spoken: string[] = []
    const firstAgent = manager.getCurrentAgent().id

    const result = await manager.chat('(Reply naturally to the last thing said)', (s) => spoken.push(s))

    expect(result.response).toBe('')
    expect(spoken).toEqual([])
    expect(manager.getHistory()).toEqual([])
    expect(manager.getCurrentAgent().id).not.toBe(firstAgent)
    expect(engine.chatCalls).toHaveLength(2)
  })

  it('does not retry when the first reply is speakable', async () => {
    const { manager, engine } = await makeManager()
    engine.queueResponses('The banana is a contract.')
    const spoken: string[] = []

    const result = await manager.chat('Hello', (s) => spoken.push(s), { maxTokens: 48 })

    expect(engine.chatCalls).toHaveLength(1)
    expect(result.response).toMatch(/banana/i)
    expect(spoken.length).toBeGreaterThan(0)
  })

  it('prerenderTurns retries then skips unspeakable slots without enqueueing them', async () => {
    const { manager, engine } = await makeManager()
    engine.queueResponses('😂', '🤣', 'The scientist measures the bit.')

    const turns = await manager.prerenderTurns('Start the scene', 1)

    expect(turns).toHaveLength(1)
    expect(turns[0].response).toMatch(/scientist/i)
    expect(turns.some((t) => /😂|🤣/.test(t.response))).toBe(false)
  })
})
