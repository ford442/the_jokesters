/**
 * Performance Monitor
 * 
 * Centralized performance monitoring system for The Jokesters.
 * Tracks FPS, memory usage, TTS latency, and LLM throughput.
 * 
 * Usage:
 * ```typescript
 * const monitor = new PerformanceMonitor();
 * monitor.start();
 * // ... run application ...
 * const report = monitor.generateReport();
 * monitor.stop();
 * ```
 */

export interface FPSMetrics {
  samples: number[];
  average: number;
  min: number;
  max: number;
  p95: number;
  p99: number;
  drops: number; // Count of frames below threshold
}

export interface MemoryMetrics {
  samples: Array<{
    timestamp: number;
    usedJSHeapSize: number;
    totalJSHeapSize: number;
  }>;
  baseline: number;
  final: number;
  growth: number;
  growthRatePerMinute: number;
}

export interface TTSMetrics {
  samples: Array<{
    text: string;
    latencyMs: number;
    textLength: number;
    timestamp: number;
  }>;
  average: number;
  min: number;
  max: number;
  p95: number;
  p99: number;
}

export interface LLMMetrics {
  samples: Array<{
    tokensGenerated: number;
    timeMs: number;
    tokensPerSec: number;
    agentId: string;
    timestamp: number;
  }>;
  averageTokensPerSec: number;
  minTokensPerSec: number;
  maxTokensPerSec: number;
  p95TokensPerSec: number;
}

export interface PerformanceReport {
  timestamp: string;
  duration: number;
  fps: FPSMetrics;
  memory: MemoryMetrics;
  tts: TTSMetrics;
  llm: LLMMetrics;
  violations: Array<{
    metric: string;
    threshold: number;
    actual: number;
    severity: 'critical' | 'warning';
  }>;
  summary: {
    score: number; // 0-100
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    passed: boolean;
  };
}

export interface MonitorOptions {
  fpsThreshold?: number;
  memorySampleInterval?: number;
  maxMemoryGrowthMB?: number;
  maxTTSLatencyMs?: number;
  minTokensPerSec?: number;
}

export class PerformanceMonitor {
  private isRunning = false;
  private startTime = 0;
  private options: Required<MonitorOptions>;
  
  // FPS tracking
  private fpsSamples: number[] = [];
  private lastFrameTime = 0;
  private frameCount = 0;
  private fpsRafId: number | null = null;
  
  // Memory tracking
  private memorySamples: MemoryMetrics['samples'] = [];
  private memoryInterval: ReturnType<typeof setInterval> | null = null;
  private baselineMemory = 0;
  
  // TTS tracking
  private ttsSamples: TTSMetrics['samples'] = [];
  
  // LLM tracking
  private llmSamples: LLMMetrics['samples'] = [];
  
  // Budget thresholds
  private budget: any = null;

  constructor(options: MonitorOptions = {}) {
    this.options = {
      fpsThreshold: 30,
      memorySampleInterval: 5000,
      maxMemoryGrowthMB: 50,
      maxTTSLatencyMs: 50,
      minTokensPerSec: 40,
      ...options
    };
  }

  async loadBudget(budgetPath: string = './perf-budget.json'): Promise<void> {
    try {
      const response = await fetch(budgetPath);
      this.budget = await response.json();
      
      // Update options from budget
      if (this.budget?.thresholds) {
        this.options.fpsThreshold = this.budget.thresholds.fps?.min ?? 30;
        this.options.maxMemoryGrowthMB = this.budget.thresholds.memoryLeak?.maxHeapGrowthMB ?? 50;
        this.options.maxTTSLatencyMs = this.budget.thresholds.ttsLatency?.max ?? 50;
        this.options.minTokensPerSec = this.budget.thresholds.llmTokensPerSec?.min ?? 40;
      }
    } catch (e) {
      console.warn('[PerformanceMonitor] Could not load budget, using defaults:', e);
    }
  }

  start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.startTime = performance.now();
    
    // Reset samples
    this.fpsSamples = [];
    this.memorySamples = [];
    this.ttsSamples = [];
    this.llmSamples = [];
    this.frameCount = 0;
    
    // Capture baseline memory
    this.captureBaselineMemory();
    
    // Start FPS tracking
    this.startFPSTracking();
    
    // Start memory tracking
    this.startMemoryTracking();
    
    console.log('[PerformanceMonitor] Started monitoring');
  }

  stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    
    // Stop FPS tracking
    if (this.fpsRafId !== null) {
      cancelAnimationFrame(this.fpsRafId);
      this.fpsRafId = null;
    }
    
    // Stop memory tracking
    if (this.memoryInterval) {
      clearInterval(this.memoryInterval);
      this.memoryInterval = null;
    }
    
    console.log('[PerformanceMonitor] Stopped monitoring');
  }

  private captureBaselineMemory(): void {
    if ('memory' in performance && (performance as any).memory) {
      const mem = (performance as any).memory;
      this.baselineMemory = mem.usedJSHeapSize;
    }
  }

  private startFPSTracking(): void {
    this.lastFrameTime = performance.now();
    
    const trackFrame = () => {
      if (!this.isRunning) return;
      
      const now = performance.now();
      const delta = now - this.lastFrameTime;
      this.lastFrameTime = now;
      
      // Calculate instantaneous FPS
      const fps = 1000 / delta;
      this.fpsSamples.push(fps);
      this.frameCount++;
      
      this.fpsRafId = requestAnimationFrame(trackFrame);
    };
    
    this.fpsRafId = requestAnimationFrame(trackFrame);
  }

  private startMemoryTracking(): void {
    if (!('memory' in performance)) {
      console.warn('[PerformanceMonitor] Memory API not available');
      return;
    }
    
    this.memoryInterval = setInterval(() => {
      const mem = (performance as any).memory;
      if (mem) {
        this.memorySamples.push({
          timestamp: performance.now() - this.startTime,
          usedJSHeapSize: mem.usedJSHeapSize,
          totalJSHeapSize: mem.totalJSHeapSize
        });
      }
    }, this.options.memorySampleInterval);
  }

  /**
   * Record a TTS latency measurement
   */
  recordTTSLatency(text: string, latencyMs: number): void {
    if (!this.isRunning) return;
    
    this.ttsSamples.push({
      text: text.substring(0, 100),
      latencyMs,
      textLength: text.length,
      timestamp: performance.now() - this.startTime
    });
  }

  /**
   * Record an LLM generation metric
   */
  recordLLMGeneration(tokensGenerated: number, timeMs: number, agentId: string): void {
    if (!this.isRunning) return;
    
    const tokensPerSec = tokensGenerated / (timeMs / 1000);
    this.llmSamples.push({
      tokensGenerated,
      timeMs,
      tokensPerSec,
      agentId,
      timestamp: performance.now() - this.startTime
    });
  }

  /**
   * Get current FPS
   */
  getCurrentFPS(): number {
    if (this.fpsSamples.length === 0) return 60;
    return this.fpsSamples[this.fpsSamples.length - 1];
  }

  /**
   * Get current memory growth in MB
   */
  getCurrentMemoryGrowthMB(): number {
    if (this.memorySamples.length === 0) return 0;
    const current = this.memorySamples[this.memorySamples.length - 1].usedJSHeapSize;
    return (current - this.baselineMemory) / (1024 * 1024);
  }

  private calculateFPSMetrics(): FPSMetrics {
    const samples = [...this.fpsSamples];
    if (samples.length === 0) {
      return {
        samples: [],
        average: 0,
        min: 0,
        max: 0,
        p95: 0,
        p99: 0,
        drops: 0
      };
    }
    
    const sorted = [...samples].sort((a, b) => a - b);
    const drops = samples.filter(fps => fps < this.options.fpsThreshold).length;
    
    return {
      samples: samples.slice(-1000), // Keep last 1000 for reporting
      average: samples.reduce((a, b) => a + b, 0) / samples.length,
      min: Math.min(...samples),
      max: Math.max(...samples),
      p95: sorted[Math.floor(sorted.length * 0.95)] || sorted[sorted.length - 1],
      p99: sorted[Math.floor(sorted.length * 0.99)] || sorted[sorted.length - 1],
      drops
    };
  }

  private calculateMemoryMetrics(): MemoryMetrics {
    const samples = [...this.memorySamples];
    if (samples.length === 0) {
      return {
        samples: [],
        baseline: this.baselineMemory,
        final: this.baselineMemory,
        growth: 0,
        growthRatePerMinute: 0
      };
    }
    
    const final = samples[samples.length - 1].usedJSHeapSize;
    const growth = final - this.baselineMemory;
    const durationMinutes = (samples[samples.length - 1].timestamp - samples[0].timestamp) / 60000;
    
    return {
      samples: samples.map(s => ({
        timestamp: s.timestamp,
        usedJSHeapSize: s.usedJSHeapSize,
        totalJSHeapSize: s.totalJSHeapSize
      })),
      baseline: this.baselineMemory,
      final,
      growth,
      growthRatePerMinute: durationMinutes > 0 ? growth / durationMinutes : 0
    };
  }

  private calculateTTSMetrics(): TTSMetrics {
    const samples = [...this.ttsSamples];
    if (samples.length === 0) {
      return {
        samples: [],
        average: 0,
        min: 0,
        max: 0,
        p95: 0,
        p99: 0
      };
    }
    
    const latencies = samples.map(s => s.latencyMs).sort((a, b) => a - b);
    
    return {
      samples: samples.slice(-100),
      average: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      min: Math.min(...latencies),
      max: Math.max(...latencies),
      p95: latencies[Math.floor(latencies.length * 0.95)] || latencies[latencies.length - 1],
      p99: latencies[Math.floor(latencies.length * 0.99)] || latencies[latencies.length - 1]
    };
  }

  private calculateLLMMetrics(): LLMMetrics {
    const samples = [...this.llmSamples];
    if (samples.length === 0) {
      return {
        samples: [],
        averageTokensPerSec: 0,
        minTokensPerSec: 0,
        maxTokensPerSec: 0,
        p95TokensPerSec: 0
      };
    }
    
    const rates = samples.map(s => s.tokensPerSec).sort((a, b) => a - b);
    
    return {
      samples: samples.slice(-50),
      averageTokensPerSec: rates.reduce((a, b) => a + b, 0) / rates.length,
      minTokensPerSec: Math.min(...rates),
      maxTokensPerSec: Math.max(...rates),
      p95TokensPerSec: rates[Math.floor(rates.length * 0.05)] || rates[0] // 5th percentile = worst of best 95%
    };
  }

  private detectViolations(
    fps: FPSMetrics,
    memory: MemoryMetrics,
    tts: TTSMetrics,
    llm: LLMMetrics
  ): PerformanceReport['violations'] {
    const violations: PerformanceReport['violations'] = [];
    const growthMB = memory.growth / (1024 * 1024);
    
    // FPS violation
    if (fps.p95 < this.options.fpsThreshold) {
      violations.push({
        metric: 'fps.p95',
        threshold: this.options.fpsThreshold,
        actual: Math.round(fps.p95),
        severity: 'critical'
      });
    } else if (fps.average < this.options.fpsThreshold) {
      violations.push({
        metric: 'fps.average',
        threshold: this.options.fpsThreshold,
        actual: Math.round(fps.average),
        severity: 'warning'
      });
    }
    
    // Memory violation
    if (growthMB > this.options.maxMemoryGrowthMB) {
      violations.push({
        metric: 'memory.growth',
        threshold: this.options.maxMemoryGrowthMB,
        actual: Math.round(growthMB),
        severity: 'critical'
      });
    }
    
    // TTS violation
    if (tts.p95 > this.options.maxTTSLatencyMs) {
      violations.push({
        metric: 'tts.latency.p95',
        threshold: this.options.maxTTSLatencyMs,
        actual: Math.round(tts.p95),
        severity: 'critical'
      });
    }
    
    // LLM violation
    if (llm.p95TokensPerSec < this.options.minTokensPerSec) {
      violations.push({
        metric: 'llm.tokensPerSec.p95',
        threshold: this.options.minTokensPerSec,
        actual: Math.round(llm.p95TokensPerSec * 10) / 10,
        severity: 'critical'
      });
    }
    
    return violations;
  }

  private calculateScore(fps: FPSMetrics, memory: MemoryMetrics, tts: TTSMetrics, llm: LLMMetrics): number {
    let score = 100;
    
    // FPS score (40% weight)
    const fpsScore = Math.min(100, (fps.p95 / 60) * 100);
    score -= (100 - fpsScore) * 0.4;
    
    // Memory score (20% weight)
    const growthMB = memory.growth / (1024 * 1024);
    const memoryScore = Math.max(0, 100 - (growthMB / this.options.maxMemoryGrowthMB) * 100);
    score -= (100 - memoryScore) * 0.2;
    
    // TTS score (20% weight)
    const ttsScore = Math.max(0, 100 - (tts.p95 / this.options.maxTTSLatencyMs) * 100);
    score -= (100 - ttsScore) * 0.2;
    
    // LLM score (20% weight)
    const llmScore = Math.min(100, (llm.p95TokensPerSec / this.options.minTokensPerSec) * 100);
    score -= (100 - llmScore) * 0.2;
    
    return Math.max(0, Math.round(score));
  }

  private getGrade(score: number): PerformanceReport['summary']['grade'] {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  /**
   * Generate a comprehensive performance report
   */
  generateReport(): PerformanceReport {
    const duration = performance.now() - this.startTime;
    
    const fps = this.calculateFPSMetrics();
    const memory = this.calculateMemoryMetrics();
    const tts = this.calculateTTSMetrics();
    const llm = this.calculateLLMMetrics();
    
    const violations = this.detectViolations(fps, memory, tts, llm);
    const score = this.calculateScore(fps, memory, tts, llm);
    const grade = this.getGrade(score);
    
    return {
      timestamp: new Date().toISOString(),
      duration,
      fps,
      memory,
      tts,
      llm,
      violations,
      summary: {
        score,
        grade,
        passed: violations.filter(v => v.severity === 'critical').length === 0
      }
    };
  }

  /**
   * Export report as JSON
   */
  exportJSON(report?: PerformanceReport): string {
    return JSON.stringify(report || this.generateReport(), null, 2);
  }

  /**
   * Export report as Markdown
   */
  exportMarkdown(report?: PerformanceReport): string {
    const r = report || this.generateReport();
    
    let md = `# Performance Report\n\n`;
    md += `**Timestamp:** ${r.timestamp}\n`;
    md += `**Duration:** ${(r.duration / 1000).toFixed(2)}s\n\n`;
    
    md += `## Summary\n\n`;
    md += `- **Score:** ${r.summary.score}/100 (${r.summary.grade})\n`;
    md += `- **Status:** ${r.summary.passed ? '✅ PASSED' : '❌ FAILED'}\n\n`;
    
    if (r.violations.length > 0) {
      md += `### Violations\n\n`;
      md += `| Metric | Threshold | Actual | Severity |\n`;
      md += `|--------|-----------|--------|----------|\n`;
      for (const v of r.violations) {
        md += `| ${v.metric} | ${v.threshold} | ${v.actual} | ${v.severity} |\n`;
      }
      md += `\n`;
    }
    
    md += `## Metrics\n\n`;
    md += `### FPS\n`;
    md += `- Average: ${r.fps.average.toFixed(1)}\n`;
    md += `- P95: ${r.fps.p95.toFixed(1)}\n`;
    md += `- Min: ${r.fps.min.toFixed(1)}\n`;
    md += `- Drops: ${r.fps.drops}\n\n`;
    
    md += `### Memory\n`;
    md += `- Growth: ${(r.memory.growth / (1024 * 1024)).toFixed(2)} MB\n`;
    md += `- Growth Rate: ${(r.memory.growthRatePerMinute / (1024 * 1024)).toFixed(2)} MB/min\n\n`;
    
    md += `### TTS Latency\n`;
    md += `- Average: ${r.tts.average.toFixed(1)}ms\n`;
    md += `- P95: ${r.tts.p95.toFixed(1)}ms\n`;
    md += `- Max: ${r.tts.max.toFixed(1)}ms\n\n`;
    
    md += `### LLM Throughput\n`;
    md += `- Average: ${r.llm.averageTokensPerSec.toFixed(1)} tokens/sec\n`;
    md += `- P95: ${r.llm.p95TokensPerSec.toFixed(1)} tokens/sec\n`;
    md += `- Min: ${r.llm.minTokensPerSec.toFixed(1)} tokens/sec\n`;
    
    return md;
  }
}

// Global instance for easy access
export const globalPerfMonitor = new PerformanceMonitor();
