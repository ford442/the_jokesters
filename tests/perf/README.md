# Performance Test Suite

Automated performance guardrails for The Jokesters application.

## Files

| File | Description |
|------|-------------|
| `PerformanceMonitor.ts` | Core monitoring class - tracks FPS, memory, TTS, LLM metrics |
| `FPSBenchmark.ts` | 3D rendering performance test |
| `MemoryLeakTest.ts` | Heap growth detection over time |
| `TTSLatencyBenchmark.ts` | Text-to-speech latency measurement |
| `LLMThroughputBenchmark.ts` | LLM token generation speed test |
| `index.ts` | Main test suite runner and exports |
| `ci-runner.ts` | CLI runner for CI/CD integration |
| `browser-runner.html` | Browser-based test UI |

## Usage

### From Command Line

```bash
# Quick test (30 seconds)
npm run perf:quick

# CI test (1-2 minutes) - default
npm run perf:ci

# Full test (5 minutes)
npm run perf:full

# Custom options
npx tsx tests/perf/ci-runner.ts --duration=ci --skip-tts --format=json
```

### From Browser

1. Start dev server: `npm run dev`
2. Open: `http://localhost:5173/tests/perf/browser-runner.html`

### From Code

```typescript
import { runAllBenchmarks, FPSBenchmark, MemoryLeakTest } from './tests/perf';

// Run all tests
const results = await runAllBenchmarks({
  duration: 'quick',  // 'quick' | 'ci' | 'full'
  output: 'console'   // 'console' | 'json' | 'html' | 'markdown'
});

if (results.passed) {
  console.log('All benchmarks passed!');
} else {
  console.log('Violations:', results.violations);
}

// Run individual test
const fps = new FPSBenchmark({ durationMinutes: 5 });
await fps.init();
const fpsResult = await fps.run();
fps.dispose();
```

## Performance Budget

See `../../perf-budget.json` for threshold definitions.

### Thresholds

| Metric | Target | Critical Threshold |
|--------|--------|-------------------|
| FPS (P95) | 60 | ≥30 |
| Memory Growth | 0 MB | ≤50 MB |
| TTS Latency (P95) | 30 ms | ≤50 ms |
| LLM Throughput (P95) | 60 tok/sec | ≥40 tok/sec |

## CI Integration

The test suite automatically detects CI environments and:
- Outputs JSON format for parsing
- Sets appropriate exit codes (0=pass, 1=fail, 2=error)
- Generates GitHub Actions annotations

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All benchmarks passed |
| 1 | One or more benchmarks failed thresholds |
| 2 | Execution error |
