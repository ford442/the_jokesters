import type { Agent, ProfanityLevel } from '../GroupChatManager'
import { createChatLog } from './chatLog'
import { createAudioHelpers, wireChatController } from './chatController'
import { wireImprovController } from './improvController'
import { updateNextAgentUI, updateVRAMInfoBar } from './statusBar'
import { loadMemoryDepthPreference } from '../config/contextDepth'
import { getDOM } from '../ui/uiHelpers'
import { wireEpisodeUi } from './episodeUi'
import { wireSfxUi } from './sfxUi'
import { wireMusicUi } from './musicUi'
import { wireClipUi } from './clipUi'
import { wireVoiceUi } from './voiceUi'
import { createDirectorBridge } from './directorBridge'
import type { Director } from '../Director/Director'
import type { AppServices } from './services'
import type { Scope } from '../utils/lifecycle'

export interface SceneControllerDeps {
  agents: Agent[]
  services: AppServices
  /** Owner of this run's UI wiring; disposed before a re-init. */
  scope: Scope
}

/** Wire chat/improv handlers and post-ready settings UI after model load succeeds. */
export function wireSceneController(deps: SceneControllerDeps): void {
  const { agents, services, scope } = deps
  const { groupChatManager, memoryManager, audioEngine, speechQueue, stage, sfx, music } = services

  const dom = getDOM()
  const chatLog = createChatLog(dom.chatLog, groupChatManager)
  const { speakAndVisualize, prerenderAhead } = createAudioHelpers(audioEngine, speechQueue, stage, sfx)

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

    if (memoryManager) {
      memoryManager.switchProfile(newProfile)
      chatLog.addMessage('System', `Switched to profile: ${newProfile}`, '#4ecdc4')
    } else {
      chatLog.addMessage('System', 'Profile switching requires MemoryManager to be available', '#ff6b6b')
    }
  })

  updateNextAgentUI(groupChatManager)
  updateVRAMInfoBar(groupChatManager)

  let directorRef: Director | null = null

  const getDirector = () => directorRef

  directorRef = createDirectorBridge({
    services,
    groupChatManager,
    memoryManager,
    speechQueue,
    stage,
    chatLog,
    seedInput: dom.seedInput,
    ttsStepsSlider: dom.ttsStepsSlider,
    speakAndVisualize,
    onSceneStop: () => {
      music.stopBeat()
      updateNextAgentUI(groupChatManager)
      updateVRAMInfoBar(groupChatManager)
    },
  })
  const director = directorRef
  scope.add(() => director.dispose())

  wireChatController({
    services,
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
    services,
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
    services,
    agents,
    groupChatManager,
    audioEngine,
    speechQueue,
    stage,
    chatLog,
    getDirector,
  })

  wireSfxUi(sfx)
  wireMusicUi(music)
  wireClipUi({ agents, speechQueue, stage, chatLog, services, scope })

  // Cast editor is a lazy chunk (zod schema + editor UI) — nothing loads until it is opened.
  document.getElementById('cast-editor-btn')?.addEventListener('click', () => {
    void import('../cast/castEditor').then((m) =>
      m.openCastEditor({
        roster: agents,
        groupChatManager,
        speechQueue,
        stage,
        chatLog,
        getDirector,
        tier: services.avatarTier,
      }),
    )
  })
  wireVoiceUi(speechQueue, agents)

  dom.userInput.focus()
}
