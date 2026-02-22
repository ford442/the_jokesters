/**
 * Performance Test Suite
 * 
 * Main entry point for running all performance benchmarks.
 * 
 * Usage:
 * ```typescript
 * import { runAllBenchmarks } from './tests/perf';
 * 
 * const results = await runAllBenchmarks({
 *   duration: 'quick', // or 'full'
 *   output: 'json'
 * });
 * ```
 */

import { FPSBenchmark, FPSBenchmarkResult } from './FPSBenchmark';
import { MemoryLeakTest, MemoryLeakResult } from './MemoryLeakTest';
import { TTSLatencyBenchmark, TTSLatencyResult } from './TTSLatencyBenchmark';
import { LLMThroughputBenchmark, LLMThroughputResult } from './LLMThroughputBenchmark';
import { PerformanceMonitor, PerformanceReport } from './PerformanceMonitor';

export * from './PerformanceMonitor';
export * from './FPSBenchmark';
export * from './MemoryLeakTest';
export * from './TTSLatencyBenchmark';
export * from './LLMThroughputBenchmark';

export interface BenchmarkSuiteOptions {
  /** Test duration mode */
  duration?: 'quick' | 'full' | 'ci';
  /** Output format */
  output?: 'json' | 'html' | 'markdown' | 'console';
  /** Output file path (optional) */
  outputPath?: string;
  /** Whether to fail on threshold violations */
  failOnViolation?: boolean;
  /** Specific benchmarks to run */
  include?: Array<'fps' | 'memory' | 'tts' | 'llm'>;
}

export interface BenchmarkSuiteResult {
  timestamp: string;
  duration: string;
  fps?: FPSBenchmarkResult;
  memory?: MemoryLeakResult;
  tts?: TTSLatencyResult;
  llm?: LLMThroughputResult;
  passed: boolean;
  violations: Array<{
    test: string;
    metric: string;
    expected: string;
    actual: string;
  }>;
}

/**
 * Run all performance benchmarks
 */
export async function runAllBenchmarks(
  options: BenchmarkSuiteOptions = {}
): Promise<BenchmarkSuiteResult> {
  const opts = {
    duration: 'quick',
    output: 'console',
    failOnViolation: true,
    include: ['fps', 'memory', 'tts', 'llm'] as const,
    ...options
  };

  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║         THE JOKESTERS - PERFORMANCE TEST SUITE               ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║ Duration: ${opts.duration.padEnd(51)} ║`);
  console.log(`║ Output:   ${opts.output.padEnd(51)} ║`);
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  const startTime = performance.now();
  const result: BenchmarkSuiteResult = {
    timestamp: new Date().toISOString(),
    duration: '',
    passed: true,
    violations: []
  };

  // FPS Benchmark
  if (opts.include.includes('fps')) {
    console.log('\n📊 Running FPS Benchmark...');
    try {
      const fpsBenchmark = new FPSBenchmark({
        durationMinutes: opts.duration === 'full' ? 5 : opts.duration === 'ci' ? 1 : 0.5,
        targetFPS: 30
      });
      
      await fpsBenchmark.init();
      result.fps = await fpsBenchmark.run();
      fpsBenchmark.dispose();
      
      if (!result.fps.passed) {
        result.violations.push({
          test: 'FPS',
          metric: 'P95 FPS',
          expected: '>= 30',
          actual: result.fps.p95FPS.toFixed(1)
        });
      }
    } catch (e) {
      console.error('FPS Benchmark failed:', e);
      result.violations.push({
        test: 'FPS',
        metric: 'execution',
        expected: 'success',
        actual: 'error: ' + (e as Error).message
      });
    }
  }

  // Memory Leak Test
  if (opts.include.includes('memory')) {
    console.log('\n🧠 Running Memory Leak Test...');
    try {
      const memoryTest = new MemoryLeakTest({
        durationMinutes: opts.duration === 'full' ? 5 : opts.duration === 'ci' ? 2 : 1,
        maxGrowthMB: 50
      });
      
      result.memory = await memoryTest.run();
      
      if (!result.memory.passed) {
        result.violations.push({
          test: 'Memory',
          metric: 'Heap Growth',
          expected: '<= 50 MB',
          actual: `${result.memory.growthMB.toFixed(2)} MB`
        });
      }
    } catch (e) {
      console.error('Memory Leak Test failed:', e);
      result.violations.push({
        test: 'Memory',
        metric: 'execution',
        expected: 'success',
        actual: 'error: ' + (e as Error).message
      });
    }
  }

  // TTS Latency Benchmark
  if (opts.include.includes('tts')) {
    console.log('\n🔊 Running TTS Latency Benchmark...');
    try {
      const ttsBenchmark = new TTSLatencyBenchmark({
        iterations: opts.duration === 'full' ? 100 : opts.duration === 'ci' ? 50 : 20,
        maxLatencyMs: 50
      });
      
      await ttsBenchmark.init();
      result.tts = await ttsBenchmark.run();
      ttsBenchmark.dispose();
      
      if (!result.tts.passed) {
        result.violations.push({
          test: 'TTS',
          metric: 'P95 Latency',
          expected: '<= 50ms',
          actual: `${result.tts.p95Latency.toFixed(2)}ms`
        });
      }
    } catch (e) {
      console.error('TTS Latency Benchmark failed:', e);
      result.violations.push({
        test: 'TTS',
        metric: 'execution',
        expected: 'success',
        actual: 'error: ' + (e as Error).message
      });
    }
  }

  // LLM Throughput Benchmark
  if (opts.include.includes('llm')) {
    console.log('\n🤖 Running LLM Throughput Benchmark...');
    try {
      const llmBenchmark = new LLMThroughputBenchmark({
        iterations: opts.duration === 'full' ? 20 : opts.duration === 'ci' ? 10 : 5,
        minTokensPerSec: 40
      });
      
      await llmBenchmark.init((progress) => {
        if (progress.progress % 0.25 < 0.01) {
          console.log(`  Model loading: ${(progress.progress * 100).toFixed(0)}%`);
        }
      });
      
      result.llm = await llmBenchmark.run();
      await llmBenchmark.dispose();
      
      if (!result.llm.passed) {
        result.violations.push({
          test: 'LLM',
          metric: 'P95 Tokens/sec',
          expected: '>= 40',
          actual: result.llm.p95TokensPerSec.toFixed(2)
        });
      }
    } catch (e) {
      console.error('LLM Throughput Benchmark failed:', e);
      result.violations.push({
        test: 'LLM',
        metric: 'execution',
        expected: 'success',
        actual: 'error: ' + (e as Error).message
      });
    }
  }

  // Calculate overall result
  result.passed = result.violations.filter(v => 
    v.test !== 'FPS' && v.test !== 'Memory' && v.test !== 'TTS' && v.test !== 'LLM'
  ).length === 0 &&
  (result.fps?.passed ?? true) &&
  (result.memory?.passed ?? true) &&
  (result.tts?.passed ?? true) &&
  (result.llm?.passed ?? true);

  const endTime = performance.now();
  result.duration = `${((endTime - startTime) / 1000).toFixed(2)}s`;

  // Output results
  await outputResults(result, opts.output, opts.outputPath);

  return result;
}

/**
 * Output benchmark results
 */
async function outputResults(
  result: BenchmarkSuiteResult,
  format: string,
  path?: string
): Promise<void> {
  switch (format) {
    case 'json':
      await outputJSON(result, path);
      break;
    case 'html':
      await outputHTML(result, path);
      break;
    case 'markdown':
      await outputMarkdown(result, path);
      break;
    case 'console':
    default:
      outputConsole(result);
  }
}

function outputConsole(result: BenchmarkSuiteResult): void {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                     TEST RESULTS                             ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  
  if (result.fps) {
    console.log(`║ FPS Benchmark:       ${result.fps.passed ? '✅ PASS' : '❌ FAIL'}`.padEnd(63) + '║');
    console.log(`║   P95 FPS:           ${result.fps.p95FPS.toFixed(1)}`.padEnd(63) + '║');
    console.log(`║   Frame Drops:       ${result.fps.frameDrops}`.padEnd(63) + '║');
  }
  
  if (result.memory) {
    console.log(`║ Memory Test:         ${result.memory.passed ? '✅ PASS' : '❌ FAIL'}`.padEnd(63) + '║');
    console.log(`║   Growth:            ${result.memory.growthMB.toFixed(2)} MB`.padEnd(63) + '║');
    console.log(`║   Leak Detected:     ${result.memory.leakDetected ? 'YES' : 'NO'}`.padEnd(63) + '║');
  }
  
  if (result.tts) {
    console.log(`║ TTS Benchmark:       ${result.tts.passed ? '✅ PASS' : '❌ FAIL'}`.padEnd(63) + '║');
    console.log(`║   P95 Latency:       ${result.tts.p95Latency.toFixed(2)}ms`.padEnd(63) + '║');
    console.log(`║   Target Met:        ${result.tts.targetMet ? 'YES' : 'NO'}`.padEnd(63) + '║');
  }
  
  if (result.llm) {
    console.log(`║ LLM Benchmark:       ${result.llm.passed ? '✅ PASS' : '❌ FAIL'}`.padEnd(63) + '║');
    console.log(`║   P95 Tokens/sec:    ${result.llm.p95TokensPerSec.toFixed(2)}`.padEnd(63) + '║');
    console.log(`║   Total Tokens:      ${result.llm.totalTokens}`.padEnd(63) + '║');
  }
  
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log(`║ Overall:             ${result.passed ? '✅ PASSED' : '❌ FAILED'}`.padEnd(63) + '║');
  console.log(`║ Duration:            ${result.duration}`.padEnd(63) + '║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  if (result.violations.length > 0) {
    console.log('\n⚠️  Violations:');
    result.violations.forEach(v => {
      console.log(`   ${v.test}.${v.metric}: expected ${v.expected}, got ${v.actual}`);
    });
  }
}

async function outputJSON(result: BenchmarkSuiteResult, path?: string): Promise<void> {
  const json = JSON.stringify(result, null, 2);
  
  if (path) {
    // In browser environment, trigger download
    if (typeof document !== 'undefined') {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = path;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // Node.js environment
      const fs = await import('fs');
      fs.writeFileSync(path, json);
    }
  } else {
    console.log(json);
  }
}

async function outputHTML(result: BenchmarkSuiteResult, path?: string): Promise<void> {
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Performance Test Results</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
    .passed { color: green; } .failed { color: red; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { padding: 0.5rem; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #f5f5f5; }
  </style>
</head>
<body>
  <h1>Performance Test Results</h1>
  <p>Timestamp: ${result.timestamp}</p>
  <p>Duration: ${result.duration}</p>
  <p>Status: <span class="${result.passed ? 'passed' : 'failed'}">${result.passed ? 'PASSED' : 'FAILED'}</span></p>
  
  ${result.violations.length > 0 ? `
  <h2>Violations</h2>
  <table>
    <tr><th>Test</th><th>Metric</th><th>Expected</th><th>Actual</th></tr>
    ${result.violations.map(v => `<tr><td>${v.test}</td><td>${v.metric}</td><td>${v.expected}</td><td>${v.actual}</td></tr>`).join('')}
  </table>
  ` : ''}
</body>
</html>`;

  if (path && typeof document === 'undefined') {
    const fs = await import('fs');
    fs.writeFileSync(path, html);
  } else {
    console.log(html);
  }
}

async function outputMarkdown(result: BenchmarkSuiteResult, path?: string): Promise<void> {
  let md = `# Performance Test Results\n\n`;
  md += `**Timestamp:** ${result.timestamp}\n`;
  md += `**Duration:** ${result.duration}\n`;
  md += `**Status:** ${result.passed ? '✅ PASSED' : '❌ FAILED'}\n\n`;
  
  if (result.violations.length > 0) {
    md += `## Violations\n\n`;
    md += `| Test | Metric | Expected | Actual |\n`;
    md += `|------|--------|----------|--------|\n`;
    result.violations.forEach(v => {
      md += `| ${v.test} | ${v.metric} | ${v.expected} | ${v.actual} |\n`;
    });
    md += `\n`;
  }
  
  if (path && typeof document === 'undefined') {
    const fs = await import('fs');
    fs.writeFileSync(path, md);
  } else {
    console.log(md);
  }
}

/**
 * Check if running in CI environment
 */
export function isCI(): boolean {
  return !!(
    process?.env?.CI ||
    process?.env?.CONTINUOUS_INTEGRATION ||
    process?.env?.GITHUB_ACTIONS
  );
}

/**
 * Run benchmarks appropriate for CI environment
 */
export async function runCIBenchmarks(): Promise<BenchmarkSuiteResult> {
  return runAllBenchmarks({
    duration: 'ci',
    output: isCI() ? 'json' : 'console',
    failOnViolation: true
  });
}

// Auto-run if executed directly
if (typeof window !== 'undefined') {
  // Browser environment - expose for console testing
  (window as any).PerfTests = {
    runAllBenchmarks,
    runCIBenchmarks,
    FPSBenchmark,
    MemoryLeakTest,
    TTSLatencyBenchmark,
    LLMThroughputBenchmark,
    PerformanceMonitor
  };
}
