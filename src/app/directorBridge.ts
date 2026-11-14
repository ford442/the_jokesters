import type { Agent } from '../GroupChatManager'
import type { GroupChatManager } from '../GroupChatManager'
import { Director } from '../Director/Director'
import type { DirectorCallbacks } from '../Director/Director'
import type { MemoryManager } from '../Director/MemoryManager'
import type { SpeechQueue } from '../audio/SpeechQueue'
import type { Stage } from '../visuals/Stage'
import { stripStageTokens, takePropCues } from '../visuals/propTokens'
import type { ChatLogApi } from './chatLog'
import { CHARACTER_SPEEDS } from './chatLog'
import type { SpeakAndVisualizeFn } from './chatController'
import { updateNextAgentUI } from './statusBar'
import { AudienceFeedbackDriver } from '../comedy/audienceFeedback'
import { setVoiceOverride } from '../audio/voiceMap'
import type { AppServices } from './services'

export interface DirectorBridgeDeps {
  services: AppServices
  groupChatManager: GroupChatManager
  memoryManager: MemoryManager | null
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
  const audienceFeedback = new AudienceFeedbackDriver({
    triggerReaction: (reaction) => deps.stage.triggerAudienceReaction(reaction),
    playSfx: (name) => { void deps.services.sfx.play(name) },
    onBitDied: () => deps.services.music.cue('bit_died'),
  })

  const callbacks: DirectorCallbacks = {
    onMessage: (sender, message, color) => deps.chatLog.addMessage(sender, message, color),
    onSpeak: async (sentence, agentId, options) => {
      const steps = options.steps ?? parseInt(deps.ttsStepsSlider.value, 10)
      const speed = options.speed ?? CHARACTER_SPEEDS[agentId] ?? 1.0
      const seed = options.seed
      const cued = takePropCues(sentence)
      deps.stage.applyPropCues(cued.cues)
      const spoken = stripStageTokens(cued.cleanText)
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
    onGuestEnter: (guest) => {
      // Supertonic style from the card (one of the four hosted files — no new voice model).
      setVoiceOverride(guest.id, guest.voiceStyle)
      deps.stage.addGuestActor(guest.id, guest.name, guest.color)
    },
    onGuestExit: (guestId) => {
      deps.stage.removeGuestActor(guestId)
      setVoiceOverride(guestId, null)
    },
    onThinking: (agentId, thinking) => deps.stage.setThinking(agentId, thinking),
    onReactToText: (agentId, text) => deps.stage.reactToText(agentId, text),
    onSfx: (name, agentId) => {
      void deps.services.sfx.play(name, agentId)
    },
    onStageKit: (kitId) => {
      // Music palette follows the kit (talk show band / courtroom organ / news desk).
      deps.services.music.setKit(kitId)
      void deps.stage.setStageKit(kitId)
    },
    onShowCue: (cue) => deps.services.music.cue(cue),
    onSceneStart: ({ title }) => deps.services.clipRecorder?.setSceneTitle(title, true),
    musicControls: {
      startBeat: (bpm) => deps.services.music.startBeat(bpm),
      stopBeat: () => deps.services.music.stopBeat(),
    },
    onProp: (name, action) => {
      deps.stage.applyPropCue(name, action)
    },
    onCallbackRecorded: () => {
      deps.stage.whipCamera()
    },
    onAudienceReaction: (event) => {
      audienceFeedback.handleEvent(event)
    },
  }

  return new Director(deps.groupChatManager, callbacks, deps.memoryManager ?? undefined)
}
