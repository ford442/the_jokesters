/**
 * Script Player boot path (`?mode=script`, `?script=<url>`): a prewritten script spoken
 * on the existing stage with Supertonic TTS + lip-sync.
 *
 * NO LLM ON THIS PATH. This module must not import GroupChatManager, EngineFactory,
 * MLC / web-llm, wllama or Transformers.js (directly or via app/bootstrap, chatController,
 * episodeUi…). `main.ts` reaches it through a dynamic import so the improv/LLM chunk is
 * never fetched. It is a boot path, not a Director mode — nothing here touches MODE_REGISTRY.
 */
import { Stage } from '../visuals/Stage'
import { getRequestedRendererMode, isWebGPUAvailable } from '../visuals/rendererMode'
import { LipSync } from '../visuals/LipSync'
import { AudioEngine, type TtsEngine } from '../audio/AudioEngine'
import { OptimizedAudioEngineAdapter } from '../audio/OptimizedAudioEngineAdapter'
import { SpeechQueue } from '../audio/SpeechQueue'
import { SfxManager } from '../audio/SfxManager'
import { isAllowedSfxName } from '../audio/sfxCatalog'
import { ShowAudioBus } from '../audio/showAudioBus'
import { initAudioEngineWithFailover } from '../audio/ttsFailover'
import { setVoiceOverrides } from '../audio/voiceMap'
import { replayEpisode, type EpisodeReplayHandle } from '../episode/episodeReplay'
import { stripForSpeakability } from '../chat/speakableText'
import type { Scope } from '../utils/lifecycle'
import {
  parseScriptPacket,
  scriptHoldMs,
  scriptPacketToEpisode,
  scriptTurnNames,
  scriptVoiceOverrides,
} from './scriptPacket'
import type { ScriptPacket } from './types'

const SAMPLE_SCRIPT_URL = './scripts/sample-script.json'

interface Overlay {
  root: HTMLElement
  title: HTMLElement
  speaker: HTMLElement
  line: HTMLElement
  status: HTMLElement
  play: HTMLButtonElement
  stop: HTMLButtonElement
  file: HTMLInputElement
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, css: string, text = ''): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag)
  e.style.cssText = css
  if (text) e.textContent = text
  return e
}

function buildDom(app: HTMLElement): { canvas: HTMLCanvasElement; ui: Overlay } {
  app.replaceChildren()
  const canvas = el('canvas', 'position:fixed;inset:0;width:100vw;height:100vh;display:block;')
  canvas.id = 'scene'
  const root = el(
    'div',
    'position:fixed;left:50%;bottom:16px;transform:translateX(-50%);width:min(680px,calc(100vw - 32px));' +
      'background:rgba(12,12,24,.82);color:#eee;border:1px solid #444;border-radius:10px;padding:12px 14px;' +
      'font:14px/1.4 system-ui,sans-serif;z-index:10;box-sizing:border-box;',
  )
  root.id = 'script-player'
  const title = el('div', 'font-weight:600;font-size:16px;margin-bottom:6px;', 'Script Player')
  const speaker = el('div', 'font-weight:600;min-height:1.2em;')
  const line = el('div', 'min-height:2.8em;margin-bottom:8px;')
  const status = el('div', 'font-size:12px;color:#aaa;margin-top:6px;', 'Loading…')
  const row = el('div', 'display:flex;gap:8px;flex-wrap:wrap;align-items:center;')
  const btn = 'padding:6px 14px;border-radius:6px;border:1px solid #666;background:#2a2a40;color:#fff;cursor:pointer;'
  const play = el('button', btn, '▶ Play')
  const stop = el('button', btn, '⏹ Stop')
  stop.disabled = true
  const fileLabel = el('label', btn, '📂 Open script…')
  const file = el('input', 'display:none;')
  file.type = 'file'
  file.accept = '.json,application/json'
  fileLabel.append(file)
  const hint = el('span', 'font-size:12px;color:#888;', 'or drop a .json packet anywhere')
  row.append(play, stop, fileLabel, hint)
  root.append(title, speaker, line, row, status)
  app.append(canvas, root)
  return { canvas, ui: { root, title, speaker, line, status, play, stop, file } }
}

async function loadInitialPacket(search: string): Promise<{ packet: ScriptPacket | null; error?: string }> {
  const scriptUrl = new URLSearchParams(search).get('script')
  const url = scriptUrl ? new URL(scriptUrl, location.href).href : SAMPLE_SCRIPT_URL
  try {
    const res = await fetch(url)
    if (!res.ok) return { packet: null, error: `Could not fetch script (${res.status}) from ${url}` }
    const r = parseScriptPacket(await res.text())
    return r.ok ? { packet: r.packet } : { packet: null, error: r.errors.join('; ') }
  } catch (e) {
    return { packet: null, error: `Could not fetch script: ${e instanceof Error ? e.message : String(e)}` }
  }
}

/** Boot the script player inside a child of `parent`. Never constructs an LLM. */
export async function initScriptPlayer(parent: Scope): Promise<void> {
  const run = parent.child()
  const app = document.querySelector<HTMLElement>('#app') ?? document.body
  const { canvas, ui } = buildDom(app)

  // --- Stage (WebGL2 default; WebGPU only when requested the existing way). Capsules; no VRM wait.
  let stage: Stage
  if (getRequestedRendererMode() === 'webgpu' && isWebGPUAvailable()) {
    stage = new Stage(canvas, { rendererMode: 'webgpu', scope: run })
  } else {
    const gl = canvas.getContext('webgl2', { alpha: true, antialias: true })
    if (!gl) throw new Error('WebGL 2 is not supported or is disabled in this environment.')
    stage = new Stage(canvas, { context: gl as WebGLRenderingContext, rendererMode: 'webgl', scope: run })
  }
  await stage.initRenderer()

  // --- TTS → lip-sync → stage, same wiring as bootstrap.
  const useLegacyAudio = new URLSearchParams(location.search).has('legacyAudio')
  const audioEngine: TtsEngine = useLegacyAudio ? new AudioEngine() : new OptimizedAudioEngineAdapter()
  run.add(() => audioEngine.dispose?.())
  const speechQueue = new SpeechQueue(audioEngine)
  run.add(() => speechQueue.dispose())
  const audioCtx = speechQueue.getAudioContext()
  const lipSync = new LipSync(audioCtx)
  const audioBus = new ShowAudioBus(audioCtx)
  run.add(() => audioBus.dispose())
  speechQueue.setDestination(lipSync.analyser)
  lipSync.analyser.connect(audioBus.master)
  stage.setLipSync(lipSync)
  stage.setAudioClock(() => audioCtx.currentTime)
  run.add(speechQueue.onUtteranceStart((e) => stage.beginUtterance(e)))
  run.add(speechQueue.onUtteranceEnd(() => stage.endUtterance()))
  stage.render()

  const sfx = new SfxManager({ basePath: './sfx' })
  run.add(() => sfx.dispose())
  void sfx.init(audioCtx, speechQueue.getTtsGainNode(), audioBus.master).catch((e) => console.warn('[ScriptPlayer] SFX init failed:', e))
  // Show music: muted for v1 (kit palette is cosmetic here).

  ui.status.textContent = 'Loading voice…'
  const voiceReady = initAudioEngineWithFailover(audioEngine)

  // --- Packet + playback state
  let packet: ScriptPacket | null = null
  let replay: EpisodeReplayHandle | null = null
  let voiceAvailable = false
  let voiceSettled = false

  const setPlaying = (playing: boolean) => {
    ui.play.disabled = playing || !packet || !voiceSettled
    ui.stop.disabled = !playing
  }

  const stopPlayback = () => {
    replay?.stop()
    replay = null
    speechQueue.stop()
    sfx.stopAll()
    stage.endUtterance()
    stage.setActiveActor('')
    setPlaying(false)
  }
  run.add(stopPlayback)

  const loadPacket = async (p: ScriptPacket) => {
    stopPlayback()
    packet = p
    setVoiceOverrides(scriptVoiceOverrides(p))
    ui.title.textContent = p.title
    ui.speaker.textContent = ''
    ui.line.textContent = p.description ?? `${p.turns.length} lines · ${p.speakers.map((s) => s.name).join(', ')}`
    setPlaying(false)
    await stage.setStageKit(p.stageKit)
  }
  run.add(() => setVoiceOverrides({}))

  const showError = (msg: string) => {
    ui.status.textContent = `⚠️ ${msg}`
    ui.status.style.color = '#ff9b9b'
  }

  const loadFromText = async (text: string, label: string) => {
    const r = parseScriptPacket(text)
    if (!r.ok) return showError(`${label}: ${r.errors.join('; ')}`)
    ui.status.style.color = '#aaa'
    await loadPacket(r.packet)
    ui.status.textContent = `Loaded ${label}${voiceAvailable ? '' : ' · 🔇 voice offline (transcript only)'}`
  }

  const play = () => {
    if (!packet) return
    stopPlayback()
    void audioCtx.resume().catch(() => {})
    const p = packet
    const holds = scriptHoldMs(p)
    const names = scriptTurnNames(p)
    const colors = new Map(p.speakers.map((s) => [s.name, s.color ?? '#fff']))
    let turnIndex = -1
    setPlaying(true)
    const handle = replayEpisode(scriptPacketToEpisode(p), {
      onMessage: (sender, message) => {
        if (sender === 'System') ui.status.textContent = message
      },
      onTurnStart: (agentId) => {
        turnIndex++
        const name = names[turnIndex] ?? agentId
        ui.speaker.textContent = name
        ui.speaker.style.color = colors.get(name) ?? '#fff'
        ui.line.textContent = p.turns[turnIndex]?.text ?? ''
        stage.setActiveActor(agentId)
      },
      onThinking: (agentId, thinking) => stage.setThinking(agentId, thinking),
      onReactToText: (agentId, text) => stage.reactToText(agentId, text),
      onSfx: (name, agentId) => {
        const n = name.trim().toLowerCase()
        if (isAllowedSfxName(n)) void sfx.play(n, agentId)
        else console.warn(`[ScriptPlayer] sfx "${name}" is not whitelisted — skipped`)
      },
      onSpeak: async (text, agentId, options) => {
        if (!voiceAvailable || replay !== handle) return
        const clean = stripForSpeakability(text)
        if (!clean.trim()) return
        try {
          const { audioData, sampleRate, visemes } = await speechQueue.synthesizeOrTakeCached(clean, agentId, options)
          if (replay !== handle) return
          speechQueue.add(audioData, sampleRate, { agentId, text: clean, visemes })
        } catch (e) {
          console.error('[ScriptPlayer] synthesis failed', e)
        }
      },
      waitUntilFinished: () => (voiceAvailable ? speechQueue.waitUntilFinished() : sleep(estimateReadMs(ui.line.textContent ?? ''))),
      getHoldMs: (i) => holds[i],
      onComplete: () => {
        if (replay === handle) {
          replay = null
          stage.setActiveActor('')
          setPlaying(false)
        }
      },
      onStop: () => {},
    })
    replay = handle
  }

  run.listen(ui.play, 'click', play)
  run.listen(ui.stop, 'click', stopPlayback)
  run.listen(ui.file, 'change', () => {
    const f = ui.file.files?.[0]
    ui.file.value = ''
    if (f) void f.text().then((t) => loadFromText(t, f.name))
  })
  run.listen(window, 'dragover', (e: DragEvent) => e.preventDefault())
  run.listen(window, 'drop', (e: DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer?.files?.[0]
    if (f) void f.text().then((t) => loadFromText(t, f.name))
  })

  const initial = await loadInitialPacket(location.search)
  if (initial.packet) {
    await loadPacket(initial.packet)
    ui.status.textContent = 'Loading voice…'
  } else {
    showError(initial.error ?? 'No script loaded')
  }
  voiceAvailable = await voiceReady
  voiceSettled = true
  setPlaying(false)
  const offline = '🔇 Voice offline — TTS could not connect. Play shows the transcript only.'
  if (initial.packet) ui.status.textContent = voiceAvailable ? 'Ready — press Play' : offline
  else if (!voiceAvailable) ui.status.textContent += ` · ${offline}`
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/** Rough read time when there is no voice, so the transcript still paces. */
function estimateReadMs(text: string): number {
  return Math.min(8000, 600 + text.split(/\s+/).length * 280)
}
