/**
 * TTS Latency Benchmark
 * 
 * Measures text-to-speech latency from text input to audio buffer ready.
 * Target: <50ms for 80% of requests
 */

import { AudioEngine } from '../../src/audio/AudioEngine';
import { OptimizedAudioEngine } from '../../src/audio/OptimizedAudioEngine';
import { PerformanceMonitor } from './PerformanceMonitor';

export interface TTSLatencyOptions {
  iterations?: number;
  warmupIterations?: number;
  maxLatencyMs?: number;
  modelPath?: string;
  useOptimized?: boolean;
}

export interface TTSLatencyResult {
  passed: boolean;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  minLatency: number;
  maxLatency: number;
  targetMet: boolean;
  iterations: number;
}

export class TTSLatencyBenchmark {
  private engine: AudioEngine | OptimizedAudioEngine | null = null;
  private monitor: PerformanceMonitor;
  private options: Required<TTSLatencyOptions>;

  // Test phrases of varying complexity
  private testPhrases = [
    // Short phrases (common phonemes)
    "Hello!",
    "Yes.",
    "No way!",
    "Okay then.",
    "Oh wow!",
    
    // Medium phrases
    "The quick brown fox jumps over the lazy dog.",
    "Hello there, how are you doing today?",
    "I think this is working pretty well!",
    "Can you hear me clearly now?",
    "What do you think about that idea?",
    
    // Longer phrases
    "Science is not only a disciple of reason but also one of romance and passion.",
    "The philosopher said that knowledge is the beginning of all wisdom and understanding.",
    "Comedy is simply a funny way of being serious about life's little absurdities.",
    
    // Agent-specific phrases
    "Why did the programmer quit his job? Because he didn't get arrays!",
    "To be or not to be, that is the question...",
    "According to my calculations, this should be hilarious!"
  ];

  constructor(options: TTSLatencyOptions = {}) {
    this.options = {
      iterations: 100,
      warmupIterations: 10,
      maxLatencyMs: 50,
      modelPath: './tts/onnx',
      useOptimized: true,
      ...options
    };
    this.monitor = new PerformanceMonitor({
      maxTTSLatencyMs: this.options.maxLatencyMs
    });
  }

  /**
   * Initialize the TTS engine
   */
  async init(): Promise<void> {
    console.log('[TTSLatencyBenchmark] Initializing TTS engine...');
    
    if (this.options.useOptimized) {
      this.engine = new OptimizedAudioEngine();
    } else {
      this.engine = new AudioEngine();
    }
    
    await this.engine.init(this.options.modelPath);
    
    console.log('[TTSLatencyBenchmark] Engine ready');
  }

  /**
   * Run the TTS latency benchmark
   */
  async run(): Promise<TTSLatencyResult> {
    if (!this.engine) {
      throw new Error('TTSLatencyBenchmark not initialized. Call init() first.');
    }

    console.log(`[TTSLatencyBenchmark] Running ${this.options.iterations} iterations...`);
    console.log(`[TTSLatencyBenchmark] Target latency: <${this.options.maxLatencyMs}ms`);

    // Warmup phase
    console.log(`[TTSLatencyBenchmark] Warming up (${this.options.warmupIterations} iterations)...`);
    for (let i = 0; i < this.options.warmupIterations; i++) {
      const text = this.testPhrases[i % this.testPhrases.length];
      try {
        await this.engine.synthesize(text, 'comedian', { steps: 10 });
      } catch (e) {
        console.warn('[TTSLatencyBenchmark] Warmup synthesis failed:', e);
      }
    }

    // Start monitoring
    this.monitor.start();

    // Benchmark phase
    console.log('[TTSLatencyBenchmark] Running benchmark...');
    
    for (let i = 0; i < this.options.iterations; i++) {
      const text = this.testPhrases[i % this.testPhrases.length];
      const agentId = ['comedian', 'philosopher', 'scientist'][i % 3];
      
      const startTime = performance.now();
      
      try {
        await this.engine.synthesize(text, agentId, { steps: 10 });
        const latency = performance.now() - startTime;
        this.monitor.recordTTSLatency(text, latency);
      } catch (e) {
        console.warn(`[TTSLatencyBenchmark] Synthesis failed for iteration ${i}:`, e);
        this.monitor.recordTTSLatency(text, -1);
      }

      // Progress log every 25 iterations
      if ((i + 1) % 25 === 0) {
        console.log(`[TTSLatencyBenchmark] Progress: ${i + 1}/${this.options.iterations}`);
      }
    }

    this.monitor.stop();

    // Generate report
    const report = this.monitor.generateReport();
    const validSamples = report.tts.samples.filter(s => s.latencyMs > 0);
    
    if (validSamples.length === 0) {
      throw new Error('No valid TTS measurements collected');
    }

    const targetMetCount = validSamples.filter(s => s.latencyMs < this.options.maxLatencyMs).length;
    const targetMetPercentage = (targetMetCount / validSamples.length) * 100;

    const result: TTSLatencyResult = {
      passed: report.tts.p95 <= this.options.maxLatencyMs,
      averageLatency: report.tts.average,
      p95Latency: report.tts.p95,
      p99Latency: report.tts.p99,
      minLatency: report.tts.min,
      maxLatency: report.tts.max,
      targetMet: targetMetPercentage >= 80, // 80% of requests under threshold
      iterations: validSamples.length
    };

    console.log('[TTSLatencyBenchmark] Complete:');
    console.log(`  Average: ${result.averageLatency.toFixed(2)}ms`);
    console.log(`  P95: ${result.p95Latency.toFixed(2)}ms`);
    console.log(`  P99: ${result.p99Latency.toFixed(2)}ms`);
    console.log(`  Min/Max: ${result.minLatency.toFixed(2)}ms / ${result.maxLatency.toFixed(2)}ms`);
    console.log(`  Target Met: ${targetMetPercentage.toFixed(1)}% (${result.targetMet ? '✓' : '✗'})`);
    console.log(`  Passed: ${result.passed}`);

    return result;
  }

  /**
   * Run stress test with rapid-fire requests
   */
  async runStressTest(durationMs: number = 10000): Promise<{
    totalRequests: number;
    successfulRequests: number;
    avgLatency: number;
    p95Latency: number;
    maxLatency: number;
    passed: boolean;
  }> {
    if (!this.engine) {
      throw new Error('TTSLatencyBenchmark not initialized');
    }

    console.log(`[TTSLatencyBenchmark] Running stress test for ${durationMs}ms...`);

    const latencies: number[] = [];
    let totalRequests = 0;
    let successfulRequests = 0;
    const startTime = performance.now();

    while (performance.now() - startTime < durationMs) {
      const text = this.testPhrases[totalRequests % this.testPhrases.length];
      totalRequests++;

      try {
        const reqStart = performance.now();
        await this.engine.synthesize(text, 'default', { steps: 5 });
        const latency = performance.now() - reqStart;
        
        if (latency > 0) {
          latencies.push(latency);
          successfulRequests++;
        }
      } catch (e) {
        // Count as failure
      }

      // Small delay to prevent overwhelming the system
      await this.sleep(10);
    }

    const sorted = [...latencies].sort((a, b) => a - b);
    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
    const max = sorted[sorted.length - 1] || 0;

    return {
      totalRequests,
      successfulRequests,
      avgLatency: avg,
      p95Latency: p95,
      maxLatency: max,
      passed: p95 <= this.options.maxLatencyMs
    };
  }

  /**
   * Compare optimized vs legacy engine
   */
  async runComparison(): Promise<{
    optimized: TTSLatencyResult;
    comparison: string;
  }> {
    // Run with optimized engine
    const optimizedResult = await this.run();

    return {
      optimized: optimizedResult,
      comparison: 'Optimized engine only - legacy comparison not available'
    };
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.monitor.stop();
    
    if (this.engine) {
      if (this.engine instanceof OptimizedAudioEngine) {
        this.engine.terminate();
      }
      this.engine = null;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Run TTS latency benchmark
 */
export async function runTTSLatencyBenchmark(options?: TTSLatencyOptions): Promise<TTSLatencyResult> {
  const benchmark = new TTSLatencyBenchmark(options);
  
  try {
    await benchmark.init();
    return await benchmark.run();
  } finally {
    benchmark.dispose();
  }
}

/**
 * Quick TTS latency check
 */
export async function quickTTSLatencyCheck(): Promise<{ 
  latency: number; 
  passed: boolean 
}> {
  const benchmark = new TTSLatencyBenchmark({ 
    iterations: 10, 
    warmupIterations: 2 
  });
  
  try {
    await benchmark.init();
    const result = await benchmark.run();
    return { latency: result.p95Latency, passed: result.passed };
  } finally {
    benchmark.dispose();
  }
}
