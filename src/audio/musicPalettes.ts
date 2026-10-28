import type { StageKitId } from '../visuals/stageKitIds'
import { musicPaletteIdForKit } from '../visuals/stageKitIds'

export type MusicPaletteId = 'house' | 'talkshow' | 'court' | 'news'

export interface MusicPalette {
  id: MusicPaletteId
  label: string
  bpm: number
  /** MIDI note of the tonic (lead octave). */
  rootMidi: number
  /** Scale degrees in semitones above the tonic. Degree n wraps into higher octaves. */
  scale: readonly number[]
  lead: OscillatorType
  pad: OscillatorType
  /** Lowpass cutoff for the lead voice (Hz) — brass is brighter than a courtroom organ. */
  leadCutoff: number
  /** Overall palette loudness (before the user's music volume and speech ducking). */
  gain: number
}

/**
 * One palette per stage kit — the music scales with kits, not with the 360+ modes.
 * Adding a kit means adding one entry in stageKitIds.ts and (optionally) one here.
 */
export const MUSIC_PALETTES: Record<MusicPaletteId, MusicPalette> = {
  // Bare stage: friendly major-pentatonic stingers.
  house: {
    id: 'house', label: 'House band', bpm: 108, rootMidi: 60,
    scale: [0, 2, 4, 7, 9], lead: 'triangle', pad: 'sine', leadCutoff: 3200, gain: 0.9,
  },
  // Late-night talk show: big-band brass, swung major.
  talkshow: {
    id: 'talkshow', label: 'Talk-show band', bpm: 124, rootMidi: 57,
    scale: [0, 2, 4, 5, 7, 9, 11], lead: 'sawtooth', pad: 'triangle', leadCutoff: 2600, gain: 0.75,
  },
  // Courtroom: low, grave organ and timpani in a minor mode.
  court: {
    id: 'court', label: 'Courtroom organ', bpm: 72, rootMidi: 50,
    scale: [0, 2, 3, 5, 7, 8, 10], lead: 'square', pad: 'sine', leadCutoff: 1400, gain: 0.8,
  },
  // Breaking-news desk: tight, urgent synth in a bright mixolydian-ish line.
  news: {
    id: 'news', label: 'News desk', bpm: 132, rootMidi: 62,
    scale: [0, 2, 4, 5, 7, 9, 10], lead: 'square', pad: 'sawtooth', leadCutoff: 3800, gain: 0.6,
  },
}

export function paletteForKit(kit: StageKitId | string | null | undefined): MusicPalette {
  return MUSIC_PALETTES[musicPaletteIdForKit(kit)]
}
