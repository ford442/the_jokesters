import { describe, expect, it, vi } from 'vitest'
import { OptimizedAudioEngineAdapter } from '../../src/audio/OptimizedAudioEngineAdapter'
import type { OptimizedAudioEngine, SynthesisResult } from '../../src/audio/OptimizedAudioEngine'

function fakeSynthesisResult(overrides: Partial<SynthesisResult> = {}): SynthesisResult {
  return {
    audioData: new Float32Array([0.1, 0.2, 0.3]),
    sampleRate: 24000,
    duration: 1,
    visemes: [],
    latencyMs: 5,
    ...overrides,
  }
}

describe('OptimizedAudioEngineAdapter', () => {
  it('exposes the wrapped engine sample rate and delegates init/synthesize', async () => {
    const init = vi.fn(async () => {})
    const synthesize = vi.fn(async () => fakeSynthesisResult())
    const fakeEngine = { sampleRate: 24000, init, synthesize } as unknown as OptimizedAudioEngine

    const adapter = new OptimizedAudioEngineAdapter(fakeEngine)

    expect(adapter.sampleRate).toBe(24000)
    expect(adapter.getEngine()).toBe(fakeEngine)

    await adapter.init('https://storage.example/tts/onnx')
    expect(init).toHaveBeenCalledWith('https://storage.example/tts/onnx')

    const audio = await adapter.synthesize('Hello there.', 'comedian', { speed: 1.2 })
    expect(synthesize).toHaveBeenCalledWith('Hello there.', 'comedian', { speed: 1.2 })
    expect(audio).toBeInstanceOf(Float32Array)
    expect(audio.length).toBe(3)
  })

  it('unwraps the richer SynthesisResult to a plain Float32Array (SpeechQueue/PrerenderCoordinator contract)', async () => {
    const result = fakeSynthesisResult({ audioData: new Float32Array([1, 2, 3, 4]) })
    const fakeEngine = {
      sampleRate: 24000,
      init: vi.fn(async () => {}),
      synthesize: vi.fn(async () => result),
    } as unknown as OptimizedAudioEngine

    const adapter = new OptimizedAudioEngineAdapter(fakeEngine)
    const audio = await adapter.synthesize('Another line.', 'philosopher')

    // The adapter must return exactly the audioData buffer, dropping visemes/latency/duration —
    // that's the whole point: SpeechQueue only ever wants Promise<Float32Array>.
    expect(audio).toBe(result.audioData)
  })
})
