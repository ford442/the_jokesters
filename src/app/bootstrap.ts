import { registerSW } from 'virtual:pwa-register'
import { reloadOnceForIsolation } from './isolationReload'
import type * as webllm from '@mlc-ai/web-llm'
import { GroupChatManager } from '../GroupChatManager'
import { Stage } from '../visuals/Stage'
import { getRequestedRendererMode, isWebGPUAvailable } from '../visuals/rendererMode'
import { LipSync } from '../visuals/LipSync'
import { loadDeviceSnapshot, readAvatarTierEnv, readGlRendererString, selectAvatarTier } from '../visuals/avatarTier'
import { bundledAvatarUrl } from '../visuals/avatarManifest'
import { hasStoredCast } from '../cast/castKeys'
import { AudioEngine } from '../audio/AudioEngine'
import type { TtsEngine } from '../audio/AudioEngine'
import { OptimizedAudioEngineAdapter } from '../audio/OptimizedAudioEngineAdapter'
import { SpeechQueue } from '../audio/SpeechQueue'
import { SfxManager } from '../audio/SfxManager'
import { ShowAudioBus } from '../audio/showAudioBus'
import { MusicEngine } from '../audio/MusicEngine'
import { ShowMusic } from '../audio/ShowMusic'
import { MemoryManager } from '../Director/MemoryManager'
import type { Scope } from '../utils/lifecycle'
import type { AppServices } from './services'
import { VPS_STORAGE_URL } from '../config/models'
import { VPS_STORAGE_ORIGIN, VPS_STORAGE_MIRROR_ORIGIN } from '../utils/vpsStorageUrl'
import { parseStripeKillSwitch, consumePreferMirror } from '../utils/dualDomainStripe'
import { createDefaultRoster } from '../cast/defaultCast'
import { MAIN_PANEL_AUTH_FORM, wireHfAuthForm } from '../ui/dashboard'
import { getAppTemplate } from './appTemplate'
import { wireModelPicker } from './modelPicker'
import { setProgress, setInputsEnabled, showVoiceOfflineBanner, showWasmFallbackBanner } from './loadingUi'
import { classifyInitProgress, formatLoadStatus } from './loadProgress'
import { renderInitErrorPanel } from './errorPanel'
import { setReadyStatus, updateVRAMInfoBar } from './statusBar'
import { wireSceneController } from './sceneController'
import { saveSuccessfulLaunch } from './modelGuide'
import { consumeWasmFallbackWarning } from '../config/loadFailover'

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

/**
 * Service-worker registration, stale-root cleanup and dual-domain stripe config.
 * Page-lifetime: call once per page load (from `main.ts`), not per `initApp()`
 * attempt — retries must not register a second `controllerchange` listener.
 */
export function setupServiceWorker(scope: Scope): void {
  if ('serviceWorker' in navigator) {
    try {
      // Clean up any stale origin-wide (scope '/') service worker registration from
      // earlier builds — it intercepts fetches for every app on this shared origin
      // (test.1ink.us, go.1ink.us), not just this one. Our own registration below is
      // scoped to /the-jokesters/, so this only ever removes the poisoned root worker.
      const ownScope = new URL('./', location.href).href
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          for (const registration of registrations) {
            if (registration.scope === location.origin + '/' && registration.scope !== ownScope) {
              void registration.unregister().then(() => {
                console.log('[ServiceWorker] Unregistered stale origin-wide service worker')
              })
            }
          }
        })
        .catch((error) => {
          console.warn('[ServiceWorker] Failed to enumerate registrations for cleanup:', error)
        })

      reloadOnceForIsolation({ scope })
      registerSW({
        onNeedRefresh() {
          console.log('[ServiceWorker] New content available, please refresh.')
        },
        onOfflineReady() {
          console.log('[ServiceWorker] App is ready for offline use.')
        },
      })
      console.log('[ServiceWorker] Registered via virtual:pwa-register')

      const invertOrigins = consumePreferMirror()
      const stripeConfig = {
        ...parseStripeKillSwitch({
          search: window.location.search,
          storageGet: (key) => {
            try {
              return localStorage.getItem(key)
            } catch {
              return null
            }
          },
        }),
        invertOrigins,
      }
      const stripeMessage = {
        type: 'SET_STRIPE_CONFIG',
        enabled: stripeConfig.enabled,
        raceFirstByte: stripeConfig.raceFirstByte,
        invertOrigins: stripeConfig.invertOrigins,
      }
      navigator.serviceWorker.controller?.postMessage(stripeMessage)
      void navigator.serviceWorker.ready
        .then((reg) => {
          reg.active?.postMessage(stripeMessage)
        })
        .catch(() => {
          /* registration still in flight */
        })
      scope.listen(navigator.serviceWorker, 'controllerchange', () => {
        navigator.serviceWorker.controller?.postMessage(stripeMessage)
      })
      console.log('[ServiceWorker] Dual-domain stripe', stripeConfig)
    } catch (error) {
      console.warn('[ServiceWorker] Registration failed (non-critical):', error)
    }
  }
}

export interface InitAppHooks {
  /** Called with the run's services once they exist, and with `null` when the run is disposed. */
  onServices?: (services: AppServices | null) => void
}

/**
 * Boots one app run inside a child of `parent`. Every service, listener, timer
 * and render loop the run creates is owned by that child scope; the error
 * panel's retry disposes it before starting a fresh run, so retries never
 * stack rAF loops, AudioContexts, engines or listeners.
 */
export async function initApp(parent: Scope, hooks: InitAppHooks = {}): Promise<void> {
  const run = parent.child()
  const app = document.querySelector<HTMLDivElement>('#app')!

  let currentInitState: AppInitState = 'BOOTING'
  console.log(currentInitState)

  app.innerHTML = getAppTemplate()

  const launchConfig = await wireModelPicker()

  const canvas = document.getElementById('scene') as HTMLCanvasElement
  const loadingDiv = document.getElementById('loading')!
  const chatContainer = document.getElementById('chat-container')!
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
  run.listen(window, 'unhandledrejection', suppressGpuCascadeRejections)

  try {
    // Fresh roster per run: the cast applier and GroupChatManager mutate it in place.
    const agents = createDefaultRoster()
    const memoryManager = new MemoryManager()
    run.add(() => memoryManager.dispose())
    // The settings panel's HF form is part of the per-run template.
    wireHfAuthForm(run, MAIN_PANEL_AUTH_FORM, () => memoryManager)
    void memoryManager.fetchPreviousEpisodeSummaries();

    // Custom cast (names, personas, voices, optional agents) applies to the shared roster
    // before the manager exists. Loaded lazily — no stored cast means no zod, no editor code.
    const storedCast = hasStoredCast()
      ? await import('../cast/castBoot').then((m) => m.applyStoredCastToRoster(agents)).catch((err) => {
          console.warn('[Cast] could not apply stored cast:', err)
          return null
        })
      : null

    const groupChatManager = new GroupChatManager(agents)
    run.add(() => groupChatManager.terminate())
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
    run.add(() => audioEngine.dispose?.())
    const speechQueue = new SpeechQueue(audioEngine)
    // Closes the run's AudioContext (LIFO: after bus/SFX/music/stage disconnect).
    run.add(() => speechQueue.dispose())

    const requestedRenderer = getRequestedRendererMode()
    let stage: Stage
    let glRenderer: string | null = null
    if (requestedRenderer === 'webgpu' && isWebGPUAvailable()) {
      console.log('[Renderer] WebGPU scene rendering requested (opt-in). WebLLM shares the GPU — prefer high-VRAM devices.')
      stage = new Stage(canvas, { rendererMode: 'webgpu', scope: run })
    } else {
      if (requestedRenderer === 'webgpu') {
        console.warn('[Renderer] WebGPU rendering requested but navigator.gpu is unavailable — using WebGL2.')
      }
      const gl = canvas.getContext('webgl2', { alpha: true, antialias: true })
      if (!gl) {
        throw new Error('WebGL 2 is not supported or is disabled in this environment.')
      }
      glRenderer = readGlRendererString(gl as WebGL2RenderingContext)
      stage = new Stage(canvas, { context: gl as WebGLRenderingContext, rendererMode: 'webgl', scope: run })
    }
    const activeRenderer = await stage.initRenderer()
    console.log(`[Renderer] Active 3D renderer: ${activeRenderer.toUpperCase()} · LLM inference: WebGPU (independent)`)

    const lipSync = new LipSync(speechQueue.getAudioContext())
    // TTS → ttsGain → analyser → master bus → speakers (+ recording tap). SFX and music join
    // the same master bus, so a recorded clip hears exactly what the audience hears.
    const audioCtx = speechQueue.getAudioContext()
    const audioBus = new ShowAudioBus(audioCtx)
    run.add(() => audioBus.dispose())
    speechQueue.setDestination(lipSync.analyser)
    lipSync.analyser.connect(audioBus.master)
    stage.setLipSync(lipSync)
    // Phoneme timing + audible clock → viseme-accurate mouths (loudness is the fallback).
    stage.setAudioClock(() => speechQueue.getAudioContext().currentTime)
    speechQueue.onUtteranceStart((e) => stage.beginUtterance(e))
    speechQueue.onUtteranceEnd(() => stage.endUtterance())
    stage.render()

    // VRM avatars on capable GPUs; low tiers keep the primitive capsule actors. Loads in the
    // background — each agent swaps in as its model arrives, and a failure leaves the capsule.
    const avatarTier = selectAvatarTier(readAvatarTierEnv(loadDeviceSnapshot(), glRenderer))
    console.log(`[Avatars] tier=${avatarTier.tier} (${avatarTier.reason})`)
    if (storedCast) {
      // The cast decides per slot: uploads/URLs load on any tier, defaults follow the tier.
      void import('../cast/castBoot')
        .then((m) => m.applyStoredCastAvatars(storedCast, stage, avatarTier.tier))
        .then(({ loaded, failed }) => {
          console.log(`[Avatars] cast avatars loaded: ${loaded.join(', ') || 'none'}${failed.length ? ` · failed: ${failed.map((f) => f.id).join(', ')}` : ''}`)
        })
        .catch((err) => console.warn('[Avatars] cast avatars failed:', err))
    } else if (avatarTier.tier === 'vrm') {
      void stage.useVrmActors((id) => bundledAvatarUrl(id)).then(({ loaded, failed }) => {
        console.log(`[Avatars] VRM loaded: ${loaded.join(', ') || 'none'}${failed.length ? ` · kept primitive: ${failed.join(', ')}` : ''}`)
      })
    }

    const sfxManager = new SfxManager({ basePath: './sfx' })
    run.add(() => sfxManager.dispose())
    await sfxManager.init(audioCtx, speechQueue.getTtsGainNode(), audioBus.master)
    sfxManager.setInterruptHandler(() => speechQueue.stop())

    // Show music: stingers per beat/act/tag, ducked under TTS (settings toggle, default on).
    const showMusic = new ShowMusic(new MusicEngine({ ctx: audioCtx, output: audioBus.master }))
    run.add(() => showMusic.dispose())
    showMusic.attachSpeech(speechQueue, () => lipSync.getVolume())

    const services: AppServices = {
      memoryManager,
      groupChatManager,
      audioEngine,
      speechQueue,
      audioBus,
      sfx: sfxManager,
      music: showMusic,
      stage,
      avatarTier: avatarTier.tier,
      clipRecorder: null,
    }
    hooks.onServices?.(services)
    run.add(() => hooks.onServices?.(null))

    currentInitState = 'BOOTING'
    setProgress('Setting up graphics...', 10)

    currentInitState = 'AUDIO'
    setProgress('Initializing Audio Engine...', 25)
    const voiceAvailable = await initAudioEngineWithFailover(audioEngine)

    currentInitState = 'MODEL'
    setProgress(formatLoadStatus('Initializing LLM Engine...', 'rewrite'), 35)
    let progressStartTime = 0
    await groupChatManager.initialize((progress: webllm.InitProgressReport) => {
      const percentage = 35 + Math.round(progress.progress * 55)
      const phase = classifyInitProgress(progress.text)
      let status = formatLoadStatus(progress.text, phase)
      if (progress.progress > 0.02 && progress.progress < 0.99) {
        if (progressStartTime === 0) progressStartTime = performance.now()
        const elapsedMs = performance.now() - progressStartTime
        const totalEstimatedMs = elapsedMs / progress.progress
        const remainingMs = totalEstimatedMs - elapsedMs
        const remainingSec = Math.max(0, Math.round(remainingMs / 1000))
        const mm = Math.floor(remainingSec / 60).toString().padStart(2, '0')
        const ss = (remainingSec % 60).toString().padStart(2, '0')
        status = `${status} · ~${mm}:${ss} remaining`
      }
      setProgress(status, percentage)
    }, selectedModelId, preferredContext, enginePreference)

    currentInitState = 'FINALIZING'
    setProgress(formatLoadStatus('Finalizing setup...', 'ready'), 90)

    currentInitState = 'READY'
    setReadyStatus(groupChatManager)

    // Persist successful launch for next visit (model + chat/VRAM opts)
    saveSuccessfulLaunch(launchConfig)

    loadingDiv.style.display = 'none'
    chatContainer.style.display = 'flex'

    if (!voiceAvailable) {
      showVoiceOfflineBanner()
    }
    const wasmWarning = consumeWasmFallbackWarning()
    if (wasmWarning) {
      showWasmFallbackBanner(wasmWarning)
    }

    setInputsEnabled(true)
    userInput.focus()

    updateVRAMInfoBar(groupChatManager)

    wireSceneController({ agents, services, scope: run })
  } catch (error: unknown) {
    currentInitState = 'ERROR'
    console.error('Initialization error:', error)
    // Full re-init so model picker + OOM fallback session keys are honored. Tear the
    // failed run down first so nothing it created survives into the next attempt.
    renderInitErrorPanel(error, () => {
      void run.dispose().then(() => initApp(parent, hooks))
    })
  }
}
