#!/usr/bin/env node
/**
 * CI Performance Test Runner
 * 
 * Runs performance benchmarks in CI environment and exits with error code
 * if any thresholds are exceeded.
 * 
 * Usage:
 *   npx tsx tests/perf/ci-runner.ts [options]
 * 
 * Options:
 *   --duration=quick|ci|full    Test duration (default: ci)
 *   --format=json|console       Output format (default: json in CI, console locally)
 *   --output=PATH              Output file path
 *   --thresholds=PATH          Custom perf-budget.json path
 *   --skip-fps                 Skip FPS benchmark
 *   --skip-memory              Skip memory leak test
 *   --skip-tts                 Skip TTS latency benchmark
 *   --skip-llm                 Skip LLM throughput benchmark
 */

import './setup-env'; // Mock browser environment
import { runAllBenchmarks, isCI } from './index';
import type { BenchmarkSuiteResult } from './index';
import * as fs from 'fs';
import * as path from 'path';

interface CLIOptions {
  duration: 'quick' | 'ci' | 'full';
  format: 'json' | 'console';
  output?: string;
  thresholds?: string;
  include: Array<'fps' | 'memory' | 'tts' | 'llm'>;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  // Default to only memory test in Node environment (others require browser)
  const defaultInclude: Array<'fps' | 'memory' | 'tts' | 'llm'> =
    typeof window === 'undefined' ? ['memory'] : ['fps', 'memory', 'tts', 'llm'];

  const options: CLIOptions = {
    duration: 'ci',
    format: isCI() ? 'json' : 'console',
    include: defaultInclude
  };

  for (const arg of args) {
    if (arg.startsWith('--duration=')) {
      const value = arg.split('=')[1] as CLIOptions['duration'];
      if (['quick', 'ci', 'full'].includes(value)) {
        options.duration = value;
      }
    } else if (arg.startsWith('--format=')) {
      const value = arg.split('=')[1] as CLIOptions['format'];
      if (['json', 'console'].includes(value)) {
        options.format = value;
      }
    } else if (arg.startsWith('--output=')) {
      options.output = arg.split('=')[1];
    } else if (arg.startsWith('--thresholds=')) {
      options.thresholds = arg.split('=')[1];
    } else if (arg === '--skip-fps') {
      options.include = options.include.filter(i => i !== 'fps');
    } else if (arg === '--skip-memory') {
      options.include = options.include.filter(i => i !== 'memory');
    } else if (arg === '--skip-tts') {
      options.include = options.include.filter(i => i !== 'tts');
    } else if (arg === '--skip-llm') {
      options.include = options.include.filter(i => i !== 'llm');
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
The Jokesters - Performance Test CI Runner

Usage: npx tsx tests/perf/ci-runner.ts [options]

Options:
  --duration=quick|ci|full    Test duration (default: ci)
  --format=json|console       Output format (default: json in CI)
  --output=PATH              Output file path for results
  --thresholds=PATH          Path to custom perf-budget.json
  --skip-fps                 Skip FPS benchmark
  --skip-memory              Skip memory leak test
  --skip-tts                 Skip TTS latency benchmark
  --skip-llm                 Skip LLM throughput benchmark
  --help, -h                 Show this help

Exit Codes:
  0  All benchmarks passed
  1  One or more benchmarks failed
  2  Execution error
`);
}

function loadThresholds(thresholdsPath: string): any {
  try {
    const content = fs.readFileSync(thresholdsPath, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    console.error(`Failed to load thresholds from ${thresholdsPath}:`, e);
    return null;
  }
}

async function main(): Promise<void> {
  const options = parseArgs();
  
  console.log('The Jokesters - Performance Test CI Runner');
  console.log('=========================================\n');
  
  console.log(`Duration: ${options.duration}`);
  console.log(`Format: ${options.format}`);
  console.log(`Include: ${options.include.join(', ')}`);
  if (options.output) console.log(`Output: ${options.output}`);
  if (options.thresholds) console.log(`Thresholds: ${options.thresholds}`);
  console.log('');

  // Load custom thresholds if provided
  if (options.thresholds) {
    const thresholds = loadThresholds(options.thresholds);
    if (thresholds) {
      console.log(`Loaded thresholds from ${options.thresholds}`);
      // Store for benchmarks to use
      process.env.PERF_BUDGET_PATH = path.resolve(options.thresholds);
    }
  }

  let result: BenchmarkSuiteResult;
  
  try {
    result = await runAllBenchmarks({
      duration: options.duration,
      output: options.format,
      outputPath: options.output,
      failOnViolation: true,
      include: options.include
    });
  } catch (e) {
    console.error('\n❌ Fatal error running benchmarks:', e);
    process.exit(2);
  }

  // Output summary for CI
  if (isCI()) {
    console.log('\n::group::Performance Test Summary');
    console.log(`passed=${result.passed}`);
    console.log(`duration=${result.duration}`);
    if (result.fps) {
      console.log(`fps.p95=${result.fps.p95FPS.toFixed(2)}`);
      console.log(`fps.passed=${result.fps.passed}`);
    }
    if (result.memory) {
      console.log(`memory.growth=${result.memory.growthMB.toFixed(2)}`);
      console.log(`memory.passed=${result.memory.passed}`);
    }
    if (result.tts) {
      console.log(`tts.p95=${result.tts.p95Latency.toFixed(2)}`);
      console.log(`tts.passed=${result.tts.passed}`);
    }
    if (result.llm) {
      console.log(`llm.p95=${result.llm.p95TokensPerSec.toFixed(2)}`);
      console.log(`llm.passed=${result.llm.passed}`);
    }
    console.log('::endgroup::');

    // GitHub Actions annotations
    for (const violation of result.violations) {
      console.log(`::error::Performance violation: ${violation.test}.${violation.metric} - expected ${violation.expected}, got ${violation.actual}`);
    }
  }

  // Exit with appropriate code
  if (result.passed) {
    console.log('\n✅ All performance benchmarks passed!');
    process.exit(0);
  } else {
    console.log('\n❌ One or more performance benchmarks failed!');
    console.log(`   Violations: ${result.violations.length}`);
    process.exit(1);
  }
}

main();
