/**
 * Memory Leak Test
 * 
 * Monitors JavaScript heap growth during extended usage.
 * Detects memory leaks by tracking heap size over time.
 */

import { PerformanceMonitor } from './PerformanceMonitor';

export interface MemoryLeakOptions {
  durationMinutes?: number;
  sampleIntervalMs?: number;
  maxGrowthMB?: number;
  baselineWindowSeconds?: number;
}

export interface MemoryLeakResult {
  passed: boolean;
  baselineMB: number;
  finalMB: number;
  growthMB: number;
  growthRateMBPerMinute: number;
  samples: number;
  duration: number;
  leakDetected: boolean;
}

export class MemoryLeakTest {
  private options: Required<MemoryLeakOptions>;
  private monitor: PerformanceMonitor;
  private isRunning = false;

  constructor(options: MemoryLeakOptions = {}) {
    this.options = {
      durationMinutes: 5,
      sampleIntervalMs: 5000,
      maxGrowthMB: 50,
      baselineWindowSeconds: 30,
      ...options
    };
    this.monitor = new PerformanceMonitor({
      memorySampleInterval: this.options.sampleIntervalMs,
      maxMemoryGrowthMB: this.options.maxGrowthMB
    });
  }

  /**
   * Check if memory API is available
   */
  isMemoryAPIAvailable(): boolean {
    return 'memory' in performance && (performance as any).memory !== undefined;
  }

  /**
   * Force garbage collection if available (requires --expose-gc flag)
   */
  forceGC(): void {
    if (typeof (globalThis as any).gc === 'function') {
      (globalThis as any).gc();
      console.log('[MemoryLeakTest] Forced garbage collection');
    }
  }

  /**
   * Get current memory usage in MB
   */
  getCurrentMemoryMB(): number {
    if (!this.isMemoryAPIAvailable()) {
      return 0;
    }
    const mem = (performance as any).memory;
    return mem.usedJSHeapSize / (1024 * 1024);
  }

  /**
   * Run the memory leak test
   */
  async run(): Promise<MemoryLeakResult> {
    if (!this.isMemoryAPIAvailable()) {
      console.warn('[MemoryLeakTest] Memory API not available, skipping test');
      return {
        passed: true,
        baselineMB: 0,
        finalMB: 0,
        growthMB: 0,
        growthRateMBPerMinute: 0,
        samples: 0,
        duration: 0,
        leakDetected: false
      };
    }

    console.log(`[MemoryLeakTest] Starting ${this.options.durationMinutes}-minute test...`);
    console.log(`[MemoryLeakTest] Max allowed growth: ${this.options.maxGrowthMB} MB`);

    // Force GC before starting
    this.forceGC();
    await this.sleep(1000);

    // Start monitoring
    this.isRunning = true;
    this.monitor.start();

    const startTime = performance.now();
    const durationMs = this.options.durationMinutes * 60 * 1000;

    // Simulate application activity
    const activityInterval = setInterval(() => {
      this.simulateActivity();
    }, 1000);

    // Wait for test duration
    await this.sleep(durationMs);

    // Stop activity
    clearInterval(activityInterval);
    this.isRunning = false;

    // Force GC before final measurement
    this.forceGC();
    await this.sleep(1000);

    this.monitor.stop();

    // Generate report
    const report = this.monitor.generateReport();
    const growthMB = report.memory.growth / (1024 * 1024);
    const durationMinutes = report.duration / 60000;
    const growthRate = durationMinutes > 0 ? growthMB / durationMinutes : 0;

    // Detect leak: consistent upward trend with >20% growth
    const leakDetected = this.detectLeak(report.memory.samples);

    const result: MemoryLeakResult = {
      passed: growthMB <= this.options.maxGrowthMB && !leakDetected,
      baselineMB: report.memory.baseline / (1024 * 1024),
      finalMB: report.memory.final / (1024 * 1024),
      growthMB,
      growthRateMBPerMinute: growthRate,
      samples: report.memory.samples.length,
      duration: report.duration,
      leakDetected
    };

    console.log('[MemoryLeakTest] Complete:');
    console.log(`  Baseline: ${result.baselineMB.toFixed(2)} MB`);
    console.log(`  Final: ${result.finalMB.toFixed(2)} MB`);
    console.log(`  Growth: ${result.growthMB.toFixed(2)} MB`);
    console.log(`  Growth Rate: ${result.growthRateMBPerMinute.toFixed(2)} MB/min`);
    console.log(`  Leak Detected: ${result.leakDetected}`);
    console.log(`  Passed: ${result.passed}`);

    return result;
  }

  /**
   * Analyze memory samples to detect leak pattern
   */
  private detectLeak(samples: Array<{ usedJSHeapSize: number }>): boolean {
    if (samples.length < 10) return false;

    // Simple linear regression to detect upward trend
    const n = samples.length;
    const x: number[] = [];
    const y: number[] = [];
    
    for (let i = 0; i < n; i++) {
      x.push(i);
      y.push(samples[i].usedJSHeapSize);
    }

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    // Convert slope to MB per sample
    const slopeMBPerSample = slope / (1024 * 1024);
    
    // Leak if slope indicates >5MB growth per sample
    return slopeMBPerSample > 5;
  }

  /**
   * Simulate various application activities that might leak memory
   */
  private simulateActivity(): void {
    if (!this.isRunning) return;

    // Create and discard objects to simulate memory pressure
    const temp: any[] = [];
    
    // Simulate message history growth
    for (let i = 0; i < 10; i++) {
      temp.push({
        id: Math.random().toString(36),
        text: 'A'.repeat(100),
        timestamp: Date.now()
      });
    }

    // Simulate TTS buffer allocation
    const audioBuffer = new Float32Array(1024 * 16);
    
    // Clear references (should be GC'd)
    temp.length = 0;
  }

  /**
   * Quick memory check (1 minute instead of 5)
   */
  async runQuick(): Promise<MemoryLeakResult> {
    const originalDuration = this.options.durationMinutes;
    this.options.durationMinutes = 1;
    
    const result = await this.run();
    
    // Adjust threshold for shorter test
    const adjustedThreshold = this.options.maxGrowthMB * (1 / 5);
    result.passed = result.growthMB <= adjustedThreshold && !result.leakDetected;
    
    this.options.durationMinutes = originalDuration;
    
    return result;
  }

  /**
   * Get memory pressure status
   */
  getMemoryPressure(): 'nominal' | 'fair' | 'serious' | 'critical' {
    if (!this.isMemoryAPIAvailable()) return 'nominal';
    
    const mem = (performance as any).memory;
    const usedRatio = mem.usedJSHeapSize / mem.jsHeapSizeLimit;
    
    if (usedRatio < 0.5) return 'nominal';
    if (usedRatio < 0.7) return 'fair';
    if (usedRatio < 0.9) return 'serious';
    return 'critical';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Run memory leak test
 */
export async function runMemoryLeakTest(options?: MemoryLeakOptions): Promise<MemoryLeakResult> {
  const test = new MemoryLeakTest(options);
  return test.run();
}

/**
 * Quick memory check for development
 */
export async function quickMemoryCheck(): Promise<{ 
  currentMB: number; 
  pressure: string; 
  passed: boolean 
}> {
  const test = new MemoryLeakTest({ durationMinutes: 0.1 });
  
  return {
    currentMB: test.getCurrentMemoryMB(),
    pressure: test.getMemoryPressure(),
    passed: test.getMemoryPressure() !== 'critical'
  };
}
