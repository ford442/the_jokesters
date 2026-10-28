import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getUnifiedModelById } from '../../src/config/models'
import { VPS_STORAGE_URL } from '../../src/utils/vpsStorageUrl'
import { buildStripePlan, defaultStripeConfig, isStripeEligibleUrl, stripeCacheKey } from '../../src/utils/dualDomainStripe'
import { toWllamaMessages, wllamaHasMemory64Build, wllamaLoadTuning, wllamaModelSource } from '../../src/llm/wllamaRuntime'

const wllamaMock = vi.hoisted(() => ({ instance: null as null | Record<string, unknown> }))

vi.mock('@wllama/wllama', () => ({
  Wllama: class {
    constructor() {
      return wllamaMock.instance as object
    }
  },
}))

import { LlamaCppEngineAdapter } from '../../src/llm/LlamaCppEngineAdapter'

const GGUF = `${VPS_STORAGE_URL}/gguf/Kimi-VL-A3B-Thinking-2506-Q4_K_M.gguf`
const MMPROJ = `${VPS_STORAGE_URL}/gguf/mmproj-Kimi-VL-A3B-Thinking-2506-f16.gguf`

describe('Kimi-VL GGUF registry entry', () => {
  const model = getUnifiedModelById('Kimi-VL-A3B-Thinking-2506-GGUF')

  it('is registered next to the other GGUF models with VPS URLs', () => {
    expect(model?.llamaCpp?.gguf_url).toBe(GGUF)
    expect(model?.llamaCpp?.mmprojUrl).toBe(MMPROJ)
  })

  it('does not replace the existing server-API Kimi-VL entry', () => {
    expect(getUnifiedModelById('Kimi-VL-A3B-Thinking-2506')?.api).toBeDefined()
  })

  it('keeps both files on the shared striping path and primary-host cache key', () => {
    for (const url of [GGUF, MMPROJ]) {
      expect(isStripeEligibleUrl(url)).toBe(true)
      const plan = buildStripePlan(200 * 1024 * 1024, url, { ...defaultStripeConfig(), enabled: true })
      expect(plan.enabled).toBe(true)
      expect(plan.mirrorUrl).toContain('/models/gguf/')
      expect(plan.cacheKey).toBe(url)
      expect(stripeCacheKey(url)).toBe(url)
    }
  })
})

describe('wllama mmproj pass-through', () => {
  it('uses { url, mmprojUrl } for a model with a vision projector', () => {
    expect(wllamaModelSource(GGUF, MMPROJ)).toEqual({ url: GGUF, mmprojUrl: MMPROJ })
  })

  it('uses the plain URL when the model has no mmproj', () => {
    expect(wllamaModelSource(GGUF)).toBe(GGUF)
  })
})

describe('toWllamaMessages', () => {
  const fetchImage = vi.fn(async () => new ArrayBuffer(4))
  const withImage = [
    { role: 'system' as const, content: 'be funny' },
    {
      role: 'user' as const,
      content: [
        { type: 'image_url' as const, image_url: { url: 'data:image/png;base64,AAAA' } },
        { type: 'text' as const, text: 'roast this' },
      ],
    },
  ]

  beforeEach(() => {
    fetchImage.mockClear()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  it('turns image parts into ArrayBuffers when the model accepts images', async () => {
    const out = await toWllamaMessages(withImage, { imageInput: true, fetchImage })
    expect(out[0]).toEqual({ role: 'system', content: 'be funny' })
    expect(out[1]).toEqual({
      role: 'user',
      content: [{ type: 'image', data: expect.any(ArrayBuffer) }, { type: 'text', text: 'roast this' }],
    })
    expect(fetchImage).toHaveBeenCalledWith('data:image/png;base64,AAAA')
  })

  it('drops images (text only) without downloading when the model has no vision projector', async () => {
    const out = await toWllamaMessages(withImage, { imageInput: false, fetchImage })
    expect(out[1]).toEqual({ role: 'user', content: 'roast this' })
    expect(fetchImage).not.toHaveBeenCalled()
  })

  it('leaves plain string messages untouched', async () => {
    expect(await toWllamaMessages([{ role: 'assistant', content: 'hi' }])).toEqual([{ role: 'assistant', content: 'hi' }])
  })
})

describe('wllama 3.x load defaults', () => {
  it('keeps GGUF models CPU-only unless the model opts into GPU layers', () => {
    expect(wllamaLoadTuning(1024, { isolated: false, hardwareConcurrency: 4 }).n_gpu_layers).toBe(0)
    expect(wllamaLoadTuning(1024, { gpuLayers: 99 }).n_gpu_layers).toBe(99)
    expect(getUnifiedModelById('vicuna-7b-v1.5-GGUF')?.llamaCpp?.gpuLayers).toBeUndefined()
    expect(getUnifiedModelById('Kimi-VL-A3B-Thinking-2506-GGUF')?.llamaCpp).toMatchObject({
      gpuLayers: 99,
      jinja: true,
      requiresMem64: true,
    })
  })

  it('detects the JSPI + memory64 build', () => {
    expect(wllamaHasMemory64Build({ jspi: false, memory64: true })).toBe(false)
    expect(wllamaHasMemory64Build({ jspi: true, memory64: false })).toBe(false)
    expect(wllamaHasMemory64Build({ jspi: true, memory64: true })).toBe(true)
  })
})

describe('LlamaCppEngineAdapter with Kimi-VL', () => {
  const config = () => {
    const base = getUnifiedModelById('Kimi-VL-A3B-Thinking-2506-GGUF')
    if (!base) throw new Error('Kimi-VL GGUF entry missing')
    return base
  }
  const chunk = (content: string, usage?: object) => ({ choices: [{ delta: { content } }], usage })
  async function* stream(...chunks: object[]) {
    yield* chunks
  }

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.stubGlobal('WebAssembly', { ...WebAssembly, Suspending: function () {}, Memory: class {} })
  })

  it('loads model + mmproj with GPU offload and Jinja, and enables image input', async () => {
    const loadModelFromUrl = vi.fn().mockResolvedValue(undefined)
    const createChatCompletion = vi.fn().mockResolvedValue(stream(chunk('Hel'), chunk('lo', { prompt_tokens: 9, completion_tokens: 2 })))
    wllamaMock.instance = { loadModelFromUrl, supportInputModality: vi.fn().mockReturnValue(true), createChatCompletion }
    const adapter = new LlamaCppEngineAdapter()
    await adapter.initialize(config())

    expect(loadModelFromUrl.mock.calls[0][0]).toEqual({ url: GGUF, mmprojUrl: MMPROJ })
    expect(loadModelFromUrl.mock.calls[0][1]).toMatchObject({ n_gpu_layers: 99, jinja: true, n_ctx: 4096 })

    const onUsage = vi.fn()
    const image = 'data:image/png;base64,iVBORw0KGgo='
    let text = ''
    for await (const delta of adapter.chat(
      [{ role: 'user', content: [{ type: 'image_url', image_url: { url: image } }, { type: 'text', text: 'what is this' }] }],
      { onUsage },
    )) text += delta

    expect(text).toBe('Hello')
    const req = createChatCompletion.mock.calls[0][0]
    expect(req.stream).toBe(true)
    expect(req.messages[0].content[0]).toMatchObject({ type: 'image', data: expect.any(ArrayBuffer) })
    expect(onUsage).toHaveBeenCalledWith(expect.objectContaining({ prefillTokens: 9, completionTokens: 2 }))
  })

  it('sends text only when the loaded model reports no image input', async () => {
    const createChatCompletion = vi.fn().mockResolvedValue(stream(chunk('ok')))
    wllamaMock.instance = {
      loadModelFromUrl: vi.fn().mockResolvedValue(undefined),
      supportInputModality: vi.fn().mockReturnValue(false),
      createChatCompletion,
    }
    const adapter = new LlamaCppEngineAdapter()
    await adapter.initialize(config())
    for await (const _ of adapter.chat(
      [{ role: 'user', content: [{ type: 'image_url', image_url: { url: 'data:image/png;base64,AA==' } }, { type: 'text', text: 'hi' }] }],
      {},
    )) void _
    expect(createChatCompletion.mock.calls[0][0].messages[0]).toEqual({ role: 'user', content: 'hi' })
  })

  it('fails fast without the JSPI + memory64 build instead of using the 32-bit CDN build', async () => {
    vi.stubGlobal('WebAssembly', { ...WebAssembly, Suspending: undefined })
    const loadModelFromUrl = vi.fn()
    wllamaMock.instance = { loadModelFromUrl }
    await expect(new LlamaCppEngineAdapter().initialize(config())).rejects.toThrow(/JSPI and 64-bit memory/)
    expect(loadModelFromUrl).not.toHaveBeenCalled()
  })

  it('does not require memory64 or GPU for the existing CPU GGUF models', async () => {
    vi.stubGlobal('WebAssembly', { ...WebAssembly, Suspending: undefined })
    const loadModelFromUrl = vi.fn().mockResolvedValue(undefined)
    wllamaMock.instance = { loadModelFromUrl, supportInputModality: vi.fn().mockReturnValue(false) }
    const vicuna = getUnifiedModelById('vicuna-7b-v1.5-GGUF')!
    await new LlamaCppEngineAdapter().initialize(vicuna)
    expect(loadModelFromUrl.mock.calls[0][0]).toBe(vicuna.llamaCpp!.gguf_url)
    expect(loadModelFromUrl.mock.calls[0][1]).toMatchObject({ n_gpu_layers: 0 })
    expect(loadModelFromUrl.mock.calls[0][1].jinja).toBeUndefined()
  })
})
