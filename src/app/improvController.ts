import { GroupChatManager } from '../GroupChatManager'
import type { Agent } from '../GroupChatManager'
import type { SpeechQueue } from '../audio/SpeechQueue'
import type { TtsEngine } from '../audio/AudioEngine'
import type { Stage } from '../visuals/Stage'
import type { ChatLogApi } from './chatLog'
import { CHARACTER_SPEEDS, createFeedbackControls } from './chatLog'
import type { PrerenderAheadFn, SpeakAndVisualizeFn } from './chatController'
import { updateNextAgentUI, updateVRAMInfoBar, updatePrerenderHud } from './statusBar'
import {
  captureEpisodeFromManager,
  hideEpisodeExportBar,
  showEpisodeExportBar,
} from './episodeUi'
import { stripSfxTokens } from '../audio/sfxTokens'
import { PrerenderCoordinator } from '../prerender/PrerenderCoordinator'
import type { PrerenderedTurn } from '../prerender/PrerenderCoordinator'
import type { Director } from '../Director/Director'
import { wireModeBrowser } from './modeBrowser'
import { AudienceFeedbackDriver } from '../comedy/audienceFeedback'
import { getSharedSfxManager } from '../audio/SfxManager'
import { isSpeakableText, isVicunaModel } from '../chat/speakableText'

export interface ImprovControllerDeps {
  agents: Agent[]
  groupChatManager: GroupChatManager
  audioEngine: TtsEngine
  speechQueue: SpeechQueue
  stage: Stage
  chatLog: ChatLogApi
  chaosSlider: HTMLInputElement
  seedInput: HTMLInputElement
  speakAndVisualize: SpeakAndVisualizeFn
  prerenderAhead: PrerenderAheadFn
  getDirector: () => Director | null
}

function calculatePacing(modelId: string | null) {
  const roll = Math.random()
  if (roll > 0.7) {
    return {
      type: 'punchline',
      maxTokens: isVicunaModel(modelId) ? 96 : 48,
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
    audioEngine,
    speechQueue,
    stage,
    chatLog,
    chaosSlider,
    seedInput,
    speakAndVisualize,
    prerenderAhead,
    getDirector,
  } = deps

  const coordinator = new PrerenderCoordinator(groupChatManager, audioEngine, speechQueue)
  // Director's stopScene() invalidates the queue via this hook instead of importing
  // the prerender module directly (keeps Director decoupled from app-layer wiring).
  getDirector()?.setPrerenderInvalidator(() => coordinator.cancel('director stopScene'))

  // This "classic improv" quick-start path runs its own turn loop (live + prerendered)
  // outside Director/ComedySession, so it needs its own audience-feedback wiring —
  // scored fresh at actual speak time (see the two waitUntilFinished() call sites below),
  // never at generation/prerender time.
  const audienceFeedback = new AudienceFeedbackDriver({
    triggerReaction: (reaction) => stage.triggerAudienceReaction(reaction),
    playSfx: (name) => { void getSharedSfxManager()?.play(name) },
  })

  const sceneTitleInput = document.getElementById('scene-title') as HTMLInputElement
  const sceneDescriptionInput = document.getElementById('scene-description') as HTMLTextAreaElement
  const startImprovBtn = document.getElementById('start-improv-btn') as HTMLButtonElement
  const stopImprovBtn = document.getElementById('stop-improv-btn') as HTMLButtonElement
  const chatLogEl = document.getElementById('chat-log')!

  const modeBrowser = wireModeBrowser()

  let isImprovRunning = false

  const refreshHud = () => updatePrerenderHud(coordinator.getMetrics())

  const playPrerenderedTurn = async (turn: PrerenderedTurn) => {
    const agent = agents.find(a => a.id === turn.agentId)
    if (!agent) {
      console.warn('[Prerender] Unknown agent', turn.agentId)
      return
    }

    if (!isSpeakableText(turn.response)) {
      console.warn('[Prerender] Skipping unspeakable queued turn', turn.agentId, turn.response)
      return
    }

    const turnStart = coordinator.markTurnStart()
    console.log(`[Prerendered] Playing: ${agent.name} - ${turn.sentences.length} sentences`)

    stage.setActiveActor(turn.agentId)
    stage.setThinking(turn.agentId, true)
    // Short beat only — audio should already be warming
    await new Promise(r => setTimeout(r, 80))
    stage.setThinking(turn.agentId, false)
    stage.setActiveActor(turn.agentId)
    stage.reactToText(turn.agentId, turn.response)

    const messageDiv = document.createElement('div')
    messageDiv.className = 'message'
    messageDiv.innerHTML = `<strong style="color: ${agent.color}">${agent.name}:</strong> <span class="content"></span>`
    messageDiv.appendChild(createFeedbackControls(groupChatManager, agent.id))

    chatLogEl.appendChild(messageDiv)
    const contentSpan = messageDiv.querySelector('.content')!

    const synthOpts = {
      steps: 16,
      speed: CHARACTER_SPEEDS[turn.agentId] || 1.0,
    }

    let firstAudio = true
    for (let i = 0; i < turn.sentences.length; i++) {
      if (!isImprovRunning) break
      const sentence = turn.sentences[i]
      const clean = stripSfxTokens(sentence)
      if (!clean.trim()) continue

      const audioData = await coordinator.resolveSentenceAudio(
        turn,
        i,
        sentence,
        turn.agentId,
        synthOpts,
      )
      if (audioData) {
        if (firstAudio) {
          coordinator.recordTtfa(turnStart)
          firstAudio = false
        }
        stage.setActiveActor(turn.agentId)
        speechQueue.add(audioData)
      } else {
        // Graceful live TTS fallback for this sentence
        await speakAndVisualize(sentence, turn.agentId, synthOpts)
        if (firstAudio) {
          coordinator.recordTtfa(turnStart)
          firstAudio = false
        }
      }

      contentSpan.textContent = contentSpan.textContent
        ? contentSpan.textContent + ' ' + clean
        : clean
      chatLogEl.scrollTop = chatLogEl.scrollHeight
    }

    // History sync once per turn (prevents double-speak desync)
    groupChatManager.addToHistory('(Continue)', turn.response)

    await speechQueue.waitUntilFinished()
    // Re-scored here (not when this turn was originally prerendered/generated) so the
    // audience reacts when the line is actually heard, not whenever it happened to be
    // batch-generated ahead of time.
    audienceFeedback.handleSpokenText(turn.response)
    coordinator.markTurnEnd()
    updateNextAgentUI(groupChatManager)
    refreshHud()

    if (isImprovRunning) {
      coordinator.refillInBackground('(Reply naturally to the last thing said)')
      refreshHud()
    }
  }

  const processTurn = async (inputText: string, silentCritique?: string) => {
    try {
      coordinator.markLiveSource()
      const turnStart = coordinator.markTurnStart()
      const pacing = calculatePacing(groupChatManager.getLoadedModelId())
      console.log(`[Director] Live turn · pacing: ${pacing.type}`)

      const currentAgentId = groupChatManager.getCurrentAgent().id
      const agent = agents.find(a => a.id === currentAgentId)!

      stage.setActiveActor(currentAgentId)
      stage.setThinking(currentAgentId, true)

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
      let clearedThinking = false
      let reacted = false
      let firstAudio = true

      const result = await groupChatManager.chat(effectivePrompt, (sentence) => {
        if (!clearedThinking) {
          stage.setThinking(currentAgentId, false)
          stage.setActiveActor(currentAgentId)
          clearedThinking = true
        }
        if (!reacted) {
          const clip = stage.reactToText(currentAgentId, sentence)
          if (clip) reacted = true
        }

        sentenceBuffer.push(sentence)

        // TTS prerender for upcoming sentences in this stream
        if (sentenceBuffer.length >= 2 && sentenceIndex < sentenceBuffer.length - 1) {
          const upcomingSentences = sentenceBuffer.slice(sentenceIndex + 1)
          const maxS = coordinator.getDepth().maxSentences
          prerenderAhead(upcomingSentences.slice(0, maxS), agent.id, {
            steps: pacing.ttsSteps,
            speed: CHARACTER_SPEEDS[agent.id] || 1.0,
            seed: turnSeed,
          })
        }

        void (async () => {
          await speakAndVisualize(sentence, agent.id, {
            steps: pacing.ttsSteps,
            speed: CHARACTER_SPEEDS[agent.id] || 1.0,
            seed: turnSeed,
          })
          if (firstAudio) {
            coordinator.recordTtfa(turnStart)
            firstAudio = false
            refreshHud()
          }
        })()
        sentenceIndex++

        const displaySentence = stripSfxTokens(sentence)
        if (displaySentence) {
          contentSpan.textContent =
            contentSpan.textContent === '...'
              ? displaySentence + ' '
              : contentSpan.textContent + displaySentence + ' '
        }
        chatLogEl.scrollTop = chatLogEl.scrollHeight
      }, { maxTokens: pacing.maxTokens, seed: turnSeed, hiddenInstruction: silentCritique })

      if (!result.response) {
        messageDiv.remove()
        stage.setThinking(currentAgentId, false)
        coordinator.markTurnEnd()
        updateNextAgentUI(groupChatManager)
        updateVRAMInfoBar(groupChatManager)
        refreshHud()
        if (isImprovRunning) {
          coordinator.refillInBackground('(Reply naturally to the last thing said)')
        }
        return
      }

      stage.setThinking(currentAgentId, false)
      if (!reacted && sentenceBuffer.length > 0) {
        stage.reactToText(currentAgentId, sentenceBuffer.join(' '))
      }

      await speechQueue.waitUntilFinished()
      if (sentenceBuffer.length > 0) {
        audienceFeedback.handleSpokenText(sentenceBuffer.join(' '))
      }
      coordinator.markTurnEnd()
      updateNextAgentUI(groupChatManager)
      updateVRAMInfoBar(groupChatManager)
      refreshHud()

      // Background LLM refill after live turns too
      if (isImprovRunning) {
        coordinator.refillInBackground('(Reply naturally to the last thing said)')
      }
    } catch (error) {
      console.error('Turn Error:', error)
      try {
        stage.setThinking(groupChatManager.getCurrentAgent().id, false)
      } catch { /* ignore */ }
      if (GroupChatManager.getErrorCategory(error) === 'oom') {
        coordinator.cancel('oom')
        speechQueue.clearPrerendered()
      }
      isImprovRunning = false
      updateVRAMInfoBar(groupChatManager)
      refreshHud()
    }
  }

  const resetSceneUi = () => {
    sceneTitleInput.disabled = false
    sceneDescriptionInput.disabled = false
    startImprovBtn.style.display = 'inline-block'
    stopImprovBtn.style.display = 'none'
    refreshHud()
  }

  const finalizeEpisodeExport = (sceneTitle: string, sceneDescription: string, modeId: string) => {
    const episode = captureEpisodeFromManager(groupChatManager, agents, {
      title: sceneTitle || 'Scene',
      description: sceneDescription,
      mode: modeId,
      chaosLevel: parseInt(chaosSlider.value, 10),
      seed: seedInput.value ? parseInt(seedInput.value, 10) : undefined,
    })
    if (episode) {
      showEpisodeExportBar(episode)
      chatLog.addMessage(
        'System',
        `💾 Episode ready · ${episode.turns.length} turns — export JSON/MD or Replay (TTS only)`,
        '#4ecdc4',
      )
    }
  }

  const startRegisteredModeScene = async (modeId: string, title: string, description: string) => {
    const director = getDirector()
    if (!director) {
      chatLog.addMessage('System', 'Director not ready — reload the page', '#ff6b6b')
      return
    }

    sceneTitleInput.disabled = true
    sceneDescriptionInput.disabled = true
    startImprovBtn.style.display = 'none'
    stopImprovBtn.style.display = 'inline-block'
    hideEpisodeExportBar()
    modeBrowser.recordStart()

    director.setChaosLevel(parseInt(chaosSlider.value, 10))
    speechQueue.stop()
    speechQueue.clearPrerendered()

    try {
      isImprovRunning = true
      await director.playScenario({
        type: modeId,
        title,
        description,
        config: { chaosLevel: parseInt(chaosSlider.value, 10) },
      })
    } catch (error) {
      console.error('Mode scene error:', error)
      const cat = GroupChatManager.getErrorCategory(error)
      const msgs = {
        oom: '⚠️ GPU ran out of memory. Close other GPU-heavy tabs and reload.',
        network: '⚠️ Network error during scene. Check your connection and try again.',
        webgpu: '⚠️ WebGPU error. Try reloading the page.',
        llamacpp_mismatch: '⚠️ llama.cpp runtime mismatch. Reload or switch to MLC.',
        unknown: '⚠️ Error running scene — see console for details.',
      } as const
      chatLog.addMessage('System', msgs[cat] ?? msgs.unknown, '#ff6b6b')
    } finally {
      isImprovRunning = false
      resetSceneUi()
      finalizeEpisodeExport(title, description, modeId)
    }
  }

  const startImprovScene = async () => {
    const title = sceneTitleInput.value.trim()
    const description = sceneDescriptionInput.value.trim()
    const modeId = modeBrowser.modeId

    if (!title || !description) {
      chatLog.addMessage('System', 'Please provide both a scene title and description', '#ff6b6b')
      return
    }

    modeBrowser.recordStart()

    if (modeId !== 'improv') {
      await startRegisteredModeScene(modeId, title, description)
      return
    }

    sceneTitleInput.disabled = true
    sceneDescriptionInput.disabled = true
    startImprovBtn.style.display = 'none'
    stopImprovBtn.style.display = 'inline-block'
    hideEpisodeExportBar()

    chatLog.addMessage('System', `🎭 Starting improv scene: "${title}"`, '#4ecdc4')
    chatLog.addMessage('System', description, '#4ecdc4')

    try {
      isImprovRunning = true
      groupChatManager.resetConversation()
      coordinator.beginScene()
      speechQueue.stop()
      speechQueue.clearPrerendered()

      const depth = await coordinator.configureForDevice()
      chatLog.addMessage('System', `🎚️ Prerender budget: ${depth.reason}`, '#888')
      refreshHud()

      const initialPrompt = `You are participating in an improv comedy scene with other characters.\nScene: "${title}"\nDescription: ${description}\n\nStart the scene with your character's perspective. Be creative, stay in character, and keep your response brief (2-3 sentences). ###`

      if (depth.initialTurns > 0) {
        chatLog.addMessage('System', '🎬 Prerendering opening dialogue…', '#888')
        const n = await coordinator.fillInitial(initialPrompt)
        if (n > 0) {
          chatLog.addMessage('System', `✅ ${n} turn(s) ready (LLM+TTS warming)`, '#4ecdc4')
        } else {
          chatLog.addMessage('System', '⚠️ Prerender empty — live generation', '#ff6b6b')
        }
      } else {
        chatLog.addMessage('System', '⚡ Live generation (VRAM budget skips prerender)', '#ffd700')
      }
      refreshHud()

      const first = coordinator.takeTurn()
      if (first) {
        await playPrerenderedTurn(first)
      } else if (groupChatManager.getHistoryLength() === 0) {
        const seed = title || 'Why do hotdogs come in packs of 10 but buns in packs of 8?'
        chatLog.addMessage('Director', `Action! "${seed}"`, '#888')
        await processTurn(seed)
      }

      while (isImprovRunning) {
        await new Promise(r => setTimeout(r, 400))
        if (!isImprovRunning) break

        const turnCount = groupChatManager.getHistoryLength()
        const chaosLevel = parseInt(chaosSlider.value)

        let critique = ''

        // Director critique only on live path / when not mid-prerender heavy
        if (turnCount > 2 && Math.random() * 100 < chaosLevel && coordinator.getQueueDepth() === 0) {
          const thinkingDiv = document.createElement('div')
          thinkingDiv.innerHTML = `<em style="color:#666; font-size:0.9em">Director is watching...</em>`
          chatLogEl.appendChild(thinkingDiv)
          chatLogEl.scrollTop = chatLogEl.scrollHeight

          const directorResult = await groupChatManager.getDirectorCritique()

          chatLogEl.removeChild(thinkingDiv)

          if (directorResult.instruction) {
            critique = directorResult.instruction

            if (directorResult.status === 'flowing') {
              chatLog.addMessage('Director (Note)', `📝 ${critique}`, '#4ecdc4')
            } else if (directorResult.status === 'stagnant') {
              chatLog.addMessage('Director (Action!)', `🎬 ${critique}`, '#ff6b6b')
            } else {
              chatLog.addMessage('Director', `📣 ${critique}`, '#ffd700')
            }

            if (directorResult.memoryHint) {
              const hintLabels: Record<string, string> = {
                zoom_in: '🔍 Zoom in (tight focus)',
                zoom_out: '🔭 Zoom out (wider memory)',
              }
              const hintLabel = directorResult.memoryHint.startsWith('recall:')
                ? `🧠 Recall: ${directorResult.memoryHint.slice('recall:'.length)}`
                : hintLabels[directorResult.memoryHint] ?? directorResult.memoryHint
              chatLog.addMessage('Director (Memory)', hintLabel, '#9b59b6')
            }
          }
        }

        const prompt = '(Reply naturally to the last thing said)'

        try {
          const next = coordinator.takeTurn()
          if (next) {
            console.log(`[Improv] Prerender hit (queue left ${coordinator.getQueueDepth()})`)
            await playPrerenderedTurn(next)
          } else {
            console.log('[Improv] Queue empty — live generation')
            await processTurn(prompt, critique)
          }
          refreshHud()
        } catch (turnError) {
          const cat = GroupChatManager.getErrorCategory(turnError)
          if (cat === 'oom') {
            coordinator.cancel('oom')
            speechQueue.clearPrerendered()
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
      coordinator.cancel('scene error')
      speechQueue.clearPrerendered()
      console.error('Error running improv scene:', error)
      const cat = GroupChatManager.getErrorCategory(error)
      const msgs = {
        oom: '⚠️ GPU ran out of memory. Close other GPU-heavy tabs and reload.',
        network: '⚠️ Network error during scene. Check your connection and try again.',
        webgpu: '⚠️ WebGPU error. Try reloading the page.',
        llamacpp_mismatch: '⚠️ llama.cpp runtime mismatch. Reload or switch to MLC in the engine selector.',
        unknown: '⚠️ Error running improv scene — see console for details.',
      } as const
      chatLog.addMessage('System', msgs[cat] ?? msgs.unknown, '#ff6b6b')
    }

    sceneTitleInput.disabled = false
    sceneDescriptionInput.disabled = false
    startImprovBtn.style.display = 'inline-block'
    stopImprovBtn.style.display = 'none'
    refreshHud()

    finalizeEpisodeExport(title, description, 'improv')
  }

  const stopImprovScene = () => {
    isImprovRunning = false
    coordinator.cancel('user stop')
    speechQueue.stop()
    speechQueue.clearPrerendered()
    const director = getDirector()
    if (director?.isSceneRunning()) director.stopScene()
    chatLog.addMessage('System', '🎭 Scene stopped by user', '#ff6b6b')
    resetSceneUi()
    finalizeEpisodeExport(sceneTitleInput.value.trim(), sceneDescriptionInput.value.trim(), modeBrowser.modeId)
  }

  // Mode switch away from improv cancels queue
  document.getElementById('chat-mode-btn')?.addEventListener('click', () => {
    if (isImprovRunning) stopImprovScene()
    else {
      coordinator.cancel('mode change')
      speechQueue.clearPrerendered()
      refreshHud()
    }
  })

  startImprovBtn.addEventListener('click', startImprovScene)
  stopImprovBtn.addEventListener('click', stopImprovScene)
}
