import { GroupChatManager } from '../GroupChatManager'
import type { Agent } from '../GroupChatManager'
import type { AudioEngine } from '../audio/AudioEngine'
import type { SpeechQueue } from '../audio/SpeechQueue'
import type { Stage } from '../visuals/Stage'
import type { ChatLogApi } from './chatLog'
import { CHARACTER_SPEEDS, createFeedbackControls } from './chatLog'
import { MAX_PRERENDER_SENTENCES } from './types'
import { updateNextAgentUI, updateVRAMInfoBar } from './statusBar'

export interface ChatControllerDeps {
  agents: Agent[]
  groupChatManager: GroupChatManager
  audioEngine: AudioEngine
  speechQueue: SpeechQueue
  stage: Stage
  chatLog: ChatLogApi
  userInput: HTMLInputElement
  sendBtn: HTMLButtonElement
  ttsStepsSlider: HTMLInputElement
  seedInput: HTMLInputElement
  onTurnComplete?: () => void
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
  } = deps

  const { speakAndVisualize, prerenderAhead } = createAudioHelpers(audioEngine, speechQueue, stage)

  const sendMessage = async () => {
    const message = userInput.value.trim()
    if (!message) return

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

      const baseUserSeed = seedInput.value ? parseInt(seedInput.value) : undefined
      const baseTurnSeed = baseUserSeed !== undefined ? baseUserSeed + groupChatManager.getHistoryLength() : undefined

      const sentenceBuffer: string[] = []
      let sentenceIndex = 0

      await groupChatManager.chat(message + ' ###', (sentence) => {
        console.log(`[${agent.name} speaks]: ${sentence}`)

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

        if (!fullResponse) contentSpan.textContent = ''
        fullResponse += sentence + ' '
        contentSpan.textContent = fullResponse
        chatLogEl.scrollTop = chatLogEl.scrollHeight
      }, { seed: baseTurnSeed })

      await speechQueue.waitUntilFinished()

      updateNextAgentUI(groupChatManager)
      updateVRAMInfoBar(groupChatManager)
      deps.onTurnComplete?.()
    } catch (error) {
      console.error('Error:', error)
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
  audioEngine: AudioEngine,
  speechQueue: SpeechQueue,
  stage: Stage,
): { speakAndVisualize: SpeakAndVisualizeFn; prerenderAhead: PrerenderAheadFn } {
  let isPrerendering = false

  const speakAndVisualize: SpeakAndVisualizeFn = async (text, agentId, options = {}) => {
    try {
      stage.setActiveActor(agentId)
      const audioData = await audioEngine.synthesize(text, agentId, { steps: options.steps, seed: options.seed })
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
    const toPrerender = sentences.slice(0, prerenderCount)

    speechQueue.prerenderSentences(toPrerender, agentId, options)
    isPrerendering = false
  }

  return { speakAndVisualize, prerenderAhead }
}
