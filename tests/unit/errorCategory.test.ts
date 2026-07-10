import { describe, expect, it } from 'vitest';
import { GroupChatManager } from '../../src/GroupChatManager';

describe('GroupChatManager.getErrorCategory', () => {
  it('classifies WebGPU errors', () => {
    expect(GroupChatManager.getErrorCategory(new Error('WebGPU not available'))).toBe('webgpu');
    expect(GroupChatManager.getErrorCategory('GPU not supported in this browser')).toBe('webgpu');
  });

  it('classifies OOM / GPU memory errors', () => {
    expect(GroupChatManager.getErrorCategory(new Error('GPU OOM during CreateBuffer'))).toBe('oom');
    expect(GroupChatManager.getErrorCategory(new Error('mapAsync failed: buffer was unmapped'))).toBe('oom');
    expect(GroupChatManager.getErrorCategory(new Error('device is lost during inference'))).toBe('oom');
    expect(GroupChatManager.getErrorCategory(new Error('allocation failed: out of memory'))).toBe('oom');
  });

  it('classifies network / fetch errors', () => {
    expect(GroupChatManager.getErrorCategory(new Error('fetch failed: ERR_CONNECTION_REFUSED'))).toBe('network');
    expect(GroupChatManager.getErrorCategory(new Error('Network timeout while downloading from CDN'))).toBe('network');
    expect(GroupChatManager.getErrorCategory(new Error('Cache.add() encountered a network error'))).toBe('network');
  });

  it('classifies llama.cpp WASM runtime mismatch', () => {
    expect(GroupChatManager.getErrorCategory(new Error('llama.cpp runtime mismatch'))).toBe('llamacpp_mismatch');
    expect(GroupChatManager.getErrorCategory(new Error('function import requires a callable'))).toBe('llamacpp_mismatch');
  });

  it('honors WebLLMInitError category when present', () => {
    const err = new Error('init failed');
    err.name = 'WebLLMInitError';
    (err as Error & { category: string }).category = 'network';
    expect(GroupChatManager.getErrorCategory(err)).toBe('network');
  });

  it('returns unknown for unrecognized errors', () => {
    expect(GroupChatManager.getErrorCategory(new Error('something completely unexpected'))).toBe('unknown');
    expect(GroupChatManager.getErrorCategory(42)).toBe('unknown');
  });
});
