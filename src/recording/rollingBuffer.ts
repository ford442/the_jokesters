/**
 * Rolling window of encoded media, trimmed on GOP boundaries so an export always starts on a
 * keyframe (a clip that opens on a delta frame is garbage until the next keyframe).
 * Pure and codec-agnostic: items only need a timestamp, a keyframe flag and a size.
 */

export interface TimedItem {
  /** Microseconds on the encoder's timeline. */
  timestampUs: number
  /** Video keyframe. Audio items are never keyframes (every audio frame is independently decodable). */
  key: boolean
  byteLength: number
}

export class RollingBuffer<V extends TimedItem, A extends TimedItem> {
  private video: V[] = []
  private audio: A[] = []
  private bytes = 0

  /** @param windowUs how much trailing media a clip must contain. */
  constructor(private readonly windowUs: number) {}

  pushVideo(item: V): void {
    this.video.push(item)
    this.bytes += item.byteLength
    this.trim()
  }

  pushAudio(item: A): void {
    this.audio.push(item)
    this.bytes += item.byteLength
  }

  /** Newest timestamp seen (video drives the clock; audio only if there is no video yet). */
  latestUs(): number {
    const v = this.video[this.video.length - 1]?.timestampUs
    const a = this.audio[this.audio.length - 1]?.timestampUs
    return Math.max(v ?? -Infinity, a ?? -Infinity)
  }

  /** Seconds of video currently held. */
  bufferedSeconds(): number {
    if (this.video.length < 2) return 0
    return (this.video[this.video.length - 1].timestampUs - this.video[0].timestampUs) / 1e6
  }

  byteSize(): number {
    return this.bytes
  }

  /**
   * Drop whole GOPs from the head while the remainder still covers `windowUs`.
   * Keeps one GOP of slack, so the retained span is [window, window + one GOP].
   */
  private trim(): void {
    const latest = this.video[this.video.length - 1].timestampUs
    for (;;) {
      // Index of the second keyframe: the first GOP is [0, secondKey).
      let secondKey = -1
      for (let i = 1; i < this.video.length; i++) {
        if (this.video[i].key) { secondKey = i; break }
      }
      if (secondKey < 0) return
      // Dropping GOP 0 leaves video starting at secondKey; allowed only if that still spans the window.
      if (latest - this.video[secondKey].timestampUs < this.windowUs) return
      for (let i = 0; i < secondKey; i++) this.bytes -= this.video[i].byteLength
      this.video.splice(0, secondKey)
      this.dropAudioBefore(this.video[0].timestampUs)
    }
  }

  /** Audio older than the retained video can never be exported — release it with the video it belonged to. */
  private dropAudioBefore(tsUs: number): void {
    let n = 0
    while (n < this.audio.length && this.audio[n].timestampUs < tsUs) {
      this.bytes -= this.audio[n].byteLength
      n++
    }
    if (n > 0) this.audio.splice(0, n)
  }

  /**
   * The media for a clip of (about) `windowUs`: video from the newest keyframe at or before
   * `latest - windowUs` (or the first keyframe if the buffer is shorter), plus audio from the
   * same instant. Timestamps are left untouched; callers rebase against `startUs`.
   */
  snapshot(): { video: V[]; audio: A[]; startUs: number } | null {
    if (this.video.length === 0) return null
    const latest = this.video[this.video.length - 1].timestampUs
    const cutoff = latest - this.windowUs

    let start = -1
    for (let i = 0; i < this.video.length; i++) {
      if (!this.video[i].key) continue
      if (this.video[i].timestampUs <= cutoff) start = i
      else if (start < 0) start = i // buffer shorter than the window: first keyframe
    }
    if (start < 0) return null

    const video = this.video.slice(start)
    const startUs = video[0].timestampUs
    return { video, audio: this.audio.filter((a) => a.timestampUs >= startUs), startUs }
  }

  clear(): void {
    this.video = []
    this.audio = []
    this.bytes = 0
  }
}
