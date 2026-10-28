import { describe, expect, it } from 'vitest'
import { RollingBuffer, type TimedItem } from '../../src/recording/rollingBuffer'
import { CaptionTrack, wrapCaption, titleCardFor, CAPTION_LINGER_MS, CAPTION_MAX_MS } from '../../src/recording/captions'
import { MediaRecorderRing, type RecorderLike } from '../../src/recording/mediaRecorderRing'
import { extForMime, pickRecorderMime } from '../../src/recording/ClipRecorder'

const item = (sec: number, key = false, byteLength = 100): TimedItem => ({ timestampUs: sec * 1e6, key, byteLength })

describe('RollingBuffer (keyframe-aligned window)', () => {
  function fill(seconds: number, fps = 10, gopSec = 2) {
    const b = new RollingBuffer<TimedItem, TimedItem>(30 * 1e6)
    for (let i = 0; i <= seconds * fps; i++) {
      const t = i / fps
      b.pushVideo(item(t, Math.abs(t / gopSec - Math.round(t / gopSec)) < 1e-9))
      b.pushAudio(item(t))
    }
    return b
  }

  it('keeps about the window — at least 30 s, at most 30 s plus one GOP — regardless of how long it runs', () => {
    const b = fill(300)
    expect(b.bufferedSeconds()).toBeGreaterThanOrEqual(30)
    expect(b.bufferedSeconds()).toBeLessThanOrEqual(32.1)
    // memory stays bounded: ~32 s of 10 fps video + audio chunks (≈650), not 300 s (≈6000)
    expect(b.byteSize()).toBeLessThan(700 * 100)
  })

  it('snapshots start on a keyframe and cover the window; audio starts with the video', () => {
    const b = fill(120)
    const snap = b.snapshot()!
    expect(snap.video[0].key).toBe(true)
    const latest = snap.video[snap.video.length - 1].timestampUs
    expect((latest - snap.startUs) / 1e6).toBeGreaterThanOrEqual(30)
    expect(snap.audio[0].timestampUs).toBeGreaterThanOrEqual(snap.startUs)
    expect(snap.audio.length).toBeGreaterThan(0)
  })

  it('returns everything from the first keyframe while the buffer is shorter than the window', () => {
    const b = fill(10)
    const snap = b.snapshot()!
    expect(snap.startUs).toBe(0)
    expect(snap.video.length).toBe(101)
  })

  it('is null when empty or when no keyframe has arrived', () => {
    const b = new RollingBuffer<TimedItem, TimedItem>(30e6)
    expect(b.snapshot()).toBeNull()
    b.pushVideo(item(0, false))
    expect(b.snapshot()).toBeNull()
  })

  it('never splits a GOP (head is always a keyframe after trimming)', () => {
    const b = fill(200, 10, 3)
    expect(b.snapshot()!.video[0].key).toBe(true)
  })
})

describe('captions', () => {
  it('shows the current line, lingers briefly, then clears; a new line replaces the old', () => {
    const t = new CaptionTrack()
    expect(t.at(0)).toBeNull()
    t.start('The Comedian', '#f00', 'Why did the chicken…', 1000)
    expect(t.at(1500)?.text).toBe('Why did the chicken…')
    t.end(3000)
    expect(t.at(3000 + CAPTION_LINGER_MS - 1)).not.toBeNull()
    expect(t.at(3000 + CAPTION_LINGER_MS + 1)).toBeNull()
    t.start('The Robot', '#ccc', 'BEEP.', 4000)
    t.start('The Scientist', '#00f', 'Hypothesis.', 4100) // closes the open one
    expect(t.at(4200)?.speaker).toBe('The Scientist')
    expect(t.at(4050)?.speaker).toBe('The Robot')
  })

  it('caps captions whose end never arrives', () => {
    const t = new CaptionTrack()
    t.start('A', '#fff', 'stuck', 0)
    expect(t.at(CAPTION_MAX_MS - 1)).not.toBeNull()
    expect(t.at(CAPTION_MAX_MS + 1)).toBeNull()
  })

  it('wraps to the width and keeps the live tail when too long', () => {
    const measure = (s: string) => s.length
    expect(wrapCaption('one two three four', 9, measure)).toEqual(['one two', 'three', 'four'])
    expect(wrapCaption('', 10, measure)).toEqual([])
    const long = Array.from({ length: 40 }, (_, i) => `w${i}`).join(' ')
    const lines = wrapCaption(long, 20, measure, 3)
    expect(lines).toHaveLength(3)
    expect(lines[0].startsWith('… ')).toBe(true)
    expect(lines[2].endsWith('w39')).toBe(true)
  })

  it('builds a title card from episode metadata with a fallback', () => {
    expect(titleCardFor('Breakfast Court')).toEqual({ show: 'THE JOKESTERS', episode: 'Breakfast Court' })
    expect(titleCardFor('  ').episode).toMatch(/Live show/)
    expect(titleCardFor(null).show).toBe('THE JOKESTERS')
  })
})

describe('MediaRecorderRing (two staggered recorders)', () => {
  function harness() {
    let now = 0
    const timers: Array<{ at: number; fn: () => void; id: number }> = []
    let nextId = 1
    const recorders: FakeRecorder[] = []
    class FakeRecorder implements RecorderLike {
      state = 'inactive'
      ondataavailable: ((e: { data: Blob }) => void) | null = null
      onerror: ((e: unknown) => void) | null = null
      startedAt = 0
      constructor() { recorders.push(this) }
      start() { this.state = 'recording'; this.startedAt = now }
      stop() { this.state = 'inactive' }
      emit(label: string) { this.ondataavailable?.({ data: new Blob([label]) }) }
    }
    const ring = new MediaRecorderRing({
      mimeType: 'video/webm',
      createRecorder: () => new FakeRecorder(),
      lifetimeMs: 45_000,
      now: () => now,
      setTimer: (fn, ms) => { const id = nextId++; timers.push({ at: now + ms, fn, id }); return id },
      clearTimer: (id) => { const i = timers.findIndex((t) => t.id === id); if (i >= 0) timers.splice(i, 1) },
    })
    const advance = (ms: number) => {
      const target = now + ms
      for (;;) {
        timers.sort((a, b) => a.at - b.at)
        const next = timers[0]
        if (!next || next.at > target) break
        timers.shift()
        now = next.at
        next.fn()
      }
      now = target
    }
    // emit one chunk per second on every live recorder, like timeslice=1000
    const tick = (sec: number) => {
      for (let i = 0; i < sec; i++) {
        advance(1000)
        for (const r of recorders) if (r.state === 'recording') r.emit(`r${recorders.indexOf(r)}@${Math.round(now / 1000)}`)
      }
    }
    return { ring, tick, recorders, advance, now: () => now }
  }

  it('always has a snapshot of between lifetime/2 and lifetime once warmed up', () => {
    const h = harness()
    h.ring.start()
    expect(h.recorders).toHaveLength(1)
    h.tick(10)
    expect(h.ring.bufferedSeconds()).toBeCloseTo(10, 0) // only one recorder so far: everything so far
    h.tick(13) // 23 s: second recorder has joined
    expect(h.recorders).toHaveLength(2)
    for (let s = 24; s <= 300; s++) {
      h.tick(1)
      if (s >= 25) {
        expect(h.ring.bufferedSeconds()).toBeGreaterThanOrEqual(22)
        expect(h.ring.bufferedSeconds()).toBeLessThanOrEqual(45.5)
      }
    }
  })

  it('snapshots the older recorder as one standalone blob, and keeps working after stop()', async () => {
    const h = harness()
    h.ring.start()
    h.tick(30)
    const blob = h.ring.snapshot()!
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe('video/webm')
    // older recorder (index 0) chunks only, starting with its first chunk (the WebM header)
    const text = await blob.text()
    expect(text.startsWith('r0@1')).toBe(true)
    expect(text).not.toContain('r1@')
    h.ring.stop()
    expect(h.ring.isRunning()).toBe(false)
    expect(h.recorders.every((r) => r.state === 'inactive')).toBe(true)
    expect(h.ring.snapshot()).not.toBeNull()
  })

  it('returns null before anything is captured', () => {
    const h = harness()
    h.ring.start()
    expect(h.ring.snapshot()).toBeNull()
  })
})

describe('recorder format helpers', () => {
  it('picks the best supported mime and falls back to Safari mp4', () => {
    expect(pickRecorderMime(() => true)).toBe('video/webm;codecs=vp9,opus')
    expect(pickRecorderMime((m) => m === 'video/mp4')).toBe('video/mp4')
    expect(pickRecorderMime(() => false)).toBeNull()
    expect(extForMime('video/webm;codecs=vp9,opus')).toBe('webm')
    expect(extForMime('video/mp4')).toBe('mp4')
  })
})

describe('pickWebCodecsPlan', () => {
  async function plan(videoOk: (codec: string) => boolean, audioOk: (codec: string) => boolean) {
    const { vi } = await import('vitest')
    const stub = (ok: (c: string) => boolean) => Object.assign(function () {}, { isConfigSupported: async (cfg: { codec: string }) => ({ supported: ok(cfg.codec) }) })
    vi.stubGlobal('VideoEncoder', stub(videoOk))
    vi.stubGlobal('AudioEncoder', stub(audioOk))
    vi.stubGlobal('VideoFrame', function () {})
    vi.stubGlobal('AudioData', function () {})
    vi.stubGlobal('MediaStreamTrackProcessor', function () {})
    const { pickWebCodecsPlan } = await import('../../src/recording/webcodecsRing')
    try {
      return await pickWebCodecsPlan(1280, 720, 30, { sampleRate: 48000, channels: 2 })
    } finally {
      vi.unstubAllGlobals()
    }
  }

  it('prefers H.264 + AAC (widest share-target support)', async () => {
    const p = await plan(() => true, () => true)
    expect(p?.video.mux).toBe('avc')
    expect(p?.audio.mux).toBe('aac')
  })

  it('falls back to VP9 + Opus when the browser has no H.264/AAC encoder', async () => {
    const p = await plan((c) => c.startsWith('vp09'), (c) => c === 'opus')
    expect(p?.video.mux).toBe('vp9')
    expect(p?.audio.mux).toBe('opus')
  })

  it('is null when either encoder is unavailable, or WebCodecs is absent', async () => {
    expect(await plan(() => false, () => true)).toBeNull()
    expect(await plan(() => true, () => false)).toBeNull()
    const { pickWebCodecsPlan, webCodecsAvailable } = await import('../../src/recording/webcodecsRing')
    expect(webCodecsAvailable()).toBe(false) // plain node
    expect(await pickWebCodecsPlan(1280, 720, 30, { sampleRate: 48000, channels: 2 })).toBeNull()
  })
})
