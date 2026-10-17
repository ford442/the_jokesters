import { describe, expect, it } from 'vitest'
import { GroupChatManager, type PromptLayout } from '../../src/GroupChatManager'
import { MockLLMEngine } from '../../src/llm/MockLLMEngine'
import type { ChatMessage, GenerationOptions } from '../../src/llm/LLMEngine'
import type { ChatStreamEvent } from '../../src/llm/streamEvents'
import { agents } from '../../src/config/agents'
import { buildWritersRoomSystemPrompt, compactPersona, buildSpeakerCue } from '../../src/chat/writersRoom'
import { prefillReduction, summarizeTurnMetrics } from '../../src/chat/turnMetrics'

const tokens = (text: string) => Math.ceil(text.length / 4)
const contentOf = (m: ChatMessage) => (typeof m.content === 'string' ? m.content : JSON.stringify(m.content))

/**
 * Mirrors web-llm's multi-round rule (compareConversationObject): the KV cache is reused only
 * when messages[:-1] equal the previous request's messages plus the reply it produced; then
 * only the last message is prefilled. Reports usage like web-llm (`prompt_tokens`).
 */
class KvSimEngine extends MockLLMEngine {
  private stored: ChatMessage[] | null = null
  reuses = 0
  resets = 0
  private turn = 0

  async *chat(messages: ChatMessage[], options: GenerationOptions): AsyncGenerator<ChatStreamEvent> {
    const prefix = messages.slice(0, -1)
    const reused = this.stored !== null && JSON.stringify(prefix) === JSON.stringify(this.stored)
    if (reused) this.reuses++
    else this.resets++
    const prefill = reused ? tokens(contentOf(messages.at(-1)!)) : messages.reduce((n, m) => n + tokens(contentOf(m)), 0)

    let output = ''
    for await (const chunk of super.chat(messages, options)) {
      output += typeof chunk === 'string' ? chunk : chunk.content
      yield chunk
    }
    if (!output) output = `Line number ${++this.turn} is a zinger. `
    this.stored = [...messages, { role: 'assistant', content: output }]
    options.onUsage?.({ prefillTokens: prefill, completionTokens: tokens(output), ttftMs: prefill / 10, decodeTokPerSec: 30 })
  }
}

async function makeManager(layout: PromptLayout, contextTokens = 4096) {
  const manager = new GroupChatManager(agents.map((a) => ({ ...a })))
  manager.setPromptLayout(layout)
  const engine = new KvSimEngine()
  await engine.initialize({ id: 'mock', name: 'Mock', vram_required_MB: 0, context_window_size: contextTokens })
  engine.queueResponses(...Array.from({ length: 200 }, (_, i) => `Zinger ${i}: the stage is on fire again, folks.`))
  manager.attachSessionForTests(engine, 'mock')
  return { manager, engine }
}

async function runTurns(manager: GroupChatManager, turns: number, note?: (i: number) => string | undefined) {
  for (let i = 0; i < turns; i++) {
    await manager.chat(i === 0 ? 'Topic: haunted startups' : '(Reply naturally to the last thing said)', undefined, {
      hiddenInstruction: note?.(i),
    })
  }
}

describe("writers' room prompt layout", () => {
  it('extends the previous request exactly, so every turn after the first reuses the KV cache', async () => {
    const { manager, engine } = await makeManager('writers-room')
    manager.setMemoryDepth(30) // 12 turns = 24 messages: no depth trim in this run
    await runTurns(manager, 12, (i) => (i % 4 === 2 ? 'Raise the stakes.' : undefined))
    expect(engine.resets).toBe(1)
    expect(engine.reuses).toBe(11)
    // One shared system prompt for everyone.
    const systems = new Set(engine.chatCalls.map((c) => c.messages[0].content))
    expect(systems.size).toBe(1)
  })

  it('cuts median prefill tokens after turn 3 by ≥60% vs the per-speaker layout', async () => {
    const legacy = await makeManager('per-speaker')
    legacy.manager.setMemoryDepth(30)
    await runTurns(legacy.manager, 12, (i) => (i % 4 === 2 ? 'Raise the stakes.' : undefined))
    const room = await makeManager('writers-room')
    room.manager.setMemoryDepth(30)
    await runTurns(room.manager, 12, (i) => (i % 4 === 2 ? 'Raise the stakes.' : undefined))

    const baseline = summarizeTurnMetrics(legacy.manager.getTurnMetrics())
    const after = summarizeTurnMetrics(room.manager.getTurnMetrics())
    expect(legacy.engine.reuses).toBe(0)
    expect(prefillReduction(baseline, after)!).toBeGreaterThanOrEqual(0.6)
  })

  it('puts the speaker cue and Director note in the last user message only', async () => {
    const { manager, engine } = await makeManager('writers-room')
    const speaker = manager.getCurrentAgent()
    await manager.chat('Topic: tax season', undefined, { hiddenInstruction: 'Be suspicious.' })
    const sent = engine.chatCalls[0].messages
    expect(sent[0].role).toBe('system')
    expect(String(sent[0].content)).not.toContain('Be suspicious.')
    expect(sent.at(-1)).toEqual({ role: 'user', content: `Topic: tax season\n\n${buildSpeakerCue(speaker, 'Be suspicious.')}` })
    // Display history stays clean; the engine copy keeps the exact prompt + raw reply.
    const [user, reply] = manager.getHistory()
    expect(user.content).toBe('Topic: tax season')
    expect(user.engineContent).toContain('the Director whispers: Be suspicious.')
    expect(reply.engineContent ?? reply.content).toMatch(/Zinger 0/)
  })

  it('trims history in blocks so the prefix is rebuilt rarely', async () => {
    const { manager, engine } = await makeManager('writers-room', 1024)
    manager.setMemoryDepth(30)
    await runTurns(manager, 40)
    const breaks = manager.getTurnMetrics().filter((m) => m.chainBreak === 'trim').length
    expect(breaks).toBeGreaterThan(0)
    expect(engine.resets).toBe(breaks + 1)
    expect(engine.reuses).toBeGreaterThanOrEqual(40 - 1 - breaks)
    expect(breaks).toBeLessThan(10)
    // Every request fits the context budget (reply reserve included).
    const info = manager.getContextWindowInfo()!
    expect(info.usedTokens + info.reserveTokens).toBeLessThanOrEqual(1024)
    expect(info.hasSummary).toBe(true)
  })

  it('rate-limits Director critiques on the main engine and parses them as JSON', async () => {
    const { manager, engine } = await makeManager('writers-room')
    await runTurns(manager, 3)
    engine.queueResponses('{"status": "STAGNANT", "instruction": "A meteor hits the stage.", "memory": "zoom_in"}')
    const critique = await manager.getDirectorCritique()
    expect(critique).toMatchObject({ status: 'stagnant', instruction: 'A meteor hits the stage.', memoryHint: 'zoom_in' })
    // Too soon for another one: no engine call.
    const calls = engine.chatCalls.length
    expect((await manager.getDirectorCritique()).status).toBe('unknown')
    expect(engine.chatCalls.length).toBe(calls)
    // The next turn records the chain break the critique caused.
    await runTurns(manager, 1)
    expect(manager.getTurnMetrics().at(-1)?.chainBreak).toBe('critique')
  })

  it('compacts persona prompts to the context budget and drops repeated boilerplate', () => {
    const prompt = buildWritersRoomSystemPrompt(agents, 'Keep it clean.', { contextTokens: 1024 })
    expect(prompt.match(/End every reply with "###"/g)).toHaveLength(1)
    expect(prompt).not.toMatch(/DO NOT start sentences with your name/)
    for (const a of agents) expect(prompt).toContain(`### ${a.name}`)
    expect(tokens(prompt)).toBeLessThan(1024 * 0.5)
    expect(compactPersona('One. Two. Three.', 9)).toBe('One. Two.')
  })
})
