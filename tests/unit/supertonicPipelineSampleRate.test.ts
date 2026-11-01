import { describe, expect, it, vi, beforeEach } from 'vitest'
import { SupertonicPipeline, Style } from '../../src/audio/SupertonicPipeline'
import { resolveTtsNativeSampleRate } from '../../src/audio/ttsNativeSampleRate'

describe('SupertonicPipeline sample rate resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('resolves playback sample rate via resolveTtsNativeSampleRate rather than blindly returning configHz', async () => {
    const pipeline = new SupertonicPipeline()
    pipeline.sampleRate = 16000 // JSON config says 16000, but native is 24000

    // Mock internal ORT sessions and data
    ;(pipeline as any).isReady = true
    ;(pipeline as any).textProcessor = { call: vi.fn(() => ({ textIds: [[1]], textMask: [[[1]]] })) }

    ;(pipeline as any).ort = {
      Tensor: class MockTensor {
        constructor(public type: any, public data: any, public dims: any) {}
      }
    }
    ;(pipeline as any).cfgs = {
      ae: { base_chunk_size: 100 },
      ttl: { chunk_compress_factor: 1, latent_dim: 10 }
    }

    const durationSeconds = 1.0 // 1 second
    const expectedSamplesFor24k = 24000

    ;(pipeline as any).dpOrt = {
      run: vi.fn().mockResolvedValue({ duration: { data: new Float32Array([durationSeconds]) } })
    }
    ;(pipeline as any).textEncOrt = {
      run: vi.fn().mockResolvedValue({ text_emb: {} })
    }
    ;(pipeline as any).vectorEstOrt = {
      run: vi.fn().mockResolvedValue({ denoised_latent: { data: new Float32Array(0) } })
    }
    ;(pipeline as any).vocoderOrt = {
      // Vocoder emits PCM corresponding to 48kHz!
      run: vi.fn().mockResolvedValue({ wav_tts: { data: new Float32Array(expectedSamplesFor24k) } })
    }

    const mockStyle = new Style({} as any, {} as any)

    // Call generate
    const result = await pipeline.generate('test', mockStyle, 1, 1.0)

    // configHz = 44100
    // empiricalHz = 96000 / 2 = 48000
    // resolveTtsNativeSampleRate should detect the 48000 Hz actual rate
    expect(result.duration).toBe(durationSeconds)
    expect(result.wav.length).toBe(24000)

    // Let's verify what sampleRate is returned
    expect(result.sampleRate).toBe(24000)
  })
})
