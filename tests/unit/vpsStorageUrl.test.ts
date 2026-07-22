import { describe, expect, it } from 'vitest'
import {
  isVpsStorageUrl,
  rewriteVpsModelUrl,
  toVpsMirrorUrl,
  VPS_STORAGE_MIRROR_ORIGIN,
  VPS_STORAGE_ORIGIN,
  vpsGzUrl,
} from '../../src/utils/vpsStorageUrl'

describe('rewriteVpsModelUrl', () => {
  it('strips /resolve/main/ on primary and mirror hosts', () => {
    expect(
      rewriteVpsModelUrl(
        'https://storage.1ink.us/models/vicuna-7b-q4f32-webllm/resolve/main/params_shard_0.bin',
      ),
    ).toBe('https://storage.1ink.us/models/vicuna-7b-q4f32-webllm/params_shard_0.bin')

    expect(
      rewriteVpsModelUrl(
        'https://storage.noahcohn.com/models/Hermes-3-Llama-3.2-3B-q4f32_1-MLC/resolve/main/mlc-chat-config.json',
      ),
    ).toBe(
      'https://storage.noahcohn.com/models/Hermes-3-Llama-3.2-3B-q4f32_1-MLC/mlc-chat-config.json',
    )
  })

  it('leaves unrelated URLs unchanged', () => {
    const hf = 'https://huggingface.co/foo/resolve/main/model.bin'
    expect(rewriteVpsModelUrl(hf)).toBe(hf)
  })
})

describe('toVpsMirrorUrl', () => {
  it('swaps primary to mirror and back', () => {
    const primary = `${VPS_STORAGE_ORIGIN}/models/wasm-libs/lib.wasm`
    const mirror = `${VPS_STORAGE_MIRROR_ORIGIN}/models/wasm-libs/lib.wasm`
    expect(toVpsMirrorUrl(primary)).toBe(mirror)
    expect(toVpsMirrorUrl(mirror)).toBe(primary)
  })

  it('returns null for non-VPS URLs', () => {
    expect(toVpsMirrorUrl('https://cdn-lfs.huggingface.co/models/x.bin')).toBeNull()
  })
})

describe('vpsGzUrl', () => {
  it('appends .gz on the same origin only', () => {
    const url = `${VPS_STORAGE_ORIGIN}/models/vicuna-7b-q4f32-webllm/params_shard_0.bin`
    expect(vpsGzUrl(url)).toBe(`${url}.gz`)
  })
})

describe('isVpsStorageUrl', () => {
  it('detects primary and mirror hosts', () => {
    expect(isVpsStorageUrl(`${VPS_STORAGE_ORIGIN}/models/a.bin`)).toBe(true)
    expect(isVpsStorageUrl(`${VPS_STORAGE_MIRROR_ORIGIN}/models/a.bin`)).toBe(true)
    expect(isVpsStorageUrl('https://huggingface.co/a.bin')).toBe(false)
  })
})
