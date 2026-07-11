import {
  ALLOWED_SFX,
  DEFAULT_DUCK_ATTACK_MS,
  DEFAULT_DUCK_RELEASE_MS,
  DEFAULT_SFX_MODE,
  DEFAULT_SFX_VOLUME,
  DEFAULT_TTS_DUCK_LEVEL,
  SFX_STORAGE_KEYS,
  isAllowedSfxName,
  resolveAgentSfx,
  sfxAssetUrl,
  type AllowedSfxName,
  type SfxPlaybackMode,
} from './sfxCatalog'
import { parseSfxTokens } from './sfxTokens'

export interface SfxManagerOptions {
  /** Base path for assets (default ./sfx) */
  basePath?: string
  /** Prefer procedural fallback when decode fails */
  allowProceduralFallback?: boolean
}

/**
 * Loads and plays whitelisted sound effects with TTS ducking support.
 * Security: only ALLOWED_SFX names are ever fetched; unknown names are warned and ignored.
 */
export class SfxManager {
  private ctx: AudioContext | null = null
  private ttsGain: GainNode | null = null
  private sfxGain: GainNode | null = null
  private buffers = new Map<AllowedSfxName, AudioBuffer>()
  private enabled = true
  private volume = DEFAULT_SFX_VOLUME
  private mode: SfxPlaybackMode = DEFAULT_SFX_MODE
  private basePath: string
  private allowProceduralFallback: boolean
  private ready = false
  private activeSources = new Set<AudioBufferSourceNode>()
  private duckCount = 0
  private onInterruptTts: (() => void) | null = null

  constructor(options: SfxManagerOptions = {}) {
    this.basePath = options.basePath ?? './sfx'
    this.allowProceduralFallback = options.allowProceduralFallback !== false
    this.loadPrefs()
  }

  /**
   * Attach to the shared AudioContext used by SpeechQueue / lip-sync.
   * @param ttsGain - GainNode that all TTS sources route through (for duck mode)
   */
  async init(ctx: AudioContext, ttsGain: GainNode): Promise<void> {
    this.ctx = ctx
    this.ttsGain = ttsGain

    this.sfxGain = ctx.createGain()
    this.sfxGain.gain.value = this.volume
    this.sfxGain.connect(ctx.destination)

    await this.preloadAll()
    this.ready = true
    console.log(
      `[SfxManager] Ready · enabled=${this.enabled} mode=${this.mode} volume=${this.volume} loaded=${this.buffers.size}/${ALLOWED_SFX.length}`,
    )
  }

  isReady(): boolean {
    return this.ready
  }

  setInterruptHandler(handler: (() => void) | null): void {
    this.onInterruptTts = handler
  }

  isEnabled(): boolean {
    return this.enabled
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    try {
      localStorage.setItem(SFX_STORAGE_KEYS.enabled, enabled ? '1' : '0')
    } catch { /* ignore */ }
    if (!enabled) {
      this.stopAll()
      this.releaseDuck(true)
    }
  }

  getVolume(): number {
    return this.volume
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v))
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.02)
    }
    try {
      localStorage.setItem(SFX_STORAGE_KEYS.volume, String(this.volume))
    } catch { /* ignore */ }
  }

  getMode(): SfxPlaybackMode {
    return this.mode
  }

  setMode(mode: SfxPlaybackMode): void {
    if (mode !== 'overlay' && mode !== 'interrupt' && mode !== 'duck') return
    this.mode = mode
    try {
      localStorage.setItem(SFX_STORAGE_KEYS.mode, mode)
    } catch { /* ignore */ }
  }

  listAllowed(): readonly AllowedSfxName[] {
    return ALLOWED_SFX
  }

  /**
   * Play a named SFX. Unknown names are ignored (console warn) — never fetched.
   */
  async play(rawName: string, agentId?: string): Promise<void> {
    if (!this.enabled) return
    if (!this.ctx || !this.sfxGain) {
      console.warn('[SfxManager] Not initialized')
      return
    }

    const normalized = rawName.trim().toLowerCase()
    if (!isAllowedSfxName(normalized)) {
      console.warn(`[SfxManager] Unknown SFX "${rawName}" — ignored (not on whitelist)`)
      return
    }

    const name = resolveAgentSfx(normalized, agentId)
    if (!isAllowedSfxName(name)) {
      console.warn(`[SfxManager] Mapped SFX "${name}" invalid — ignored`)
      return
    }

    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume()
      } catch { /* ignore */ }
    }

    let buffer: AudioBuffer | undefined = this.buffers.get(name)
    if (!buffer) {
      const loaded = await this.loadOne(name)
      if (!loaded) {
        console.warn(`[SfxManager] No buffer for "${name}"`)
        return
      }
      buffer = loaded
    }

    if (this.mode === 'interrupt') {
      this.onInterruptTts?.()
    }

    const duration = buffer.duration
    if (this.mode === 'duck') {
      this.applyDuck(duration)
    }

    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    source.connect(this.sfxGain)
    this.activeSources.add(source)
    source.onended = () => {
      this.activeSources.delete(source)
    }
    source.start()
  }

  /**
   * Parse dialogue for [sfx:…] / SFX:… tokens, play them, return TTS-safe text.
   */
  async processDialogue(text: string, agentId?: string): Promise<string> {
    const { cleanText, events } = parseSfxTokens(text)
    if (events.length === 0) return cleanText || text

    // Fire SFX without awaiting full playback (overlay/duck); still sequential start
    for (const ev of events) {
      void this.play(ev.name, agentId)
    }
    return cleanText
  }

  /** Director inject without speaking: SFX:explosion or bare name. */
  async playDirectorCue(cue: string, agentId?: string): Promise<void> {
    const m = cue.match(/(?:SFX:)?([a-zA-Z0-9_-]+)/i)
    if (m) await this.play(m[1], agentId)
  }

  stopAll(): void {
    for (const s of this.activeSources) {
      try {
        s.stop()
      } catch { /* already stopped */ }
    }
    this.activeSources.clear()
  }

  private loadPrefs(): void {
    try {
      const en = localStorage.getItem(SFX_STORAGE_KEYS.enabled)
      if (en === '0') this.enabled = false
      if (en === '1') this.enabled = true
      const vol = localStorage.getItem(SFX_STORAGE_KEYS.volume)
      if (vol != null) {
        const n = parseFloat(vol)
        if (Number.isFinite(n)) this.volume = Math.max(0, Math.min(1, n))
      }
      const mode = localStorage.getItem(SFX_STORAGE_KEYS.mode)
      if (mode === 'overlay' || mode === 'interrupt' || mode === 'duck') {
        this.mode = mode
      }
    } catch { /* ignore */ }
  }

  private async preloadAll(): Promise<void> {
    await Promise.all(ALLOWED_SFX.map((name) => this.loadOne(name)))
  }

  private async loadOne(name: AllowedSfxName): Promise<AudioBuffer | null> {
    if (this.buffers.has(name)) return this.buffers.get(name)!
    if (!this.ctx) return null

    const url = sfxAssetUrl(name, this.basePath)
    if (!url) return null // should never happen for AllowedSfxName

    try {
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const arr = await res.arrayBuffer()
      const buffer = await this.ctx.decodeAudioData(arr.slice(0))
      this.buffers.set(name, buffer)
      return buffer
    } catch (e) {
      console.warn(`[SfxManager] Failed to load ${url}:`, e)
      if (this.allowProceduralFallback) {
        const procedural = this.synthesizePlaceholder(name)
        if (procedural) {
          this.buffers.set(name, procedural)
          return procedural
        }
      }
      return null
    }
  }

  /**
   * Tiny procedural placeholders so the feature works before real assets ship.
   */
  private synthesizePlaceholder(name: AllowedSfxName): AudioBuffer | null {
    if (!this.ctx) return null
    const sr = this.ctx.sampleRate
    const duration = name === 'applause' ? 1.2 : name === 'explosion' ? 0.9 : 0.45
    const len = Math.floor(sr * duration)
    const buffer = this.ctx.createBuffer(1, len, sr)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < len; i++) {
      const t = i / sr
      const env = Math.exp(-t * (name === 'explosion' ? 3 : 6))
      let sample = 0
      switch (name) {
        case 'laugh':
        case 'comedian_laugh':
          sample = Math.sin(2 * Math.PI * (420 + 80 * Math.sin(t * 18)) * t) * env
          sample += Math.sin(2 * Math.PI * 880 * t) * env * 0.3
          break
        case 'applause':
          sample = (Math.random() * 2 - 1) * Math.exp(-t * 1.5) * (0.4 + 0.3 * Math.sin(t * 40))
          break
        case 'rimshot':
          sample =
            Math.sin(2 * Math.PI * 180 * t) * Math.exp(-t * 25) +
            (Math.random() * 2 - 1) * Math.exp(-t * 40) * 0.5
          break
        case 'boo':
          sample = Math.sin(2 * Math.PI * (120 - t * 40) * t) * env
          break
        case 'gasp':
          sample = (Math.random() * 2 - 1) * Math.exp(-t * 12) * 0.7
          break
        case 'whoosh':
          sample = (Math.random() * 2 - 1) * Math.exp(-t * 4) * (t < 0.15 ? t / 0.15 : 1)
          break
        case 'explosion':
          sample = (Math.random() * 2 - 1) * Math.exp(-t * 4) + Math.sin(2 * Math.PI * 60 * t) * env
          break
        case 'robot_beep':
          sample = Math.sin(2 * Math.PI * 880 * t) * (t < 0.08 ? 1 : Math.exp(-(t - 0.08) * 20))
          break
        default:
          sample = Math.sin(2 * Math.PI * 440 * t) * env
      }
      data[i] = Math.max(-1, Math.min(1, sample * 0.55))
    }
    return buffer
  }

  private applyDuck(sfxDurationSec: number): void {
    if (!this.ttsGain || !this.ctx) return
    this.duckCount++
    const now = this.ctx.currentTime
    const attack = DEFAULT_DUCK_ATTACK_MS / 1000
    const release = DEFAULT_DUCK_RELEASE_MS / 1000
    const g = this.ttsGain.gain
    g.cancelScheduledValues(now)
    g.setValueAtTime(g.value, now)
    g.linearRampToValueAtTime(DEFAULT_TTS_DUCK_LEVEL, now + attack)

    const hold = Math.max(0.05, sfxDurationSec)
    window.setTimeout(() => {
      this.releaseDuck(false)
    }, (attack + hold) * 1000)

    // Safety release if something goes wrong
    window.setTimeout(() => {
      this.releaseDuck(true)
    }, (attack + hold + release + 0.5) * 1000)
  }

  private releaseDuck(force: boolean): void {
    if (!this.ttsGain || !this.ctx) return
    if (force) {
      this.duckCount = 0
    } else {
      this.duckCount = Math.max(0, this.duckCount - 1)
      if (this.duckCount > 0) return
    }
    const now = this.ctx.currentTime
    const release = DEFAULT_DUCK_RELEASE_MS / 1000
    const g = this.ttsGain.gain
    g.cancelScheduledValues(now)
    g.setValueAtTime(g.value, now)
    g.linearRampToValueAtTime(1, now + release)
  }
}

/** Shared app instance (set during bootstrap). */
let sharedSfx: SfxManager | null = null

export function setSharedSfxManager(mgr: SfxManager | null): void {
  sharedSfx = mgr
}

export function getSharedSfxManager(): SfxManager | null {
  return sharedSfx
}
