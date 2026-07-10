import { GroupChatManager } from '../GroupChatManager'
import type { Agent } from '../GroupChatManager'
import type { ImprovSceneManager } from '../ImprovSceneManager'
import type { SpeechQueue } from '../audio/SpeechQueue'
import type { Stage } from '../visuals/Stage'
import { DEFAULT_IMPROV_SETUPS } from '../config/improvSetups'
import type { ChatLogApi } from './chatLog'
import { CHARACTER_SPEEDS, createFeedbackControls } from './chatLog'
import type { PrerenderAheadFn, SpeakAndVisualizeFn } from './chatController'
import {
  PRERENDER_BATCH_SIZE,
  PRERENDER_INITIAL_TURNS,
  PRERENDER_MIN_QUEUE,
} from './types'
import { updateNextAgentUI, updateVRAMInfoBar } from './statusBar'

export interface ImprovControllerDeps {
  agents: Agent[]
  groupChatManager: GroupChatManager
  improvSceneManager: ImprovSceneManager
  speechQueue: SpeechQueue
  stage: Stage
  chatLog: ChatLogApi
  chaosSlider: HTMLInputElement
  seedInput: HTMLInputElement
  speakAndVisualize: SpeakAndVisualizeFn
  prerenderAhead: PrerenderAheadFn
}

interface PrerenderedTurn {
  agentId: string
  agentName: string
  response: string
  sentences: string[]
}

function calculatePacing() {
  const roll = Math.random()
  if (roll > 0.7) {
    return {
      type: 'punchline',
      maxTokens: 48,
      ttsSteps: 25,
      promptSuffix: ' (One joking sentence. Be brief.)',
    }
  } else if (roll > 0.2) {
    return {
      type: 'standard',
      maxTokens: 72,
      ttsSteps: 16,
      promptSuffix: ' (1-2 sentences.)',
    }
  } else {
    return {
      type: 'rant',
      maxTokens: 96,
      ttsSteps: 8,
      promptSuffix: ' (Be expressive!)',
    }
  }
}

export function wireImprovController(deps: ImprovControllerDeps): void {
  const {
    agents,
    groupChatManager,
    improvSceneManager,
    speechQueue,
    stage,
    chatLog,
    chaosSlider,
    seedInput,
    speakAndVisualize,
    prerenderAhead,
  } = deps

  const sceneTitleInput = document.getElementById('scene-title') as HTMLInputElement
  const sceneDescriptionInput = document.getElementById('scene-description') as HTMLTextAreaElement
  const improvPresetSelect = document.getElementById('improv-preset-select') as HTMLSelectElement
  const startImprovBtn = document.getElementById('start-improv-btn') as HTMLButtonElement
  const stopImprovBtn = document.getElementById('stop-improv-btn') as HTMLButtonElement
  const chatLogEl = document.getElementById('chat-log')!

  DEFAULT_IMPROV_SETUPS.forEach(setup => {
    const option = document.createElement('option')
    option.value = setup.id
    option.textContent = setup.title
    improvPresetSelect.appendChild(option)
  })

  improvPresetSelect.addEventListener('change', () => {
    if (!improvPresetSelect.value) return
    const selectedSetup = DEFAULT_IMPROV_SETUPS.find(s => s.id === improvPresetSelect.value)
    if (selectedSetup) {
      sceneTitleInput.value = selectedSetup.title
      sceneDescriptionInput.value = selectedSetup.description
    }
  })

  let isImprovRunning = false
  let prerenderedQueue: PrerenderedTurn[] = []

  const playPrerenderedTurn = async () => {
    if (prerenderedQueue.length === 0) return

    const turn = prerenderedQueue.shift()!
    const agent = agents.find(a => a.id === turn.agentId)!

    console.log(`[Prerendered] Playing: ${agent.name} - ${turn.sentences.length} sentences`)

    stage.setActiveActor(turn.agentId)

    const messageDiv = document.createElement('div')
    messageDiv.className = 'message'
    messageDiv.innerHTML = `<strong style="color: ${agent.color}">${agent.name}:</strong> <span class="content"></span>`
    messageDiv.appendChild(createFeedbackControls(groupChatManager, agent.id))

    chatLogEl.appendChild(messageDiv)
    const contentSpan = messageDiv.querySelector('.content')!

    for (const sentence of turn.sentences) {
      await speakAndVisualize(sentence, turn.agentId, {
        steps: 16,
        speed: CHARACTER_SPEEDS[turn.agentId] || 1.0,
      })
      contentSpan.textContent = contentSpan.textContent ? contentSpan.textContent + ' ' + sentence : sentence
      chatLogEl.scrollTop = chatLogEl.scrollHeight
      await new Promise(r => setTimeout(r, 200))
    }

    groupChatManager.addToHistory('(Continue)', turn.response)

    await speechQueue.waitUntilFinished()
    updateNextAgentUI(groupChatManager)

    if (prerenderedQueue.length < PRERENDER_MIN_QUEUE && isImprovRunning) {
      console.log('[Prerender] Queue low, generating more turns in background...')
      const continuePrompt = '(Reply naturally to the last thing said)'
      groupChatManager.prerenderTurns(continuePrompt, PRERENDER_BATCH_SIZE)
        .then(newTurns => {
          prerenderedQueue.push(...newTurns)
          console.log(`[Prerender] Added ${newTurns.length} turns to queue (now ${prerenderedQueue.length})`)
        })
        .catch(e => console.error('[Prerender] Background prerender failed:', e))
    }
  }

  const processTurn = async (inputText: string, silentCritique?: string) => {
    try {
      const pacing = calculatePacing()
      console.log(`[Director] Pacing: ${pacing.type} (Tokens: ${pacing.maxTokens}, Steps: ${pacing.ttsSteps})`)

      const currentAgentId = groupChatManager.getCurrentAgent().id
      const agent = agents.find(a => a.id === currentAgentId)!

      stage.setActiveActor(currentAgentId)

      const messageDiv = document.createElement('div')
      messageDiv.className = 'message'
      messageDiv.innerHTML = `<strong style="color: ${agent.color}">${agent.name}:</strong> <span class="content">...</span>`
      messageDiv.appendChild(createFeedbackControls(groupChatManager, agent.id))

      chatLogEl.appendChild(messageDiv)
      const contentSpan = messageDiv.querySelector('.content')!

      const userSeed = seedInput.value ? parseInt(seedInput.value) : undefined
      const turnSeed = userSeed !== undefined ? userSeed + groupChatManager.getHistoryLength() : undefined
      const effectivePrompt = inputText + pacing.promptSuffix + ' ###'

      const sentenceBuffer: string[] = []
      let sentenceIndex = 0

      await groupChatManager.chat(effectivePrompt, (sentence) => {
        sentenceBuffer.push(sentence)

        if (sentenceBuffer.length >= 2 && sentenceIndex < sentenceBuffer.length - 1) {
          const upcomingSentences = sentenceBuffer.slice(sentenceIndex + 1)
          prerenderAhead(upcomingSentences, agent.id, {
            steps: pacing.ttsSteps,
            speed: CHARACTER_SPEEDS[agent.id] || 1.0,
            seed: turnSeed,
          })
        }

        speakAndVisualize(sentence, agent.id, {
          steps: pacing.ttsSteps,
          speed: CHARACTER_SPEEDS[agent.id] || 1.0,
          seed: turnSeed,
        })
        sentenceIndex++

        contentSpan.textContent = contentSpan.textContent === '...' ? sentence + ' ' : contentSpan.textContent + sentence + ' '
        chatLogEl.scrollTop = chatLogEl.scrollHeight
      }, { maxTokens: pacing.maxTokens, seed: turnSeed, hiddenInstruction: silentCritique })

      await speechQueue.waitUntilFinished()
      updateNextAgentUI(groupChatManager)
      updateVRAMInfoBar(groupChatManager)
    } catch (error) {
      console.error('Turn Error:', error)
      isImprovRunning = false
      updateVRAMInfoBar(groupChatManager)
    }
  }

  const startImprovScene = async () => {
    const title = sceneTitleInput.value.trim()
    const description = sceneDescriptionInput.value.trim()

    if (!title || !description) {
      chatLog.addMessage('System', 'Please provide both a scene title and description', '#ff6b6b')
      return
    }

    sceneTitleInput.disabled = true
    sceneDescriptionInput.disabled = true
    startImprovBtn.style.display = 'none'
    stopImprovBtn.style.display = 'inline-block'

    chatLog.addMessage('System', `🎭 Starting improv scene: "${title}"`, '#4ecdc4')
    chatLog.addMessage('System', description, '#4ecdc4')

    try {
      isImprovRunning = true
      groupChatManager.resetConversation()
      prerenderedQueue = []

      const initialPrompt = `You are participating in an improv comedy scene with other characters.\nScene: "${title}"\nDescription: ${description}\n\nStart the scene with your character's perspective. Be creative, stay in character, and keep your response brief (2-3 sentences). ###`

      chatLog.addMessage('System', '🎬 Prerendering opening dialogue...', '#888')

      try {
        const prerendered = await groupChatManager.prerenderTurns(initialPrompt, PRERENDER_INITIAL_TURNS)
        prerenderedQueue = prerendered
        console.log(`[Improv] Prerendered ${prerendered.length} turns`)
        chatLog.addMessage('System', `✅ Prerendered ${prerendered.length} turns ahead`, '#4ecdc4')
      } catch (e) {
        console.error('[Improv] Prerender failed, continuing with live generation', e)
        chatLog.addMessage('System', '⚠️ Prerender failed, using live generation', '#ff6b6b')
      }

      if (prerenderedQueue.length > 0) {
        await playPrerenderedTurn()
      } else if (groupChatManager.getHistoryLength() === 0) {
        const seed = title || 'Why do hotdogs come in packs of 10 but buns in packs of 8?'
        chatLog.addMessage('Director', `Action! "${seed}"`, '#888')
        await processTurn(seed)
      }

      while (isImprovRunning) {
        await new Promise(r => setTimeout(r, 1000))
        if (!isImprovRunning) break

        const turnCount = groupChatManager.getHistoryLength()
        const chaosLevel = parseInt(chaosSlider.value)

        let critique = ''

        if (turnCount > 2 && Math.random() * 100 < chaosLevel) {
          const thinkingDiv = document.createElement('div')
          thinkingDiv.innerHTML = `<em style="color:#666; font-size:0.9em">Director is watching...</em>`
          chatLogEl.appendChild(thinkingDiv)
          chatLogEl.scrollTop = chatLogEl.scrollHeight

          const rawCritique = await groupChatManager.getDirectorCritique()

          chatLogEl.removeChild(thinkingDiv)

          if (rawCritique.includes(':')) {
            const parts = rawCritique.split(':')
            const status = parts[0].trim().toUpperCase()
            critique = parts.slice(1).join(':').trim()

            if (status.includes('FLOWING')) {
              chatLog.addMessage('Director (Note)', `📝 ${critique}`, '#4ecdc4')
            } else {
              chatLog.addMessage('Director (Action!)', `🎬 ${critique}`, '#ff6b6b')
            }
          } else if (rawCritique) {
            critique = rawCritique
            chatLog.addMessage('Director', `📣 ${critique}`, '#ffd700')
          }
        }

        const prompt = '(Reply naturally to the last thing said)'

        try {
          if (prerenderedQueue.length > 0) {
            console.log(`[Improv] Using prerendered turn (${prerenderedQueue.length} remaining)`)
            await playPrerenderedTurn()
          } else {
            console.log('[Improv] No prerendered turns, generating live')
            await processTurn(prompt, critique)
          }
        } catch (turnError) {
          const cat = GroupChatManager.getErrorCategory(turnError)
          if (cat === 'oom') {
            chatLog.addMessage('System', '⚠️ GPU ran out of memory — scene stopped. Close other GPU-heavy tabs and reload.', '#ff6b6b')
            isImprovRunning = false
            break
          }
          throw turnError
        }
      }

      await speechQueue.waitUntilFinished()
    } catch (error) {
      isImprovRunning = false
      console.error('Error running improv scene:', error)
      const cat = GroupChatManager.getErrorCategory(error)
      const msgs = {
        oom: '⚠️ GPU ran out of memory. Close other GPU-heavy tabs and reload.',
        network: '⚠️ Network error during scene. Check your connection and try again.',
        webgpu: '⚠️ WebGPU error. Try reloading the page.',
        unknown: '⚠️ Error running improv scene — see console for details.',
      } as const
      chatLog.addMessage('System', msgs[cat] ?? msgs.unknown, '#ff6b6b')
    }

    sceneTitleInput.disabled = false
    sceneDescriptionInput.disabled = false
    startImprovBtn.style.display = 'inline-block'
    stopImprovBtn.style.display = 'none'
  }

  const stopImprovScene = () => {
    isImprovRunning = false
    if (improvSceneManager.isSceneRunning()) improvSceneManager.stop()
    chatLog.addMessage('System', '🎭 Scene stopped by user', '#ff6b6b')
    sceneTitleInput.disabled = false
    sceneDescriptionInput.disabled = false
    startImprovBtn.style.display = 'inline-block'
    stopImprovBtn.style.display = 'none'
  }

  startImprovBtn.addEventListener('click', startImprovScene)
  stopImprovBtn.addEventListener('click', stopImprovScene)
}
