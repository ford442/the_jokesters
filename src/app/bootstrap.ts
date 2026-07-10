import { registerSW } from 'virtual:pwa-register'
import * as webllm from '@mlc-ai/web-llm'
import { GroupChatManager } from '../GroupChatManager'
import { ImprovSceneManager } from '../ImprovSceneManager'
import { Stage } from '../visuals/Stage'
import { getRequestedRendererMode, isWebGPUAvailable } from '../visuals/rendererMode'
import { LipSync } from '../visuals/LipSync'
import { AudioEngine } from '../audio/AudioEngine'
import { SpeechQueue } from '../audio/SpeechQueue'
import { MemoryManager } from '../Director/MemoryManager'
import { VPS_STORAGE_URL } from '../config/models'
import { agents } from './agents'
import { getAppTemplate } from './appTemplate'
import { wireModelPicker } from './modelPicker'
import { setProgress, setInputsEnabled } from './loadingUi'
import { renderInitErrorPanel } from './errorPanel'
import { setReadyStatus, updateVRAMInfoBar } from './statusBar'
import { wireSceneController } from './sceneController'

console.log('Available prebuilt models:', webllm.prebuiltAppConfig.model_list.map((m: { model_id: string }) => m.model_id))

type AppInitState = 'BOOTING' | 'AUDIO' | 'MODEL' | 'FINALIZING' | 'READY' | 'ERROR'

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
    ;(window as any).getMemoryManager = () => memoryManager

    const groupChatManager = new GroupChatManager(agents)
    groupChatManager.setVRAMConfig(vramConfig)
    groupChatManager.setMaxTokensPerTurn(chosenMaxTokens)

    const audioEngine = new AudioEngine()
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
    window.addEventListener('audienceReaction', (e: Event) => {
      stage.triggerAudienceReaction((e as CustomEvent).detail.reaction)
    })

    const lipSync = new LipSync(speechQueue.getAudioContext())
    speechQueue.setDestination(lipSync.analyser)
    lipSync.analyser.connect(speechQueue.getAudioContext().destination)
    stage.setLipSync(lipSync)
    stage.render()

    currentInitState = 'BOOTING'
    setProgress('Setting up graphics...', 10)

    currentInitState = 'AUDIO'
    setProgress('Initializing Audio Engine...', 25)
    await audioEngine.init(`${VPS_STORAGE_URL}/tts/onnx`)

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

    const improvSceneManager = new ImprovSceneManager(groupChatManager)

    currentInitState = 'READY'
    setReadyStatus(groupChatManager)

    loadingDiv.style.display = 'none'
    chatContainer.style.display = 'flex'

    setInputsEnabled(true)
    userInput.focus()

    updateVRAMInfoBar(groupChatManager)

    wireSceneController({
      agents,
      groupChatManager,
      improvSceneManager,
      audioEngine,
      speechQueue,
      stage,
    })
  } catch (error: unknown) {
    currentInitState = 'ERROR'
    console.error('Initialization error:', error)
    renderInitErrorPanel(error, () => { void initApp() })
  }
}
