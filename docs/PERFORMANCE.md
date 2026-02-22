# Performance Guardrails

This document describes the automated performance guardrails for The Jokesters application.

## Overview

The performance test suite monitors four critical metrics:

| Metric | Target | Threshold | Description |
|--------|--------|-----------|-------------|
| **FPS** | 60 | ≥30 | Frame rate during 3D rendering |
| **Memory Leak** | 0 MB | ≤50 MB | Heap growth over 5 minutes |
| **TTS Latency** | 30 ms | ≤50 ms | Text-to-speech latency |
| **LLM Throughput** | 60 tok/sec | ≥40 tok/sec | Token generation speed |

## Quick Start

### Run in Browser

```bash
# Start dev server
npm run dev

# Open browser test runner
open http://localhost:5173/tests/perf/browser-runner.html
```

### Run in CI

```bash
# Run all benchmarks (CI mode)
npx tsx tests/perf/ci-runner.ts

# Run with specific options
npx tsx tests/perf/ci-runner.ts --duration=full --format=json --output=results.json

# Skip specific tests
npx tsx tests/perf/ci-runner.ts --skip-tts --skip-llm
```

### Run from Code

```typescript
import { runAllBenchmarks } from './tests/perf';

// Quick test (30 seconds)
const results = await runAllBenchmarks({ duration: 'quick' });

// Full test (5 minutes)
const results = await runAllBenchmarks({ duration: 'full' });

// CI test (1-2 minutes)
const results = await runAllBenchmarks({ duration: 'ci' });
```

## Performance Budget

The `perf-budget.json` file defines thresholds for all metrics:

```json
{
  "thresholds": {
    "fps": { "min": 30, "target": 60 },
    "memoryLeak": { "maxHeapGrowthMB": 50 },
    "ttsLatency": { "max": 50 },
    "llmTokensPerSec": { "min": 40 }
  }
}
```

### Environment Adjustments

Different thresholds can be applied for CI vs production:

```json
{
  "environments": {
    "ci": {
      "adjustments": {
        "fps": { "tolerance": 0.7 },
        "tokensPerSec": { "tolerance": 0.6 }
      }
    }
  }
}
```

## Benchmark Details

### FPS Benchmark

Measures frame rate during a simulated improv scene with all 5 actors active.

```typescript
import { FPSBenchmark } from './tests/perf';

const benchmark = new FPSBenchmark({
  durationMinutes: 5,
  targetFPS: 30,
  warmupSeconds: 5
});

await benchmark.init();
const result = await benchmark.run();
console.log(`P95 FPS: ${result.p95FPS}`);
benchmark.dispose();
```

**What it tests:**
- Three.js rendering performance
- Actor animations (lip sync, gestures)
- Audience particle simulation
- LOD system effectiveness
- Frustum culling

### Memory Leak Test

Monitors JavaScript heap growth during extended usage.

```typescript
import { MemoryLeakTest } from './tests/perf';

const test = new MemoryLeakTest({
  durationMinutes: 5,
  maxGrowthMB: 50
});

const result = await test.run();
console.log(`Growth: ${result.growthMB} MB`);
```

**What it tests:**
- Message history accumulation
- TTS buffer leaks
- Event listener cleanup
- Animation frame leaks

### TTS Latency Benchmark

Measures text-to-speech latency from text input to audio buffer ready.

```typescript
import { TTSLatencyBenchmark } from './tests/perf';

const benchmark = new TTSLatencyBenchmark({
  iterations: 100,
  maxLatencyMs: 50
});

await benchmark.init();
const result = await benchmark.run();
console.log(`P95 Latency: ${result.p95Latency}ms`);
benchmark.dispose();
```

**What it tests:**
- AudioEngine initialization
- Voice style loading
- ONNX inference speed
- Phoneme processing

### LLM Throughput Benchmark

Measures LLM token generation throughput.

```typescript
import { LLMThroughputBenchmark } from './tests/perf';

const benchmark = new LLMThroughputBenchmark({
  iterations: 20,
  minTokensPerSec: 40,
  modelId: 'Hermes-3-Llama-3.2-3B-q4f32_1-MLC'
});

await benchmark.init();
const result = await benchmark.run();
console.log(`P95 Tokens/sec: ${result.p95TokensPerSec}`);
await benchmark.dispose();
```

**What it tests:**
- Model loading time
- Token generation speed
- KV-cache efficiency
- Agent switching overhead

## CI Integration

### GitHub Actions Example

```yaml
name: Performance Tests

on: [push, pull_request]

jobs:
  perf:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run performance tests
        run: npx tsx tests/perf/ci-runner.ts --duration=ci --format=json --output=perf-results.json
        
      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: performance-results
          path: perf-results.json
          
      - name: Check thresholds
        run: |
          if [ $(jq '.passed' perf-results.json) = "false" ]; then
            echo "Performance thresholds exceeded!"
            exit 1
          fi
```

### GitLab CI Example

```yaml
performance:
  stage: test
  script:
    - npm ci
    - npx tsx tests/perf/ci-runner.ts --duration=ci
  artifacts:
    reports:
      junit: perf-results.xml
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

## Interpreting Results

### FPS Results

| Grade | P95 FPS | Status |
|-------|---------|--------|
| A | ≥55 | Excellent |
| B | 45-54 | Good |
| C | 35-44 | Acceptable |
| D | 30-34 | Marginal |
| F | <30 | Failing |

### Memory Results

| Growth Rate | Status |
|-------------|--------|
| <5 MB/min | ✅ Healthy |
| 5-20 MB/min | ⚠️ Monitor |
| 20-50 MB/min | ⚠️ Warning |
| >50 MB/min | ❌ Leak Detected |

### TTS Latency Results

| P95 Latency | Status |
|-------------|--------|
| <30 ms | ✅ Excellent |
| 30-50 ms | ✅ Good |
| 50-100 ms | ⚠️ Slow |
| >100 ms | ❌ Unacceptable |

### LLM Throughput Results

| P95 Tokens/sec | Status |
|----------------|--------|
| >60 | ✅ Excellent |
| 40-60 | ✅ Good |
| 20-40 | ⚠️ Slow |
| <20 | ❌ Unacceptable |

## Troubleshooting

### Low FPS

1. Check WebGPU support: `chrome://gpu`
2. Reduce audience count in `Stage.ts`
3. Disable shadows: `shadowMap.enabled = false`
4. Lower pixel ratio: `setPixelRatio(1)`

### Memory Leaks

1. Use Chrome DevTools Memory tab
2. Take heap snapshots before/after
3. Look for detached DOM nodes
4. Check for uncleared event listeners

### High TTS Latency

1. Ensure TTS model files are cached
2. Check ONNX Runtime Web version
3. Reduce diffusion steps: `steps: 5`
4. Use OptimizedAudioEngine

### Low LLM Throughput

1. Check GPU utilization in Task Manager
2. Verify 4-bit quantization is enabled
3. Reduce `maxTokens` per generation
4. Consider model size vs speed tradeoff

## Contributing

When adding new features:

1. Run benchmarks before changes
2. Run benchmarks after changes
3. Ensure no regression >10%
4. Document any threshold changes

## Related Files

- `perf-budget.json` - Threshold definitions
- `tests/perf/` - Test suite source code
- `src/utils/performanceTest.ts` - Existing LLM perf utilities
- `src/audio/TTSLatencyProfiler.ts` - TTS profiling utilities
