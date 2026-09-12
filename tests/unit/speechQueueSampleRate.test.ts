import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SpeechQueue } from '../../src/audio/SpeechQueue'
import type { TtsEngine } from '../../src/audio/AudioEngine'

describe('SpeechQueue sample-rate tagging (#332)', () => {
  let createBufferCalls: Array<{ channels: number; length: number; sampleRate: number }>

  beforeEach(() => {
    createBufferCalls = []

    class FakeBuffer {
      copyToChannel() {}
    }

    class FakeGain {
      gain = { value: 1 }
      connect() {}
      disconnect() {}
    }

    class FakeSource {
      buffer: unknown = null
      onended: (() => void) | null = null
      connect() {}
      start() {
        // Fire ended asynchronously so playNext completes without blocking
        queueMicrotask(() => this.onended?.())
      }
      stop() {}
    }

    class FakeAudioContext {
      state = 'running'
      sampleRate = 48000
      destination = {}
      createGain() {
        return new FakeGain()
      }
      createBuffer(channels: number, length: number, sampleRate: number) {
        createBufferCalls.push({ channels, length, sampleRate })
        return new FakeBuffer()
      }
      createBufferSource() {
        return new FakeSource()
      }
      resume = vi.fn(async () => {})
    }

    vi.stubGlobal('AudioContext', FakeAudioContext)
    vi.stubGlobal('webkitAudioContext', FakeAudioContext)
    // SpeechQueue reads window.AudioContext (Node vitest has no window by default)
    vi.stubGlobal('window', {
      AudioContext: FakeAudioContext,
      webkitAudioContext: FakeAudioContext,
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('stamps createBuffer with the engine-reported sampleRate (not a hardcoded 24000)', async () => {
    const engine: TtsEngine = {
      sampleRate: 48000,
      init: async () => {},
      synthesize: async () => new Float32Array(0),
    }

    const queue = new SpeechQueue(engine)
    const pcm = new Float32Array(96000) // 2s at 48 kHz
    queue.add(pcm)

    // Allow playNext microtasks
    await Promise.resolve()
    await Promise.resolve()

    expect(createBufferCalls.length).toBeGreaterThanOrEqual(1)
    expect(createBufferCalls[0]).toEqual({
      channels: 1,
      length: 96000,
      sampleRate: 48000,
    })
  })

  it('falls back to 44100 when the engine omits sampleRate (legacy AudioEngine)', async () => {
    const engine: TtsEngine = {
      init: async () => {},
      synthesize: async () => new Float32Array(0),
    }

    const queue = new SpeechQueue(engine)
    queue.add(new Float32Array(4410))

    await Promise.resolve()
    await Promise.resolve()

    expect(createBufferCalls[0]?.sampleRate).toBe(44100)
  })

  it('stamps engine.sampleRate even when audioContext.sampleRate differs (never ctx Hz, never playbackRate)', async () => {
    const playbackRates: unknown[] = []

    class TrackingSource {
      buffer: unknown = null
      onended: (() => void) | null = null
      connect() {}
      start() {
        queueMicrotask(() => this.onended?.())
      }
      stop() {}
      set playbackRate(value: unknown) {
        playbackRates.push(value)
      }
    }

    // Rebuild AudioContext so createBufferSource is the tracking one.
    class FakeAudioContext {
      state = 'running'
      sampleRate = 48000
      destination = {}
      createGain() {
        return { gain: { value: 1 }, connect() {}, disconnect() {} }
      }
      createBuffer(channels: number, length: number, sampleRate: number) {
        createBufferCalls.push({ channels, length, sampleRate })
        return { copyToChannel() {} }
      }
      createBufferSource() {
        return new TrackingSource()
      }
      resume = vi.fn(async () => {})
    }

    vi.stubGlobal('AudioContext', FakeAudioContext)
    vi.stubGlobal('webkitAudioContext', FakeAudioContext)
    vi.stubGlobal('window', {
      AudioContext: FakeAudioContext,
      webkitAudioContext: FakeAudioContext,
    })

    const engine: TtsEngine = {
      sampleRate: 24000,
      init: async () => {},
      synthesize: async () => new Float32Array(0),
    }

    const queue = new SpeechQueue(engine)
    queue.add(new Float32Array(24000))

    await Promise.resolve()
    await Promise.resolve()

    expect(createBufferCalls[0]?.sampleRate).toBe(24000)
    expect(createBufferCalls[0]?.sampleRate).not.toBe(48000)
    expect(playbackRates).toEqual([])
  })

  it('stamps the rate captured at add(), not a later engine.sampleRate mutation', async () => {
    const engine = {
      sampleRate: 44100,
      init: async () => {},
      synthesize: async () => new Float32Array(0),
    }

    const queue = new SpeechQueue(engine)
    queue.add(new Float32Array(44100))
    engine.sampleRate = 24000

    await Promise.resolve()
    await Promise.resolve()

    expect(createBufferCalls[0]?.sampleRate).toBe(44100)
  })
})
