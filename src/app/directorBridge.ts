import type { Agent } from '../GroupChatManager'
import type { GroupChatManager } from '../GroupChatManager'
import { Director } from '../Director/Director'
import type { DirectorCallbacks } from '../Director/Director'
import type { MemoryManager } from '../Director/MemoryManager'
import type { SpeechQueue } from '../audio/SpeechQueue'
import type { Stage } from '../visuals/Stage'
import { getSharedSfxManager } from '../audio/SfxManager'
import { stripSfxTokens } from '../audio/sfxTokens'
import type { ChatLogApi } from './chatLog'
import { CHARACTER_SPEEDS } from './chatLog'
import type { SpeakAndVisualizeFn } from './chatController'
import { updateNextAgentUI } from './statusBar'

export interface DirectorBridgeDeps {
  groupChatManager: GroupChatManager
  speechQueue: SpeechQueue
  stage: Stage
  chatLog: ChatLogApi
  seedInput: HTMLInputElement
  ttsStepsSlider: HTMLInputElement
  speakAndVisualize: SpeakAndVisualizeFn
  onSceneStop?: () => void
}

/** Create Director with app audio/visual callbacks (lazy mode loads happen in playScenario). */
export function createDirectorBridge(deps: DirectorBridgeDeps): Director {
  const memoryManager: MemoryManager | null =
    typeof (window as unknown as { getMemoryManager?: () => MemoryManager }).getMemoryManager === 'function'
      ? (window as unknown as { getMemoryManager: () => MemoryManager }).getMemoryManager()
      : null

  const callbacks: DirectorCallbacks = {
    onMessage: (sender, message, color) => deps.chatLog.addMessage(sender, message, color),
    onSpeak: async (sentence, agentId, options) => {
      const steps = options.steps ?? parseInt(deps.ttsStepsSlider.value, 10)
      const speed = options.speed ?? CHARACTER_SPEEDS[agentId] ?? 1.0
      const seed = options.seed
      const spoken = stripSfxTokens(sentence)
      if (spoken) {
        await deps.speakAndVisualize(spoken, agentId, { steps, speed, seed })
      }
    },
    onTurnStart: async (agentId) => {
      deps.stage.setActiveActor(agentId)
      updateNextAgentUI(deps.groupChatManager)
    },
    onTurnEnd: async () => {
      await deps.speechQueue.waitUntilFinished()
    },
    onError: (error) => {
      const msg = error instanceof Error ? error.message : String(error)
      deps.chatLog.addMessage('System', msg, '#ff6b6b')
    },
    onSceneStop: () => deps.onSceneStop?.(),
    getSeed: () => {
      const v = deps.seedInput.value.trim()
      return v ? parseInt(v, 10) : undefined
    },
    onThinking: (agentId, thinking) => deps.stage.setThinking(agentId, thinking),
    onReactToText: (agentId, text) => deps.stage.reactToText(agentId, text),
    onSfx: (name, agentId) => {
      getSharedSfxManager()?.play(name, agentId)
    },
  }

  return new Director(deps.groupChatManager, callbacks, memoryManager ?? undefined)
}

export function getAppDirector(): Director | null {
  return typeof (window as unknown as { getDirector?: () => Director }).getDirector === 'function'
    ? (window as unknown as { getDirector: () => Director }).getDirector()
    : null
}
