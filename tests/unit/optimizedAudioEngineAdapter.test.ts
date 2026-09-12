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
  it('exposes a live sampleRate getter from the wrapped engine', async () => {
    const init = vi.fn(async () => {})
    const mutableEngine = {
      sampleRate: 44100,
      init,
      synthesize: vi.fn(async () => {
        // Mimic OptimizedAudioEngine.handleSynthesisSuccess updating rate before resolve
        mutableEngine.sampleRate = 48000
        return fakeSynthesisResult({ sampleRate: 48000 })
      }),
    }
    const fakeEngine = mutableEngine as unknown as OptimizedAudioEngine

    const adapter = new OptimizedAudioEngineAdapter(fakeEngine)

    expect(adapter.sampleRate).toBe(44100)
    expect(adapter.getEngine()).toBe(fakeEngine)

    await adapter.init('https://storage.example/tts/onnx')
    expect(init).toHaveBeenCalledWith('https://storage.example/tts/onnx')

    const audio = await adapter.synthesize('Hello there.', 'comedian', { speed: 1.2 })
    expect(mutableEngine.synthesize).toHaveBeenCalledWith('Hello there.', 'comedian', { speed: 1.2 })
    expect(audio).toBeInstanceOf(Float32Array)
    expect(audio.length).toBe(3)
    // Live getter must reflect the worker rate after synthesize resolves
    expect(adapter.sampleRate).toBe(48000)
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
