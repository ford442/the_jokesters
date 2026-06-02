# VRAM Optimization Implementation Guide

> **Synthesized research from agent swarm analysis**  
> **Last Updated:** April 2026

---

## Table of Contents

1. [Web-LLM Specific Optimizations](#1-web-llm-specific-optimizations)
2. [GGUF Quantization & WASM Integration](#2-gguf-quantization--wasm-integration)
3. [Layer-by-Layer Progressive Loading](#3-layer-by-layer-progressive-loading)
4. [KV Cache Compression](#4-kv-cache-compression)
5. [Service Worker & Model Sharding](#5-service-worker--model-sharding)
6. [VRAM Detection & Monitoring](#6-vram-detection--monitoring)

---

## 1. Web-LLM Specific Optimizations

### 1.1 Context Window Configuration (4-8x VRAM Reduction)

**Key Finding:** Web-LLM pre-allocates KV cache at model load time based on `context_window_size`. This is the PRIMARY way to control VRAM usage.

```typescript
// src/config/models.ts
import { CreateMLCEngine } from "@mlc-ai/web-llm";

interface OptimizedModelConfig {
  modelId: string;
  contextWindow: number;
  slidingWindow?: number;
  attentionSinkSize?: number;
}

// VRAM calculation for KV cache:
// KV Size = context_window × head_dim × num_kv_heads × num_layers × 2 (K+V) × 2 bytes (fp16)
// Example: 4096 ctx × 128 × 8 × 32 × 2 × 2 = ~537 MB just for KV cache!

export const VRAM_OPTIMIZED_CONFIGS: Record<string, OptimizedModelConfig> = {
  "vicuna-7b-ultra-low": {
    modelId: "ford442/vicuna-7b-q4f32-webllm",
    contextWindow: 512,     // Extreme reduction for <4GB VRAM
    slidingWindow: 256,
    attentionSinkSize: 4
  },
  "vicuna-7b-low": {
    modelId: "ford442/vicuna-7b-q4f32-webllm", 
    contextWindow: 1024,    // Good for ~5GB VRAM
    slidingWindow: 512,
    attentionSinkSize: 4
  },
  "vicuna-7b-medium": {
    modelId: "ford442/vicuna-7b-q4f32-webllm",
    contextWindow: 2048,    // For 6-8GB VRAM
    slidingWindow: 1024,
    attentionSinkSize: 4
  }
};

// Initialize with VRAM-optimized config
export async function createOptimizedEngine(
  configKey: keyof typeof VRAM_OPTIMIZED_CONFIGS,
  progressCallback?: (progress: number) => void
) {
  const config = VRAM_OPTIMIZED_CONFIGS[configKey];
  
  const chatOpts = {
    context_window_size: config.contextWindow,
    sliding_window_size: config.slidingWindow || -1,
    attention_sink_size: config.attentionSinkSize || 0,
    temperature: 0.7,
    top_p: 0.9
  };

  return CreateMLCEngine(
    config.modelId,
    {
      initProgressCallback: (report) => {
        progressCallback?.(report.progress);
      }
    },
    chatOpts  // Applied at model load time
  );
}
```

### 1.2 Sliding Window Attention (Mistral-Style)

**Research Finding:** StreamingLLM research shows keeping just 4 "attention sink" tokens + recent window maintains ~95% quality.

```typescript
// src/utils/SlidingWindowManager.ts
export class SlidingWindowManager {
  private sinkTokens: number = 4;
  private windowSize: number;
  private fullContext: string[] = [];

  constructor(windowSize: number = 512, sinkTokens: number = 4) {
    this.windowSize = windowSize;
    this.sinkTokens = sinkTokens;
  }

  addMessage(message: string): void {
    this.fullContext.push(message);
  }

  getEffectiveContext(): string {
    if (this.fullContext.length <= this.windowSize) {
      return this.fullContext.join('\n');
    }

    // Keep sink tokens (first N) + recent window
    const sinks = this.fullContext.slice(0, this.sinkTokens);
    const recent = this.fullContext.slice(-this.windowSize);
    
    return [
      ...sinks,
      '[... earlier context omitted ...]',
      ...recent
    ].join('\n');
  }

  // For conversation history truncation
  truncateMessages(messages: Array<{role: string; content: string}>): typeof messages {
    const estimatedTokens = messages.reduce((sum, m) => 
      sum + Math.ceil(m.content.length / 4), 0
    );

    if (estimatedTokens <= this.windowSize) return messages;

    // Keep system messages + recent conversation
    const systemMessages = messages.filter(m => m.role === 'system');
    const conversation = messages.filter(m => m.role !== 'system');
    
    // Keep first message (often contains persona) + recent messages
    const recentConversation = conversation.length > this.windowSize 
      ? [conversation[0], ...conversation.slice(-(this.windowSize - 1))]
      : conversation;

    return [...systemMessages, ...recentConversation];
  }
}
```

### 1.3 Web-LLM Model Selection by VRAM

```typescript
// src/config/models.ts
export interface WebLLMModel {
  id: string;
  name: string;
  vramRequiredMB: number;
  contextWindow: number;
  quantization: string;
  lowResource: boolean;
}

export const AVAILABLE_MODELS: WebLLMModel[] = [
  {
    id: "SmolLM2-360M-Instruct-q4f32_1-MLC",
    name: "SmolLM2 360M (Ultra Light)",
    vramRequiredMB: 580,
    contextWindow: 2048,
    quantization: "q4f32",
    lowResource: true
  },
  {
    id: "TinyLlama-1.1B-Chat-v0.4-q4f32_1-MLC-1k",
    name: "TinyLlama 1.1B (1K ctx)",
    vramRequiredMB: 675,
    contextWindow: 1024,
    quantization: "q4f32",
    lowResource: true
  },
  {
    id: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    name: "Llama 3.2 1B",
    vramRequiredMB: 879,
    contextWindow: 4096,
    quantization: "q4f16",
    lowResource: true
  },
  {
    id: "Hermes-3-Llama-3.2-3B-q4f32_1-MLC",
    name: "Hermes 3 3B",
    vramRequiredMB: 2900,
    contextWindow: 4096,
    quantization: "q4f32",
    lowResource: false
  },
  {
    id: "Llama-3.1-8B-Instruct-q4f16_1-MLC-1k",
    name: "Llama 3.1 8B (1K ctx)",
    vramRequiredMB: 4598,
    contextWindow: 1024,
    quantization: "q4f16",
    lowResource: true
  },
  {
    id: "Llama-3.1-8B-Instruct-q4f16_1-MLC",
    name: "Llama 3.1 8B (4K ctx)",
    vramRequiredMB: 5001,
    contextWindow: 4096,
    quantization: "q4f16",
    lowResource: false
  }
];

export function selectModelForVRAM(availableVRAM_MB: number): WebLLMModel {
  // Sort by quality (VRAM requirement) descending
  const sorted = [...AVAILABLE_MODELS].sort((a, b) => 
    b.vramRequiredMB - a.vramRequiredMB
  );
  
  // Find largest model that fits with 20% safety margin
  return sorted.find(m => m.vramRequiredMB <= availableVRAM_MB * 0.8) 
    || AVAILABLE_MODELS[0]; // Fallback to smallest
}
```

### 1.4 Custom-Compiled WASM Model Libraries

**Key Finding:** The generic MLC-prebuilt `.wasm` (e.g., `Llama-2-7b-chat-hf-q4f32_1-ctx4k_cs1k-webgpu.wasm`) is compiled with a 4096-token memory plan baked into the TVM module. Even when we override `context_window_size` to 512 at runtime, the `.wasm` may still reserve buffers based on the original 4K plan, and the override is applied *after* some allocations have already occurred during `CreateMLCEngine`. A custom-compiled `.wasm` with a smaller context baked in reduces peak allocation *before* any chat begins.

**How it works:**
1. Start from the same q4f32_1 converted weight shards (no re-quantization needed)
2. Generate `mlc-chat-config.json` with `context_window_size: 512` (or 1024)
3. Run `mlc_llm compile --device webgpu` — TVM's memory planner generates a tight allocation graph
4. The resulting `.wasm` is only ~3–6 MB and can be served with standard cache headers

**VRAM impact:**
| Variant | model_lib | Runtime overrides | Est. peak VRAM |
|---------|-----------|-------------------|----------------|
| VPS_VICUNA_7B_Q4F32 | Generic 4K .wasm | context_window_size: 2048 | ~4.0 GB |
| VPS_VICUNA_7B_ULTRA_LOW | Generic 4K .wasm | context_window_size: 512 + sliding_window | ~3.5 GB |
| **VPS_VICUNA_7B_CTX512** | **Custom 512-ctx .wasm** | context_window_size: 512 | **~3.2 GB** |
| **VPS_VICUNA_7B_CTX1024** | **Custom 1024-ctx .wasm** | context_window_size: 1024 | **~3.6 GB** |

The 512-ctx custom .wasm gives headroom that runtime overrides alone cannot, because the TVM module itself is compiled for a smaller KV cache and activation workspace.

**Build recipe:**
```bash
# Prerequisites: emsdk, Rust (wasm32-unknown-emscripten), mlc-llm Python package
# See scripts/build-vicuna-wasm.sh for the full automated script

CONTEXT_SIZE=512 ./scripts/build-vicuna-wasm.sh
CONTEXT_SIZE=1024 ./scripts/build-vicuna-wasm.sh
```

**When to use:**
- **CTX512**: GPUs with exactly 4 GB VRAM (e.g., GTX 1650, Intel Arc A380, many laptop iGPUs)
- **CTX1024**: GPUs with 4–5 GB VRAM where you need a bit more conversation history
- Keep the generic `.wasm` + override fallback for compatibility if the custom .wasm is not yet hosted

**Caveats:**
- The build environment is heavy (30–60 min on a clean machine). Use CI or Colab for reproducibility.
- The custom .wasm is *not* a different model — it uses the exact same q4f32_1 weight shards. Only the model_lib changes.
- If a user still OOMs, the existing `dynamicContext.ts` retry chain will fall back to the 3B Hermes model.

---

## 2. GGUF Quantization & WASM Integration

### 2.1 Recommended Library: wllama

**Research Finding:** `wllama` (@ngxson/wllama) is the most mature TypeScript binding for llama.cpp with native GGUF support.

```bash
npm install @wllama/wllama
```

### 2.2 wllama Integration

```typescript
// src/utils/WllamaEngine.ts
import { Wllama } from '@wllama/wllama';
import singleThreadWasm from '@wllama/wllama/esm/single-thread/wllama.wasm?url';
import multiThreadWasm from '@wllama/wllama/esm/multi-thread/wllama.wasm?url';

export interface WllamaConfig {
  n_ctx: number;           // Context size
  n_gpu_layers: number;    // -1 = all on GPU, 0 = all on CPU
  n_threads: number;       // WASM threads (recommend 4)
  temp: number;
  top_p: number;
  top_k: number;
}

export class WllamaEngine {
  private wllama: Wllama | null = null;
  private isLoaded: boolean = false;

  constructor() {
    // Check cross-origin isolation for multi-threading
    if (typeof crossOriginIsolated !== 'undefined' && !crossOriginIsolated) {
      console.warn('Cross-origin isolation not enabled. Multi-threading disabled.');
    }
  }

  async loadModel(
    modelUrl: string,
    progressCallback?: (loaded: number, total: number) => void
  ): Promise<void> {
    // Configure WASM paths
    const wasmPaths = {
      'single-thread/wllama.wasm': singleThreadWasm,
      'multi-thread/wllama.wasm': multiThreadWasm,
    };

    this.wllama = new Wllama(wasmPaths, {
      allowOffline: true,  // Use cached model if available
    });

    // For HuggingFace models
    if (modelUrl.includes('huggingface.co')) {
      const [repo, file] = this.parseHFUrl(modelUrl);
      await this.wllama.loadModelFromHF(repo, file, {
        progressCallback: ({ loaded, total }) => {
          progressCallback?.(loaded, total);
        }
      });
    } else {
      // Direct URL loading
      await this.wllama.loadModelFromUrl(modelUrl, {
        progressCallback: ({ loaded, total }) => {
          progressCallback?.(loaded, total);
        }
      });
    }

    this.isLoaded = true;
  }

  async createCompletion(
    messages: Array<{role: string; content: string}>,
    config: Partial<WllamaConfig> = {}
  ): Promise<string> {
    if (!this.wllama || !this.isLoaded) {
      throw new Error('Model not loaded');
    }

    const stream = await this.wllama.createChatCompletion(messages, {
      nPredict: config.n_ctx || 1024,
      sampling: {
        temp: config.temp ?? 0.7,
        top_p: config.top_p ?? 0.9,
        top_k: config.top_k ?? 40
      },
      stream: true
    });

    let result = '';
    for await (const chunk of stream) {
      result += chunk.currentText;
    }

    return result;
  }

  async *streamCompletion(
    messages: Array<{role: string; content: string}>,
    config: Partial<WllamaConfig> = {}
  ): AsyncGenerator<string> {
    if (!this.wllama || !this.isLoaded) {
      throw new Error('Model not loaded');
    }

    const stream = await this.wllama.createChatCompletion(messages, {
      nPredict: 1024,
      sampling: {
        temp: config.temp ?? 0.7,
        top_p: config.top_p ?? 0.9,
        top_k: config.top_k ?? 40
      },
      stream: true
    });

    for await (const chunk of stream) {
      yield chunk.currentText;
    }
  }

  unload(): void {
    this.wllama?.unloadModel();
    this.isLoaded = false;
  }

  private parseHFUrl(url: string): [string, string] {
    // Parse huggingface.co/repo/file.gguf format
    const match = url.match(/huggingface\.co\/([^\/]+\/[^\/]+)\/(?:resolve\/main\/)?(.+\.gguf)/);
    if (!match) throw new Error('Invalid HuggingFace URL');
    return [match[1], match[2]];
  }
}
```

### 2.3 GGUF Quantization Selection

| Quant | 7B Size | 7B VRAM | Quality | Recommendation |
|-------|---------|---------|---------|----------------|
| Q8_0 | ~7.5GB | ~9GB | Near-lossless | Max quality |
| Q6_K | ~5.7GB | ~7.5GB | Excellent | High quality |
| **Q5_K_M** | ~4.5GB | ~6.5GB | Very Good | **Sweet spot** |
| **Q4_K_M** | ~3.8GB | ~5.5GB | Good | **Default** |
| Q3_K_M | ~3.1GB | ~4.5GB | Noticeable loss | Last resort |

```typescript
// src/config/ggufModels.ts
export const GGUF_MODELS = [
  {
    id: 'vicuna-7b-q4_k_m',
    name: 'Vicuna 7B Q4_K_M',
    repo: 'TheBloke/vicuna-7B-v1.5-GGUF',
    file: 'vicuna-7b-v1.5.Q4_K_M.gguf',
    sizeMB: 3800,
    vramMB: 5500,
    quantization: 'Q4_K_M',
    contextSize: 4096
  },
  {
    id: 'vicuna-7b-q5_k_m',
    name: 'Vicuna 7B Q5_K_M',
    repo: 'TheBloke/vicuna-7B-v1.5-GGUF',
    file: 'vicuna-7b-v1.5.Q5_K_M.gguf',
    sizeMB: 4500,
    vramMB: 6500,
    quantization: 'Q5_K_M',
    contextSize: 4096
  },
  {
    id: 'hermes-3-3b-q4_k_m',
    name: 'Hermes 3 3B Q4_K_M',
    repo: 'TheBloke/Hermes-3-Llama-3.2-3B-GGUF',
    file: 'hermes-3-llama-3.2-3b.Q4_K_M.gguf',
    sizeMB: 1800,
    vramMB: 2800,
    quantization: 'Q4_K_M',
    contextSize: 8192
  }
];
```

### 2.4 Vite Configuration for Cross-Origin Isolation

```typescript
// vite.config.ts
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    }
  },
  build: {
    target: 'esnext', // Required for top-level await
  },
  optimizeDeps: {
    exclude: ['@wllama/wllama'] // WASM files should not be bundled
  }
});
```

---

## 3. Layer-by-Layer Progressive Loading

### 3.1 WebGPU Buffer Pool Manager

```typescript
// src/utils/LayerPoolManager.ts

interface LayerBuffer {
  id: number;
  buffer: GPUBuffer;
  size: number;
  lastAccessed: number;
}

interface LayerPoolConfig {
  maxLayersInVRAM: number;   // Keep only N layers in GPU
  totalLayers: number;
  prefetchCount: number;     // Prefetch next N layers
}

export class LayerPoolManager {
  private device: GPUDevice;
  private cache: Map<number, LayerBuffer> = new Map();
  private layerWeights: Map<number, ArrayBuffer>; // CPU-side storage
  private config: LayerPoolConfig;
  private accessCounter: number = 0;

  constructor(
    device: GPUDevice,
    config: LayerPoolConfig,
    layerWeights: Map<number, ArrayBuffer>
  ) {
    this.device = device;
    this.config = config;
    this.layerWeights = layerWeights;
  }

  async initialize(): Promise<void> {
    // Pre-load first N layers
    const initialLayers = Math.min(
      this.config.maxLayersInVRAM,
      this.config.totalLayers
    );
    
    for (let i = 0; i < initialLayers; i++) {
      await this.loadLayer(i);
    }
  }

  async getLayer(layerId: number): Promise<GPUBuffer> {
    const cached = this.cache.get(layerId);
    if (cached) {
      cached.lastAccessed = ++this.accessCounter;
      return cached.buffer;
    }

    // Evict oldest if at capacity
    if (this.cache.size >= this.config.maxLayersInVRAM) {
      this.evictLRU();
    }

    // Load requested layer
    await this.loadLayer(layerId);

    // Prefetch next layers asynchronously
    this.schedulePrefetch(layerId + 1);

    return this.cache.get(layerId)!.buffer;
  }

  private async loadLayer(layerId: number): Promise<void> {
    const weights = this.layerWeights.get(layerId);
    if (!weights) throw new Error(`Layer ${layerId} not found`);

    // Create GPU buffer
    const buffer = this.device.createBuffer({
      size: weights.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });

    // Copy weights to GPU
    new Uint8Array(buffer.getMappedRange()).set(new Uint8Array(weights));
    buffer.unmap();

    this.cache.set(layerId, {
      id: layerId,
      buffer,
      size: weights.byteLength,
      lastAccessed: ++this.accessCounter
    });
  }

  private evictLRU(): void {
    let oldest: LayerBuffer | null = null;
    let oldestAccess = Infinity;

    for (const layer of this.cache.values()) {
      if (layer.lastAccessed < oldestAccess) {
        oldestAccess = layer.lastAccessed;
        oldest = layer;
      }
    }

    if (oldest) {
      oldest.buffer.destroy();
      this.cache.delete(oldest.id);
      console.log(`[LayerPool] Evicted layer ${oldest.id}`);
    }
  }

  private schedulePrefetch(startId: number): void {
    const endId = Math.min(
      startId + this.config.prefetchCount,
      this.config.totalLayers
    );

    // Non-blocking prefetch
    setTimeout(() => {
      for (let i = startId; i < endId; i++) {
        if (!this.cache.has(i) && this.cache.size < this.config.maxLayersInVRAM) {
          this.loadLayer(i).catch(() => {}); // Ignore prefetch errors
        }
      }
    }, 0);
  }

  getStats(): { cached: number; total: number; vramUsed: number } {
    let vramUsed = 0;
    for (const layer of this.cache.values()) {
      vramUsed += layer.size;
    }

    return {
      cached: this.cache.size,
      total: this.config.totalLayers,
      vramUsed
    };
  }

  dispose(): void {
    for (const layer of this.cache.values()) {
      layer.buffer.destroy();
    }
    this.cache.clear();
  }
}
```

### 3.2 Model Shard Loader

```typescript
// src/utils/ModelShardLoader.ts

interface ShardIndex {
  model_id: string;
  total_layers: number;
  layers: Array<{
    id: number;
    file: string;
    offset: number;
    size: number;
    sha256: string;
  }>;
}

export class ModelShardLoader {
  private cacheName = 'jokesters-model-shards-v1';
  private index: ShardIndex | null = null;
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async loadIndex(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/index.json`);
    this.index = await response.json();
  }

  async loadLayer(layerId: number): Promise<ArrayBuffer> {
    if (!this.index) throw new Error('Index not loaded');

    const layer = this.index.layers.find(l => l.id === layerId);
    if (!layer) throw new Error(`Layer ${layerId} not found`);

    // Check Cache API first
    const cache = await caches.open(this.cacheName);
    const cached = await cache.match(`${this.baseUrl}/${layer.file}`);
    
    if (cached) {
      return cached.arrayBuffer();
    }

    // Fetch from network with Range request support
    const response = await fetch(`${this.baseUrl}/${layer.file}`, {
      headers: {
        'Range': `bytes=0-${layer.size - 1}`
      }
    });

    if (!response.ok && response.status !== 206) {
      throw new Error(`Failed to load layer ${layerId}: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();

    // Cache for next time
    await cache.put(
      `${this.baseUrl}/${layer.file}`,
      new Response(buffer)
    );

    return buffer;
  }

  async getProgress(): Promise<{ cached: number; total: number }> {
    if (!this.index) return { cached: 0, total: 0 };

    const cache = await caches.open(this.cacheName);
    const keys = await cache.keys();
    const cachedLayers = keys.filter(r => 
      r.url.includes('/layer_') || r.url.includes('/shard_')
    ).length;

    return {
      cached: cachedLayers,
      total: this.index.total_layers
    };
  }

  // Background download of remaining layers
  async prefetchRemaining(): Promise<void> {
    if (!this.index) return;

    const progress = await this.getProgress();
    if (progress.cached >= progress.total) return;

    // Use Background Sync API if available
    if ('sync' in self.registration) {
      await self.registration.sync.register('download-model-shards');
    }
  }
}
```

---

## 4. KV Cache Compression

### 4.1 KV Cache Quantization

```typescript
// src/utils/KVCacheCompressor.ts

export type QuantizationType = 'fp16' | 'fp8' | 'int8' | 'kivi';

interface KVCacheConfig {
  quantization: QuantizationType;
  groupSize: number;      // For KIVI-style quantization
  residualLength: number; // Tokens to keep in FP16
}

export class KVCacheCompressor {
  private config: KVCacheConfig;

  constructor(config: Partial<KVCacheConfig> = {}) {
    this.config = {
      quantization: config.quantization || 'int8',
      groupSize: config.groupSize || 32,
      residualLength: config.residualLength || 128
    };
  }

  // Quantize key cache with per-channel quantization
  quantizeKeys(keys: Float32Array, headDim: number): {
    quantized: Int8Array;
    scales: Float32Array;
  } {
    const seqLen = keys.length / headDim;
    const quantized = new Int8Array(keys.length);
    const scales = new Float32Array(headDim);

    // Per-channel quantization
    for (let d = 0; d < headDim; d++) {
      // Find max abs value for this channel
      let maxAbs = 0;
      for (let t = 0; t < seqLen; t++) {
        maxAbs = Math.max(maxAbs, Math.abs(keys[t * headDim + d]));
      }

      scales[d] = maxAbs / 127;
      
      // Quantize
      for (let t = 0; t < seqLen; t++) {
        const val = keys[t * headDim + d] / scales[d];
        quantized[t * headDim + d] = Math.max(-128, Math.min(127, Math.round(val)));
      }
    }

    return { quantized, scales };
  }

  // Quantize value cache with per-token quantization
  quantizeValues(values: Float32Array, headDim: number): {
    quantized: Int8Array;
    scales: Float32Array;
  } {
    const seqLen = values.length / headDim;
    const quantized = new Int8Array(values.length);
    const scales = new Float32Array(seqLen);

    // Per-token quantization
    for (let t = 0; t < seqLen; t++) {
      let maxAbs = 0;
      for (let d = 0; d < headDim; d++) {
        maxAbs = Math.max(maxAbs, Math.abs(values[t * headDim + d]));
      }

      scales[t] = maxAbs / 127;

      for (let d = 0; d < headDim; d++) {
        const val = values[t * headDim + d] / scales[t];
        quantized[t * headDim + d] = Math.max(-128, Math.min(127, Math.round(val)));
      }
    }

    return { quantized, scales };
  }

  dequantize(
    quantized: Int8Array,
    scales: Float32Array,
    mode: 'per_channel' | 'per_token',
    headDim: number
  ): Float32Array {
    const result = new Float32Array(quantized.length);

    if (mode === 'per_channel') {
      const seqLen = quantized.length / headDim;
      for (let t = 0; t < seqLen; t++) {
        for (let d = 0; d < headDim; d++) {
          result[t * headDim + d] = quantized[t * headDim + d] * scales[d];
        }
      }
    } else {
      const seqLen = scales.length;
      for (let t = 0; t < seqLen; t++) {
        for (let d = 0; d < headDim; d++) {
          result[t * headDim + d] = quantized[t * headDim + d] * scales[t];
        }
      }
    }

    return result;
  }

  // KIVI-style 2-bit quantization for extreme compression
  quantizeKIVI(
    tensor: Float32Array,
    bits: 2 | 4 = 2
  ): {
    quantized: Uint8Array;
    scales: Float32Array;
    residuals: Float32Array;
  } {
    const levels = bits === 2 ? 4 : 16;
    const groupSize = this.config.groupSize;
    const numGroups = Math.ceil(tensor.length / groupSize);
    
    const quantized = new Uint8Array(Math.ceil(tensor.length * bits / 8));
    const scales = new Float32Array(numGroups);
    
    // Keep recent tokens in FP16 (residual)
    const residualLength = Math.min(this.config.residualLength, tensor.length / 128);
    const residual = tensor.slice(-residualLength * 128);

    for (let g = 0; g < numGroups; g++) {
      const start = g * groupSize;
      const end = Math.min((g + 1) * groupSize, tensor.length);
      
      let maxAbs = 0;
      for (let i = start; i < end; i++) {
        maxAbs = Math.max(maxAbs, Math.abs(tensor[i]));
      }
      
      scales[g] = maxAbs / (levels / 2 - 1);
      
      // Pack bits
      for (let i = start; i < end; i++) {
        const val = tensor[i] / scales[g];
        const q = Math.round((val + maxAbs) / scales[g]);
        const clamped = Math.max(0, Math.min(levels - 1, q));
        
        // Pack into bytes
        const byteIdx = Math.floor(i * bits / 8);
        const bitOffset = (i * bits) % 8;
        quantized[byteIdx] |= clamped << bitOffset;
      }
    }

    return { quantized, scales, residuals: residual };
  }

  calculateSavings(originalBytes: number, quantization: QuantizationType): {
    compressedBytes: number;
    ratio: number;
  } {
    const ratios: Record<QuantizationType, number> = {
      'fp16': 1,
      'fp8': 0.5,
      'int8': 0.5,
      'kivi': 0.25  // Assuming 2-bit average
    };

    const ratio = ratios[quantization];
    return {
      compressedBytes: originalBytes * ratio,
      ratio
    };
  }
}
```

### 4.2 Sliding Window KV Cache

```typescript
// src/utils/SlidingWindowKVCache.ts

interface KVCacheEntry {
  keys: GPUBuffer;
  values: GPUBuffer;
  sequenceLength: number;
  isQuantized: boolean;
}

export class SlidingWindowKVCache {
  private device: GPUDevice;
  private windowSize: number;
  private sinkSize: number;
  private headDim: number;
  private numKVHeads: number;
  private numLayers: number;
  private cache: Map<number, KVCacheEntry> = new Map();

  constructor(
    device: GPUDevice,
    config: {
      windowSize: number;
      sinkSize: number;
      headDim: number;
      numKVHeads: number;
      numLayers: number;
    }
  ) {
    this.device = device;
    this.windowSize = config.windowSize;
    this.sinkSize = config.sinkSize;
    this.headDim = config.headDim;
    this.numKVHeads = config.numKVHeads;
    this.numLayers = config.numLayers;
  }

  getMaxCacheSize(): number {
    // Fixed size regardless of sequence length
    return (this.sinkSize + this.windowSize) * 
           this.numLayers * 
           this.numKVHeads * 
           this.headDim * 
           2 * 2; // K+V, FP16
  }

  update(
    layerIdx: number,
    newKeys: Float32Array,
    newValues: Float32Array,
    currentPos: number
  ): void {
    const entry = this.cache.get(layerIdx);
    
    if (!entry) {
      // First time - create buffers
      const maxTokens = this.sinkSize + this.windowSize;
      const bufferSize = maxTokens * this.numKVHeads * this.headDim * 4;

      this.cache.set(layerIdx, {
        keys: this.createBuffer(bufferSize),
        values: this.createBuffer(bufferSize),
        sequenceLength: 0,
        isQuantized: false
      });
    }

    // Circular buffer logic for rolling window
    const cache = this.cache.get(layerIdx)!;
    
    if (currentPos < this.sinkSize + this.windowSize) {
      // Still filling initial window
      this.writeToBuffer(cache.keys, newKeys, currentPos * this.headDim * 4);
      this.writeToBuffer(cache.values, newValues, currentPos * this.headDim * 4);
      cache.sequenceLength = currentPos + 1;
    } else {
      // Rolling window: overwrite oldest non-sink token
      const writePos = this.sinkSize + (currentPos % this.windowSize);
      this.writeToBuffer(cache.keys, newKeys, writePos * this.headDim * 4);
      this.writeToBuffer(cache.values, newValues, writePos * this.headDim * 4);
      cache.sequenceLength = this.sinkSize + this.windowSize;
    }
  }

  private createBuffer(size: number): GPUBuffer {
    return this.device.createBuffer({
      size,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC
    });
  }

  private writeToBuffer(buffer: GPUBuffer, data: Float32Array, offset: number): void {
    this.device.queue.writeBuffer(buffer, offset, data);
  }

  getCacheForLayer(layerIdx: number): KVCacheEntry | undefined {
    return this.cache.get(layerIdx);
  }

  clear(): void {
    for (const entry of this.cache.values()) {
      entry.keys.destroy();
      entry.values.destroy();
    }
    this.cache.clear();
  }
}
```

---

## 5. Service Worker & Model Sharding

### 5.1 Production Service Worker

```typescript
// src/service-worker.ts

/// <reference lib="es2020" />
/// <reference lib="webworker" />

const CACHE_NAME = 'jokesters-models-v2';
const SHARD_INDEX_URL = '/models/sharded/index.json';

interface ShardIndex {
  model_id: string;
  total_layers: number;
  layers: Array<{
    id: number;
    file: string;
    size: number;
    sha256: string;
  }>;
}

// Install: Pre-cache critical shards
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Pre-caching initial layers...');
      return cache.addAll([
        '/models/sharded/layer_0000.bin',
        '/models/sharded/layer_0001.bin',
        '/models/sharded/layer_0002.bin',
        '/models/sharded/layer_0003.bin',
        '/models/sharded/index.json'
      ]);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Intercept model shard requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle model shard requests
  if (url.pathname.startsWith('/models/sharded/')) {
    event.respondWith(handleModelRequest(event.request));
  }
  
  // Handle range requests for partial loading
  else if (event.request.headers.has('range')) {
    event.respondWith(handleRangeRequest(event.request));
  }
});

async function handleModelRequest(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);
  
  // Try cache first
  const cached = await cache.match(request);
  if (cached) {
    console.log('[SW] Cache hit:', request.url);
    return cached;
  }
  
  // Fetch from network with streaming
  console.log('[SW] Fetching:', request.url);
  const response = await fetch(request);
  
  if (response.ok) {
    // Clone and cache
    const clone = response.clone();
    cache.put(request, clone);
  }
  
  return response;
}

async function handleRangeRequest(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, { ignoreVary: true });
  
  if (cached) {
    // Serve from cache, respecting range
    const range = request.headers.get('range');
    if (range && cached.body) {
      return createRangeResponse(cached, range);
    }
    return cached;
  }
  
  // Pass through to network
  return fetch(request);
}

function createRangeResponse(response: Response, range: string): Response {
  const matches = range.match(/bytes=(\d+)-(\d*)/);
  if (!matches) return response;
  
  const start = parseInt(matches[1], 10);
  const end = matches[2] ? parseInt(matches[2], 10) : undefined;
  
  // This would need actual implementation for slicing ArrayBuffer
  // Simplified for demonstration
  return new Response(response.body, {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      'Content-Range': `bytes ${start}-${end || ''}/${response.headers.get('content-length')}`,
      'Content-Type': response.headers.get('content-type') || 'application/octet-stream'
    }
  });
}

// Background Sync: Download remaining shards
self.addEventListener('sync', (event) => {
  if (event.tag === 'download-model-shards') {
    event.waitUntil(downloadRemainingShards());
  }
});

// Background Fetch: For large model downloads
self.addEventListener('backgroundfetchsuccess', (event) => {
  console.log('[SW] Background fetch complete:', event.registration.id);
  event.updateUI({ title: 'Model download complete!' });
});

async function downloadRemainingShards(): Promise<void> {
  const cache = await caches.open(CACHE_NAME);
  
  // Get index
  const indexResponse = await cache.match(SHARD_INDEX_URL);
  if (!indexResponse) {
    console.warn('[SW] No shard index found');
    return;
  }
  
  const index: ShardIndex = await indexResponse.json();
  const cachedRequests = await cache.keys();
  const cachedFiles = new Set(cachedRequests.map(r => new URL(r.url).pathname));
  
  // Download missing shards
  const missing = index.layers.filter(layer => {
    const path = `/models/sharded/${layer.file}`;
    return !cachedFiles.has(path);
  });
  
  console.log(`[SW] Downloading ${missing.length} missing shards...`);
  
  for (const layer of missing) {
    try {
      const path = `/models/sharded/${layer.file}`;
      const response = await fetch(path);
      
      if (response.ok) {
        await cache.put(path, response);
        console.log(`[SW] Cached: ${path}`);
      }
    } catch (err) {
      console.error(`[SW] Failed to download ${layer.file}:`, err);
    }
  }
  
  // Notify clients
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({ type: 'SHARDS_CACHED', count: missing.length });
  });
}

// Message handling from main thread
self.addEventListener('message', (event) => {
  if (event.data.type === 'PREFETCH_SHARDS') {
    const shardIds: number[] = event.data.shardIds;
    prefetchSpecificShards(shardIds);
  }
});

async function prefetchSpecificShards(shardIds: number[]): Promise<void> {
  const cache = await caches.open(CACHE_NAME);
  const indexResponse = await cache.match(SHARD_INDEX_URL);
  
  if (!indexResponse) return;
  
  const index: ShardIndex = await indexResponse.json();
  
  for (const id of shardIds) {
    const layer = index.layers.find(l => l.id === id);
    if (!layer) continue;
    
    const path = `/models/sharded/${layer.file}`;
    const cached = await cache.match(path);
    
    if (!cached) {
      fetch(path).then(response => {
        if (response.ok) cache.put(path, response);
      });
    }
  }
}

export {}; // Make this a module
```

### 5.2 IndexedDB Storage for Large Models

```typescript
// src/utils/IndexedDBModelStore.ts

const DB_NAME = 'JokestersModels';
const DB_VERSION = 1;
const STORE_NAME = 'modelShards';

interface StoredShard {
  id: string;
  modelId: string;
  layerId: number;
  data: ArrayBuffer;
  size: number;
  sha256: string;
  cachedAt: number;
  accessCount: number;
  lastAccessed: number;
}

export class IndexedDBModelStore {
  private db: IDBDatabase | null = null;
  private maxStorageMB: number;

  constructor(maxStorageMB: number = 4000) {
    this.maxStorageMB = maxStorageMB;
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('modelId', 'modelId', { unique: false });
          store.createIndex('lastAccessed', 'lastAccessed', { unique: false });
        }
      };
    });
  }

  async storeShard(shard: Omit<StoredShard, 'cachedAt' | 'accessCount' | 'lastAccessed'>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    // Check storage quota and evict if needed
    await this.enforceStorageLimit();

    const data: StoredShard = {
      ...shard,
      cachedAt: Date.now(),
      accessCount: 0,
      lastAccessed: Date.now()
    };

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(data);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getShard(modelId: string, layerId: number): Promise<ArrayBuffer | null> {
    if (!this.db) throw new Error('Database not initialized');

    const id = `${modelId}_layer_${layerId}`;

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);
      
      request.onsuccess = () => {
        const data: StoredShard | undefined = request.result;
        
        if (data) {
          // Update access stats
          data.accessCount++;
          data.lastAccessed = Date.now();
          store.put(data);
          
          resolve(data.data);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  async getStorageStats(): Promise<{
    totalShards: number;
    totalSizeMB: number;
    byModel: Record<string, number>;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const shards: StoredShard[] = request.result;
        const totalSize = shards.reduce((sum, s) => sum + s.size, 0);
        
        const byModel: Record<string, number> = {};
        shards.forEach(s => {
          byModel[s.modelId] = (byModel[s.modelId] || 0) + s.size;
        });
        
        resolve({
          totalShards: shards.length,
          totalSizeMB: totalSize / (1024 * 1024),
          byModel
        });
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  private async enforceStorageLimit(): Promise<void> {
    const stats = await this.getStorageStats();
    
    if (stats.totalSizeMB <= this.maxStorageMB) return;

    // LRU eviction
    const toEvictMB = stats.totalSizeMB - this.maxStorageMB * 0.9;
    let evictedMB = 0;

    const shards = await this.getAllShardsSortedByAccess();
    
    for (const shard of shards) {
      if (evictedMB >= toEvictMB) break;
      
      await this.deleteShard(shard.id);
      evictedMB += shard.size / (1024 * 1024);
    }

    console.log(`[IndexedDB] Evicted ${evictedMB.toFixed(1)}MB`);
  }

  private async getAllShardsSortedByAccess(): Promise<StoredShard[]> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('lastAccessed');
      const request = index.getAll();
      
      request.onsuccess = () => {
        const shards = request.result as StoredShard[];
        // Sort by last accessed (oldest first)
        shards.sort((a, b) => a.lastAccessed - b.lastAccessed);
        resolve(shards);
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  private async deleteShard(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}
```

---

## 6. VRAM Detection & Monitoring

### 6.1 Comprehensive GPU Detection

```typescript
// src/utils/GPUDetector.ts

export interface GPUInfo {
  supported: boolean;
  backend: 'webgpu' | 'webgl' | 'none';
  vendor?: string;
  architecture?: string;
  renderer?: string;
  estimatedVRAM?: number;
  maxBufferSize?: number;
  isFallbackAdapter?: boolean;
  confidence: 'high' | 'medium' | 'low';
}

// GPU VRAM database (simplified)
const GPU_VRAM_DB: Record<string, number> = {
  'RTX 4090': 24, 'RTX 4080': 16, 'RTX 4070': 12, 'RTX 4060': 8,
  'RTX 3090': 24, 'RTX 3080': 10, 'RTX 3070': 8, 'RTX 3060': 12,
  'RX 7900': 24, 'RX 7800': 16, 'RX 7700': 12, 'RX 7600': 8,
  'RX 6900': 16, 'RX 6800': 16, 'RX 6700': 12, 'RX 6600': 8,
  'Apple M1': 8, 'Apple M2': 8, 'Apple M3': 8,
  'Apple M1 Pro': 16, 'Apple M2 Pro': 16, 'Apple M3 Pro': 18,
  'Apple M1 Max': 32, 'Apple M2 Max': 32, 'Apple M3 Max': 36,
  'GTX 1650': 4, 'GTX 1660': 6
};

export async function detectGPU(): Promise<GPUInfo> {
  // Try WebGPU first
  if (navigator.gpu) {
    try {
      const adapter = await navigator.gpu.requestAdapter({
        powerPreference: 'high-performance'
      });
      
      if (adapter) {
        const info = adapter.info;
        const limits = adapter.limits;
        
        // Estimate VRAM from GPU name
        const estimatedVRAM = estimateVRAMFromName(
          info.description || '',
          info.architecture || ''
        );
        
        return {
          supported: true,
          backend: 'webgpu',
          vendor: info.vendor,
          architecture: info.architecture,
          estimatedVRAM,
          maxBufferSize: limits.maxBufferSize,
          isFallbackAdapter: info.isFallbackAdapter,
          confidence: estimatedVRAM ? 'medium' : 'low'
        };
      }
    } catch (e) {
      console.warn('WebGPU detection failed:', e);
    }
  }

  // Fallback to WebGL
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
  
  if (gl) {
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    
    if (ext) {
      const vendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL);
      const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
      
      return {
        supported: true,
        backend: 'webgl',
        vendor,
        renderer,
        estimatedVRAM: estimateVRAMFromName(renderer),
        confidence: 'low'
      };
    }
    
    return {
      supported: true,
      backend: 'webgl',
      confidence: 'low'
    };
  }

  return {
    supported: false,
    backend: 'none',
    confidence: 'high'
  };
}

function estimateVRAMFromName(name: string, architecture?: string): number | undefined {
  // Direct match
  for (const [model, vram] of Object.entries(GPU_VRAM_DB)) {
    if (name.toLowerCase().includes(model.toLowerCase())) {
      return vram;
    }
  }
  
  // Architecture-based heuristics
  if (architecture) {
    if (architecture.includes('ampere') || architecture.includes('ada')) {
      return 8;  // Conservative estimate for NVIDIA Ampere/Ada
    }
    if (architecture.includes('turing')) {
      return 6;  // NVIDIA Turing
    }
    if (architecture.includes('metal')) {
      // Apple Silicon - use device memory as hint
      const deviceMem = (navigator as any).deviceMemory;
      return deviceMem || 8;
    }
  }
  
  return undefined;
}

// Probe actual allocatable memory
export async function probeAvailableVRAM(device: GPUDevice): Promise<number> {
  const testSizes = [
    512 * 1024 * 1024,   // 512 MB
    1024 * 1024 * 1024,  // 1 GB
    2 * 1024 * 1024 * 1024,  // 2 GB
    4 * 1024 * 1024 * 1024,  // 4 GB
  ];
  
  let maxSuccessful = 0;
  
  for (const size of testSizes) {
    if (size > device.limits.maxBufferSize) break;
    
    try {
      const buffer = device.createBuffer({
        size,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
      });
      
      buffer.destroy();
      maxSuccessful = size;
    } catch (e) {
      break;
    }
  }
  
  return maxSuccessful;
}
```

### 6.2 VRAM Monitor for Real-time Tracking

```typescript
// src/utils/VRAMMonitor.ts

export interface VRAMStats {
  allocatedBytes: number;
  bufferCount: number;
  largestBuffer: number;
  timestamp: number;
}

export class VRAMMonitor {
  private device: GPUDevice;
  private allocations: Map<GPUBuffer, { size: number; label: string }> = new Map();
  private listeners: Set<(stats: VRAMStats) => void> = new Set();
  private intervalId?: number;

  constructor(device: GPUDevice) {
    this.device = device;
  }

  startMonitoring(intervalMs: number = 1000): void {
    this.intervalId = window.setInterval(() => {
      this.reportStats();
    }, intervalMs);

    // Monitor device loss (indicates memory pressure)
    this.device.lost.then((info) => {
      console.error(`[VRAM] GPU lost: ${info.message} (${info.reason})`);
      if (info.reason === 'lost') {
        this.notifyListeners({
          allocatedBytes: Infinity,
          bufferCount: 0,
          largestBuffer: 0,
          timestamp: Date.now()
        });
      }
    });
  }

  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  trackBuffer(buffer: GPUBuffer, size: number, label: string = 'unnamed'): void {
    this.allocations.set(buffer, { size, label });
    this.reportStats();
  }

  untrackBuffer(buffer: GPUBuffer): void {
    this.allocations.delete(buffer);
    this.reportStats();
  }

  createTrackedBuffer(
    descriptor: GPUBufferDescriptor
  ): GPUBuffer {
    const buffer = this.device.createBuffer(descriptor);
    this.trackBuffer(buffer, descriptor.size, descriptor.label);
    
    // Wrap destroy to auto-untrack
    const originalDestroy = buffer.destroy.bind(buffer);
    buffer.destroy = () => {
      this.untrackBuffer(buffer);
      originalDestroy();
    };
    
    return buffer;
  }

  getStats(): VRAMStats {
    let allocatedBytes = 0;
    let largestBuffer = 0;
    
    for (const { size } of this.allocations.values()) {
      allocatedBytes += size;
      largestBuffer = Math.max(largestBuffer, size);
    }

    return {
      allocatedBytes,
      bufferCount: this.allocations.size,
      largestBuffer,
      timestamp: Date.now()
    };
  }

  onStats(callback: (stats: VRAMStats) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private reportStats(): void {
    const stats = this.getStats();
    this.listeners.forEach(cb => cb(stats));
  }

  // Log detailed breakdown
  logBreakdown(): void {
    const byLabel: Record<string, { count: number; size: number }> = {};
    
    for (const { size, label } of this.allocations.values()) {
      if (!byLabel[label]) {
        byLabel[label] = { count: 0, size: 0 };
      }
      byLabel[label].count++;
      byLabel[label].size += size;
    }

    console.group('[VRAM] Allocation Breakdown');
    Object.entries(byLabel)
      .sort((a, b) => b[1].size - a[1].size)
      .forEach(([label, { count, size }]) => {
        console.log(`${label}: ${count} buffers, ${(size / 1024 / 1024).toFixed(1)}MB`);
      });
    console.groupEnd();
  }
}
```

### 6.3 Adaptive Model Selection

```typescript
// src/utils/AdaptiveModelSelector.ts

import { detectGPU, probeAvailableVRAM } from './GPUDetector';
import { selectModelForVRAM, AVAILABLE_MODELS } from '../config/models';
import { GGUF_MODELS } from '../config/ggufModels';

export interface ModelRecommendation {
  type: 'webllm' | 'gguf' | 'none';
  model: any;
  estimatedVRAM: number;
  confidence: 'high' | 'medium' | 'low';
  warnings: string[];
}

export async function getOptimalModel(): Promise<ModelRecommendation> {
  const warnings: string[] = [];
  
  // Detect GPU capabilities
  const gpuInfo = await detectGPU();
  
  if (!gpuInfo.supported) {
    return {
      type: 'none',
      model: null,
      estimatedVRAM: 0,
      confidence: 'high',
      warnings: ['No GPU detected. Model inference not available.']
    };
  }

  // Get VRAM estimate
  let estimatedVRAM = gpuInfo.estimatedVRAM;
  let confidence: 'high' | 'medium' | 'low' = gpuInfo.confidence;

  // If WebGPU available, try to probe actual memory
  if (gpuInfo.backend === 'webgpu' && navigator.gpu) {
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter) {
        const device = await adapter.requestDevice();
        const probedMemory = await probeAvailableVRAM(device);
        
        if (probedMemory > 0) {
          estimatedVRAM = Math.floor(probedMemory / (1024 * 1024 * 1024));
          confidence = 'high';
        }
        
        device.destroy();
      }
    } catch (e) {
      warnings.push('Could not probe actual VRAM. Using estimates.');
    }
  }

  // Select appropriate model
  const vramMB = (estimatedVRAM || 4) * 1024;
  
  // Prefer GGUF for 7B+ models (better VRAM efficiency)
  if (vramMB >= 4500) {
    const ggufModel = GGUF_MODELS.find(m => m.vramMB <= vramMB * 0.9);
    if (ggufModel) {
      return {
        type: 'gguf',
        model: ggufModel,
        estimatedVRAM: estimatedVRAM || 0,
        confidence,
        warnings
      };
    }
  }

  // Fall back to Web-LLM
  const webllmModel = selectModelForVRAM(vramMB);
  
  if (webllmModel.vramRequiredMB > vramMB) {
    warnings.push('Selected model may exceed available VRAM.');
  }

  return {
    type: 'webllm',
    model: webllmModel,
    estimatedVRAM: estimatedVRAM || 0,
    confidence,
    warnings
  };
}

// UI component for showing recommendation
export function createVRAMWarningUI(recommendation: ModelRecommendation): HTMLElement {
  const div = document.createElement('div');
  div.className = 'vram-warning';
  
  const vramText = recommendation.estimatedVRAM > 0 
    ? `~${recommendation.estimatedVRAM}GB VRAM detected`
    : 'VRAM unknown';
  
  div.innerHTML = `
    <div class="alert alert-${recommendation.warnings.length > 0 ? 'warning' : 'info'}">
      <strong>GPU: ${vramText}</strong> (${recommendation.confidence} confidence)
      <br>Recommended: ${recommendation.model?.name || 'None'}
      ${recommendation.warnings.map(w => `<br>⚠️ ${w}`).join('')}
    </div>
  `;
  
  return div;
}
```

---

## Summary

### Quick Implementation Checklist

**Phase 1 (Week 1):** Context Window Optimization
- [ ] Implement `SlidingWindowManager`
- [ ] Update Web-LLM configs with reduced context
- [ ] Add VRAM-based model selection

**Phase 2 (Week 2):** GGUF Integration
- [ ] Install `@wllama/wllama`
- [ ] Implement `WllamaEngine`
- [ ] Configure Vite for COOP/COEP headers

**Phase 3 (Week 3):** Progressive Loading
- [ ] Implement `LayerPoolManager`
- [ ] Create model sharding script
- [ ] Build `ModelShardLoader`

**Phase 4 (Week 4):** KV Cache Optimization
- [ ] Implement `KVCacheCompressor`
- [ ] Add INT8/FP8 quantization
- [ ] Build `SlidingWindowKVCache`

**Phase 5 (Week 5):** Service Worker
- [ ] Update service worker with shard caching
- [ ] Implement `IndexedDBModelStore`
- [ ] Add background sync

**Phase 6 (Week 6):** Monitoring
- [ ] Implement `GPUDetector`
- [ ] Build `VRAMMonitor`
- [ ] Create adaptive model selector

### Expected VRAM Savings

| Technique | Reduction | Implementation |
|-----------|-----------|----------------|
| Context 4096→1024 | 4x | Easy |
| Sliding Window | 8x for 32K context | Easy |
| Q4_K_M vs FP16 | 4x | Medium |
| KV Cache INT8 | 2x | Medium |
| Layer Pooling | 10-20x | Hard |
| Combined | **20-40x** | - |

With all techniques applied, a 7B model requiring ~28GB can run in ~3-4GB VRAM.
