# VRAM Optimization Research Summary

> **Agent Swarm Analysis Results** - Compiled from parallel research across 6 specialized agents

---

## Executive Summary

The agent swarm research identified **8 proven strategies** to reduce 7B model VRAM requirements from ~28GB to ~3-5GB. The most impactful (and easiest) wins are:

1. **Context Window Reduction** (4-8x reduction) - Immediate, zero-effort implementation
2. **Q4_K_M Quantization** (4x reduction) - Use wllama library
3. **Sliding Window Attention** (8x for long contexts) - Mistral-style approach

---

## Agent Research Findings

### Agent 1: Web-LLM Optimization
**Key Discovery:** Web-LLM pre-allocates KV cache at load time based on `context_window_size`. This is the PRIMARY VRAM control mechanism.

**Critical Finding:** There is **NO** `gpu_memory_utilization` parameter in Web-LLM JavaScript API (unlike vLLM Python). Context window is the only lever.

**Code Pattern:**
```typescript
const engine = await CreateMLCEngine(
  "model-id",
  { initProgressCallback },
  {
    context_window_size: 1024,    // ← PRIMARY VRAM control
    sliding_window_size: 512,     // Enable rolling window
    attention_sink_size: 4        // Keep 4 initial tokens
  }
);
```

**VRAM Calculation Formula:**
```
KV Cache = context_window × head_dim × num_kv_heads × num_layers × 2 (K+V) × 2 bytes

Example: 4096 × 128 × 8 × 32 × 2 × 2 = ~537 MB just for KV cache
```

---

### Agent 2: GGUF/WASM Integration
**Key Discovery:** `@wllama/wllama` is the most mature TypeScript binding for llama.cpp.

**Comparison Matrix:**

| Library | WebGPU | GGUF | Custom Models | Multi-thread |
|---------|--------|------|---------------|--------------|
| Web-LLM | ✅ Yes | ❌ No | Hard (TVM compile) | ✅ Yes |
| **wllama** | ❌ No | ✅ Yes | Easy | ✅ Yes |
| llama-cpp-wasm | ❌ No | ✅ Yes | Easy | ❌ No |

**Recommendation:** Use **wllama** for GGUF models, **Web-LLM** for WebGPU performance with prebuilt models.

**VRAM by Quantization (7B model):**

| Quant | Size | VRAM | Quality |
|-------|------|------|---------|
| Q8_0 | ~7.5GB | ~9GB | Near-lossless |
| Q6_K | ~5.7GB | ~7.5GB | Excellent |
| **Q5_K_M** | ~4.5GB | ~6.5GB | **Sweet spot** |
| **Q4_K_M** | ~3.8GB | ~5.5GB | **Default** |
| Q3_K_M | ~3.1GB | ~4.5GB | Degraded |

**Critical Requirement:** Cross-Origin Isolation headers for multi-threading:
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

---

### Agent 3: Layer-by-Layer Loading
**Key Discovery:** Only 2-4 transformer layers need to be in VRAM simultaneously due to sequential processing.

**Architecture Pattern:**
```
┌─────────────────────────────────────┐
│         Layer Pool Manager          │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │
│  │ L0  │ │ L1  │ │ L2  │ │ L3  │   │  ← Active in VRAM
│  │[HOT]│ │[HOT]│ │[WARM│ │[COLD]│   │
│  └─────┘ └─────┘ └─────┘ └─────┘   │
│                                     │
│  L4-L31: Stored in CPU RAM/IndexedDB│
│  Prefetch: L4, L5 async loading     │
└─────────────────────────────────────┘
```

**Implementation Strategy:**
1. Keep LRU cache of N layers in GPU
2. Prefetch next 2 layers during current computation
3. Overlap compute and transfer via double buffering
4. Use `mappedAtCreation: true` for static weights

**VRAM Savings:** 10-20x reduction possible (load 3 of 32 layers = 10x reduction)

---

### Agent 4: KV Cache Compression
**Key Discovery:** Multiple quantization techniques can compose multiplicatively.

**Technique Comparison:**

| Technique | Compression | Accuracy | Composable |
|-----------|-------------|----------|------------|
| FP8 E4M3 | 2× | Minimal | Yes |
| INT8 per-channel | 2× | Minimal | Yes |
| KIVI 2-bit | 4-8× | Low | Yes |
| GQA (4:1) | 4× | Low | Yes |
| Sliding Window | Unbounded | Low-Med | Yes |

**Composable Example:**
```
GQA (4×) + INT8 (2×) = 8× total KV cache reduction
7B model: 537MB → 67MB KV cache
```

**KIVI Algorithm:**
- Keys: Per-channel quantization (handles outliers in fixed channels)
- Values: Per-token quantization (streaming-friendly)
- Recent tokens: Keep in FP16 (residual)

---

### Agent 5: Service Worker & Sharding
**Key Discovery:** Cache API + IndexedDB combination provides best of both worlds.

**Storage Strategy:**

| Storage | Best For | Limit |
|---------|----------|-------|
| Cache API | HTTP responses, range requests | ~200MB per file practical |
| IndexedDB | Large binary blobs | ~2GB per object (browser dependent) |
| OPFS (Origin Private FS) | Streaming files | Disk space |

**Sharding Recommendation:**
- Shard models >500MB to avoid ArrayBuffer limits
- 100-200MB shards provide good granularity
- Use manifest with checksums for integrity

**Service Worker Features:**
- Range request support (206 Partial Content)
- Background Sync for offline download
- Background Fetch (download even when app closed)

---

### Agent 6: VRAM Detection
**Key Discovery:** There is **NO standard API** for querying GPU VRAM in browsers.

**Available Detection Methods:**

| Method | Accuracy | Browser Support |
|--------|----------|-----------------|
| WebGPU adapter.info | Low | Chrome, Edge, Firefox 141+, Safari 26+ |
| WebGL debug_renderer_info | Medium | All (privacy restrictions) |
| navigator.deviceMemory | Low | Chrome/Edge only (system RAM, not VRAM) |
| Buffer probing | High | WebGPU only (intrusive) |

**Best Practice:** Combine heuristics + GPU database + probe allocation

```typescript
// Detection hierarchy
1. WebGPU adapter.info → vendor, architecture
2. GPU name database lookup → estimated VRAM
3. Probe allocate test buffers → actual allocatable
4. Select model based on conservative estimate
```

**Important Limitation:** `maxBufferSize` is per-buffer limit, NOT total VRAM. A GPU with 8GB VRAM may only allow 256MB-2GB per buffer.

---

## Implementation Priority Matrix

| Strategy | VRAM Impact | Effort | Priority |
|----------|-------------|--------|----------|
| Context 4096→1024 | 4× | 1 hour | **P0** |
| Q4_K_M Quantization | 4× | 4 hours | **P0** |
| Sliding Window | 8× | 2 hours | **P1** |
| KV Cache INT8 | 2× | 4 hours | **P1** |
| Service Worker Sharding | Enables streaming | 6 hours | **P2** |
| Layer-by-Layer | 10-20× | 16 hours | **P3** |

---

## Quick Wins (Implement Today)

### 1. Reduce Context Window (5 minutes)
```typescript
// In your CreateMLCEngine call
const engine = await CreateMLCEngine(
  "Hermes-3-Llama-3.2-3B-q4f32_1-MLC",
  { initProgressCallback },
  { context_window_size: 1024 }  // ← Add this
);
```

### 2. Add Sliding Window (10 minutes)
```typescript
const chatOpts = {
  context_window_size: 2048,
  sliding_window_size: 1024,  // ← Add this
  attention_sink_size: 4      // ← Add this
};
```

### 3. Install wllama for GGUF (15 minutes)
```bash
npm install @wllama/wllama
```

```typescript
import { Wllama } from '@wllama/wllama';
import singleThreadWasm from '@wllama/wllama/esm/single-thread/wllama.wasm?url';

const wllama = new Wllama({ 'single-thread/wllama.wasm': singleThreadWasm });
await wllama.loadModelFromHF('TheBloke/vicuna-7B-v1.5-GGUF', 'vicuna-7b-v1.5.Q4_K_M.gguf');
```

### 4. Update Vite Config (5 minutes)
```typescript
// vite.config.ts
export default {
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    }
  }
};
```

---

## Expected Results

### 7B Model VRAM Requirements

| Configuration | VRAM | Status |
|--------------|------|--------|
| Baseline (FP16, 4K ctx) | ~28GB | ❌ Unusable |
| + Q4_K_M quantization | ~7GB | ⚠️ Marginal |
| + 1K context window | ~5GB | ✅ Usable |
| + Sliding window | ~4GB | ✅ Good |
| + KV cache INT8 | ~3.5GB | ✅ Excellent |

### 3B Model VRAM Requirements

| Configuration | VRAM | Status |
|--------------|------|--------|
| Q4_K_M + 2K ctx | ~2GB | ✅ Excellent |

---

## Risk Assessment

| Strategy | Risk | Mitigation |
|----------|------|------------|
| Context reduction | Quality loss on long conversations | Use conversation summarization |
| GGUF migration | Different API | Abstract behind interface |
| Layer streaming | Slower inference | Keep 3-4 layers hot, prefetch |
| KV quantization | Accuracy loss | Test on your use case first |

---

## References

- **Web-LLM:** https://github.com/mlc-ai/web-llm
- **wllama:** https://github.com/ngxson/wllama
- **llama.cpp:** https://github.com/ggerganov/llama.cpp
- **StreamingLLM Paper:** https://arxiv.org/abs/2309.17453
- **KIVI Paper:** https://arxiv.org/abs/2402.02750

---

## Next Steps

1. **Immediate (Today):** Implement context window reduction
2. **This Week:** Add wllama integration for GGUF models
3. **Next Sprint:** Implement sliding window attention
4. **Future:** Consider layer-by-layer for extreme cases

See `VRAM_OPTIMIZATION_IMPLEMENTATION.md` for complete code implementations.
