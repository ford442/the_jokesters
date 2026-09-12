import { describe, expect, it } from 'vitest'
import {
  STRIPE_CHUNK_SIZE,
  STRIPE_PARALLEL_CONNECTIONS,
  STRIPE_RACE_STORAGE_KEY,
  STRIPE_STORAGE_KEY,
  buildStripePlan,
  chunkSourceUrls,
  expectedChunkBytes,
  fetchStripedChunk,
  isChunkLengthValid,
  isStripeEligibleUrl,
  originAttemptOrder,
  parseStripeKillSwitch,
  preferredOriginForChunk,
  raceRangeResponses,
  resolveStripePair,
  splitByteRanges,
  stripeCacheKey,
  stripeProgress,
  stripeWorkerCount,
} from '../../src/utils/dualDomainStripe'
import {
  VPS_STORAGE_MIRROR_ORIGIN,
  VPS_STORAGE_ORIGIN,
} from '../../src/utils/vpsStorageUrl'

const SHARD = `${VPS_STORAGE_ORIGIN}/models/vicuna-7b-q4f32-webllm/params_shard_0.bin`
const MIRROR_SHARD = `${VPS_STORAGE_MIRROR_ORIGIN}/models/vicuna-7b-q4f32-webllm/params_shard_0.bin`
const WASM = `${VPS_STORAGE_ORIGIN}/models/wasm-libs/Llama-2-7b-chat-hf-q4f32_1-ctx4k_cs1k-webgpu.wasm`
const HF = 'https://cdn-lfs.huggingface.co/models/vicuna/params_shard_0.bin'

const ENABLED = { enabled: true, raceFirstByte: false }
const DISABLED = { enabled: false, raceFirstByte: false }

describe('isStripeEligibleUrl', () => {
  it('allows VPS weight / runtime binaries and rejects gzip twins + HF', () => {
    expect(isStripeEligibleUrl(SHARD)).toBe(true)
    expect(isStripeEligibleUrl(WASM)).toBe(true)
    expect(isStripeEligibleUrl(`${SHARD}.gz`)).toBe(false)
    expect(isStripeEligibleUrl(`${VPS_STORAGE_ORIGIN}/models/vicuna/mlc-chat-config.json`)).toBe(false)
    expect(isStripeEligibleUrl(HF)).toBe(false)
  })
})

describe('resolveStripePair / stripeCacheKey', () => {
  it('maps primary and mirror onto a stable primary cache key', () => {
    expect(resolveStripePair(SHARD)).toEqual({ primaryUrl: SHARD, mirrorUrl: MIRROR_SHARD })
    expect(resolveStripePair(MIRROR_SHARD)).toEqual({ primaryUrl: SHARD, mirrorUrl: MIRROR_SHARD })
    expect(stripeCacheKey(SHARD)).toBe(SHARD)
    expect(stripeCacheKey(MIRROR_SHARD)).toBe(SHARD)
    expect(stripeCacheKey(HF)).toBe(HF)
  })

  it('never returns a mirror-host cache key', () => {
    expect(stripeCacheKey(MIRROR_SHARD).startsWith(`${VPS_STORAGE_MIRROR_ORIGIN}/`)).toBe(false)
    expect(stripeCacheKey(SHARD).startsWith(`${VPS_STORAGE_ORIGIN}/`)).toBe(true)
  })
})

describe('splitByteRanges', () => {
  it('emits 42MB chunks and a short tail', () => {
    const fileSize = STRIPE_CHUNK_SIZE * 2 + 100
    const ranges = splitByteRanges(fileSize)
    expect(ranges).toHaveLength(3)
    expect(ranges[0]).toEqual({ index: 0, start: 0, end: STRIPE_CHUNK_SIZE - 1 })
    expect(ranges[1]).toEqual({
      index: 1,
      start: STRIPE_CHUNK_SIZE,
      end: STRIPE_CHUNK_SIZE * 2 - 1,
    })
    expect(ranges[2]).toEqual({
      index: 2,
      start: STRIPE_CHUNK_SIZE * 2,
      end: fileSize - 1,
    })
    expect(expectedChunkBytes(ranges[2])).toBe(100)
    expect(isChunkLengthValid(100, ranges[2])).toBe(true)
    expect(isChunkLengthValid(99, ranges[2])).toBe(false)
  })
})

describe('chunk → origin assignment', () => {
  it('alternates even=primary, odd=mirror with sibling refill', () => {
    const fileSize = STRIPE_CHUNK_SIZE * 4
    const plan = buildStripePlan(fileSize, SHARD, ENABLED)

    expect(plan.enabled).toBe(true)
    expect(plan.cacheKey).toBe(SHARD)
    expect(plan.mirrorUrl).toBe(MIRROR_SHARD)
    expect(plan.chunks).toHaveLength(4)

    expect(plan.chunks[0]?.preferred).toBe('primary')
    expect(plan.chunks[0]?.fallback).toBe('mirror')
    expect(plan.chunks[1]?.preferred).toBe('mirror')
    expect(plan.chunks[1]?.fallback).toBe('primary')
    expect(plan.chunks[2]?.preferred).toBe('primary')
    expect(plan.chunks[3]?.preferred).toBe('mirror')

    expect(originAttemptOrder(plan.chunks[0]!)).toEqual(['primary', 'mirror'])
    expect(originAttemptOrder(plan.chunks[1]!)).toEqual(['mirror', 'primary'])

    expect(chunkSourceUrls(plan.chunks[0]!, plan)).toEqual({
      preferredUrl: SHARD,
      fallbackUrl: MIRROR_SHARD,
    })
    expect(chunkSourceUrls(plan.chunks[1]!, plan)).toEqual({
      preferredUrl: MIRROR_SHARD,
      fallbackUrl: SHARD,
    })
  })

  it('keeps every chunk on primary when the kill-switch is off', () => {
    const plan = buildStripePlan(STRIPE_CHUNK_SIZE * 3, SHARD, DISABLED)
    expect(plan.enabled).toBe(false)
    expect(plan.mirrorUrl).toBeNull()
    expect(plan.cacheKey).toBe(SHARD)
    for (const chunk of plan.chunks) {
      expect(chunk.preferred).toBe('primary')
      expect(chunk.fallback).toBeNull()
      expect(chunkSourceUrls(chunk, plan).fallbackUrl).toBeNull()
      expect(chunkSourceUrls(chunk, plan).preferredUrl).toBe(SHARD)
    }
  })

  it('does not stripe HuggingFace or .gz twins', () => {
    const hfPlan = buildStripePlan(STRIPE_CHUNK_SIZE * 2, HF, ENABLED)
    expect(hfPlan.enabled).toBe(false)
    expect(hfPlan.chunks.every((c) => c.preferred === 'primary' && c.fallback === null)).toBe(true)

    const gzPlan = buildStripePlan(STRIPE_CHUNK_SIZE * 2, `${SHARD}.gz`, ENABLED)
    expect(gzPlan.enabled).toBe(false)
  })

  it('canonicalizes a mirror request URL onto the primary cache key', () => {
    const plan = buildStripePlan(STRIPE_CHUNK_SIZE, MIRROR_SHARD, ENABLED)
    expect(plan.cacheKey).toBe(SHARD)
    expect(plan.primaryUrl).toBe(SHARD)
    expect(plan.mirrorUrl).toBe(MIRROR_SHARD)
  })

  it('preferredOriginForChunk is deterministic', () => {
    expect(preferredOriginForChunk(0, true)).toBe('primary')
    expect(preferredOriginForChunk(1, true)).toBe('mirror')
    expect(preferredOriginForChunk(7, false)).toBe('primary')
    expect(preferredOriginForChunk(0, true, true)).toBe('mirror')
    expect(preferredOriginForChunk(1, true, true)).toBe('primary')
  })

  it('inverts even/odd assignment when invertOrigins is set', () => {
    const plan = buildStripePlan(STRIPE_CHUNK_SIZE * 2, SHARD, {
      enabled: true,
      raceFirstByte: false,
      invertOrigins: true,
    })
    expect(plan.chunks[0]?.preferred).toBe('mirror')
    expect(plan.chunks[0]?.fallback).toBe('primary')
    expect(plan.chunks[1]?.preferred).toBe('primary')
    expect(plan.chunks[1]?.fallback).toBe('mirror')
    expect(plan.cacheKey).toBe(SHARD)
  })
})

describe('fetchStripedChunk refill', () => {
  it('refills from primary when the mirror preferred origin misses', async () => {
    const plan = buildStripePlan(STRIPE_CHUNK_SIZE * 2, SHARD, ENABLED)
    const odd = plan.chunks[1]!
    const hits: string[] = []
    const result = await fetchStripedChunk(odd, plan, async (url) => {
      hits.push(url)
      if (url.includes('noahcohn.com')) throw new Error('mirror miss')
      return new Uint8Array([1, 2, 3])
    })

    expect(hits[0]).toBe(MIRROR_SHARD)
    expect(hits[1]).toBe(SHARD)
    expect(result.fromFallback).toBe(true)
    expect(result.url).toBe(SHARD)
  })

  it('refills from the mirror when the preferred primary origin is blocked', async () => {
    const plan = buildStripePlan(STRIPE_CHUNK_SIZE * 2, SHARD, ENABLED)
    const even = plan.chunks[0]!
    const hits: string[] = []
    const result = await fetchStripedChunk(even, plan, async (url) => {
      hits.push(url)
      if (url === SHARD) {
        throw new Error('primary blocked')
      }
      return new Uint8Array([9])
    })
    expect(hits[0]).toBe(SHARD)
    expect(hits[1]).toBe(MIRROR_SHARD)
    expect(result.fromFallback).toBe(true)
    expect(result.url).toBe(MIRROR_SHARD)
  })

  it('does not touch the mirror when the preferred primary chunk succeeds', async () => {
    const plan = buildStripePlan(STRIPE_CHUNK_SIZE * 2, SHARD, ENABLED)
    const even = plan.chunks[0]!
    const hits: string[] = []
    const result = await fetchStripedChunk(even, plan, async (url) => {
      hits.push(url)
      return new Uint8Array(8)
    })
    expect(hits).toEqual([SHARD])
    expect(result.fromFallback).toBe(false)
  })

  it('propagates when both origins fail', async () => {
    const plan = buildStripePlan(STRIPE_CHUNK_SIZE, SHARD, ENABLED)
    await expect(
      fetchStripedChunk(plan.chunks[0]!, plan, async () => {
        throw new Error('blocked')
      }),
    ).rejects.toThrow('blocked')
  })
})

describe('raceRangeResponses', () => {
  it('returns the faster origin and aborts the slower one', async () => {
    const aborted: string[] = []
    const { url } = await raceRangeResponses('https://primary.example/a.bin', 'https://mirror.example/a.bin', async (u, signal) => {
      signal.addEventListener('abort', () => aborted.push(u))
      if (u.includes('mirror.example')) {
        await new Promise((resolve) => setTimeout(resolve, 40))
        if (signal.aborted) throw new DOMException('aborted', 'AbortError')
      }
      return `ok:${u}`
    })
    expect(url).toBe('https://primary.example/a.bin')
    expect(aborted.some((u) => u.includes('mirror.example'))).toBe(true)
  })
})

describe('parseStripeKillSwitch', () => {
  it('honors ?noStripe over localStorage on', () => {
    const cfg = parseStripeKillSwitch({
      search: '?legacyAudio&noStripe',
      storageGet: (key) => (key === STRIPE_STORAGE_KEY ? '1' : null),
      envEnabled: true,
      envRace: true,
    })
    expect(cfg.enabled).toBe(false)
    expect(cfg.raceFirstByte).toBe(false)
  })

  it('disables via localStorage and enables race via query', () => {
    expect(
      parseStripeKillSwitch({
        search: '',
        storageGet: (key) => (key === STRIPE_STORAGE_KEY ? '0' : null),
        envEnabled: true,
      }).enabled,
    ).toBe(false)

    const raced = parseStripeKillSwitch({
      search: '?stripeRace',
      storageGet: (key) => (key === STRIPE_RACE_STORAGE_KEY ? '0' : null),
      envEnabled: true,
      envRace: false,
    })
    expect(raced.enabled).toBe(true)
    expect(raced.raceFirstByte).toBe(true)
  })
})

describe('stripeProgress / worker count', () => {
  it('never counts past 100% and ignores over-complete bytes', () => {
    expect(stripeProgress(0, 1000)).toEqual({ downloaded: 0, total: 1000, percentage: 0 })
    expect(stripeProgress(500, 1000).percentage).toBe(50)
    expect(stripeProgress(5000, 1000)).toEqual({ downloaded: 1000, total: 1000, percentage: 100 })
  })

  it('halves workers when racing so connection count stays ~4', () => {
    expect(stripeWorkerCount(10, false)).toBe(STRIPE_PARALLEL_CONNECTIONS)
    expect(stripeWorkerCount(10, true)).toBe(Math.ceil(STRIPE_PARALLEL_CONNECTIONS / 2))
    expect(stripeWorkerCount(1, true)).toBe(1)
  })
})
