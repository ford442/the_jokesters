/**
 * LLM Performance Test Utility
 * 
 * This utility helps measure and benchmark LLM inference performance
 * using the optimized GroupChatManager.
 * 
 * Usage:
 * ```typescript
 * import { runPerformanceTest } from './utils/performanceTest';
 * 
 * const results = await runPerformanceTest(groupChatManager, {
 *   iterations: 10,
 *   warmupIterations: 2,
 * });
 * 
 * console.log(results.summary);
 * ```
 */





export interface GenerationMetrics {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  totalTimeMs: number;
  timeToFirstTokenMs: number;
  tokensPerSec: number;
}

export interface PerformanceTestOptions {
  /** Number of chat iterations to measure */
  iterations?: number
  /** Number of warmup iterations before measurement */
  warmupIterations?: number
  /** Test prompt to use */
  prompt?: string
  /** Max tokens per generation */
  maxTokens?: number
  /** Callback for progress updates */
  onProgress?: (iteration: number, total: number) => void
}

export interface PerformanceTestResults {
  /** Individual metrics for each iteration */
  metrics: GenerationMetrics[]
  /** Summary statistics */
  summary: {
    totalIterations: number
    totalTokens: number
    totalTimeMs: number
    averageTokensPerSec: number
    minTokensPerSec: number
    maxTokensPerSec: number
    p50TokensPerSec: number
    p95TokensPerSec: number
    p99TokensPerSec: number
  }
  /** Human-readable report */
  report: string
}

/**
 * Run a performance benchmark test
 */
export async function runPerformanceTest(
  manager: any,
  options: PerformanceTestOptions = {}
): Promise<PerformanceTestResults> {
  const {
    iterations = 10,
    warmupIterations = 2,
    prompt = "Tell me a short joke about programming.",
    maxTokens = 64,
    onProgress,
  } = options

  const metrics: GenerationMetrics[] = []
  
  console.log(`[PerfTest] Starting performance test`)
  console.log(`[PerfTest] Warmup iterations: ${warmupIterations}`)
  console.log(`[PerfTest] Measurement iterations: ${iterations}`)
  console.log(`[PerfTest] Max tokens: ${maxTokens}`)
  
  // Reset any previous metrics
  manager.resetPerformanceMetrics()
  
  // Warmup phase
  console.log('[PerfTest] Warming up...')
  for (let i = 0; i < warmupIterations; i++) {
    onProgress?.(i, warmupIterations + iterations)
    await manager.chat(prompt, undefined, { maxTokens, enablePerfTracking: true })
  }
  
  // Measurement phase
  console.log('[PerfTest] Running measurements...')
  for (let i = 0; i < iterations; i++) {
    onProgress?.(warmupIterations + i, warmupIterations + iterations)
    
    const result = await manager.chat(prompt, undefined, { 
      maxTokens, 
      enablePerfTracking: true 
    })
    
    if (result.metrics) {
      metrics.push(result.metrics)
      console.log(`[PerfTest] Iteration ${i + 1}/${iterations}: ${result.metrics.tokensPerSec.toFixed(2)} tok/sec`)
    }
  }
  
  // Calculate statistics
  const tokensPerSecValues = metrics.map(m => m.tokensPerSec).sort((a, b) => a - b)
  const totalTokens = metrics.reduce((sum, m) => sum + m.totalTokens, 0)
  const totalTimeMs = metrics.reduce((sum, m) => sum + m.totalTimeMs, 0)
  const avgTokensPerSec = totalTokens / (totalTimeMs / 1000)
  
  const summary = {
    totalIterations: iterations,
    totalTokens,
    totalTimeMs,
    averageTokensPerSec: avgTokensPerSec,
    minTokensPerSec: Math.min(...tokensPerSecValues),
    maxTokensPerSec: Math.max(...tokensPerSecValues),
    p50TokensPerSec: percentile(tokensPerSecValues, 0.5),
    p95TokensPerSec: percentile(tokensPerSecValues, 0.95),
    p99TokensPerSec: percentile(tokensPerSecValues, 0.99),
  }
  
  const report = generateReport(summary, manager)
  
  console.log('[PerfTest] Test complete!')
  console.log(report)
  
  return {
    metrics,
    summary,
    report,
  }
}

/**
 * Calculate percentile from sorted array
 */
function percentile(sortedArray: number[], p: number): number {
  if (sortedArray.length === 0) return 0
  if (p <= 0) return sortedArray[0]
  if (p >= 1) return sortedArray[sortedArray.length - 1]
  
  const index = (sortedArray.length - 1) * p
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index - lower
  
  return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight
}

/**
 * Generate human-readable performance report
 */
function generateReport(summary: PerformanceTestResults['summary'], manager: any): string {
  const engineReport = manager.getPerformanceReport()
  
  return `
╔══════════════════════════════════════════════════════════════╗
║              LLM PERFORMANCE TEST RESULTS                    ║
╠══════════════════════════════════════════════════════════════╣
║ Iterations:        ${summary.totalIterations.toString().padEnd(39)} ║
║ Total Tokens:      ${summary.totalTokens.toString().padEnd(39)} ║
║ Total Time:        ${(summary.totalTimeMs / 1000).toFixed(2)}s${''.padEnd(35)} ║
╠══════════════════════════════════════════════════════════════╣
║ THROUGHPUT                                                   ║
║   Average:          ${summary.averageTokensPerSec.toFixed(2)} tok/sec${''.padEnd(25)} ║
║   Min/Max:          ${summary.minTokensPerSec.toFixed(2)} / ${summary.maxTokensPerSec.toFixed(2)} tok/sec${''.padEnd(18)} ║
║   P50:              ${summary.p50TokensPerSec.toFixed(2)} tok/sec${''.padEnd(25)} ║
║   P95:              ${summary.p95TokensPerSec.toFixed(2)} tok/sec${''.padEnd(25)} ║
║   P99:              ${summary.p99TokensPerSec.toFixed(2)} tok/sec${''.padEnd(25)} ║
╠══════════════════════════════════════════════════════════════╣
║ OPTIMIZATIONS ACTIVE                                         ║
║   4-bit Quantization:  Enabled (q4f16_1)                     ║
║   KV-Cache Reuse:      Enabled                               ║
║   Speculative Decode:  Not available in web-llm v0.2.80      ║
╚══════════════════════════════════════════════════════════════╝

${engineReport}
  `.trim()
}

/**
 * Quick benchmark - runs a minimal test and returns key metrics
 */
export async function quickBenchmark(
  manager: any,
  prompt: string = "Hello! Tell me a joke."
): Promise<{ tokensPerSec: number; latencyMs: number }> {
  const startTime = performance.now()
  const result = await manager.chat(prompt, undefined, { 
    maxTokens: 32,
    enablePerfTracking: true 
  })
  const endTime = performance.now()
  
  return {
    tokensPerSec: result.metrics?.tokensPerSec || 0,
    latencyMs: endTime - startTime,
  }
}

/**
 * Export performance data as JSON for further analysis
 */
export function exportPerformanceData(
  results: PerformanceTestResults
): string {
  return JSON.stringify({
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    webgpuSupported: 'gpu' in navigator,
    results: {
      summary: results.summary,
      metrics: results.metrics,
    },
  }, null, 2)
}
