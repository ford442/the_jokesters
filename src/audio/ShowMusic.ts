import type { MusicEngine } from './MusicEngine'
import { paletteForKit } from './musicPalettes'
import { SHOW_CUE_MIN_GAP_MS, type ShowCue } from './showCues'

export const SHOW_MUSIC_ENABLED_KEY = 'jokesters-show-music'
export const SHOW_MUSIC_VOLUME_KEY = 'jokesters-show-music-volume'

/** Stinger de-duplication: structural cues (cold open / act break / tag) never stack; reactions always play. */
export class CueGate {
  private lastStructural = -Infinity

  constructor(private readonly minGapMs: number = SHOW_CUE_MIN_GAP_MS) {}

  shouldPlay(cue: ShowCue, nowMs: number): boolean {
    if (cue === 'bit_died') return true
    // The tag is the scene's button: it must land even right after an act-break bumper.
    if (cue !== 'tag' && nowMs - this.lastStructural < this.minGapMs) return false
    this.lastStructural = nowMs
    return true
  }
}

interface SpeechSource {
  onUtteranceStart(cb: (e: unknown) => void): () => void
  onUtteranceEnd(cb: (e: unknown) => void): () => void
}

/**
 * App-facing music director: owns the MusicEngine, the current kit palette, the settings
 * toggle/volume (persisted), cue gating, and wires TTS loudness into the ducking sidechain.
 */
export class ShowMusic {
  private kit = 'void'
  private speaking = false
  private readonly gate = new CueGate()
  private getLoudness: () => number = () => 0

  constructor(
    private readonly engine: MusicEngine,
    private readonly now: () => number = () => Date.now(),
  ) {
    this.engine.setEnabled(this.loadEnabled())
    this.engine.setVolume(this.loadVolume())
    this.engine.setSpeechLevelSource(() => this.speechLevel())
  }

  /** Connect TTS: loudness from the lip-sync analyser, plus utterance start/end so breaths between words stay ducked. */
  attachSpeech(queue: SpeechSource, getLoudness: () => number): void {
    this.getLoudness = getLoudness
    queue.onUtteranceStart(() => { this.speaking = true })
    queue.onUtteranceEnd(() => { this.speaking = false })
  }

  private speechLevel(): number {
    const loud = this.getLoudness()
    return this.speaking ? Math.max(loud, 0.05) : loud
  }

  setKit(kit: string): void {
    this.kit = kit
  }

  getKit(): string {
    return this.kit
  }

  /** Fire a show cue in the current kit's palette. Safe to call when disabled or before audio unlock. */
  cue(cue: ShowCue): void {
    if (!this.engine.isEnabled()) return
    if (!this.gate.shouldPlay(cue, this.now())) return
    void this.engine.playCue(cue, paletteForKit(this.kit)).catch((err) => {
      console.warn('[ShowMusic] cue failed:', err)
    })
  }

  /** Settings-panel preview: ignores the structural-cue gate (still honors enabled/volume/ducking). */
  preview(cue: ShowCue): void {
    if (!this.engine.isEnabled()) return
    void this.engine.playCue(cue, paletteForKit(this.kit)).catch(() => undefined)
  }

  startBeat(bpm: number): void {
    void this.engine.startBeat(bpm)
  }

  stopBeat(): void {
    this.engine.stopBeat()
  }

  isEnabled(): boolean {
    return this.engine.isEnabled()
  }

  setEnabled(enabled: boolean): void {
    this.engine.setEnabled(enabled)
    try {
      localStorage.setItem(SHOW_MUSIC_ENABLED_KEY, enabled ? '1' : '0')
    } catch { /* storage blocked */ }
  }

  getVolume(): number {
    return this.engine.getVolume()
  }

  setVolume(v: number): void {
    this.engine.setVolume(v)
    try {
      localStorage.setItem(SHOW_MUSIC_VOLUME_KEY, String(this.engine.getVolume()))
    } catch { /* storage blocked */ }
  }

  private loadEnabled(): boolean {
    try {
      return localStorage.getItem(SHOW_MUSIC_ENABLED_KEY) !== '0'
    } catch {
      return true
    }
  }

  private loadVolume(): number {
    try {
      const raw = localStorage.getItem(SHOW_MUSIC_VOLUME_KEY)
      const v = raw === null ? NaN : parseFloat(raw)
      return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0.7
    } catch {
      return 0.7
    }
  }
}

let shared: ShowMusic | null = null

export function setSharedShowMusic(m: ShowMusic | null): void {
  shared = m
}

export function getSharedShowMusic(): ShowMusic | null {
  return shared
}
