import type { MusicPalette, MusicPaletteId } from './musicPalettes'
import type { ShowCue } from './showCues'

/**
 * Pure score builder: (cue, palette) → timed note events. MusicEngine only has to schedule
 * these on the audio clock, so what each stinger *is* can be unit-tested without Web Audio.
 */

export type NoteVoice = 'tone' | 'thump' | 'noise'

export interface NoteEvent {
  /** Seconds after the cue starts. */
  time: number
  dur: number
  gain: number
  voice: NoteVoice
  /** Tone: oscillator pitch. Thump: starting pitch (drops fast). Noise: highpass cutoff. */
  freq: number
  wave?: OscillatorType
  /** Tone: end pitch of a glide (sad-trombone sag, news sweep). */
  glideTo?: number
  /** Tone: lowpass cutoff (Hz). */
  cutoff?: number
  /** Tone: vibrato in Hz / cents. */
  vibrato?: { rate: number; cents: number }
}

export const midiToHz = (m: number): number => 440 * Math.pow(2, (m - 69) / 12)

/** Frequency of scale degree `n` (0 = tonic; negative = below; ≥ scale.length wraps up an octave). */
export function degreeHz(p: MusicPalette, degree: number, octave = 0): number {
  const len = p.scale.length
  const oct = Math.floor(degree / len)
  const idx = ((degree % len) + len) % len
  return midiToHz(p.rootMidi + p.scale[idx] + 12 * (oct + octave))
}

type Step = readonly [beat: number, degree: number, beats: number, vel?: number]

/** A rhythm table: scale-degree melodies, in beats. */
const MELODY: Record<Exclude<ShowCue, 'bit_died'>, Record<MusicPaletteId, readonly Step[]>> = {
  cold_open: {
    house: [[0, 0, 0.5], [0.5, 2, 0.5], [1, 4, 0.5], [1.5, 2, 0.5], [2, 4, 0.5], [2.5, 5, 0.5], [3, 7, 1.5, 1]],
    // Swung ba-da-ba-da brass fanfare.
    talkshow: [[0, 4, 0.33], [0.5, 4, 0.33], [1, 5, 0.33], [1.5, 7, 0.33], [2, 9, 0.5], [2.67, 7, 0.33], [3, 11, 0.5], [3.5, 14, 1.5, 1]],
    // Two ominous hits then a held fifth.
    court: [[0, 0, 1.2, 1], [1.5, 0, 1.2, 1], [3, 4, 2.5, 0.8]],
    // Urgent 16th ostinato resolving on a hit.
    news: [[0, 0, 0.25], [0.25, 0, 0.25], [0.5, 4, 0.25], [0.75, 0, 0.25], [1, 0, 0.25], [1.25, 0, 0.25], [1.5, 4, 0.25], [1.75, 5, 0.25], [2, 4, 0.5], [2.5, 7, 1, 1]],
  },
  act_break: {
    house: [[0, 0, 0.5], [0.5, 2, 0.5], [1, 4, 0.5], [1.5, 7, 1.2, 1]],
    talkshow: [[0, 4, 0.33], [0.5, 5, 0.33], [1, 7, 0.33], [1.5, 9, 1.2, 1]],
    court: [[0, 0, 1], [1.2, 2, 1], [2.4, 4, 1.6, 0.9]],
    news: [[0, 0, 0.25], [0.25, 2, 0.25], [0.5, 4, 0.25], [0.75, 7, 0.25], [1, 9, 0.9, 1]],
  },
  tag: {
    house: [[0, 4, 0.25], [0.33, 4, 0.25], [0.66, 7, 1.4, 1]],
    // "Shave and a haircut" energy → button.
    talkshow: [[0, 7, 0.4], [0.5, 4, 0.2], [0.75, 4, 0.2], [1, 5, 0.4], [1.5, 4, 0.4], [2.25, 7, 1.2, 1]],
    court: [[0, 0, 0.4, 1], [0.8, 0, 0.4, 1], [1.6, 4, 1.6, 0.8]],
    news: [[0, 7, 0.2], [0.25, 4, 0.2], [0.5, 0, 0.2], [0.75, 7, 1.1, 1]],
  },
}

/** Percussive punctuation for each cue/palette (seconds from cue start). */
function percussion(cue: ShowCue, p: MusicPalette, spb: number): NoteEvent[] {
  const kick = (beat: number, gain = 0.9): NoteEvent => ({ time: beat * spb, dur: 0.35, gain, voice: 'thump', freq: 150 })
  const hat = (beat: number, gain = 0.25): NoteEvent => ({ time: beat * spb, dur: 0.06, gain, voice: 'noise', freq: 6000 })
  const crash = (beat: number, gain = 0.5): NoteEvent => ({ time: beat * spb, dur: 0.9, gain, voice: 'noise', freq: 3500 })

  switch (cue) {
    case 'cold_open':
      if (p.id === 'court') return [kick(0, 1), kick(1.5, 1), crash(3, 0.25)]
      if (p.id === 'news') return [kick(0), hat(0.5), kick(1), hat(1.5), kick(2), crash(2.5, 0.45)]
      return [kick(0), hat(1), kick(2), hat(3), crash(3.5, 0.45)]
    case 'act_break':
      return p.id === 'court' ? [kick(0, 0.8), kick(1.2, 0.8)] : [kick(0, 0.7), hat(0.5), hat(1), crash(1.5, 0.4)]
    case 'tag':
      // The button: a final hit with a crash on the last melody note.
      return p.id === 'court'
        ? [kick(0, 1), kick(0.8, 1), kick(1.6, 0.8)] // gavel
        : [kick(p.id === 'talkshow' ? 2.25 : p.id === 'news' ? 0.75 : 0.66, 0.9), crash(p.id === 'talkshow' ? 2.25 : p.id === 'news' ? 0.75 : 0.66, 0.5)]
    default:
      return []
  }
}

/** "Wah wah wah waaah": four chromatic steps down, the last one long and wobbly. */
function sadTrombone(p: MusicPalette): NoteEvent[] {
  const base = midiToHz(p.rootMidi - 5) // below the lead range
  const step = (n: number) => base * Math.pow(2, -n / 12)
  const mk = (time: number, dur: number, n: number, last = false): NoteEvent => ({
    time,
    dur,
    gain: 0.8,
    voice: 'tone',
    freq: step(n),
    glideTo: last ? step(n + 1.2) : step(n) * 0.985,
    wave: 'sawtooth',
    cutoff: 950,
    vibrato: last ? { rate: 5.5, cents: 35 } : undefined,
  })
  return [mk(0, 0.42, 0), mk(0.5, 0.42, 1), mk(1.0, 0.42, 2), mk(1.5, 1.6, 3, true)]
}

export function buildCueScore(cue: ShowCue, palette: MusicPalette): NoteEvent[] {
  if (cue === 'bit_died') return sadTrombone(palette)
  const spb = 60 / palette.bpm
  const notes: NoteEvent[] = MELODY[cue][palette.id].map(([beat, degree, beats, vel = 0.7]) => ({
    time: beat * spb,
    dur: Math.max(0.08, beats * spb * 0.92),
    gain: vel * 0.6,
    voice: 'tone',
    freq: degreeHz(palette, degree),
    wave: palette.lead,
    cutoff: palette.leadCutoff,
    // The news cold open ends on a short upward sweep; court notes sag slightly for gravity.
    glideTo: cue === 'cold_open' && palette.id === 'news' && degree === 7 ? degreeHz(palette, degree) * 1.5 : undefined,
  }))

  // A low tonic bass under the final (resolving) note anchors the cue.
  const last = MELODY[cue][palette.id][MELODY[cue][palette.id].length - 1]
  notes.push({
    time: last[0] * spb,
    dur: Math.max(0.4, last[2] * spb),
    gain: 0.5,
    voice: 'tone',
    freq: degreeHz(palette, 0, -2),
    wave: palette.pad,
    cutoff: 700,
  })
  notes.push(...percussion(cue, palette, spb))
  return notes.sort((a, b) => a.time - b.time)
}

/** Length of a cue in seconds (last note end). */
export function cueDuration(notes: readonly NoteEvent[]): number {
  return notes.reduce((end, n) => Math.max(end, n.time + n.dur), 0)
}
