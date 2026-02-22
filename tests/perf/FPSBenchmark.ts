/**
 * FPS Benchmark
 * 
 * Measures frame rate during a simulated 5-minute improv scene.
 * Tests Three.js rendering performance with all actors active.
 */

import { Stage } from '../../src/visuals/Stage';
import { PerformanceMonitor } from './PerformanceMonitor';

export interface FPSBenchmarkOptions {
  durationMinutes?: number;
  targetFPS?: number;
  warmupSeconds?: number;
}

export interface FPSBenchmarkResult {
  passed: boolean;
  averageFPS: number;
  p95FPS: number;
  minFPS: number;
  frameDrops: number;
  totalFrames: number;
  duration: number;
}

export class FPSBenchmark {
  private stage: Stage | null = null;
  private monitor: PerformanceMonitor;
  private options: Required<FPSBenchmarkOptions>;
  private canvas: HTMLCanvasElement | null = null;

  constructor(options: FPSBenchmarkOptions = {}) {
    this.options = {
      durationMinutes: 5,
      targetFPS: 30,
      warmupSeconds: 5,
      ...options
    };
    this.monitor = new PerformanceMonitor({
      fpsThreshold: this.options.targetFPS
    });
  }

  /**
   * Initialize the benchmark environment
   */
  async init(): Promise<void> {
    // Create offscreen canvas for headless testing
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1280;
    this.canvas.height = 720;
    
    // Create stage (this starts the render loop)
    this.stage = new Stage(this.canvas);
    
    // Start render loop
    this.stage.render();
    
    console.log('[FPSBenchmark] Initialized');
  }

  /**
   * Run the FPS benchmark
   */
  async run(): Promise<FPSBenchmarkResult> {
    if (!this.stage) {
      throw new Error('FPSBenchmark not initialized. Call init() first.');
    }

    console.log(`[FPSBenchmark] Starting ${this.options.durationMinutes}-minute test...`);

    // Warmup period
    console.log(`[FPSBenchmark] Warming up for ${this.options.warmupSeconds}s...`);
    await this.sleep(this.options.warmupSeconds * 1000);

    // Start monitoring
    this.monitor.start();

    // Simulate actor activity - cycle through different actors speaking
    const startTime = performance.now();
    const durationMs = this.options.durationMinutes * 60 * 1000;
    const agentIds = ['comedian', 'philosopher', 'scientist', 'techBro', 'robot'];
    let currentAgentIndex = 0;

    // Simulate scene activity
    const activityInterval = setInterval(() => {
      // Switch active actor every 3 seconds (simulating turn-taking)
      const agentId = agentIds[currentAgentIndex % agentIds.length];
      this.stage!.setActiveActor(agentId);
      
      // Simulate lip sync activity
      const volume = Math.random() * 0.5 + 0.2;
      
      currentAgentIndex++;
    }, 3000);

    // Wait for test duration
    await this.sleep(durationMs);

    // Stop activity
    clearInterval(activityInterval);
    this.monitor.stop();

    // Generate report
    const report = this.monitor.generateReport();
    const result: FPSBenchmarkResult = {
      passed: report.summary.passed && report.fps.p95 >= this.options.targetFPS,
      averageFPS: report.fps.average,
      p95FPS: report.fps.p95,
      minFPS: report.fps.min,
      frameDrops: report.fps.drops,
      totalFrames: report.fps.samples.length,
      duration: report.duration
    };

    console.log('[FPSBenchmark] Complete:');
    console.log(`  Average FPS: ${result.averageFPS.toFixed(1)}`);
    console.log(`  P95 FPS: ${result.p95FPS.toFixed(1)}`);
    console.log(`  Min FPS: ${result.minFPS.toFixed(1)}`);
    console.log(`  Frame Drops: ${result.frameDrops}`);
    console.log(`  Passed: ${result.passed}`);

    return result;
  }

  /**
   * Quick benchmark for CI (30 seconds instead of 5 minutes)
   */
  async runQuick(): Promise<FPSBenchmarkResult> {
    const originalDuration = this.options.durationMinutes;
    this.options.durationMinutes = 0.5; // 30 seconds
    
    const result = await this.run();
    
    // Adjust expectations for shorter test
    this.options.durationMinutes = originalDuration;
    
    return result;
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.monitor.stop();
    
    if (this.stage) {
      this.stage.dispose();
      this.stage = null;
    }
    
    this.canvas = null;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Run FPS benchmark from Node.js/CI environment
 */
export async function runFPSBenchmark(options?: FPSBenchmarkOptions): Promise<FPSBenchmarkResult> {
  const benchmark = new FPSBenchmark(options);
  
  try {
    await benchmark.init();
    const result = await benchmark.run();
    return result;
  } finally {
    benchmark.dispose();
  }
}

/**
 * Quick FPS check for development
 */
export async function quickFPSCheck(): Promise<{ fps: number; passed: boolean }> {
  const benchmark = new FPSBenchmark({ durationMinutes: 0.1, warmupSeconds: 1 });
  
  try {
    await benchmark.init();
    const result = await benchmark.run();
    return { fps: result.averageFPS, passed: result.passed };
  } finally {
    benchmark.dispose();
  }
}
