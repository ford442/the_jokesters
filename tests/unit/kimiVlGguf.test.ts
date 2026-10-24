import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getUnifiedModelById } from '../../src/config/models'
import { VPS_STORAGE_URL } from '../../src/utils/vpsStorageUrl'
import { buildStripePlan, defaultStripeConfig, isStripeEligibleUrl, stripeCacheKey } from '../../src/utils/dualDomainStripe'
import { wllamaModelSource, wllamaSupportsMultimodal } from '../../src/llm/wllamaRuntime'

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
  it('uses the plain URL when wllama has no image input', () => {
    expect(wllamaSupportsMultimodal({})).toBe(false)
    expect(wllamaModelSource({}, GGUF, MMPROJ)).toBe(GGUF)
  })

  it('uses { url, mmprojUrl } when wllama supports image input', () => {
    const multimodal = { supportInputModality: () => true }
    expect(wllamaModelSource(multimodal, GGUF, MMPROJ)).toEqual({ url: GGUF, mmprojUrl: MMPROJ })
  })

  it('uses the plain URL when the model has no mmproj', () => {
    expect(wllamaModelSource({ supportInputModality: () => true }, GGUF)).toBe(GGUF)
  })
})

describe('LlamaCppEngineAdapter.initialize with mmprojUrl', () => {
  const config = () => {
    const base = getUnifiedModelById('Kimi-VL-A3B-Thinking-2506-GGUF')
    if (!base) throw new Error('Kimi-VL GGUF entry missing')
    return base
  }

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  it('loads text-only (no mmproj) on a wllama without image input', async () => {
    const loadModelFromUrl = vi.fn().mockResolvedValue(undefined)
    wllamaMock.instance = { loadModelFromUrl }
    await new LlamaCppEngineAdapter().initialize(config())
    expect(loadModelFromUrl.mock.calls[0][0]).toBe(GGUF)
  })

  it('passes the mmproj to a multimodal-capable wllama', async () => {
    const loadModelFromUrl = vi.fn().mockResolvedValue(undefined)
    wllamaMock.instance = { loadModelFromUrl, supportInputModality: () => true }
    await new LlamaCppEngineAdapter().initialize(config())
    expect(loadModelFromUrl.mock.calls[0][0]).toEqual({ url: GGUF, mmprojUrl: MMPROJ })
  })
})
