import { describe, expect, it } from 'vitest'
import { classifyInitProgress, formatLoadStatus } from '../../src/app/loadProgress'

describe('classifyInitProgress', () => {
  it('maps rewrite / wasm probe / download / compile / ready from text', () => {
    expect(classifyInitProgress('Rewriting VPS model URLs…')).toBe('rewrite')
    expect(classifyInitProgress('fetch https://storage.1ink.us/models/x/resolve/main/a.bin')).toBe(
      'rewrite',
    )
    expect(classifyInitProgress('Probing model WASM library…')).toBe('wasm_probe')
    expect(classifyInitProgress('HEAD 404 for model_lib vicuna.wasm')).toBe('wasm_probe')
    expect(classifyInitProgress('Downloading params_shard_0.bin')).toBe('download')
    expect(classifyInitProgress('Loading model from cache')).toBe('download')
    expect(classifyInitProgress('Loading GPU shader modules')).toBe('compile')
    expect(classifyInitProgress('Finish loading on GPU')).toBe('compile')
    expect(classifyInitProgress('Finalizing setup...')).toBe('ready')
  })

  it('honors loadFailover telemetry over ambiguous text', () => {
    expect(classifyInitProgress('Working…', 'wasm_probe')).toBe('wasm_probe')
    expect(classifyInitProgress('Retrying Vicuna from Hugging Face…', 'hf_retry')).toBe('download')
    expect(classifyInitProgress('almost', 'success')).toBe('ready')
  })

  it('prefixes a stable stepper label', () => {
    expect(formatLoadStatus('Downloading shard', 'download')).toBe(
      '[3/5 Download] Downloading shard',
    )
    expect(formatLoadStatus('Probing model WASM library…', 'wasm_probe')).toBe(
      '[2/5 WASM] Probing model WASM library…',
    )
  })
})
