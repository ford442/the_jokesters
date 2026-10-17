import { describe, expect, it } from 'vitest'
import {
  ISOLATION_HEADERS,
  probeIsolation,
  wasmThreadCount,
  withIsolationHeaders,
} from '../../src/utils/crossOriginIsolation'
import { wllamaLoadTuning } from '../../src/llm/wllamaRuntime'
import { ttsExecutionProviderFromQuery } from '../../src/audio/OptimizedAudioEngine'
import { EngineTokenEstimator } from '../../src/utils/tokenEstimator'
import { MockLLMEngine } from '../../src/llm/MockLLMEngine'
import viteConfig from '../../vite.config'

describe('cross-origin isolation', () => {
  it('probes isolation and derives WASM thread counts', () => {
    expect(probeIsolation({ crossOriginIsolated: true, SharedArrayBuffer, navigator: { hardwareConcurrency: 12 } })).toMatchObject({
      status: 'isolated',
      wasmThreads: 8,
    })
    expect(probeIsolation({ crossOriginIsolated: false, navigator: { hardwareConcurrency: 12 } })).toMatchObject({
      status: 'not-isolated',
      wasmThreads: 1,
    })
    expect(wasmThreadCount(true, 4)).toBe(3)
    expect(wasmThreadCount(true, 1)).toBe(1)
    expect(wasmThreadCount(true, 16, 4)).toBe(4)
  })

  it('adds COOP/COEP to responses that lack them, leaves others alone', async () => {
    const plain = withIsolationHeaders(new Response('<html>', { headers: { 'Content-Type': 'text/html' } }))
    expect(plain.headers.get('Cross-Origin-Opener-Policy')).toBe('same-origin')
    expect(plain.headers.get('Cross-Origin-Embedder-Policy')).toBe('credentialless')
    expect(plain.headers.get('Content-Type')).toBe('text/html')
    expect(await plain.text()).toBe('<html>')

    const already = new Response('x', { headers: { 'Cross-Origin-Embedder-Policy': 'require-corp' } })
    expect(withIsolationHeaders(already)).toBe(already)
  })

  it('serves the isolation headers from the Vite dev and preview servers', () => {
    const config = typeof viteConfig === 'function' ? viteConfig({ command: 'serve', mode: 'development' }) : viteConfig
    const resolved = config as { server?: { headers?: unknown }; preview?: { headers?: unknown } }
    expect(resolved.server?.headers).toEqual(ISOLATION_HEADERS)
    expect(resolved.preview?.headers).toEqual(ISOLATION_HEADERS)
  })

  it('tunes wllama for threads, batch, KV quant and the context budget', () => {
    expect(wllamaLoadTuning(1024, { isolated: true, hardwareConcurrency: 6 })).toEqual({
      n_ctx: 1024,
      n_threads: 5,
      n_batch: 512,
      cache_type_k: 'q8_0',
      flash_attn: true,
    })
    expect(wllamaLoadTuning(256, { isolated: false, hardwareConcurrency: 6 })).toMatchObject({ n_threads: 1, n_batch: 256 })
  })

  it('opts the TTS worker into WebGPU only via ?ttsWebgpu', () => {
    expect(ttsExecutionProviderFromQuery('')).toBe('wasm')
    expect(ttsExecutionProviderFromQuery('?ttsWebgpu')).toBe('webgpu')
    expect(ttsExecutionProviderFromQuery('?ttsWebgpu=0')).toBe('wasm')
  })
})

describe('async tokenizer counts', () => {
  it('primes exact counts from countTokensAsync and serves them synchronously', async () => {
    const engine = new MockLLMEngine() as MockLLMEngine & { countTokensAsync(text: string): Promise<number> }
    engine.countTokensAsync = async (text) => text.split(' ').length
    const estimator = new EngineTokenEstimator(engine)
    const text = 'one two three four five six seven eight nine ten eleven twelve'
    expect(estimator.estimateText(text)).toBe(Math.ceil(text.length / 4)) // ratio fallback before priming
    await estimator.prime([text])
    expect(estimator.estimateText(text)).toBe(12)
    expect(estimator.getSource()).toBe('tokenizer')
  })
})
