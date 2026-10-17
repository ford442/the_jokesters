/**
 * Rolling WebM via two staggered MediaRecorders.
 *
 * MediaRecorder output is only decodable from its first chunk (the header), so you cannot
 * simply drop old chunks. Instead two recorders run on the same stream, each restarted every
 * `lifetimeMs`, offset by half a lifetime. At any moment the older one holds
 * [lifetime/2, lifetime) of standalone, playable media — clip "the last ~30 s" is just
 * "snapshot the older one". Cost: two encodes of the same stream.
 */

export interface RecorderLike {
  state: string
  start(timeslice?: number): void
  stop(): void
  ondataavailable: ((e: { data: Blob }) => void) | null
  onerror: ((e: unknown) => void) | null
}

export interface RingOptions {
  createRecorder: () => RecorderLike
  /** Recorder lifetime. Default 45 s → snapshots hold 22.5–45 s. */
  lifetimeMs?: number
  now?: () => number
  setTimer?: (fn: () => void, ms: number) => unknown
  clearTimer?: (id: unknown) => void
  mimeType: string
}

interface Slot {
  recorder: RecorderLike | null
  chunks: Blob[]
  startedAt: number
  timer: unknown
}

const TIMESLICE_MS = 1000

export class MediaRecorderRing {
  private slots: [Slot, Slot] = [this.emptySlot(), this.emptySlot()]
  private running = false
  private readonly lifetimeMs: number
  private readonly now: () => number
  private readonly setTimer: (fn: () => void, ms: number) => unknown
  private readonly clearTimer: (id: unknown) => void
  private staggerTimer: unknown = null

  constructor(private readonly opts: RingOptions) {
    this.lifetimeMs = opts.lifetimeMs ?? 45_000
    this.now = opts.now ?? (() => Date.now())
    this.setTimer = opts.setTimer ?? ((fn, ms) => setTimeout(fn, ms))
    this.clearTimer = opts.clearTimer ?? ((id) => clearTimeout(id as ReturnType<typeof setTimeout>))
  }

  private emptySlot(): Slot {
    return { recorder: null, chunks: [], startedAt: 0, timer: null }
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.startSlot(0)
    // The second recorder joins half a lifetime later, giving the offset the snapshot relies on.
    this.staggerTimer = this.setTimer(() => {
      if (this.running) this.startSlot(1)
    }, this.lifetimeMs / 2)
  }

  /** Stop recording but keep what was captured so a clip can still be taken. */
  stop(): void {
    this.running = false
    if (this.staggerTimer !== null) this.clearTimer(this.staggerTimer)
    this.staggerTimer = null
    for (const slot of this.slots) {
      if (slot.timer !== null) this.clearTimer(slot.timer)
      slot.timer = null
      try {
        if (slot.recorder && slot.recorder.state !== 'inactive') slot.recorder.stop()
      } catch { /* already stopped */ }
    }
  }

  isRunning(): boolean {
    return this.running
  }

  private startSlot(index: 0 | 1): void {
    const slot = this.slots[index]
    // Restart: discard the previous generation only now that its replacement is recording.
    const previous = slot.recorder
    const recorder = this.opts.createRecorder()
    const chunks: Blob[] = []
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data)
    }
    recorder.onerror = (e) => console.warn('[ClipRecorder] MediaRecorder error:', e)
    recorder.start(TIMESLICE_MS)
    if (previous && previous.state !== 'inactive') {
      try { previous.stop() } catch { /* ignore */ }
    }
    slot.recorder = recorder
    slot.chunks = chunks
    slot.startedAt = this.now()
    if (slot.timer !== null) this.clearTimer(slot.timer)
    slot.timer = this.setTimer(() => {
      if (this.running) this.startSlot(index)
    }, this.lifetimeMs)
  }

  /** Seconds held by the older recorder (what a clip would contain right now). */
  bufferedSeconds(): number {
    const slot = this.olderSlot()
    return slot ? (this.now() - slot.startedAt) / 1000 : 0
  }

  private olderSlot(): Slot | null {
    const live = this.slots.filter((s) => s.recorder && s.chunks.length > 0)
    if (live.length === 0) return null
    return live.reduce((a, b) => (a.startedAt <= b.startedAt ? a : b))
  }

  /** A standalone, playable blob of the older recorder's media, or null if nothing was captured. */
  snapshot(): Blob | null {
    const slot = this.olderSlot()
    if (!slot) return null
    return new Blob(slot.chunks, { type: this.opts.mimeType })
  }
}
