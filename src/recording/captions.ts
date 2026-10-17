/**
 * Burned-in captions: a time-indexed transcript plus line wrapping, kept free of canvas code
 * so both are unit-testable. The compositor draws whatever `captionAt` returns.
 */

export interface CaptionEntry {
  speaker: string
  color: string
  text: string
  /** Wall-clock ms (performance.now timeline). */
  startMs: number
  /** null while the utterance is still playing. */
  endMs: number | null
}

/** Captions linger briefly after the audio ends so the last word is readable. */
export const CAPTION_LINGER_MS = 600
/** Hard cap if an utterance never reports its end (e.g. the queue was torn down). */
export const CAPTION_MAX_MS = 20_000

export class CaptionTrack {
  private entries: CaptionEntry[] = []

  start(speaker: string, color: string, text: string, nowMs: number): CaptionEntry {
    // A new line closes any still-open one (back-to-back sentences).
    for (const e of this.entries) if (e.endMs === null) e.endMs = nowMs
    const entry: CaptionEntry = { speaker, color, text: text.trim(), startMs: nowMs, endMs: null }
    this.entries.push(entry)
    if (this.entries.length > 50) this.entries.shift()
    return entry
  }

  end(nowMs: number): void {
    for (let i = this.entries.length - 1; i >= 0; i--) {
      if (this.entries[i].endMs === null) {
        this.entries[i].endMs = nowMs
        return
      }
    }
  }

  /** The caption to show at `nowMs`, or null. */
  at(nowMs: number): CaptionEntry | null {
    for (let i = this.entries.length - 1; i >= 0; i--) {
      const e = this.entries[i]
      if (nowMs < e.startMs) continue
      const end = e.endMs === null ? e.startMs + CAPTION_MAX_MS : e.endMs + CAPTION_LINGER_MS
      if (nowMs <= end) return e
      return null
    }
    return null
  }

  clear(): void {
    this.entries = []
  }
}

/** Greedy word wrap using a caller-supplied width measure (canvas `measureText`, or length in tests). */
export function wrapCaption(text: string, maxWidth: number, measure: (s: string) => number, maxLines = 3): string[] {
  const words = text.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (!line || measure(candidate) <= maxWidth) {
      line = candidate
    } else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  if (lines.length <= maxLines) return lines
  // Too long for the lower third: keep the tail (what is being said right now) with an ellipsis.
  const tail = lines.slice(lines.length - maxLines)
  tail[0] = `… ${tail[0]}`
  return tail
}

export interface TitleCardInfo {
  show: string
  episode: string
}

/** Title-card text from the episode/scene metadata (falls back to a generic episode name). */
export function titleCardFor(sceneTitle: string | null | undefined, now: Date = new Date()): TitleCardInfo {
  const title = (sceneTitle ?? '').trim()
  return {
    show: 'THE JOKESTERS',
    episode: title || `Live show · ${now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
  }
}
