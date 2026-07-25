import type { Agent, ProfanityLevel } from '../GroupChatManager'
import type { GroupChatManager } from '../GroupChatManager'
import type { AudioEngine } from '../audio/AudioEngine'
import type { SpeechQueue } from '../audio/SpeechQueue'
import type { Stage } from '../visuals/Stage'
import { createChatLog } from './chatLog'
import { createAudioHelpers, wireChatController } from './chatController'
import { wireImprovController } from './improvController'
import { updateNextAgentUI, updateVRAMInfoBar } from './statusBar'
import { loadMemoryDepthPreference } from '../config/contextDepth'
import { getDOM } from '../ui/uiHelpers'
import { wireEpisodeUi } from './episodeUi'
import { wireSfxUi } from './sfxUi'
import { createDirectorBridge } from './directorBridge'
import type { Director } from '../Director/Director'

export interface SceneControllerDeps {
  agents: Agent[]
  groupChatManager: GroupChatManager
  audioEngine: AudioEngine
  speechQueue: SpeechQueue
  stage: Stage
}

/** Wire chat/improv handlers and post-ready settings UI after model load succeeds. */
export function wireSceneController(deps: SceneControllerDeps): void {
  const {
    agents,
    groupChatManager,
    audioEngine,
    speechQueue,
    stage,
  } = deps

  const dom = getDOM()
  const chatLog = createChatLog(dom.chatLog, groupChatManager)
  const { speakAndVisualize, prerenderAhead } = createAudioHelpers(audioEngine, speechQueue, stage)

  dom.ttsStepsSlider.oninput = () => { dom.ttsStepsVal.textContent = dom.ttsStepsSlider.value }
  dom.chaosSlider.oninput = () => { dom.chaosVal.textContent = dom.chaosSlider.value + '%' }

  const profanityLevels: { level: ProfanityLevel; label: string; color: string }[] = [
    { level: 'PG', label: '👼 PG', color: '#4ecdc4' },
    { level: 'CASUAL', label: '😏 Casual', color: '#45b7d1' },
    { level: 'GRITTY', label: '🔥 Gritty', color: '#ffd700' },
    { level: 'UNCENSORED', label: '💀 Uncensored', color: '#ff6b6b' },
  ]
  dom.profanitySlider.oninput = () => {
    const idx = parseInt(dom.profanitySlider.value)
    const { level, label, color } = profanityLevels[idx]
    dom.profanityVal.textContent = label
    dom.profanityVal.style.color = color
    groupChatManager.setProfanityLevel(level)
  }

  const savedDepth = loadMemoryDepthPreference()
  groupChatManager.setMemoryDepth(savedDepth)
  dom.memoryDepthSlider.value = String(savedDepth)
  dom.memoryDepthVal.textContent = `${savedDepth} msgs`
  dom.memoryDepthSlider.oninput = () => {
    const depth = parseInt(dom.memoryDepthSlider.value, 10)
    dom.memoryDepthVal.textContent = `${depth} msgs`
    groupChatManager.setMemoryDepth(depth)
    updateVRAMInfoBar(groupChatManager)
  }

  dom.switchProfileBtn.addEventListener('click', () => {
    const newProfile = dom.userProfileInput.value.trim() || 'default'

    if ((window as any).getDirector) {
      const director = (window as any).getDirector()
      if (director && director.memoryManager) {
        director.memoryManager.switchProfile(newProfile)
        chatLog.addMessage('System', `Switched to profile: ${newProfile}`, '#4ecdc4')
      }
    } else {
      chatLog.addMessage('System', 'Profile switching requires Director to be running', '#ff6b6b')
    }
  })

  updateNextAgentUI(groupChatManager)
  updateVRAMInfoBar(groupChatManager)

  let directorRef: Director | null = null

  const getDirector = () => directorRef

  directorRef = createDirectorBridge({
    groupChatManager,
    speechQueue,
    stage,
    chatLog,
    seedInput: dom.seedInput,
    ttsStepsSlider: dom.ttsStepsSlider,
    speakAndVisualize,
    onSceneStop: () => {
      updateNextAgentUI(groupChatManager)
      updateVRAMInfoBar(groupChatManager)
    },
  })

  wireChatController({
    agents,
    groupChatManager,
    audioEngine,
    speechQueue,
    stage,
    chatLog,
    userInput: dom.userInput,
    sendBtn: dom.sendBtn,
    ttsStepsSlider: dom.ttsStepsSlider,
    seedInput: dom.seedInput,
    getDirector,
  })

  const chatModeBtn = document.getElementById('chat-mode-btn')!
  const improvModeBtn = document.getElementById('improv-mode-btn')!
  const chatModeControls = document.getElementById('chat-mode-controls')!
  const improvModeControls = document.getElementById('improv-mode-controls')!

  chatModeBtn.addEventListener('click', () => {
    chatModeBtn.classList.add('active')
    improvModeBtn.classList.remove('active')
    chatModeControls.style.display = 'flex'
    improvModeControls.style.display = 'none'

    updateNextAgentUI(groupChatManager)
  })

  improvModeBtn.addEventListener('click', () => {
    improvModeBtn.classList.add('active')
    chatModeBtn.classList.remove('active')
    chatModeControls.style.display = 'none'
    improvModeControls.style.display = 'block'
  })

  wireImprovController({
    agents,
    groupChatManager,
    audioEngine,
    speechQueue,
    stage,
    chatLog,
    chaosSlider: dom.chaosSlider,
    seedInput: dom.seedInput,
    speakAndVisualize,
    prerenderAhead,
    getDirector,
  })

  wireEpisodeUi({
    agents,
    groupChatManager,
    audioEngine,
    speechQueue,
    stage,
    chatLog,
  })

  wireSfxUi()

  dom.userInput.focus()
}
