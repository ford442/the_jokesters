import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SpeechQueue, type UtteranceEvent } from '../../src/audio/SpeechQueue'
import type { TtsEngine } from '../../src/audio/AudioEngine'
import type { Viseme } from '../../src/audio/VisemePredictor'

describe('SpeechQueue utterance events (viseme / caption / ducking feed)', () => {
  let sources: Array<{ onended: (() => void) | null }>
  let clock = 0

  beforeEach(() => {
    sources = []
    clock = 12.5
    class FakeBuffer { copyToChannel() {} }
    class FakeGain { gain = { value: 1 }; connect() {}; disconnect() {} }
    class FakeSource {
      buffer: unknown = null
      onended: (() => void) | null = null
      constructor() { sources.push(this) }
      connect() {}
      start() {}
      stop() {}
    }
    class FakeAudioContext {
      state = 'running'
      sampleRate = 44100
      destination = {}
      get currentTime() { return clock }
      createGain() { return new FakeGain() }
      createBuffer() { return new FakeBuffer() }
      createBufferSource() { return new FakeSource() }
      resume = vi.fn(async () => {})
    }
    vi.stubGlobal('AudioContext', FakeAudioContext)
    vi.stubGlobal('window', { AudioContext: FakeAudioContext, webkitAudioContext: FakeAudioContext })
  })
  afterEach(() => vi.unstubAllGlobals())

  const engine: TtsEngine = { sampleRate: 44100, init: async () => {}, synthesize: async () => ({ audioData: new Float32Array(0) }) }
  const tick = async () => { for (let i = 0; i < 4; i++) await Promise.resolve() }

  it('emits start with worker visemes (timing=tts) anchored to the audio clock', async () => {
    const q = new SpeechQueue(engine)
    const got: UtteranceEvent[] = []
    q.onUtteranceStart((e) => got.push(e))
    const visemes: Viseme[] = [{ phoneme: 'AA', startTime: 0, duration: 1, intensity: 1, mouthShape: 'AA_AH' }]
    q.add(new Float32Array(44100), 44100, { agentId: 'comedian', text: 'ah', visemes })
    await tick()
    expect(got).toHaveLength(1)
    expect(got[0]).toMatchObject({ agentId: 'comedian', text: 'ah', audioStartTime: 12.5, durationSec: 1, timing: 'tts' })
    expect(got[0].visemes).toBe(visemes)
  })

  it('estimates visemes from text over the exact audio length when the engine has no timing', async () => {
    const q = new SpeechQueue(engine)
    const got: UtteranceEvent[] = []
    q.onUtteranceStart((e) => got.push(e))
    q.add(new Float32Array(88200), 44100, { agentId: 'robot', text: 'hello there friend' })
    await tick()
    expect(got[0].timing).toBe('estimated')
    const v = got[0].visemes!
    expect(v.length).toBeGreaterThan(3)
    const end = v[v.length - 1].startTime + v[v.length - 1].duration
    expect(end).toBeCloseTo(2, 1)
  })

  it('reports timing=none (loudness fallback) when there is no text and no visemes', async () => {
    const q = new SpeechQueue(engine)
    const got: UtteranceEvent[] = []
    q.onUtteranceStart((e) => got.push(e))
    q.add(new Float32Array(100), 44100, { agentId: 'robot', text: '   ' })
    await tick()
    expect(got[0].timing).toBe('none')
    expect(got[0].visemes).toBeNull()
  })

  it('emits end on completion and plays queued items back-to-back (end before next start)', async () => {
    const q = new SpeechQueue(engine)
    const log: string[] = []
    q.onUtteranceStart((e) => log.push(`start:${e.text}`))
    q.onUtteranceEnd((e) => log.push(`end:${e.text}`))
    q.add(new Float32Array(100), 44100, { agentId: 'a', text: 'one' })
    q.add(new Float32Array(100), 44100, { agentId: 'b', text: 'two' })
    await tick()
    sources[0].onended?.()
    await tick()
    sources[1].onended?.()
    await tick()
    expect(log).toEqual(['start:one', 'end:one', 'start:two', 'end:two'])
  })

  it('emits end when stop() cuts an utterance off, and add() without meta stays silent', async () => {
    const q = new SpeechQueue(engine)
    const log: string[] = []
    q.onUtteranceStart((e) => log.push(`start:${e.text}`))
    q.onUtteranceEnd((e) => log.push(`end:${e.text}`))
    q.add(new Float32Array(100), 44100) // legacy call, no meta
    await tick()
    expect(log).toEqual([])
    sources[0].onended?.()
    await tick()
    q.add(new Float32Array(100), 44100, { agentId: 'a', text: 'cut' })
    await tick()
    q.stop()
    expect(log).toEqual(['start:cut', 'end:cut'])
  })

  it('unsubscribes and survives a throwing listener', async () => {
    const q = new SpeechQueue(engine)
    const log: string[] = []
    q.onUtteranceStart(() => { throw new Error('boom') })
    const off = q.onUtteranceStart((e) => log.push(e.text))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    q.add(new Float32Array(100), 44100, { agentId: 'a', text: 'x' })
    await tick()
    expect(log).toEqual(['x'])
    off()
    warn.mockRestore()
  })
})
