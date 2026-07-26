import { GroupChatManager } from '../GroupChatManager'
import type { Agent } from '../GroupChatManager'
import type { TtsEngine } from '../audio/AudioEngine'
import type { SpeechQueue } from '../audio/SpeechQueue'
import type { Stage } from '../visuals/Stage'
import type { ChatLogApi } from './chatLog'
import { CHARACTER_SPEEDS, createFeedbackControls } from './chatLog'
import { MAX_PRERENDER_SENTENCES } from './types'
import { updateNextAgentUI, updateVRAMInfoBar } from './statusBar'
import { getSharedSfxManager } from '../audio/SfxManager'
import { stripSfxTokens } from '../audio/sfxTokens'

export interface ChatControllerDeps {
  agents: Agent[]
  groupChatManager: GroupChatManager
  audioEngine: TtsEngine
  speechQueue: SpeechQueue
  stage: Stage
  chatLog: ChatLogApi
  userInput: HTMLInputElement
  sendBtn: HTMLButtonElement
  ttsStepsSlider: HTMLInputElement
  seedInput: HTMLInputElement
  onTurnComplete?: () => void
  getDirector?: () => import('../Director/Director').Director | null
}

export function wireChatController(deps: ChatControllerDeps): void {
  const {
    agents,
    groupChatManager,
    audioEngine,
    speechQueue,
    stage,
    chatLog,
    userInput,
    sendBtn,
    ttsStepsSlider,
    seedInput,
    getDirector,
  } = deps

  const { speakAndVisualize, prerenderAhead } = createAudioHelpers(audioEngine, speechQueue, stage)

  const sendMessage = async () => {
    const message = userInput.value.trim()
    if (!message) return

    const director = getDirector?.()
    if (director?.isSceneRunning()) {
      userInput.value = ''
      chatLog.addMessage('You', message, '#ffffff')
      director.handleUserMessage(message)
      return
    }

    userInput.value = ''
    userInput.disabled = true
    sendBtn.disabled = true

    chatLog.addMessage('You', message, '#ffffff')

    try {
      const currentAgentId = groupChatManager.getCurrentAgent().id
      const agent = agents.find(a => a.id === currentAgentId)!

      let fullResponse = ''
      const messageDiv = document.createElement('div')
      messageDiv.className = 'message'
      messageDiv.innerHTML = `<strong style="color: ${agent.color}">${agent.name}:</strong> <span class="content">...</span>`
      messageDiv.appendChild(createFeedbackControls(groupChatManager, agent.id))

      const chatLogEl = document.getElementById('chat-log')!
      chatLogEl.appendChild(messageDiv)
      const contentSpan = messageDiv.querySelector('.content')!

      stage.setActiveActor(currentAgentId)
      // Thinking pose while the LLM generates
      stage.setThinking(currentAgentId, true)

      const baseUserSeed = seedInput.value ? parseInt(seedInput.value) : undefined
      const baseTurnSeed = baseUserSeed !== undefined ? baseUserSeed + groupChatManager.getHistoryLength() : undefined

      const sentenceBuffer: string[] = []
      let sentenceIndex = 0
      let clearedThinking = false
      let reacted = false

      await groupChatManager.chat(message + ' ###', (sentence) => {
        console.log(`[${agent.name} speaks]: ${sentence}`)

        if (!clearedThinking) {
          stage.setThinking(currentAgentId, false)
          stage.setActiveActor(currentAgentId)
          clearedThinking = true
        }

        // One reaction per turn from text cues / [director tags]
        if (!reacted) {
          const clip = stage.reactToText(currentAgentId, sentence)
          if (clip) reacted = true
        }

        sentenceBuffer.push(sentence)

        if (sentenceBuffer.length >= 2 && sentenceIndex < sentenceBuffer.length - 1) {
          const upcomingSentences = sentenceBuffer.slice(sentenceIndex + 1)
          prerenderAhead(upcomingSentences, agent.id, {
            steps: parseInt(ttsStepsSlider.value || '10'),
            speed: CHARACTER_SPEEDS[agent.id] || 1.0,
            seed: baseTurnSeed,
          })
        }

        speakAndVisualize(sentence, agent.id, {
          steps: parseInt(ttsStepsSlider.value || '10'),
          speed: CHARACTER_SPEEDS[agent.id] || 1.0,
          seed: baseTurnSeed,
        })
        sentenceIndex++

        const displaySentence = stripSfxTokens(sentence)
        if (!fullResponse) contentSpan.textContent = ''
        if (displaySentence) {
          fullResponse += displaySentence + ' '
          contentSpan.textContent = fullResponse
        }
        chatLogEl.scrollTop = chatLogEl.scrollHeight
      }, { seed: baseTurnSeed })

      stage.setThinking(currentAgentId, false)
      if (!reacted && fullResponse.trim()) {
        stage.reactToText(currentAgentId, fullResponse)
      }

      await speechQueue.waitUntilFinished()

      updateNextAgentUI(groupChatManager)
      updateVRAMInfoBar(groupChatManager)
      deps.onTurnComplete?.()
    } catch (error) {
      console.error('Error:', error)
      try {
        const id = groupChatManager.getCurrentAgent()?.id
        if (id) stage.setThinking(id, false)
      } catch { /* ignore */ }
      if (GroupChatManager.getErrorCategory(error) === 'oom') {
        chatLog.addMessage('System', `⚠️ GPU ran out of memory. Max tokens reduced to ${groupChatManager.getMaxTokensPerTurn()}.`, '#ff6b6b')
        updateVRAMInfoBar(groupChatManager)
      }
      chatLog.addMessage('System', 'Error generating response', '#ff0000')
    }

    userInput.disabled = false
    sendBtn.disabled = false
    userInput.focus()
  }

  sendBtn.addEventListener('click', sendMessage)
  userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sendMessage()
    }
  })
}

export type SpeakAndVisualizeFn = (
  text: string,
  agentId: string,
  options?: { steps?: number; seed?: number; speed?: number },
) => Promise<void>

export type PrerenderAheadFn = (
  sentences: string[],
  agentId: string,
  options?: { steps?: number; seed?: number; speed?: number },
) => Promise<void>

/** Shared audio helpers used by chat and improv modes. */
export function createAudioHelpers(
  _audioEngine: TtsEngine,
  speechQueue: SpeechQueue,
  stage: Stage,
): { speakAndVisualize: SpeakAndVisualizeFn; prerenderAhead: PrerenderAheadFn } {
  let isPrerendering = false

  const speakAndVisualize: SpeakAndVisualizeFn = async (text, agentId, options = {}) => {
    try {
      stage.setActiveActor(agentId)
      // Strip [sfx:…] tokens, play whitelisted SFX, never TTS the token text
      const sfx = getSharedSfxManager()
      const cleanText = sfx ? await sfx.processDialogue(text, agentId) : stripSfxTokens(text)
      if (!cleanText.trim()) return
      // Use keyed TTS cache so sentence prerender is actually consumed (no double synth)
      const audioData = await speechQueue.synthesizeOrTakeCached(cleanText, agentId, {
        steps: options.steps,
        seed: options.seed,
        speed: options.speed,
      })
      speechQueue.add(audioData)
    } catch (e) {
      console.error('Speech synthesis failed', e)
    }
  }

  const prerenderAhead: PrerenderAheadFn = async (sentences, agentId, options = {}) => {
    if (isPrerendering || sentences.length === 0) return

    isPrerendering = true
    console.log(`[Prerender Audio] Starting prerender of ${sentences.length} sentences`)

    const prerenderCount = Math.min(MAX_PRERENDER_SENTENCES, sentences.length)
    const toPrerender = sentences
      .slice(0, prerenderCount)
      .map((s) => stripSfxTokens(s))
      .filter((s) => s.trim().length > 0)

    if (toPrerender.length > 0) {
      speechQueue.prerenderSentences(toPrerender, agentId, options)
    }
    isPrerendering = false
  }

  return { speakAndVisualize, prerenderAhead }
}
