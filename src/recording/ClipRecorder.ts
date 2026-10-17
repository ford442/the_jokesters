import { ClipCompositor, CLIP_FPS, CLIP_HEIGHT, CLIP_WIDTH } from './ClipCompositor'
import { titleCardFor } from './captions'
import { MediaRecorderRing } from './mediaRecorderRing'
import { pickWebCodecsPlan, WebCodecsRing, webCodecsAvailable } from './webcodecsRing'

export type ClipFormat = 'webm' | 'mp4'

export interface ClipResult {
  blob: Blob
  mime: string
  ext: 'webm' | 'mp4'
  /** Approximate length of the clip in seconds. */
  seconds: number
}

/** What the recorder needs from the rest of the app (all injectable for tests). */
export interface ClipRecorderDeps {
  /** Stage hook: invoked after each rendered frame, same task. Returns an unsubscribe. */
  onAfterRender(cb: (canvas: HTMLCanvasElement) => void): () => void
  /** Master-mix audio stream (TTS + SFX + music, as heard). */
  getAudioStream(): MediaStream
  audioSampleRate: number
  /** TTS utterance feed for captions + idle tracking. */
  speech: {
    onUtteranceStart(cb: (e: { agentId: string; text: string }) => void): () => void
    onUtteranceEnd(cb: () => void): () => void
  }
  resolveSpeaker(agentId: string): { name: string; color: string }
  now?: () => number
}

export const CLIP_FORMAT_KEY = 'jokesters-clip-format'
/** Seconds of show a clip should contain. */
export const CLIP_WINDOW_SEC = 30
/** Stop encoding after this long without speech (buffer stays available for a late "clip it"). */
export const CLIP_IDLE_STOP_MS = 120_000

const WEBM_MIMES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
  // Safari records MP4.
  'video/mp4',
]

export function pickRecorderMime(isSupported: (mime: string) => boolean): string | null {
  return WEBM_MIMES.find((m) => isSupported(m)) ?? null
}

export function extForMime(mime: string): 'webm' | 'mp4' {
  return mime.startsWith('video/mp4') ? 'mp4' : 'webm'
}

/**
 * Rolling "clip the last 30 s" recorder.
 *
 * The composited stage (3D scene + burned-in captions + show title) and the master audio bus
 * are encoded continuously while a show is running; nothing is saved until the user clips.
 * WebM uses two staggered MediaRecorders (mediaRecorderRing.ts); MP4 uses WebCodecs +
 * mp4-muxer (webcodecsRing.ts) where the browser supports it.
 */
export class ClipRecorder {
  private compositor: ClipCompositor | null = null
  private ring: MediaRecorderRing | null = null
  private wcRing: WebCodecsRing | null = null
  private unsubscribers: Array<() => void> = []
  private renderUnsub: (() => void) | null = null
  private idleTimer: ReturnType<typeof setTimeout> | null = null
  private active = false
  private starting: Promise<void> | null = null
  private format: ClipFormat
  private mp4Supported: boolean | null = null
  private readonly now: () => number

  constructor(private readonly deps: ClipRecorderDeps) {
    this.now = deps.now ?? (() => performance.now())
    this.format = loadFormat()
    this.unsubscribers.push(
      deps.speech.onUtteranceStart((e) => this.onUtterance(e)),
      deps.speech.onUtteranceEnd(() => this.onUtteranceEnd()),
    )
  }

  getFormat(): ClipFormat {
    return this.format
  }

  /** MP4 needs WebCodecs (video+audio encode) and an encoder config the browser accepts. */
  async isMp4Supported(): Promise<boolean> {
    if (this.mp4Supported === null) {
      this.mp4Supported = webCodecsAvailable()
        ? (await pickWebCodecsPlan(CLIP_WIDTH, CLIP_HEIGHT, CLIP_FPS, { sampleRate: this.deps.audioSampleRate, channels: 2 })) !== null
        : false
    }
    return this.mp4Supported
  }

  async setFormat(format: ClipFormat): Promise<ClipFormat> {
    if (format === 'mp4' && !(await this.isMp4Supported())) format = 'webm'
    if (format === this.format) return this.format
    this.format = format
    try { localStorage.setItem(CLIP_FORMAT_KEY, format) } catch { /* storage blocked */ }
    // Different encoder → the old buffer is not exportable in the new format.
    const wasActive = this.active
    this.teardownPipeline()
    this.ring = null
    this.wcRing = null
    if (wasActive) void this.start()
    return this.format
  }

  /** Scene title for the show bug / title card. `flash` shows the full-screen card (scene start). */
  setSceneTitle(title: string | null | undefined, flash = false): void {
    const c = this.getCompositor()
    c.setTitle(titleCardFor(title))
    if (flash) c.flashTitleCard(this.now())
  }

  isRecording(): boolean {
    return this.active
  }

  /** Seconds of media a clip taken now would contain. */
  bufferedSeconds(): number {
    if (this.format === 'mp4') return Math.min(CLIP_WINDOW_SEC + 2, this.wcRing?.bufferedSeconds() ?? 0)
    return this.ring?.bufferedSeconds() ?? 0
  }

  private getCompositor(): ClipCompositor {
    if (!this.compositor) this.compositor = new ClipCompositor()
    return this.compositor
  }

  private onUtterance(e: { agentId: string; text: string }): void {
    this.cancelIdle()
    const speaker = this.deps.resolveSpeaker(e.agentId)
    this.getCompositor().captions.start(speaker.name, speaker.color, e.text, this.now())
    void this.start()
  }

  private onUtteranceEnd(): void {
    this.compositor?.captions.end(this.now())
    this.cancelIdle()
    this.idleTimer = setTimeout(() => this.pause(), CLIP_IDLE_STOP_MS)
  }

  private cancelIdle(): void {
    if (this.idleTimer !== null) clearTimeout(this.idleTimer)
    this.idleTimer = null
  }

  /** Begin (or resume) continuous capture. Idempotent. */
  start(): Promise<void> {
    if (this.active) return Promise.resolve()
    if (!this.starting) {
      this.starting = this.doStart()
        .catch((err) => console.warn('[ClipRecorder] could not start:', err))
        .finally(() => { this.starting = null })
    }
    return this.starting
  }

  private async doStart(): Promise<void> {
    const compositor = this.getCompositor()
    const audioStream = this.deps.getAudioStream()

    if (this.format === 'mp4') {
      const plan = await pickWebCodecsPlan(CLIP_WIDTH, CLIP_HEIGHT, CLIP_FPS, { sampleRate: this.deps.audioSampleRate, channels: 2 })
      if (plan) {
        this.wcRing = new WebCodecsRing({ width: CLIP_WIDTH, height: CLIP_HEIGHT, fps: CLIP_FPS, windowSec: CLIP_WINDOW_SEC, plan, audioStream })
        await this.wcRing.start()
        const ring = this.wcRing
        this.renderUnsub = this.deps.onAfterRender((canvas) => {
          const t = this.now()
          if (compositor.draw(canvas, t)) ring.pushFrame(compositor.canvas, t)
        })
        this.active = true
        return
      }
      this.format = 'webm' // encoder vanished since the support probe
    }

    const mime = pickRecorderMime((m) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m))
    if (!mime) throw new Error('MediaRecorder cannot encode any supported video format in this browser')
    const stream = new MediaStream([
      ...compositor.canvas.captureStream(CLIP_FPS).getVideoTracks(),
      ...audioStream.getAudioTracks(),
    ])
    this.ring = new MediaRecorderRing({
      mimeType: mime,
      createRecorder: () =>
        new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 3_500_000, audioBitsPerSecond: 128_000 }) as never,
    })
    this.ring.start()
    this.renderUnsub = this.deps.onAfterRender((canvas) => { compositor.draw(canvas, this.now()) })
    this.active = true
  }

  /** Stop encoding but keep the buffered window exportable. */
  pause(): void {
    this.cancelIdle()
    this.teardownPipeline()
  }

  private teardownPipeline(): void {
    this.renderUnsub?.()
    this.renderUnsub = null
    this.ring?.stop()
    this.wcRing?.stop()
    this.active = false
  }

  /** Save the last ~30 s. Resolves null if nothing has been recorded yet. */
  async clip(): Promise<ClipResult | null> {
    if (this.format === 'mp4') {
      const blob = await this.wcRing?.export()
      if (!blob) return null
      return { blob, mime: 'video/mp4', ext: 'mp4', seconds: Math.min(CLIP_WINDOW_SEC + 2, this.wcRing?.bufferedSeconds() ?? 0) }
    }
    const blob = this.ring?.snapshot()
    if (!blob || blob.size === 0) return null
    const mime = blob.type || 'video/webm'
    return { blob, mime, ext: extForMime(mime), seconds: this.ring?.bufferedSeconds() ?? 0 }
  }

  dispose(): void {
    this.pause()
    for (const off of this.unsubscribers) off()
    this.unsubscribers = []
  }
}

function loadFormat(): ClipFormat {
  try {
    return localStorage.getItem(CLIP_FORMAT_KEY) === 'mp4' ? 'mp4' : 'webm'
  } catch {
    return 'webm'
  }
}

/** Trigger a browser download of a recorded clip. */
export function downloadClip(clip: ClipResult, baseName: string): string {
  const safe = baseName.replace(/[^\w.-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'clip'
  const filename = `jokesters-${safe}-${new Date().toISOString().replace(/[:.]/g, '-')}.${clip.ext}`
  const url = URL.createObjectURL(clip.blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return filename
}
