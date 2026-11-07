import { describe, expect, it, vi } from 'vitest'
import { chatForAgentWithComedy } from '../../src/comedy/comedyModeHelpers'
import type { ModeContext } from '../../src/Director/modes/ModeContext'

type Event =
  | { t: 'turnStart'; agent: string }
  | { t: 'thinking'; agent: string; on: boolean }
  | { t: 'chat'; agent: string; prompt: string }
  | { t: 'speak'; sentence: string }
  | { t: 'turnEnd' }

interface StubOptions {
  /** One entry per `chatForAgent` call: sentences streamed back, or an Error to throw. */
  replies: Array<string[] | Error>
  /** Quality gate verdicts, one per `rateAndMaybeRetry` call. */
  assessments?: Array<{ passed: boolean; score: number; qualityPrompt?: string }>
  withThinking?: boolean
}

function stubCtx({ replies, assessments = [], withThinking = true }: StubOptions) {
  const events: Event[] = []
  let chatCall = 0
  let assessCall = 0

  const ctx = {
    manager: {
      chatForAgent: async (agent: string, prompt: string, onSentence: (s: string) => Promise<void>) => {
        events.push({ t: 'chat', agent, prompt })
        const reply = replies[chatCall++] ?? []
        if (reply instanceof Error) throw reply
        for (const sentence of reply) await onSentence(sentence)
        return { agentId: agent, response: reply.join(' ') }
      },
    },
    callbacks: {
      onMessage: () => {},
      onSpeak: async () => {},
      onTurnStart: async (agent: string) => { events.push({ t: 'turnStart', agent }) },
      onTurnEnd: async () => { events.push({ t: 'turnEnd' }) },
      ...(withThinking
        ? { onThinking: (agent: string, on: boolean) => { events.push({ t: 'thinking', agent, on }) } }
        : {}),
    },
    comedy: assessments.length
      ? {
          maybeInjectCallbackPrompt: () => null,
          getSpotlightCallback: () => null,
          getTurnCount: () => 0,
          rateAndMaybeRetry: () => assessments[assessCall++] ?? { passed: true, score: 5 },
          handleAgentResponse: () => {},
        }
      : null,
    getArcPromptInjection: () => null,
    recordSceneBeat: () => {},
  }
  return { ctx: ctx as unknown as ModeContext, events }
}

const onSpeak = async (sentence: string): Promise<void> => {
  void sentence
}

describe('chatForAgentWithComedy — think pose', () => {
  it('raises the think pose before generation and drops it when the first sentence arrives', async () => {
    const { ctx, events } = stubCtx({ replies: [['First line.', 'Second line.']] })
    const spoken: string[] = []
    const text = await chatForAgentWithComedy(ctx, 'comedian', 'go', async (s) => {
      events.push({ t: 'speak', sentence: s })
      spoken.push(s)
    })

    expect(text).toBe('First line. Second line.')
    expect(events.map((e) => (e.t === 'thinking' ? `thinking:${e.on}` : e.t === 'speak' ? 'speak' : e.t))).toEqual([
      'turnStart',
      'thinking:true',
      'chat',
      'thinking:false', // first sentence → talking, not thinking
      'speak',
      'speak',
      'turnEnd',
    ])
    expect(events.filter((e) => e.t === 'thinking').every((e) => e.t === 'thinking' && e.agent === 'comedian')).toBe(true)
  })

  it('also thinks during the quality-gate retry', async () => {
    const { ctx, events } = stubCtx({
      replies: [['Weak joke.'], ['Much better joke.']],
      assessments: [{ passed: false, score: 1, qualityPrompt: '(punch it up)' }],
    })
    const text = await chatForAgentWithComedy(ctx, 'scientist', 'go', onSpeak)

    expect(text).toBe('Much better joke.')
    const thinking = events.filter((e) => e.t === 'thinking').map((e) => (e.t === 'thinking' ? e.on : null))
    expect(thinking).toEqual([true, false, true, false]) // one up/down pair per generation pass
    const chats = events.filter((e) => e.t === 'chat')
    expect(chats).toHaveLength(2)
    // Each pass raised the pose before its own chat call.
    const order = events.map((e) => (e.t === 'thinking' ? `thinking:${e.on}` : e.t))
    expect(order.indexOf('chat')).toBeGreaterThan(order.indexOf('thinking:true'))
    expect(order.lastIndexOf('thinking:true')).toBeLessThan(order.lastIndexOf('chat'))
  })

  it('drops the think pose when generation throws (no actor left stuck thinking)', async () => {
    const { ctx, events } = stubCtx({ replies: [new Error('GPU lost')] })
    await expect(chatForAgentWithComedy(ctx, 'robot', 'go', onSpeak)).rejects.toThrow('GPU lost')

    const thinking = events.filter((e) => e.t === 'thinking').map((e) => (e.t === 'thinking' ? e.on : null))
    expect(thinking).toEqual([true, false])
  })

  it('drops the think pose when the model produces no sentences', async () => {
    const { ctx, events } = stubCtx({ replies: [[]] })
    const text = await chatForAgentWithComedy(ctx, 'robot', 'go', onSpeak)

    expect(text).toBeNull()
    const thinking = events.filter((e) => e.t === 'thinking').map((e) => (e.t === 'thinking' ? e.on : null))
    expect(thinking).toEqual([true, false])
  })

  it('still works when the host provides no onThinking callback', async () => {
    const { ctx, events } = stubCtx({ replies: [['Line.']], withThinking: false })
    const text = await chatForAgentWithComedy(ctx, 'comedian', 'go', onSpeak)

    expect(text).toBe('Line.')
    expect(events.some((e) => e.t === 'thinking')).toBe(false)
  })

  it('keeps the onThinking spy honest: never more downs than ups', async () => {
    const onThinking = vi.fn()
    const { ctx } = stubCtx({
      replies: [['Weak.'], ['Strong.']],
      assessments: [{ passed: false, score: 0, qualityPrompt: '(again)' }],
    })
    ;(ctx.callbacks as { onThinking?: typeof onThinking }).onThinking = onThinking
    await chatForAgentWithComedy(ctx, 'comedian', 'go', onSpeak)

    const ups = onThinking.mock.calls.filter((c) => c[1] === true).length
    const downs = onThinking.mock.calls.filter((c) => c[1] === false).length
    expect(ups).toBe(2)
    expect(downs).toBe(2)
  })
})
