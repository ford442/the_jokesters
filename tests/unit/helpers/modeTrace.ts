import { createHash } from 'node:crypto'
import { vi } from 'vitest'
import type { ModeContext } from '../../../src/Director/modes/ModeContext'

export type TraceEvent =
  | { t: 'msg'; sender: string; message: string; color: string }
  | { t: 'chat'; agent: string; prompt: string }
  | { t: 'speak'; sentence: string; agent: string }

export interface TraceOptions {
  /** Sequential answers for `waitForInput`; once exhausted the scene stops and '' is returned. */
  inputs: string[]
  /** Values `Math.random` cycles through, starting at `rollOffset`. */
  rolls?: number[]
  rollOffset?: number
  /** Flip `isRunning` to false once this many agent turns have been played. */
  stopAfterChats?: number
}

/**
 * Fake `ModeContext` that records what a mode loop does, with no LLM. Callers must
 * `vi.mock('.../comedyModeHelpers')` with {@link recordingChatForAgentWithComedy}'s
 * result so each agent turn lands in the trace.
 */
export function createTraceCtx(opts: TraceOptions) {
  const events: TraceEvent[] = []
  let running = true
  let inputIdx = 0
  let chats = 0

  const ctx = {
    manager: {} as never,
    callbacks: {
      onMessage: (sender: string, message: string, color: string) => {
        events.push({ t: 'msg', sender, message, color })
      },
      onSpeak: async (sentence: string, agent: string) => {
        events.push({ t: 'speak', sentence, agent })
      },
      onTurnStart: async () => {},
      onTurnEnd: async () => {},
    },
    chaosLevel: 0,
    interruptQueue: [],
    isRunning: () => running,
    processTurn: vi.fn(),
    processScriptBeat: vi.fn(),
    stopScene: () => {
      running = false
    },
    waitForInput: async () => {
      if (inputIdx < opts.inputs.length) return opts.inputs[inputIdx++]
      running = false
      return ''
    },
    searchAndRecall: vi.fn().mockResolvedValue(null),
    memoryManager: null,
    comedy: null,
    recordCallbackVisual: () => {},
    recordSceneBeat: () => {},
    getArcPromptInjection: () => null,
  } as unknown as ModeContext

  /** Stand-in for `chatForAgentWithComedy` that records the turn and speaks one line. */
  const recordingChatForAgentWithComedy = async (
    _ctx: ModeContext,
    agent: string,
    prompt: string,
    onSpeak: (sentence: string) => Promise<void>,
  ) => {
    events.push({ t: 'chat', agent, prompt })
    chats += 1
    await onSpeak(`line ${chats}`)
    if (opts.stopAfterChats !== undefined && chats >= opts.stopAfterChats) running = false
    return `line ${chats}`
  }

  const rolls = opts.rolls ?? [0.5]
  let rollIdx = opts.rollOffset ?? 0
  const randomSpy = vi.spyOn(Math, 'random').mockImplementation(() => rolls[rollIdx++ % rolls.length])

  return { ctx, events, recordingChatForAgentWithComedy, restore: () => randomSpy.mockRestore() }
}

/** Rolls chosen to stay clear of every threshold (0.3, 0.4, 0.33/0.66 thirds) so old and new agree. */
export const TRACE_ROLLS = [0.05, 0.2, 0.31, 0.5, 0.65, 0.8, 0.95, 0.12, 0.45, 0.72, 0.9, 0.37]

export const TRACE_CONFIGS: Record<string, Record<string, string>> = {
  default: {},
  // `$&`, `$1`, `{{input}}` etc. must survive interpolation untouched.
  custom: {
    realityShowName: 'Show $& "Q" $1', auctionItem: 'Item $& $`', museumItem: "Spoon 'n' {{input}}",
    jobTitle: 'Job $$ {{x}}', cookingIngredient: 'Dish $&', natureTask: 'Task $1', roommateChore: 'Chore {{input}}',
    courtCase: 'Case $&', gameShowTopic: 'Topic $`',
  },
}
export const TRACE_INPUTS = ['first $& "answer"', 'second {{input}} answer', 'third']

type ChatImpl = Awaited<ReturnType<typeof createTraceCtx>>['recordingChatForAgentWithComedy']
type Loop = (scenario: never, ctx: ModeContext) => Promise<void>

/**
 * Runs `loop` across configs x roll offsets x early-stop and returns one sha256 per case, plus
 * the distinct `(agent, prompt)` literals seen with the default config (user input shown as `<INPUT>`).
 */
export async function digestLoop(loop: Loop, setChatImpl: (impl: ChatImpl) => void) {
  const digests: string[] = []
  const prompts: Array<[string, string]> = []
  const seen = new Set<string>()
  for (const [cfgName, config] of Object.entries(TRACE_CONFIGS)) {
    for (let off = 0; off < TRACE_ROLLS.length; off++) {
      for (const stopAfterChats of [undefined, 2]) {
        const t = createTraceCtx({ inputs: TRACE_INPUTS, rolls: TRACE_ROLLS, rollOffset: off, stopAfterChats })
        setChatImpl(t.recordingChatForAgentWithComedy)
        try {
          await loop({ title: 't', config } as never, t.ctx)
        } finally {
          t.restore()
        }
        digests.push(createHash('sha256').update(JSON.stringify(t.events)).digest('hex').slice(0, 16))
        if (cfgName === 'default') {
          for (const e of t.events) {
            if (e.t !== 'chat') continue
            let p = e.prompt
            for (const i of TRACE_INPUTS) p = p.split(i).join('<INPUT>')
            const key = `${e.agent}\u0000${p}`
            if (!seen.has(key)) {
              seen.add(key)
              prompts.push([e.agent, p])
            }
          }
        }
      }
    }
  }
  return { prompts, digests }
}
