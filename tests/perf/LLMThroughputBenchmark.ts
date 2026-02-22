/**
 * LLM Throughput Benchmark
 * 
 * Measures LLM token generation throughput (tokens/sec).
 * Target: >40 tokens/sec decode speed
 */

import { GroupChatManager } from '../../src/GroupChatManager';
import { agents } from '../../src/config/agents';
import { PerformanceMonitor } from './PerformanceMonitor';

export interface LLMThroughputOptions {
  iterations?: number;
  warmupIterations?: number;
  minTokensPerSec?: number;
  maxTokens?: number;
  modelId?: string;
}

export interface LLMThroughputResult {
  passed: boolean;
  averageTokensPerSec: number;
  p95TokensPerSec: number;
  minTokensPerSec: number;
  maxTokensPerSec: number;
  iterations: number;
  totalTokens: number;
}

export class LLMThroughputBenchmark {
  private manager: GroupChatManager | null = null;
  private monitor: PerformanceMonitor;
  private options: Required<LLMThroughputOptions>;

  // Test prompts of varying complexity
  private testPrompts = [
    "Tell me a short joke about programming.",
    "Explain quantum computing in simple terms.",
    "What is the meaning of life, the universe, and everything?",
    "Write a haiku about artificial intelligence.",
    "Describe the process of photosynthesis.",
    "Why did the chicken cross the road?",
    "Summarize the theory of relativity.",
    "What's your opinion on pineapple on pizza?",
    "Explain blockchain technology.",
    "Tell me about the history of comedy."
  ];

  constructor(options: LLMThroughputOptions = {}) {
    this.options = {
      iterations: 20,
      warmupIterations: 3,
      minTokensPerSec: 40,
      maxTokens: 64,
      modelId: 'Hermes-3-Llama-3.2-3B-q4f32_1-MLC',
      ...options
    };
    this.monitor = new PerformanceMonitor({
      minTokensPerSec: this.options.minTokensPerSec
    });
  }

  /**
   * Initialize the LLM
   */
  async init(onProgress?: (progress: any) => void): Promise<void> {
    console.log('[LLMThroughputBenchmark] Initializing GroupChatManager...');
    console.log(`[LLMThroughputBenchmark] Model: ${this.options.modelId}`);
    
    this.manager = new GroupChatManager(agents);
    
    await this.manager.initialize(this.options.modelId, (progress) => {
      console.log(`[LLMThroughputBenchmark] Loading: ${(progress.progress * 100).toFixed(1)}%`);
      onProgress?.(progress);
    });
    
    console.log('[LLMThroughputBenchmark] Manager ready');
  }

  /**
   * Run the LLM throughput benchmark
   */
  async run(): Promise<LLMThroughputResult> {
    if (!this.manager) {
      throw new Error('LLMThroughputBenchmark not initialized. Call init() first.');
    }

    console.log(`[LLMThroughputBenchmark] Running ${this.options.iterations} iterations...`);
    console.log(`[LLMThroughputBenchmark] Target: >${this.options.minTokensPerSec} tokens/sec`);
    console.log(`[LLMThroughputBenchmark] Max tokens: ${this.options.maxTokens}`);

    // Warmup phase
    console.log(`[LLMThroughputBenchmark] Warming up (${this.options.warmupIterations} iterations)...`);
    for (let i = 0; i < this.options.warmupIterations; i++) {
      const prompt = this.testPrompts[i % this.testPrompts.length];
      try {
        await this.manager.chat(prompt, undefined, { 
          maxTokens: this.options.maxTokens 
        });
      } catch (e) {
        console.warn('[LLMThroughputBenchmark] Warmup failed:', e);
      }
    }

    // Start monitoring
    this.monitor.start();

    // Benchmark phase
    console.log('[LLMThroughputBenchmark] Running benchmark...');
    let totalTokens = 0;
    
    for (let i = 0; i < this.options.iterations; i++) {
      const prompt = this.testPrompts[i % this.testPrompts.length];
      
      try {
        const startTime = performance.now();
        let tokenCount = 0;
        
        await this.manager.chat(prompt, () => {
          tokenCount++;
        }, { 
          maxTokens: this.options.maxTokens,
          enablePerfTracking: true
        });
        
        const timeMs = performance.now() - startTime;
        const tokensPerSec = tokenCount / (timeMs / 1000);
        
        const agentId = this.manager.getCurrentAgent().id;
        this.monitor.recordLLMGeneration(tokenCount, timeMs, agentId);
        totalTokens += tokenCount;
        
      } catch (e) {
        console.warn(`[LLMThroughputBenchmark] Iteration ${i} failed:`, e);
      }

      // Progress log every 5 iterations
      if ((i + 1) % 5 === 0) {
        console.log(`[LLMThroughputBenchmark] Progress: ${i + 1}/${this.options.iterations}`);
      }
    }

    this.monitor.stop();

    // Generate report
    const report = this.monitor.generateReport();
    const validSamples = report.llm.samples.filter(s => s.tokensPerSec > 0);
    
    if (validSamples.length === 0) {
      throw new Error('No valid LLM measurements collected');
    }

    const result: LLMThroughputResult = {
      passed: report.llm.p95TokensPerSec >= this.options.minTokensPerSec,
      averageTokensPerSec: report.llm.averageTokensPerSec,
      p95TokensPerSec: report.llm.p95TokensPerSec,
      minTokensPerSec: report.llm.minTokensPerSec,
      maxTokensPerSec: report.llm.maxTokensPerSec,
      iterations: validSamples.length,
      totalTokens
    };

    console.log('[LLMThroughputBenchmark] Complete:');
    console.log(`  Average: ${result.averageTokensPerSec.toFixed(2)} tokens/sec`);
    console.log(`  P95: ${result.p95TokensPerSec.toFixed(2)} tokens/sec`);
    console.log(`  Min/Max: ${result.minTokensPerSec.toFixed(2)} / ${result.maxTokensPerSec.toFixed(2)} tokens/sec`);
    console.log(`  Total Tokens: ${result.totalTokens}`);
    console.log(`  Passed: ${result.passed}`);

    return result;
  }

  /**
   * Run extended test with multiple models
   */
  async runMultiModel(models: string[]): Promise<Record<string, LLMThroughputResult>> {
    const results: Record<string, LLMThroughputResult> = {};
    
    for (const modelId of models) {
      console.log(`\n[LLMThroughputBenchmark] Testing model: ${modelId}`);
      
      // Dispose old manager
      if (this.manager) {
        await this.manager.terminate();
        this.manager = null;
      }
      
      // Update options
      this.options.modelId = modelId;
      
      // Re-initialize with new model
      await this.init();
      
      // Run benchmark
      results[modelId] = await this.run();
    }
    
    return results;
  }

  /**
   * Compare performance across different agent types
   */
  async runPerAgentComparison(): Promise<Record<string, {
    averageTokensPerSec: number;
    iterations: number;
  }>> {
    if (!this.manager) {
      throw new Error('LLMThroughputBenchmark not initialized');
    }

    const results: Record<string, { averageTokensPerSec: number; iterations: number }> = {};
    const agentIds = this.manager.getAgents().map(a => a.id);
    
    for (const agentId of agentIds) {
      const samples: number[] = [];
      
      for (let i = 0; i < 5; i++) {
        const prompt = this.testPrompts[i % this.testPrompts.length];
        
        try {
          const startTime = performance.now();
          let tokenCount = 0;
          
          await this.manager.chatForAgent(agentId, prompt, () => {
            tokenCount++;
          }, { maxTokens: this.options.maxTokens });
          
          const timeMs = performance.now() - startTime;
          const tokensPerSec = tokenCount / (timeMs / 1000);
          samples.push(tokensPerSec);
          
        } catch (e) {
          console.warn(`[LLMThroughputBenchmark] Agent ${agentId} iteration ${i} failed:`, e);
        }
      }
      
      results[agentId] = {
        averageTokensPerSec: samples.length > 0 
          ? samples.reduce((a, b) => a + b, 0) / samples.length 
          : 0,
        iterations: samples.length
      };
    }
    
    return results;
  }

  /**
   * Cleanup resources
   */
  async dispose(): Promise<void> {
    this.monitor.stop();
    
    if (this.manager) {
      await this.manager.terminate();
      this.manager = null;
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Run LLM throughput benchmark
 */
export async function runLLMThroughputBenchmark(
  options?: LLMThroughputOptions,
  onProgress?: (progress: any) => void
): Promise<LLMThroughputResult> {
  const benchmark = new LLMThroughputBenchmark(options);
  
  try {
    await benchmark.init(onProgress);
    return await benchmark.run();
  } finally {
    await benchmark.dispose();
  }
}

/**
 * Quick LLM throughput check
 */
export async function quickLLMThroughputCheck(
  onProgress?: (progress: any) => void
): Promise<{ 
  tokensPerSec: number; 
  passed: boolean 
}> {
  const benchmark = new LLMThroughputBenchmark({ 
    iterations: 5, 
    warmupIterations: 1 
  });
  
  try {
    await benchmark.init(onProgress);
    const result = await benchmark.run();
    return { tokensPerSec: result.p95TokensPerSec, passed: result.passed };
  } finally {
    await benchmark.dispose();
  }
}
