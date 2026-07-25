import { describe, expect, it, vi } from 'vitest'
import type { ModeContext } from '../../src/Director/modes/ModeContext'
import type { Scenario } from '../../src/Director/Director'
import { ComedySession } from '../../src/comedy/ComedySession'
import { runIntergalacticBakeOffLoop } from '../../src/Director/modes/DreamModes_Scifi'

describe('Dream mode comedy wiring (chatForAgentWithComedy)', () => {
  it('injects a callback prompt and retries a weak line through the quality gate', async () => {
    const comedy = new ComedySession()
    vi.spyOn(comedy, 'maybeInjectCallbackPrompt').mockReturnValue('(SYSTEM: callback bring it back!)')
    const rateSpy = vi
      .spyOn(comedy, 'rateAndMaybeRetry')
      .mockReturnValueOnce({ passed: false, score: 2, qualityPrompt: '(SYSTEM: punch it up!)' })
      .mockReturnValue({ passed: true, score: 9 })

    const chatCalls: Array<{ agentId: string; prompt: string }> = []
    const manager = {
      chatForAgent: vi.fn(async (agentId: string, prompt: string, onSentence: (s: string) => Promise<void> | void) => {
        chatCalls.push({ agentId, prompt })
        await onSentence(`line from ${agentId} #${chatCalls.length}`)
        return { agentId, response: '' }
      }),
    }

    const spoken: string[] = []
    let isRunningCalls = 0

    const ctx: ModeContext = {
      manager: manager as any,
      callbacks: {
        onMessage: () => {},
        onSpeak: async (sentence: string) => {
          spoken.push(sentence)
        },
        onTurnStart: async () => {},
        onTurnEnd: async () => {},
      } as any,
      chaosLevel: 0,
      interruptQueue: [],
      isRunning: () => {
        isRunningCalls += 1
        // First two checks (loop entry, post-input) stay true for one iteration; then stop.
        return isRunningCalls <= 2
      },
      processTurn: vi.fn(),
      processScriptBeat: vi.fn(),
      stopScene: () => {},
      waitForInput: vi.fn().mockResolvedValue('a cake woven from gravity itself'),
      searchAndRecall: vi.fn().mockResolvedValue(null),
      memoryManager: null,
      comedy,
      recordCallbackVisual: () => {},
    }

    vi.spyOn(Math, 'random').mockReturnValue(0.1) // force the "chaotic judge" branch

    const scenario = { title: 'Bake-off test', config: {} } as unknown as Scenario

    await runIntergalacticBakeOffLoop(scenario, ctx)

    vi.restoreAllMocks()

    // Callback injection: every prompt sent to the LLM carries the comedy session's callback line.
    expect(chatCalls.length).toBeGreaterThan(0)
    expect(chatCalls.every((c) => c.prompt.includes('(SYSTEM: callback bring it back!)'))).toBe(true)

    // Quality gate: the first (weak) response triggered a punch-up retry to the same agent.
    expect(rateSpy).toHaveBeenCalled()
    expect(chatCalls.some((c) => c.prompt.includes('(SYSTEM: punch it up!)'))).toBe(true)
    expect(spoken.length).toBeGreaterThanOrEqual(chatCalls.length)
  })
})
