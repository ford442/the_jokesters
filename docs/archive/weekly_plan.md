# Weekly Plan: VRAM Optimization for Browser-Based LLM Inference

> **Goal:** Enable 7B parameter models to run in-browser with ≤6GB VRAM (down from 14GB+) while maintaining inference quality and user experience.

---

## Current Status

**Completed Features (Director Modes):**
1. **The Conspiracy Corkboard Mode**: Integrated into `ExpandedRealityModes.ts`. The 'LogicMaster' (Phi-3) and 'WildCard' (Hermes-3) agents successfully draw wild connections between unrelated user inputs.
2. **The Overly Honest AI Mode**: Integrated into `InteractiveMode.ts`. The 'Slacker' agent refuses to perform tasks while the 'Analyzer' psychoanalyzes the user.
3. **The Intergalactic Cooking Show Disaster**: Integrated into `ExpandedRealityModes.ts`. The 'Strict Chef' and 'Chaotic Chef' try to understand Earth food through an alien lens, substituting ingredients wildly.

**Architectural Expansion (agent_plan.md):**
- Adjusted project velocity (`tasks_per_run` reduced from 6 to 3 for stability).
- Outlined a comprehensive Cloud Persistence roadmap involving Hugging Face integration:
    - **Authentication:** Validating the token against `whoami-v2` and persisting it in `localStorage`.
    - **Episode Pushing:** Saving standard JSON scripts to the cloud and enqueuing background sync jobs using `localStorage` to avoid blocking the main UI.
    - **Summary Fetching:** Boot-time fetching of `summary.json` to prime `GroupChatManager` without loading full episodes.
    - **Background Sync Queue:** Implementing `jokesters-sync-queue` for conflict resolution and retry logic.
    - **Community Script Hub:** Expanding `HFStorageManager` to allow publishing to public datasets and populating dynamic preset scripts.

---

## VRAM Optimization Strategies - Implementation Plan

> **📚 Detailed Implementation Guide:** See `docs/VRAM_OPTIMIZATION_IMPLEMENTATION.md` for complete code examples, API references, and step-by-step implementation instructions.

### Overview
The primary bottleneck for browser-based LLM inference is **VRAM**, not download size. A 7B model in FP16 requires ~14GB VRAM, which exceeds most consumer GPUs. This plan outlines 8 strategies to reduce VRAM usage to ~4-6GB while maintaining model quality.

---

## Week 1: Context Window Optimization & Web-LLM Configuration

### 1. Context Window Truncation / Sliding Window
**VRAM Impact:** Reduces KV cache from ~28GB (4096 tokens) to ~3.5-7GB (512-1024 tokens)

#### Implementation Steps:

**Step 1: Update Model Configuration (`src/main.ts`)**
```typescript
// Add context window overrides to all 7B models
const optimizedModels = [
  {
    model_id: 'ford442/vicuna-7b-q4f32-webllm',
    model: 'https://huggingface.co/ford442/vicuna-7b-q4f32-webllm/resolve/main/',
    model_lib: 'https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/main/...',
    vram_required_MB: 4096,  // Reduced from ~6000
    low_resource_required: true,
    overrides: {
      context_window_size: 1024,  // Hard limit
      sliding_window_size: 512,   // Mistral-style sliding window
    }
  }
];
```

**Step 2: Implement Dynamic Context Manager (`src/utils/dynamicContext.ts`)**
```typescript
export class DynamicContextManager {
  private maxTokens: number;
  private slidingWindow: number;
  private tokenBuffer: string[] = [];
  
  constructor(config: { maxTokens: number; slidingWindow: number }) {
    this.maxTokens = config.maxTokens;
    this.slidingWindow = config.slidingWindow;
  }
  
  // Truncate conversation history to fit within context window
  truncateHistory(messages: ChatMessage[]): ChatMessage[] {
    const estimatedTokens = this.estimateTokenCount(messages);
    if (estimatedTokens <= this.maxTokens) return messages;
    
    // Keep system message + most recent messages
    const systemMessages = messages.filter(m => m.role === 'system');
    const recentMessages = messages
      .filter(m => m.role !== 'system')
      .slice(-Math.floor(this.maxTokens / 50)); // Rough estimate
    
    return [...systemMessages, ...recentMessages];
  }
  
  // Implement sliding window for KV cache
  getSlidingWindowContext(fullContext: string): string {
    const tokens = fullContext.split(/\s+/);
    if (tokens.length <= this.slidingWindow) return fullContext;
    
    // Keep last N tokens + summary of earlier content
    const recent = tokens.slice(-this.slidingWindow).join(' ');
    return `[Earlier context summarized] ... ${recent}`;
  }
  
  private estimateTokenCount(messages: ChatMessage[]): number {
    // Rough estimate: 1 token ≈ 4 characters
    const text = messages.map(m => m.content).join('');
    return Math.ceil(text.length / 4);
  }
}
```

**Step 3: Integrate with GroupChatManager (`src/GroupChatManager.ts`)**
```typescript
import { DynamicContextManager } from './utils/dynamicContext';

class GroupChatManager {
  private contextManager: DynamicContextManager;
  
  constructor(config: ModelConfig) {
    this.contextManager = new DynamicContextManager({
      maxTokens: config.context_window_size || 1024,
      slidingWindow: config.sliding_window_size || 512
    });
  }
  
  async generateResponse(messages: ChatMessage[]): Promise<string> {
    // Auto-truncate before sending to model
    const optimizedMessages = this.contextManager.truncateHistory(messages);
    return this.engine.chat.completions.create({ messages: optimizedMessages });
  }
}
```

**Deliverables:**
- [ ] `src/utils/DynamicContextManager.ts` - Context truncation utility
- [ ] Updated model configs with `context_window_size: 1024`
- [ ] Integration tests for context truncation

---

### 2. Web-LLM VRAM Optimization Configuration
**VRAM Impact:** Automatic layer offloading, GPU memory utilization controls

#### Implementation Steps:

**Step 1: Update Engine Initialization (`src/main.ts`)**
```typescript
import * as webllm from '@mlc-ai/web-llm';

interface VRAMConfig {
  gpu_memory_utilization: number;  // 0.0 - 1.0
  context_window_size: number;
  kv_cache_quantization: 'fp16' | 'fp8' | 'int8';
}

const vramOptimizedConfig: VRAMConfig = {
  gpu_memory_utilization: 0.6,  // Leave 40% headroom for KV cache
  context_window_size: 1024,
  kv_cache_quantization: 'fp8'  // Experimental: reduce KV cache by 50%
};

async function createOptimizedEngine(modelId: string): Promise<webllm.MLCEngine> {
  const engine = await webllm.CreateMLCEngine(modelId, {
    initProgressCallback: (progress) => {
      console.log(`Loading: ${(progress.progress * 100).toFixed(1)}%`);
    },
    // VRAM optimization flags
    appConfig: {
      ...webllm.prebuiltAppConfig,
      model_list: webllm.prebuiltAppConfig.model_list.map(model => ({
        ...model,
        overrides: {
          ...model.overrides,
          ...vramOptimizedConfig
        }
      }))
    }
  });
  
  return engine;
}
```

**Deliverables:**
- [ ] VRAM configuration constants in `src/config/models.ts`
- [ ] Updated `CreateMLCEngine` calls with optimization flags

---

## Week 2: Model Quantization & Format Migration

### 3. GGUF Format Migration (Q4_K_M, Q5_K_M)
**VRAM Impact:** Stable 4-bit quantization, ~4GB file size, ~5GB VRAM at 2k context

#### Implementation Steps:

**Step 1: Convert Existing Models to GGUF**

Create conversion script (`scripts/convert_to_gguf.py`):
```python
#!/usr/bin/env python3
"""
Convert models to GGUF format for reduced VRAM usage.
Requires: pip install llama-cpp-python
"""
import subprocess
import os
from pathlib import Path

MODELS = [
    {
        "name": "vicuna-7b",
        "source": "lmsys/vicuna-7b-v1.5",
        "quantizations": ["Q4_K_M", "Q5_K_M", "Q3_K_L"]
    }
]

def convert_to_gguf(model_name: str, source: str, quant: str):
    """Convert HuggingFace model to GGUF format."""
    output_dir = Path(f"models/gguf/{model_name}")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    output_path = output_dir / f"{model_name}-{quant.lower()}.gguf"
    
    # Convert using llama.cpp convert script
    cmd = [
        "python3", "-m", "llama_cpp.convert",
        "--input", source,
        "--output", str(output_path),
        "--quantization", quant
    ]
    
    print(f"Converting {model_name} to {quant}...")
    subprocess.run(cmd, check=True)
    
    return output_path

def upload_to_hf(local_path: Path, repo_id: str, token: str):
    """Upload GGUF model to HuggingFace."""
    from huggingface_hub import HfApi
    
    api = HfApi(token=token)
    api.upload_file(
        path_or_fileobj=str(local_path),
        path_in_repo=local_path.name,
        repo_id=repo_id,
        repo_type="model"
    )
    print(f"Uploaded {local_path.name} to {repo_id}")

if __name__ == "__main__":
    for model in MODELS:
        for quant in model["quantizations"]:
            try:
                path = convert_to_gguf(model["name"], model["source"], quant)
                print(f"Created: {path}")
            except Exception as e:
                print(f"Failed to convert {model['name']} to {quant}: {e}")
```

**Step 2: Update Web-LLM to Support GGUF**

Web-LLM doesn't natively support GGUF, so we need to use llama.cpp WASM backend:

```typescript
// src/utils/LlamaCppEngine.ts
import llamaModule from './llama-cpp-wasm/llama.js';

export class LlamaCppEngine {
  private ctx: any = null;
  private modelPath: string;
  
  constructor(modelPath: string) {
    this.modelPath = modelPath;
  }
  
  async load(options: {
    n_ctx: number;        // Context size (512-2048)
    n_gpu_layers: number; // -1 = all on GPU, 0 = all on CPU
    n_threads: number;    // WASM threads
  }) {
    const Module = await llamaModule();
    
    this.ctx = Module.llama_new_context_with_model(
      this.modelPath,
      options.n_ctx,
      options.n_gpu_layers,
      options.n_threads
    );
  }
  
  async generate(prompt: string, params: GenerationParams): Promise<string> {
    if (!this.ctx) throw new Error('Model not loaded');
    
    return this.ctx.generate(prompt, {
      n_predict: params.maxTokens,
      temperature: params.temperature,
      top_p: params.topP,
      repeat_penalty: 1.1
    });
  }
  
  // Memory-efficient inference: process one token at a time
  async *generateStream(prompt: string, params: GenerationParams): AsyncGenerator<string> {
    if (!this.ctx) throw new Error('Model not loaded');
    
    const result = this.ctx.generate(prompt, {
      ...params,
      stream: true
    });
    
    for (const token of result) {
      yield token;
    }
  }
}
```

**Step 3: Create Model Selection with VRAM Estimates (`src/config/models.ts`)**
```typescript
export interface QuantizedModel {
  id: string;
  name: string;
  format: 'webllm' | 'gguf';
  quantization: 'q4f32' | 'q4f16' | 'q4_k_m' | 'q5_k_m' | 'q3_k_l';
  vramRequiredMB: number;
  fileSizeMB: number;
  quality: 'high' | 'medium' | 'low';
  recommendedContext: number;
}

export const QUANTIZED_MODELS: QuantizedModel[] = [
  {
    id: 'vicuna-7b-q4_k_m',
    name: 'Vicuna 7B (Q4_K_M)',
    format: 'gguf',
    quantization: 'q4_k_m',
    vramRequiredMB: 4800,  // ~4.8GB
    fileSizeMB: 4100,       // ~4.1GB
    quality: 'high',
    recommendedContext: 1024
  },
  {
    id: 'vicuna-7b-q5_k_m',
    name: 'Vicuna 7B (Q5_K_M)',
    format: 'gguf',
    quantization: 'q5_k_m',
    vramRequiredMB: 5600,  // ~5.6GB
    fileSizeMB: 4800,
    quality: 'high',
    recommendedContext: 1024
  },
  {
    id: 'hermes-3-3b-q4f32',
    name: 'Hermes 3 3B (Q4F32)',
    format: 'webllm',
    quantization: 'q4f32',
    vramRequiredMB: 2900,
    fileSizeMB: 1800,
    quality: 'medium',
    recommendedContext: 2048
  }
];

export function getOptimalModel(availableVRAM_MB: number): QuantizedModel {
  return QUANTIZED_MODELS
    .filter(m => m.vramRequiredMB <= availableVRAM_MB * 0.8) // 20% safety margin
    .sort((a, b) => b.quality.localeCompare(a.quality))[0];
}
```

**Deliverables:**
- [ ] `scripts/convert_to_gguf.py` - Model conversion utility
- [ ] `src/utils/LlamaCppEngine.ts` - WASM-based inference engine
- [ ] Updated model registry with quantization options

---

## Week 3: Layer-by-Layer Progressive Loading

### 4. Layer-by-Layer / Progressive Loading
**VRAM Impact:** Reduces VRAM to ~1-2x single layer size (~200-500MB for 7B)
**Trade-off:** Slower inference (CPU↔GPU transfer overhead)

#### Implementation Steps:

**Step 1: Create Layer Pool Manager (`src/utils/LayerPoolManager.ts`)**
```typescript
interface Layer {
  id: number;
  weights: GPUBuffer;
  sizeBytes: number;
  lastAccessed: number;
}

interface LayerPoolConfig {
  maxLayersInVRAM: number;  // Number of layers to keep in GPU
  totalLayers: number;      // Total layers in model (e.g., 32 for 7B)
  prefetchAhead: number;    // How many layers to prefetch
}

export class LayerPoolManager {
  private layerCache: Map<number, Layer> = new Map();
  private layerWeights: Map<number, ArrayBuffer>; // CPU-side storage
  private config: LayerPoolConfig;
  private gpuDevice: GPUDevice;
  
  constructor(
    gpuDevice: GPUDevice,
    config: LayerPoolConfig,
    layerWeights: Map<number, ArrayBuffer>
  ) {
    this.gpuDevice = gpuDevice;
    this.config = config;
    this.layerWeights = layerWeights;
  }
  
  // Initialize with first N layers
  async initialize(): Promise<void> {
    for (let i = 0; i < Math.min(this.config.maxLayersInVRAM, this.config.totalLayers); i++) {
      await this.loadLayerToGPU(i);
    }
  }
  
  // Get layer for computation (loads if not in VRAM)
  async getLayer(layerId: number): Promise<GPUBuffer> {
    const cached = this.layerCache.get(layerId);
    if (cached) {
      cached.lastAccessed = Date.now();
      return cached.weights;
    }
    
    // Evict oldest layer if at capacity
    if (this.layerCache.size >= this.config.maxLayersInVRAM) {
      this.evictOldestLayer();
    }
    
    // Load requested layer
    await this.loadLayerToGPU(layerId);
    
    // Prefetch next layers asynchronously
    this.prefetchLayers(layerId + 1, layerId + this.config.prefetchAhead);
    
    return this.layerCache.get(layerId)!.weights;
  }
  
  private async loadLayerToGPU(layerId: number): Promise<void> {
    const weights = this.layerWeights.get(layerId);
    if (!weights) throw new Error(`Layer ${layerId} not found`);
    
    const buffer = this.gpuDevice.createBuffer({
      size: weights.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });
    
    new Uint8Array(buffer.getMappedRange()).set(new Uint8Array(weights));
    buffer.unmap();
    
    this.layerCache.set(layerId, {
      id: layerId,
      weights: buffer,
      sizeBytes: weights.byteLength,
      lastAccessed: Date.now()
    });
  }
  
  private evictOldestLayer(): void {
    let oldest: Layer | null = null;
    let oldestTime = Infinity;
    
    for (const layer of this.layerCache.values()) {
      if (layer.lastAccessed < oldestTime) {
        oldestTime = layer.lastAccessed;
        oldest = layer;
      }
    }
    
    if (oldest) {
      oldest.weights.destroy(); // Free GPU memory
      this.layerCache.delete(oldest.id);
    }
  }
  
  private prefetchLayers(start: number, end: number): void {
    // Non-blocking prefetch
    setTimeout(() => {
      for (let i = start; i <= end && i < this.config.totalLayers; i++) {
        if (!this.layerCache.has(i) && this.layerCache.size < this.config.maxLayersInVRAM) {
          this.loadLayerToGPU(i).catch(console.warn);
        }
      }
    }, 0);
  }
  
  // Cleanup all GPU buffers
  dispose(): void {
    for (const layer of this.layerCache.values()) {
      layer.weights.destroy();
    }
    this.layerCache.clear();
  }
}
```

**Step 2: Integrate with Inference Pipeline (`src/utils/ProgressiveInference.ts`)**
```typescript
import { LayerPoolManager } from './LayerPoolManager';

export class ProgressiveInferenceEngine {
  private layerManager: LayerPoolManager;
  private computePipeline: GPUComputePipeline;
  
  async forward(input: GPUBuffer, layerIds: number[]): Promise<GPUBuffer> {
    let currentOutput = input;
    
    for (const layerId of layerIds) {
      const layerWeights = await this.layerManager.getLayer(layerId);
      
      // Create bind group for this layer
      const bindGroup = this.device.createBindGroup({
        layout: this.computePipeline.getBindGroupLayout(0),
        entries: [
          { binding: 0, resource: { buffer: currentOutput } },
          { binding: 1, resource: { buffer: layerWeights } }
        ]
      });
      
      // Dispatch compute shader
      const commandEncoder = this.device.createCommandEncoder();
      const passEncoder = commandEncoder.beginComputePass();
      passEncoder.setPipeline(this.computePipeline);
      passEncoder.setBindGroup(0, bindGroup);
      passEncoder.dispatchWorkgroups(...);
      passEncoder.end();
      
      currentOutput = commandEncoder.finish();
    }
    
    return currentOutput;
  }
}
```

**Step 3: Shard Model Files for Streaming (`scripts/shard_model.py`)**
```python
#!/usr/bin/env python3
"""
Shard large model files into smaller chunks for progressive loading.
Creates index.json with layer metadata for streaming.
"""
import json
import struct
from pathlib import Path
import numpy as np

def shard_model(input_path: Path, output_dir: Path, shard_size_mb: int = 100):
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Read model file (GGUF or safetensors)
    data = np.memmap(input_path, mode='r')
    
    shard_size = shard_size_mb * 1024 * 1024
    total_size = len(data)
    num_shards = (total_size + shard_size - 1) // shard_size
    
    layers = []
    
    for i in range(num_shards):
        start = i * shard_size
        end = min((i + 1) * shard_size, total_size)
        
        shard_data = data[start:end]
        shard_path = output_dir / f"layer_{i:04d}.bin"
        
        shard_data.tofile(shard_path)
        
        layers.append({
            "id": i,
            "file": f"layer_{i:04d}.bin",
            "offset": start,
            "size": end - start,
            "sha256": compute_hash(shard_data)
        })
    
    # Write index
    index = {
        "model_id": input_path.stem,
        "format": "sharded",
        "total_layers": num_shards,
        "total_size": total_size,
        "layers": layers
    }
    
    with open(output_dir / "index.json", "w") as f:
        json.dump(index, f, indent=2)
    
    return index

def compute_hash(data: np.ndarray) -> str:
    import hashlib
    return hashlib.sha256(data.tobytes()).hexdigest()[:16]

if __name__ == "__main__":
    import sys
    input_file = Path(sys.argv[1])
    output = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("shards")
    shard_model(input_file, output)
```

**Deliverables:**
- [ ] `src/utils/LayerPoolManager.ts` - GPU layer cache
- [ ] `src/utils/ProgressiveInference.ts` - Streaming inference
- [ ] `scripts/shard_model.py` - Model sharding utility
- [ ] Service Worker updates for shard caching

---

## Week 4: KV Cache Optimization & Hybrid Execution

### 5. KV Cache Compression
**VRAM Impact:** Reduces KV cache by 4-8x using MQA/GQA and quantization

#### Implementation Steps:

**Step 1: Implement KV Cache Quantization (`src/utils/KVCacheManager.ts`)**
```typescript
interface KVCacheEntry {
  key: GPUBuffer;
  value: GPUBuffer;
  sequenceLength: number;
  quantized: boolean;
}

export class KVCacheManager {
  private cache: Map<number, KVCacheEntry> = new Map();
  private maxCacheSize: number;
  private quantization: 'fp16' | 'fp8' | 'int8';
  
  constructor(config: {
    maxCacheSizeMB: number;
    quantization: 'fp16' | 'fp8' | 'int8';
    useSlidingWindow: boolean;
    windowSize: number;
  }) {
    this.maxCacheSize = config.maxCacheSizeMB * 1024 * 1024;
    this.quantization = config.quantization;
    this.useSlidingWindow = config.useSlidingWindow;
    this.windowSize = config.windowSize;
  }
  
  // Store KV with optional quantization
  set(layerIdx: number, key: Float32Array, value: Float32Array): void {
    let keyData = key;
    let valueData = value;
    let isQuantized = false;
    
    if (this.quantization === 'fp8') {
      keyData = this.quantizeFP8(key);
      valueData = this.quantizeFP8(value);
      isQuantized = true;
    } else if (this.quantization === 'int8') {
      keyData = this.quantizeINT8(key);
      valueData = this.quantizeINT8(value);
      isQuantized = true;
    }
    
    // Create GPU buffers
    const keyBuffer = this.createGPUBuffer(keyData);
    const valueBuffer = this.createGPUBuffer(valueData);
    
    this.cache.set(layerIdx, {
      key: keyBuffer,
      value: valueBuffer,
      sequenceLength: key.length,
      quantized: isQuantized
    });
    
    // Enforce sliding window
    if (this.useSlidingWindow) {
      this.enforceSlidingWindow();
    }
  }
  
  private quantizeFP8(data: Float32Array): Uint8Array {
    // Simple FP8 quantization (E4M3 format)
    const maxVal = Math.max(...Array.from(data).map(Math.abs));
    const scale = maxVal / 7.0;  // E4M3 max is ~7.5
    
    const quantized = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      const scaled = data[i] / scale;
      quantized[i] = Math.max(-127, Math.min(127, Math.round(scaled))) + 127;
    }
    
    return quantized;
  }
  
  private quantizeINT8(data: Float32Array): Int8Array {
    const maxVal = Math.max(...Array.from(data).map(Math.abs));
    const scale = maxVal / 127.0;
    
    const quantized = new Int8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      quantized[i] = Math.max(-128, Math.min(127, Math.round(data[i] / scale)));
    }
    
    return quantized;
  }
  
  private enforceSlidingWindow(): void {
    const sorted = Array.from(this.cache.entries())
      .sort((a, b) => b[1].sequenceLength - a[1].sequenceLength);
    
    // Keep only window_size most recent tokens
    for (const [idx, entry] of sorted.slice(this.windowSize)) {
      entry.key.destroy();
      entry.value.destroy();
      this.cache.delete(idx);
    }
  }
  
  // Clear cache for new conversation
  clear(): void {
    for (const entry of this.cache.values()) {
      entry.key.destroy();
      entry.value.destroy();
    }
    this.cache.clear();
  }
}
```

### 6. CPU/GPU Hybrid Execution
**VRAM Impact:** Offload some layers to CPU, reduce GPU VRAM by 30-50%

#### Implementation Steps:

**Step 1: Create Hybrid Execution Planner (`src/utils/HybridExecutionPlanner.ts`)**
```typescript
interface DeviceProfile {
  device: 'cpu' | 'gpu';
  memoryAvailableMB: number;
  computeSpeed: number; // Relative speed (GPU = 10, CPU = 1)
}

interface ExecutionPlan {
  layerAssignments: ('cpu' | 'gpu')[];
  estimatedVRAM_MB: number;
  estimatedTime_ms: number;
}

export class HybridExecutionPlanner {
  private gpuProfile: DeviceProfile;
  private cpuProfile: DeviceProfile;
  private modelConfig: {
    numLayers: number;
    layerSizeMB: number;
    kvCachePerTokenMB: number;
  };
  
  constructor(
    gpuProfile: DeviceProfile,
    cpuProfile: DeviceProfile,
    modelConfig: { numLayers: number; layerSizeMB: number; kvCachePerTokenMB: number }
  ) {
    this.gpuProfile = gpuProfile;
    this.cpuProfile = cpuProfile;
    this.modelConfig = modelConfig;
  }
  
  // Generate optimal layer assignment
  generatePlan(contextLength: number): ExecutionPlan {
    const kvCacheSize = contextLength * this.modelConfig.kvCachePerTokenMB;
    const availableForLayers = this.gpuProfile.memoryAvailableMB - kvCacheSize;
    
    const maxGpuLayers = Math.floor(availableForLayers / this.modelConfig.layerSizeMB);
    const gpuLayers = Math.min(maxGpuLayers, this.modelConfig.numLayers);
    const cpuLayers = this.modelConfig.numLayers - gpuLayers;
    
    // Assign first layers to GPU (they process first, can prefetch next)
    const assignments: ('cpu' | 'gpu')[] = [];
    for (let i = 0; i < this.modelConfig.numLayers; i++) {
      assignments.push(i < gpuLayers ? 'gpu' : 'cpu');
    }
    
    return {
      layerAssignments: assignments,
      estimatedVRAM_MB: gpuLayers * this.modelConfig.layerSizeMB + kvCacheSize,
      estimatedTime_ms: this.estimateTime(gpuLayers, cpuLayers)
    };
  }
  
  private estimateTime(gpuLayers: number, cpuLayers: number): number {
    const gpuTime = (gpuLayers / this.gpuProfile.computeSpeed) * 10; // ms per layer
    const cpuTime = (cpuLayers / this.cpuProfile.computeSpeed) * 10;
    
    // Add transfer overhead for layer boundaries
    const transferOverhead = cpuLayers > 0 ? 50 : 0;
    
    return gpuTime + cpuTime + transferOverhead;
  }
}
```

**Step 2: Integrate with Model Loading (`src/main.ts`)**
```typescript
async function createHybridEngine(modelId: string): Promise<MLCEngine> {
  // Detect available VRAM
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  const vramInfo = await getVRAMInfo(device);
  
  // Create execution plan
  const planner = new HybridExecutionPlanner(
    { device: 'gpu', memoryAvailableMB: vramInfo.available, computeSpeed: 10 },
    { device: 'cpu', memoryAvailableMB: 4096, computeSpeed: 1 },
    { numLayers: 32, layerSizeMB: 150, kvCachePerTokenMB: 0.5 }
  );
  
  const plan = planner.generatePlan(1024); // Target context length
  
  console.log(`Execution Plan: ${plan.layerAssignments.filter(d => d === 'gpu').length} GPU layers, ${plan.layerAssignments.filter(d => d === 'cpu').length} CPU layers`);
  console.log(`Estimated VRAM: ${plan.estimatedVRAM_MB}MB`);
  
  // Pass plan to engine
  return webllm.CreateMLCEngine(modelId, {
    appConfig: {
      ...webllm.prebuiltAppConfig,
      hybridExecution: plan.layerAssignments
    }
  });
}
```

**Deliverables:**
- [ ] `src/utils/KVCacheManager.ts` - KV cache compression
- [ ] `src/utils/HybridExecutionPlanner.ts` - CPU/GPU layer assignment
- [ ] Integration with model initialization

---

## Week 5: Service Worker & Caching Infrastructure

### 7. Model Sharding & Multi-File Loading with Service Worker
**VRAM Impact:** Enables on-demand loading, reduces initial load time

#### Implementation Steps:

**Step 1: Update Service Worker (`src/service-worker.ts`)**
```typescript
const CACHE_NAME = 'jokesters-models-v1';
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

// Install: Pre-cache critical shards only
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Only cache first 5 layers for fast startup
      return cache.addAll([
        '/models/sharded/layer_0000.bin',
        '/models/sharded/layer_0001.bin',
        '/models/sharded/layer_0002.bin',
        '/models/sharded/layer_0003.bin',
        '/models/sharded/layer_0004.bin',
        '/models/sharded/index.json'
      ]);
    })
  );
});

// Fetch: Lazy-load shards on demand
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  if (url.pathname.startsWith('/models/sharded/layer_')) {
    event.respondWith(lazyLoadShard(event.request));
  }
});

async function lazyLoadShard(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);
  
  // Check cache first
  const cached = await cache.match(request);
  if (cached) return cached;
  
  // Fetch from network with streaming
  const response = await fetch(request, {
    headers: {
      'Range': 'bytes=0-' // Support partial content
    }
  });
  
  if (response.ok || response.status === 206) {
    // Cache for future use
    cache.put(request, response.clone());
  }
  
  return response;
}

// Background sync: Download remaining shards
self.addEventListener('sync', (event) => {
  if (event.tag === 'download-model-shards') {
    event.waitUntil(downloadRemainingShards());
  }
});

async function downloadRemainingShards(): Promise<void> {
  const cache = await caches.open(CACHE_NAME);
  const indexResponse = await cache.match(SHARD_INDEX_URL);
  
  if (!indexResponse) return;
  
  const index: ShardIndex = await indexResponse.json();
  const cachedRequests = await cache.keys();
  const cachedFiles = new Set(cachedRequests.map(r => new URL(r.url).pathname));
  
  for (const layer of index.layers) {
    const path = `/models/sharded/${layer.file}`;
    if (!cachedFiles.has(path)) {
      // Download in background
      const response = await fetch(path);
      if (response.ok) {
        await cache.put(path, response);
      }
    }
  }
}
```

**Step 2: Create Shard Loader (`src/utils/ShardLoader.ts`)**
```typescript
export class ShardLoader {
  private cache: Cache;
  private index: ShardIndex | null = null;
  
  async initialize(): Promise<void> {
    this.cache = await caches.open('jokesters-models-v1');
    const response = await this.cache.match('/models/sharded/index.json');
    if (response) {
      this.index = await response.json();
    }
  }
  
  async loadLayer(layerId: number): Promise<ArrayBuffer> {
    if (!this.index) throw new Error('Index not loaded');
    
    const layer = this.index.layers.find(l => l.id === layerId);
    if (!layer) throw new Error(`Layer ${layerId} not found`);
    
    // Try cache first
    const cached = await this.cache.match(`/models/sharded/${layer.file}`);
    if (cached) {
      return cached.arrayBuffer();
    }
    
    // Fetch from network
    const response = await fetch(`/models/sharded/${layer.file}`);
    if (!response.ok) throw new Error(`Failed to load layer ${layerId}`);
    
    const buffer = await response.arrayBuffer();
    
    // Store in cache for next time
    await this.cache.put(
      `/models/sharded/${layer.file}`,
      new Response(buffer)
    );
    
    return buffer;
  }
  
  // Get download progress
  async getProgress(): Promise<{ cached: number; total: number }> {
    if (!this.index) return { cached: 0, total: 0 };
    
    const keys = await this.cache.keys();
    const cachedLayers = keys.filter(r => 
      r.url.includes('/models/sharded/layer_')
    ).length;
    
    return {
      cached: cachedLayers,
      total: this.index.total_layers
    };
  }
}
```

**Deliverables:**
- [ ] Updated `src/service-worker.ts` with shard caching
- [ ] `src/utils/ShardLoader.ts` for on-demand loading
- [ ] Background sync for pre-fetching

---

## Week 6: Integration & Testing

### 8. Integration & Performance Testing

#### Implementation Steps:

**Step 1: Create VRAM Monitor (`src/utils/VRAMMonitor.ts`)**
```typescript
export class VRAMMonitor {
  private observer: PerformanceObserver | null = null;
  private vramUsage: number = 0;
  
  start(): void {
    if ('gpu' in navigator) {
      // WebGPU memory queries (experimental)
      setInterval(() => this.checkVRAM(), 1000);
    }
  }
  
  private async checkVRAM(): Promise<void> {
    try {
      // Use WEBGL_debug_renderer_info or WebGPU query sets
      const adapter = await navigator.gpu.requestAdapter();
      const info = await adapter.requestAdapterInfo();
      
      // Log available memory info
      console.log('GPU Info:', info);
    } catch (e) {
      console.warn('VRAM monitoring not available');
    }
  }
  
  getCurrentUsage(): number {
    return this.vramUsage;
  }
}
```

**Step 2: Create Performance Benchmark (`tests/perf/VRAMBenchmark.ts`)**
```typescript
interface BenchmarkResult {
  modelId: string;
  quantization: string;
  contextLength: number;
  peakVRAM_MB: number;
  avgInferenceTime_ms: number;
  tokensPerSecond: number;
}

export class VRAMBenchmark {
  async runBenchmark(modelConfig: ModelConfig): Promise<BenchmarkResult> {
    const monitor = new VRAMMonitor();
    monitor.start();
    
    // Load model
    const startTime = performance.now();
    const engine = await createOptimizedEngine(modelConfig.id);
    const loadTime = performance.now() - startTime;
    
    // Run inference
    const prompt = "Tell me a joke about programming.";
    const inferenceStart = performance.now();
    
    const response = await engine.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 100
    });
    
    const inferenceTime = performance.now() - inferenceStart;
    const peakVRAM = monitor.getCurrentUsage();
    
    return {
      modelId: modelConfig.id,
      quantization: modelConfig.quantization,
      contextLength: modelConfig.contextLength,
      peakVRAM_MB: peakVRAM,
      avgInferenceTime_ms: inferenceTime,
      tokensPerSecond: 100 / (inferenceTime / 1000)
    };
  }
}
```

**Step 3: Update UI with VRAM Warnings (`src/ui/ModeHandlers.ts`)**
```typescript
function showVRAMWarning(requiredMB: number, availableMB: number): void {
  const warningEl = document.createElement('div');
  warningEl.className = 'vram-warning';
  warningEl.innerHTML = `
    <div class="alert alert-warning">
      <strong>VRAM Limit Warning</strong><br>
      This model requires ~${requiredMB}MB VRAM.<br>
      Your GPU has ~${availableMB}MB available.<br>
      <button onclick="switchToSmallerModel()">Switch to Optimized Model</button>
    </div>
  `;
  document.body.appendChild(warningEl);
}
```

**Deliverables:**
- [ ] `src/utils/VRAMMonitor.ts` - Real-time VRAM tracking
- [ ] `tests/perf/VRAMBenchmark.ts` - Performance benchmarks
- [ ] UI warnings for VRAM constraints

---

## Summary: VRAM Optimization Strategies

| Strategy | VRAM Reduction | Implementation Complexity | Priority |
|----------|---------------|---------------------------|----------|
| Context Window Truncation | 4-8x (4096→1024) | Low | P0 |
| Web-LLM GPU Utilization | 20-30% | Low | P0 |
| GGUF Q4_K_M Quantization | 50% vs FP16 | Medium | P1 |
| KV Cache Compression | 2x (FP8/INT8) | Medium | P1 |
| Layer-by-Layer Loading | 10-20x | High | P2 |
| CPU/GPU Hybrid | 30-50% | High | P2 |
| Model Sharding | Enables streaming | Medium | P2 |

### Expected Outcomes

**7B Model VRAM Requirements:**
- **Baseline (FP16, 4096 ctx):** ~28GB ❌
- **Q4_K_M + 1024 ctx:** ~5GB ✅
- **+ KV Cache FP8:** ~4GB ✅
- **+ Hybrid (20 GPU layers):** ~3GB ✅

### Next Steps

1. **Week 1:** Implement context window limits and Web-LLM config
2. **Week 2:** Convert models to GGUF Q4_K_M
3. **Week 3:** Implement layer pooling (if needed)
4. **Week 4:** Add KV cache compression
5. **Week 5:** Deploy service worker sharding
6. **Week 6:** Run benchmarks and optimize

---

## References

- [MLC-AI Web-LLM Documentation](https://llm.mlc.ai/docs/)
- [GGUF Format Specification](https://github.com/ggerganov/ggml/blob/master/docs/gguf.md)
- [Llama.cpp WASM Build](https://github.com/ggerganov/llama.cpp/tree/master/examples/server)
- [WebGPU Memory Management](https://gpuweb.github.io/gpuweb/#dom-gpudevice-createbuffer)
