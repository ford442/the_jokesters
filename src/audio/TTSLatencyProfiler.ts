/**
 * TTS Latency Profiler
 * Measures text-to-audio-buffer time with high precision
 */

export interface LatencyMetrics {
    text: string;
    totalLatencyMs: number;
    textProcessingMs: number;
    durationPredictionMs: number;
    textEncodingMs: number;
    diffusionMs: number;
    vocoderMs: number;
    timestamp: number;
}

export class TTSLatencyProfiler {
    private metrics: LatencyMetrics[] = [];
    private isEnabled = true;
    private maxSamples = 100;

    enable() {
        this.isEnabled = true;
    }

    disable() {
        this.isEnabled = false;
    }

    /**
     * Profile a TTS operation using performance.now()
     */
    async profile<T>(
        operation: () => Promise<T>,
        text: string,
        phaseTimings: Partial<LatencyMetrics>
    ): Promise<T> {
        if (!this.isEnabled) {
            return operation();
        }

        const startTime = performance.now();
        const result = await operation();
        const totalLatency = performance.now() - startTime;

        const metrics: LatencyMetrics = {
            text: text.substring(0, 50), // Truncate for storage
            totalLatencyMs: totalLatency,
            textProcessingMs: phaseTimings.textProcessingMs || 0,
            durationPredictionMs: phaseTimings.durationPredictionMs || 0,
            textEncodingMs: phaseTimings.textEncodingMs || 0,
            diffusionMs: phaseTimings.diffusionMs || 0,
            vocoderMs: phaseTimings.vocoderMs || 0,
            timestamp: Date.now()
        };

        this.metrics.push(metrics);
        
        // Keep only recent samples
        if (this.metrics.length > this.maxSamples) {
            this.metrics = this.metrics.slice(-this.maxSamples);
        }

        return result;
    }

    /**
     * Get average latency statistics
     */
    getStats() {
        if (this.metrics.length === 0) {
            return null;
        }

        const avg = (key: keyof LatencyMetrics) => 
            this.metrics.reduce((sum, m) => sum + (m[key] as number), 0) / this.metrics.length;

        return {
            sampleCount: this.metrics.length,
            avgTotalLatencyMs: avg('totalLatencyMs'),
            avgTextProcessingMs: avg('textProcessingMs'),
            avgDurationPredictionMs: avg('durationPredictionMs'),
            avgTextEncodingMs: avg('textEncodingMs'),
            avgDiffusionMs: avg('diffusionMs'),
            avgVocoderMs: avg('vocoderMs'),
            p95TotalLatencyMs: this.getPercentile('totalLatencyMs', 0.95),
            p99TotalLatencyMs: this.getPercentile('totalLatencyMs', 0.99)
        };
    }

    private getPercentile(key: keyof LatencyMetrics, percentile: number): number {
        const sorted = [...this.metrics]
            .map(m => m[key] as number)
            .sort((a, b) => a - b);
        const index = Math.ceil(sorted.length * percentile) - 1;
        return sorted[Math.max(0, index)];
    }

    /**
     * Export metrics for reporting
     */
    exportMetrics(): LatencyMetrics[] {
        return [...this.metrics];
    }

    clear() {
        this.metrics = [];
    }
}

// Global profiler instance
export const ttsProfiler = new TTSLatencyProfiler();
