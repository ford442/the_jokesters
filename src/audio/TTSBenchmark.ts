/**
 * TTS Benchmark Utility
 * Measures and compares TTS latency before and after optimization
 */

import { OptimizedAudioEngine } from './OptimizedAudioEngine';

export interface BenchmarkResult {
    text: string;
    textLength: number;
    optimizedLatencyMs: number;
    legacyLatencyMs?: number;
    improvement?: number;
    cached: boolean;
}

export interface BenchmarkSuite {
    name: string;
    results: BenchmarkResult[];
    avgOptimizedLatency: number;
    avgLegacyLatency?: number;
    avgImprovement?: number;
    targetMet: boolean;
}

export class TTSBenchmark {
    private optimizedEngine: OptimizedAudioEngine;
    // Note: Legacy engine comparison not implemented - focus on optimized metrics
    // private legacyEngine?: AudioEngine;
    private results: BenchmarkResult[] = [];

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
        
        // Repeated phrases (should hit cache)
        "Hello!",
        "Yes.",
        "Hello!",
        "The quick brown fox jumps over the lazy dog."
    ];

    constructor() {
        this.optimizedEngine = new OptimizedAudioEngine();
    }

    /**
     * Initialize engines for benchmarking
     */
    async init(modelPath: string = './tts/onnx'): Promise<void> {
        console.log('[TTSBenchmark] Initializing optimized engine...');
        await this.optimizedEngine.init(modelPath);
        
        // Warm up - run a few synthesis operations to prime caches
        console.log('[TTSBenchmark] Warming up...');
        for (let i = 0; i < 3; i++) {
            await this.optimizedEngine.synthesize('Warm up phrase.', 'default', { steps: 5 });
        }
    }

    /**
     * Run full benchmark suite
     */
    async runBenchmark(iterations: number = 3): Promise<BenchmarkSuite> {
        console.log(`[TTSBenchmark] Running benchmark with ${iterations} iterations...`);
        
        this.results = [];

        for (let iter = 0; iter < iterations; iter++) {
            console.log(`[TTSBenchmark] Iteration ${iter + 1}/${iterations}`);
            
            for (const text of this.testPhrases) {
                const result = await this.benchmarkPhrase(text);
                this.results.push(result);
            }
        }

        return this.generateReport();
    }

    /**
     * Benchmark a single phrase
     */
    private async benchmarkPhrase(text: string): Promise<BenchmarkResult> {
        const startTime = performance.now();
        
        try {
            await this.optimizedEngine.synthesize(text, 'default', { steps: 10 });
            const latency = performance.now() - startTime;

            return {
                text: text.substring(0, 50),
                textLength: text.length,
                optimizedLatencyMs: latency,
                cached: latency < 100 // Rough heuristic
            };
        } catch (e) {
            console.error('[TTSBenchmark] Synthesis failed:', e);
            return {
                text: text.substring(0, 50),
                textLength: text.length,
                optimizedLatencyMs: -1,
                cached: false
            };
        }
    }

    /**
     * Run stress test with rapid-fire requests
     */
    async runStressTest(durationMs: number = 5000): Promise<{
        totalRequests: number;
        successfulRequests: number;
        avgLatency: number;
        p95Latency: number;
        maxLatency: number;
    }> {
        console.log(`[TTSBenchmark] Running stress test for ${durationMs}ms...`);
        
        const latencies: number[] = [];
        let totalRequests = 0;
        let successfulRequests = 0;
        const startTime = performance.now();

        while (performance.now() - startTime < durationMs) {
            const text = this.testPhrases[totalRequests % this.testPhrases.length];
            totalRequests++;

            try {
                const reqStart = performance.now();
                await this.optimizedEngine.synthesize(text, 'default', { steps: 5 });
                const latency = performance.now() - reqStart;
                
                if (latency > 0) {
                    latencies.push(latency);
                    successfulRequests++;
                }
            } catch (e) {
                // Count as failure
            }
        }

        const sorted = [...latencies].sort((a, b) => a - b);
        
        return {
            totalRequests,
            successfulRequests,
            avgLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
            p95Latency: sorted[Math.floor(sorted.length * 0.95)] || 0,
            maxLatency: sorted[sorted.length - 1] || 0
        };
    }

    /**
     * Measure cache effectiveness
     */
    async measureCacheEffectiveness(): Promise<{
        firstRunLatency: number;
        cachedRunLatency: number;
        improvement: number;
    }> {
        const testPhrase = "This is a test phrase for cache measurement.";
        
        // First run - should miss cache
        const start1 = performance.now();
        await this.optimizedEngine.synthesize(testPhrase, 'default', { steps: 10 });
        const firstRunLatency = performance.now() - start1;

        // Second run - should hit cache
        const start2 = performance.now();
        await this.optimizedEngine.synthesize(testPhrase, 'default', { steps: 10 });
        const cachedRunLatency = performance.now() - start2;

        return {
            firstRunLatency,
            cachedRunLatency,
            improvement: firstRunLatency / Math.max(cachedRunLatency, 1)
        };
    }

    /**
     * Generate benchmark report
     */
    private generateReport(): BenchmarkSuite {
        const validResults = this.results.filter(r => r.optimizedLatencyMs > 0);
        
        const avgOptimized = validResults.reduce((sum, r) => sum + r.optimizedLatencyMs, 0) 
            / validResults.length;

        // Count how many met the <50ms target
        const targetMet = validResults.filter(r => r.optimizedLatencyMs < 50).length;
        const targetPercentage = (targetMet / validResults.length) * 100;

        return {
            name: 'TTS Latency Benchmark',
            results: this.results,
            avgOptimizedLatency: avgOptimized,
            targetMet: targetPercentage >= 80 // 80% of requests under 50ms
        };
    }

    /**
     * Export detailed results
     */
    exportResults(): string {
        const report = this.generateReport();
        
        let output = `# TTS Latency Benchmark Results\n\n`;
        output += `Date: ${new Date().toISOString()}\n\n`;
        output += `## Summary\n\n`;
        output += `- Average Latency: ${report.avgOptimizedLatency.toFixed(2)}ms\n`;
        output += `- Target (<50ms): ${report.targetMet ? 'MET ✓' : 'NOT MET ✗'}\n\n`;
        
        output += `## Detailed Results\n\n`;
        output += `| Text | Length | Latency (ms) | Cached |\n`;
        output += `|------|--------|--------------|--------|\n`;
        
        for (const r of this.results) {
            output += `| ${r.text.replace(/\|/g, '\\|')} | ${r.textLength} | ${r.optimizedLatencyMs.toFixed(1)} | ${r.cached ? 'Yes' : 'No'} |\n`;
        }

        return output;
    }

    /**
     * Cleanup
     */
    terminate(): void {
        this.optimizedEngine.terminate();
    }
}
