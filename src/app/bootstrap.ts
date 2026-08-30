import { registerSW } from 'virtual:pwa-register'
import * as webllm from '@mlc-ai/web-llm'
import { GroupChatManager } from '../GroupChatManager'
import { Stage } from '../visuals/Stage'
import { getRequestedRendererMode, isWebGPUAvailable } from '../visuals/rendererMode'
import { LipSync } from '../visuals/LipSync'
import { AudioEngine } from '../audio/AudioEngine'
import type { TtsEngine } from '../audio/AudioEngine'
import { OptimizedAudioEngineAdapter } from '../audio/OptimizedAudioEngineAdapter'
import { SpeechQueue } from '../audio/SpeechQueue'
import { SfxManager, setSharedSfxManager } from '../audio/SfxManager'
import { MemoryManager, setSharedMemoryManager } from '../Director/MemoryManager'
import { VPS_STORAGE_URL } from '../config/models'
import { VPS_STORAGE_ORIGIN, VPS_STORAGE_MIRROR_ORIGIN } from '../utils/vpsStorageUrl'
import { agents } from './agents'
import { getAppTemplate } from './appTemplate'
import { wireModelPicker } from './modelPicker'
import { setProgress, setInputsEnabled, showVoiceOfflineBanner } from './loadingUi'
import { renderInitErrorPanel } from './errorPanel'
import { setReadyStatus, updateVRAMInfoBar } from './statusBar'
import { wireSceneController } from './sceneController'
import { saveSuccessfulLaunch } from './modelGuide'

console.log('Available prebuilt models:', webllm.prebuiltAppConfig.model_list.map((m: { model_id: string }) => m.model_id))

type AppInitState = 'BOOTING' | 'AUDIO' | 'MODEL' | 'FINALIZING' | 'READY' | 'ERROR'

/**
 * TTS init hits the VPS storage host directly (not proxied through app-server
 * CORS), so a misconfigured or down origin (e.g. duplicate ACAO headers) fails
 * the whole `fetch`. Try primary, then fall back to the mirror host — never
 * both at once, since the engines hold mutable init state (worker, caches)
 * that a concurrent second `init()` call would clobber. A TTS failure on both
 * hosts must never block the LLM/stage from booting — voice degrades gracefully.
 */
async function initAudioEngineWithFailover(audioEngine: TtsEngine): Promise<boolean> {
  const primaryPath = `${VPS_STORAGE_URL}/tts/onnx`
  try {
    await audioEngine.init(primaryPath)
    return true
  } catch (primaryError) {
    console.warn('[Audio] TTS init failed on primary storage host:', primaryError)
  }

  if (VPS_STORAGE_MIRROR_ORIGIN !== VPS_STORAGE_ORIGIN) {
    const mirrorPath = `${VPS_STORAGE_MIRROR_ORIGIN}/models/tts/onnx`
    try {
      await audioEngine.init(mirrorPath)
      console.log('[Audio] TTS init succeeded on mirror storage host')
      return true
    } catch (mirrorError) {
      console.warn('[Audio] TTS init failed on mirror storage host:', mirrorError)
    }
  }

  console.warn('[Audio] TTS unavailable on all storage hosts — continuing without voice.')
  return false
}

export async function initApp(): Promise<void> {
  const app = document.querySelector<HTMLDivElement>('#app')!

  if ('serviceWorker' in navigator) {
    try {
      registerSW({
        onNeedRefresh() {
          console.log('[ServiceWorker] New content available, please refresh.')
        },
        onOfflineReady() {
          console.log('[ServiceWorker] App is ready for offline use.')
        },
      })
      console.log('[ServiceWorker] Registered via virtual:pwa-register')
    } catch (error) {
      console.warn('[ServiceWorker] Registration failed (non-critical):', error)
    }
  }

  let currentInitState: AppInitState = 'BOOTING'
  // @ts-ignore
  console.log(currentInitState)

  app.innerHTML = getAppTemplate()

  const launchConfig = await wireModelPicker()

  const canvas = document.getElementById('scene') as HTMLCanvasElement
  const loadingDiv = document.getElementById('loading')!
  const chatContainer = document.getElementById('chat-container')!
  const progressBar = document.getElementById('progress') as HTMLDivElement
  // @ts-ignore
  console.log(progressBar)
  const userInput = document.getElementById('user-input') as HTMLInputElement

  const { selectedModelId, preferredContext, vramConfig, chosenMaxTokens, enginePreference } = launchConfig

  // Remember attempt so OOM panel can step down to a smaller blessed model
  try {
    sessionStorage.setItem('jokesters-last-attempt-model', selectedModelId)
  } catch { /* ignore */ }

  setInputsEnabled(false)

  const suppressGpuCascadeRejections = (event: PromiseRejectionEvent) => {
    if (GroupChatManager.getErrorCategory(event.reason) === 'oom') {
      event.preventDefault()
      console.warn('[GPU] OOM cascade rejection suppressed:', event.reason)
    }
  }
  window.addEventListener('unhandledrejection', suppressGpuCascadeRejections)

  try {
    const memoryManager = new MemoryManager()
    setSharedMemoryManager(memoryManager)
    memoryManager.fetchPreviousEpisodeSummaries();

    const groupChatManager = new GroupChatManager(agents)
    groupChatManager.setVRAMConfig(vramConfig)
    groupChatManager.setMaxTokensPerTurn(chosenMaxTokens)

    // Worker-based synthesis (phoneme cache + viseme lookahead) is the default TTS
    // engine; append ?legacyAudio to the URL to force the old main-thread engine
    // for one release if the optimized path regresses on a given device.
    const useLegacyAudio = new URLSearchParams(window.location.search).has('legacyAudio')
    const audioEngine: TtsEngine = useLegacyAudio ? new AudioEngine() : new OptimizedAudioEngineAdapter()
    if (useLegacyAudio) {
      console.log('[Audio] ?legacyAudio present — using legacy main-thread AudioEngine')
    }
    const speechQueue = new SpeechQueue(audioEngine)

    const requestedRenderer = getRequestedRendererMode()
    let stage: Stage
    if (requestedRenderer === 'webgpu' && isWebGPUAvailable()) {
      console.log('[Renderer] WebGPU scene rendering requested (opt-in). WebLLM shares the GPU — prefer high-VRAM devices.')
      stage = new Stage(canvas, { rendererMode: 'webgpu' })
    } else {
      if (requestedRenderer === 'webgpu') {
        console.warn('[Renderer] WebGPU rendering requested but navigator.gpu is unavailable — using WebGL2.')
      }
      const gl = canvas.getContext('webgl2', { alpha: true, antialias: true })
      if (!gl) {
        throw new Error('WebGL 2 is not supported or is disabled in this environment.')
      }
      stage = new Stage(canvas, { context: gl as WebGLRenderingContext, rendererMode: 'webgl' })
    }
    const activeRenderer = await stage.initRenderer()
    console.log(`[Renderer] Active 3D renderer: ${activeRenderer.toUpperCase()} · LLM inference: WebGPU (independent)`)

    const lipSync = new LipSync(speechQueue.getAudioContext())
    // TTS → ttsGain → analyser → speakers (gain enables SFX ducking)
    speechQueue.setDestination(lipSync.analyser)
    lipSync.analyser.connect(speechQueue.getAudioContext().destination)
    stage.setLipSync(lipSync)
    stage.render()

    const sfxManager = new SfxManager({ basePath: './sfx' })
    await sfxManager.init(speechQueue.getAudioContext(), speechQueue.getTtsGainNode())
    sfxManager.setInterruptHandler(() => speechQueue.stop())
    setSharedSfxManager(sfxManager)

    currentInitState = 'BOOTING'
    setProgress('Setting up graphics...', 10)

    currentInitState = 'AUDIO'
    setProgress('Initializing Audio Engine...', 25)
    const voiceAvailable = await initAudioEngineWithFailover(audioEngine)

    currentInitState = 'MODEL'
    setProgress('Initializing LLM Engine...', 35)
    let progressStartTime = 0
    await groupChatManager.initialize((progress: webllm.InitProgressReport) => {
      const percentage = 35 + Math.round(progress.progress * 55)
      let status = progress.text
      if (progress.progress > 0.02 && progress.progress < 0.99) {
        if (progressStartTime === 0) progressStartTime = performance.now()
        const elapsedMs = performance.now() - progressStartTime
        const totalEstimatedMs = elapsedMs / progress.progress
        const remainingMs = totalEstimatedMs - elapsedMs
        const remainingSec = Math.max(0, Math.round(remainingMs / 1000))
        const mm = Math.floor(remainingSec / 60).toString().padStart(2, '0')
        const ss = (remainingSec % 60).toString().padStart(2, '0')
        status = `${progress.text} · ~${mm}:${ss} remaining`
      }
      setProgress(status, percentage)
    }, selectedModelId, preferredContext, enginePreference)

    currentInitState = 'FINALIZING'
    setProgress('Finalizing setup...', 90)

    currentInitState = 'READY'
    setReadyStatus(groupChatManager)

    // Persist successful launch for next visit (model + chat/VRAM opts)
    saveSuccessfulLaunch(launchConfig)

    loadingDiv.style.display = 'none'
    chatContainer.style.display = 'flex'

    if (!voiceAvailable) {
      showVoiceOfflineBanner()
    }

    setInputsEnabled(true)
    userInput.focus()

    updateVRAMInfoBar(groupChatManager)

    wireSceneController({
      agents,
      groupChatManager,
      memoryManager,
      audioEngine,
      speechQueue,
      stage,
    })
  } catch (error: unknown) {
    currentInitState = 'ERROR'
    console.error('Initialization error:', error)
    // Full re-init so model picker + OOM fallback session keys are honored
    renderInitErrorPanel(error, () => {
      void initApp()
    })
  }
}
