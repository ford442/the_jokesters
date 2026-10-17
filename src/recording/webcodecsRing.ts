import { RollingBuffer, type TimedItem } from './rollingBuffer'

/** Minimal surface for `MediaStreamTrackProcessor` (not in lib.dom yet). */
interface TrackProcessorCtor {
  new (init: { track: MediaStreamTrack }): { readable: ReadableStream<AudioData> }
}

export interface WebCodecsPlan {
  video: { codec: string; mux: 'avc' | 'vp9' }
  audio: { codec: string; mux: 'aac' | 'opus' }
}

/** Preference order: H.264+AAC plays everywhere (iMessage, WhatsApp, X); VP9+Opus is the open fallback. */
const VIDEO_CANDIDATES: WebCodecsPlan['video'][] = [
  { codec: 'avc1.4d0028', mux: 'avc' }, // Main@4.0 — fits 1280×720@30
  { codec: 'vp09.00.31.08', mux: 'vp9' },
]
const AUDIO_CANDIDATES: WebCodecsPlan['audio'][] = [
  { codec: 'mp4a.40.2', mux: 'aac' },
  { codec: 'opus', mux: 'opus' },
]

export function webCodecsAvailable(): boolean {
  const g = globalThis as unknown as Record<string, unknown>
  return (
    typeof g.VideoEncoder === 'function' &&
    typeof g.AudioEncoder === 'function' &&
    typeof g.VideoFrame === 'function' &&
    typeof g.AudioData === 'function' &&
    typeof g.MediaStreamTrackProcessor === 'function'
  )
}

/** First (video, audio) pair the browser can actually encode, or null. */
export async function pickWebCodecsPlan(
  width: number,
  height: number,
  fps: number,
  audio: { sampleRate: number; channels: number },
): Promise<WebCodecsPlan | null> {
  if (!webCodecsAvailable()) return null
  let video: WebCodecsPlan['video'] | null = null
  for (const c of VIDEO_CANDIDATES) {
    try {
      const r = await VideoEncoder.isConfigSupported({ codec: c.codec, width, height, framerate: fps, bitrate: 4_000_000 })
      if (r.supported) { video = c; break }
    } catch { /* try the next candidate */ }
  }
  let aud: WebCodecsPlan['audio'] | null = null
  for (const c of AUDIO_CANDIDATES) {
    try {
      const r = await AudioEncoder.isConfigSupported({ codec: c.codec, sampleRate: audio.sampleRate, numberOfChannels: audio.channels, bitrate: 128_000 })
      if (r.supported) { aud = c; break }
    } catch { /* try the next candidate */ }
  }
  return video && aud ? { video, audio: aud } : null
}

interface VideoItem extends TimedItem {
  chunk: EncodedVideoChunk
}
interface AudioItem extends TimedItem {
  chunk: EncodedAudioChunk
}

export interface WebCodecsRingOptions {
  width: number
  height: number
  fps: number
  windowSec: number
  plan: WebCodecsPlan
  audioStream: MediaStream
}

/** Keyframe cadence. A clip starts on a keyframe, so it overshoots the window by up to this much. */
const KEYFRAME_EVERY_SEC = 2
/** Skip frames rather than let the encoder queue grow when the machine can't keep up. */
const MAX_ENCODE_QUEUE = 10

/**
 * Rolling MP4 via WebCodecs: encodes continuously, keeps ~`windowSec` of encoded chunks in
 * memory (trimmed on GOP boundaries), and muxes them with mp4-muxer only when a clip is taken.
 */
export class WebCodecsRing {
  private readonly buffer: RollingBuffer<VideoItem, AudioItem>
  private videoEncoder: VideoEncoder | null = null
  private audioEncoder: AudioEncoder | null = null
  private videoDecoderConfig: VideoDecoderConfig | null = null
  private audioDecoderConfig: AudioDecoderConfig | null = null
  private audioChannels = 2
  private audioSampleRate = 48000
  private frameIndex = 0
  private startWallMs = 0
  private audioOffsetUs: number | null = null
  private reader: ReadableStreamDefaultReader<AudioData> | null = null
  private running = false
  private failed = false

  constructor(private readonly opts: WebCodecsRingOptions) {
    this.buffer = new RollingBuffer<VideoItem, AudioItem>(opts.windowSec * 1e6)
  }

  async start(): Promise<void> {
    if (this.running) return
    this.running = true
    this.startWallMs = performance.now()
    const { plan, width, height, fps } = this.opts

    this.videoEncoder = new VideoEncoder({
      output: (chunk, meta) => {
        if (meta?.decoderConfig) this.videoDecoderConfig = meta.decoderConfig
        this.buffer.pushVideo({ chunk, timestampUs: chunk.timestamp, key: chunk.type === 'key', byteLength: chunk.byteLength })
      },
      error: (e) => this.fail('video', e),
    })
    this.videoEncoder.configure({
      codec: plan.video.codec,
      width,
      height,
      framerate: fps,
      bitrate: 4_000_000,
      latencyMode: 'realtime',
    })

    const Processor = (globalThis as unknown as { MediaStreamTrackProcessor: TrackProcessorCtor }).MediaStreamTrackProcessor
    const track = this.opts.audioStream.getAudioTracks()[0]
    if (track) {
      this.reader = new Processor({ track }).readable.getReader()
      void this.pumpAudio()
    }
  }

  /** Called by the compositor after each composited frame. */
  pushFrame(canvas: HTMLCanvasElement, nowMs: number): void {
    const enc = this.videoEncoder
    if (!this.running || this.failed || !enc || enc.state !== 'configured') return
    if (enc.encodeQueueSize > MAX_ENCODE_QUEUE) return
    const timestamp = Math.round((nowMs - this.startWallMs) * 1000)
    const frame = new VideoFrame(canvas, { timestamp })
    try {
      const keyFrame = this.frameIndex % (this.opts.fps * KEYFRAME_EVERY_SEC) === 0
      enc.encode(frame, { keyFrame })
      this.frameIndex++
    } finally {
      frame.close()
    }
  }

  private async pumpAudio(): Promise<void> {
    const reader = this.reader
    if (!reader) return
    try {
      while (this.running) {
        const { value, done } = await reader.read()
        if (done || !value) break
        try {
          this.encodeAudio(value)
        } finally {
          value.close()
        }
      }
    } catch (e) {
      if (this.running) this.fail('audio', e)
    }
  }

  private encodeAudio(data: AudioData): void {
    if (this.failed) return
    if (!this.audioEncoder) {
      this.audioChannels = data.numberOfChannels
      this.audioSampleRate = data.sampleRate
      this.audioEncoder = new AudioEncoder({
        output: (chunk, meta) => {
          if (meta?.decoderConfig) this.audioDecoderConfig = meta.decoderConfig
          // Audio keeps its own clock; the pinned offset puts it on the video timeline.
          this.buffer.pushAudio({ chunk, timestampUs: chunk.timestamp + (this.audioOffsetUs ?? 0), key: false, byteLength: chunk.byteLength })
        },
        error: (e) => this.fail('audio', e),
      })
      this.audioEncoder.configure({
        codec: this.opts.plan.audio.codec,
        sampleRate: data.sampleRate,
        numberOfChannels: data.numberOfChannels,
        bitrate: 128_000,
      })
      // Pin the audio clock to the video clock once, then let the audio clock free-run (no jitter).
      this.audioOffsetUs = Math.round((performance.now() - this.startWallMs) * 1000) - data.timestamp
    }
    if (this.audioEncoder.state !== 'configured') return
    this.audioEncoder.encode(data)
  }

  private fail(which: string, e: unknown): void {
    if (this.failed) return
    this.failed = true
    console.warn(`[ClipRecorder] WebCodecs ${which} encoder failed — MP4 capture disabled:`, e)
  }

  hasFailed(): boolean {
    return this.failed
  }

  bufferedSeconds(): number {
    return this.buffer.bufferedSeconds()
  }

  byteSize(): number {
    return this.buffer.byteSize()
  }

  /** Mux the buffered window into an MP4. Null if nothing usable was captured. */
  async export(): Promise<Blob | null> {
    // Drain both encoders first so the clip's tail (frames/audio still queued) is included.
    try { await this.videoEncoder?.flush() } catch { /* encoder closed */ }
    try { await this.audioEncoder?.flush() } catch { /* encoder closed */ }
    const snap = this.buffer.snapshot()
    if (!snap || !this.videoDecoderConfig || snap.video.length < 2) return null

    const { Muxer, ArrayBufferTarget } = await import('mp4-muxer')
    const { plan, width, height, fps } = this.opts
    const hasAudio = this.audioDecoderConfig !== null && snap.audio.length > 0
    const muxer = new Muxer({
      target: new ArrayBufferTarget(),
      video: { codec: plan.video.mux, width, height, frameRate: fps },
      ...(hasAudio ? { audio: { codec: plan.audio.mux, numberOfChannels: this.audioChannels, sampleRate: this.audioSampleRate } } : {}),
      fastStart: 'in-memory',
      // Audio starts up to one codec frame after the keyframe; each track is shifted to start at 0.
      firstTimestampBehavior: 'offset',
    })

    snap.video.forEach((v, i) => {
      muxer.addVideoChunk(v.chunk, i === 0 ? { decoderConfig: this.videoDecoderConfig! } : undefined, v.timestampUs - snap.startUs)
    })
    if (hasAudio) {
      snap.audio.forEach((a, i) => {
        muxer.addAudioChunk(a.chunk, i === 0 ? { decoderConfig: this.audioDecoderConfig! } : undefined, a.timestampUs - snap.startUs)
      })
    }
    muxer.finalize()
    const { buffer } = muxer.target
    return new Blob([buffer], { type: 'video/mp4' })
  }

  stop(): void {
    this.running = false
    try { void this.reader?.cancel() } catch { /* ignore */ }
    this.reader = null
    for (const enc of [this.videoEncoder, this.audioEncoder]) {
      try { if (enc && enc.state !== 'closed') enc.close() } catch { /* already closed */ }
    }
    this.videoEncoder = null
    this.audioEncoder = null
  }
}
