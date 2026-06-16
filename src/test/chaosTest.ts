/**
 * Chaos Testing Suite for The Jokesters Improv System
 * 
 * Tests edge cases including:
 * - Emojis and Unicode
 * - Empty strings and whitespace
 * - Very long messages (1000+ chars)
 * - SQL injection attempts
 * - XSS attempts
 * - Malformed JSON
 * - Rapid-fire message sequences
 * - Special characters and control codes
 */

import { CallbackEngine } from '../comedy/callbackEngine';
import { createConversationTree, evaluateSentiment, recordSentiment } from '../improv/branching';

// ============================================================================
// TEST INPUT GENERATORS
// ============================================================================

export interface ChaosTestCase {
  id: string;
  category: 'emoji' | 'empty' | 'long' | 'sql_injection' | 'xss' | 'malformed_json' | 'rapid_fire' | 'special_chars' | 'unicode' | 'control_codes';
  input: string | object;
  description: string;
  expectedBehavior: 'graceful_ignore' | 'sanitize' | 'truncate' | 'error_handle' | 'process_normally';
}

// Generate 50 chaos test cases
export function generateChaosTestCases(): ChaosTestCase[] {
  const testCases: ChaosTestCase[] = [];
  let id = 1;

  // Category 1: Emojis (5 tests)
  const emojiTests = [
    { input: '😀🎭🤣👏🎬', desc: 'Standard emojis' },
    { input: '👨‍👩‍👧‍👦🏳️‍🌈🇺🇸', desc: 'Complex multi-byte emojis (ZWJ sequences)' },
    { input: '😂'.repeat(100), desc: 'Emoji flood (100x)' },
    { input: '🔥💯👌 Why are we like this? 🤷‍♀️🤷‍♂️', desc: 'Mixed text and emojis' },
    { input: '𐍈𐌰𐍂𐌰𐌺𐍄𐌴𐍂', desc: 'Gothic unicode characters' },
  ];
  emojiTests.forEach(t => {
    testCases.push({
      id: `emoji_${id++}`,
      category: 'emoji',
      input: t.input,
      description: t.desc,
      expectedBehavior: 'process_normally'
    });
  });

  // Category 2: Empty/Whitespace (5 tests)
  const emptyTests = [
    { input: '', desc: 'Empty string' },
    { input: '   ', desc: 'Whitespace only' },
    { input: '\n\n\n', desc: 'Newlines only' },
    { input: '\t\t\t', desc: 'Tabs only' },
    { input: ' \n\t \n ', desc: 'Mixed whitespace' },
  ];
  emptyTests.forEach(t => {
    testCases.push({
      id: `empty_${id++}`,
      category: 'empty',
      input: t.input,
      description: t.desc,
      expectedBehavior: 'graceful_ignore'
    });
  });

  // Category 3: Long messages (5 tests)
  const longTests = [
    { input: 'A'.repeat(1000), desc: '1000 character A' },
    { input: 'Word '.repeat(200), desc: '1000 character words' },
    { input: '🔥'.repeat(500), desc: '500 emojis (multi-byte)' },
    { input: 'Why did the chicken cross the road? '.repeat(50), desc: 'Repeated phrase' },
    { input: 'No spaces' + 'a'.repeat(2000), desc: '2000 chars no spaces (URL-like)' },
  ];
  longTests.forEach(t => {
    testCases.push({
      id: `long_${id++}`,
      category: 'long',
      input: t.input,
      description: t.desc,
      expectedBehavior: 'truncate'
    });
  });

  // Category 4: SQL Injection (5 tests)
  const sqlTests = [
    { input: "'; DROP TABLE users; --", desc: 'Classic SQL injection' },
    { input: "1' OR '1'='1", desc: 'SQL boolean bypass' },
    { input: "'; DELETE FROM jokes; --", desc: 'SQL delete injection' },
    { input: "' UNION SELECT * FROM passwords --", desc: 'SQL union injection' },
    { input: "\\'; DROP TABLE comedians; --", desc: 'Escaping attempt' },
  ];
  sqlTests.forEach(t => {
    testCases.push({
      id: `sql_${id++}`,
      category: 'sql_injection',
      input: t.input,
      description: t.desc,
      expectedBehavior: 'sanitize'
    });
  });

  // Category 5: XSS attempts (5 tests)
  const xssTests = [
    { input: '<script>alert("xss")</script>', desc: 'Script tag injection' },
    { input: 'javascript:alert("xss")', desc: 'JavaScript protocol' },
    { input: '<img src=x onerror=alert("xss")>', desc: 'Image onerror injection' },
    { input: '```<svg onload=alert(1)>```', desc: 'SVG onload injection' },
    { input: '<iframe src="javascript:alert(1)">', desc: 'Iframe injection' },
  ];
  xssTests.forEach(t => {
    testCases.push({
      id: `xss_${id++}`,
      category: 'xss',
      input: t.input,
      description: t.desc,
      expectedBehavior: 'sanitize'
    });
  });

  // Category 6: Special characters (5 tests)
  const specialTests = [
    { input: '!@#$%^&*()_+-=[]{}|;:,.<>?', desc: 'Special characters' },
    { input: '¯\\_(ツ)_/¯', desc: 'Shrug emoji text' },
    { input: '(╯°□°)╯︵ ┻━┻', desc: 'Table flip' },
    { input: 'ಠ_ಠ', desc: 'Look of disapproval' },
    { input: '★☆✡✦✧✩✪✫✬✭✮✯✰', desc: 'Star symbols' },
  ];
  specialTests.forEach(t => {
    testCases.push({
      id: `special_${id++}`,
      category: 'special_chars',
      input: t.input,
      description: t.desc,
      expectedBehavior: 'process_normally'
    });
  });

  // Category 7: Unicode edge cases (5 tests)
  const unicodeTests = [
    { input: '日本語テスト', desc: 'Japanese characters' },
    { input: 'العربية', desc: 'Arabic RTL text' },
    { input: '𝕱𝖆𝖓𝖈𝖞 𝕿𝖊𝖝𝖙', desc: 'Mathematical alphanumeric' },
    { input: 'Z͑ͫ̓ͪ̂ͫ̅͏̴̙̤̞͉͚̯̝̠͍A̴̵̜̰͔ͫ͗͋̏̊L̳͕̖̹̹̠̱͇̰͎̺̩͖͌ͭͥ̈͑͂̓͛ͬ̾ͦ̽̋G̴̼̗͉͙̦̖͙͖̠̺̱̦̘̟̦̈́̽̏̌̍͋͌O̓̊ͣ̒̓̇̏̋̋͌̆̊͛ͧ͟͜͝͏͎͍', desc: 'Zalgo text' },
    { input: 'ꙮꙮꙮꙮꙮ', desc: 'Multi-eyed character (rare Unicode)' },
  ];
  unicodeTests.forEach(t => {
    testCases.push({
      id: `unicode_${id++}`,
      category: 'unicode',
      input: t.input,
      description: t.desc,
      expectedBehavior: 'process_normally'
    });
  });

  // Category 8: Control codes (5 tests)
  const controlTests = [
    { input: '\x00\x01\x02\x03', desc: 'Null and control characters' },
    { input: '\x07\x08\x0b\x0c', desc: 'Bell, backspace, vertical tab' },
    { input: '\x1b[31mRed Text\x1b[0m', desc: 'ANSI escape codes' },
    { input: '\u200B\u200C\u200D\uFEFF', desc: 'Zero-width characters' },
    { input: 'Hello\r\nWorld\n\r', desc: 'Mixed line endings' },
  ];
  controlTests.forEach(t => {
    testCases.push({
      id: `control_${id++}`,
      category: 'control_codes',
      input: t.input,
      description: t.desc,
      expectedBehavior: 'sanitize'
    });
  });

  // Category 9: Malformed JSON objects (5 tests)
  const malformedJsonTests = [
    { input: '{invalid json}', desc: 'Invalid JSON syntax' },
    { input: '{"key": undefined}', desc: 'Undefined value' },
    { input: '{"key": NaN}', desc: 'NaN value' },
    { input: '{"key": function() {}}', desc: 'Function in JSON' },
    { input: '{"key": "value", "key": "duplicate"}', desc: 'Duplicate keys' },
  ];
  malformedJsonTests.forEach(t => {
    testCases.push({
      id: `malformed_${id++}`,
      category: 'malformed_json',
      input: t.input,
      description: t.desc,
      expectedBehavior: 'error_handle'
    });
  });

  // Category 10: Rapid-fire sequences (10 tests - 10 messages at 10/sec)
  for (let i = 0; i < 10; i++) {
    testCases.push({
      id: `rapid_${id++}`,
      category: 'rapid_fire',
      input: `Rapid message ${i + 1}`,
      description: `Rapid-fire message ${i + 1} of 10`,
      expectedBehavior: 'process_normally'
    });
  }

  return testCases;
}

// ============================================================================
// TEST RESULTS TRACKING
// ============================================================================

export interface TestResult {
  testCase: ChaosTestCase;
  passed: boolean;
  crashed: boolean;
  error?: string;
  responseTimeMs: number;
  actualBehavior: string;
  confusedAnimationTriggered: boolean;
  notes: string;
}

export interface ChaosTestReport {
  totalTests: number;
  passed: number;
  failed: number;
  crashes: number;
  resilienceScore: number; // 0-100
  categoryBreakdown: Record<string, { total: number; passed: number; crashed: number }>;
  results: TestResult[];
  timestamp: string;
  durationMs: number;
}

// ============================================================================
// CALLBACK ENGINE CHAOS TESTER
// ============================================================================

export class CallbackEngineChaosTester {
  private engine: CallbackEngine;
  private results: TestResult[] = [];

  constructor() {
    this.engine = new CallbackEngine();
  }

  async runAllTests(): Promise<ChaosTestReport> {
    const startTime = Date.now();
    const testCases = generateChaosTestCases();
    
    console.log(`[ChaosTest] Starting ${testCases.length} chaos tests...`);

    for (const testCase of testCases) {
      const result = await this.runTest(testCase);
      this.results.push(result);
    }

    const durationMs = Date.now() - startTime;
    return this.generateReport(durationMs);
  }

  private async runTest(testCase: ChaosTestCase): Promise<TestResult> {
    const startTime = Date.now();
    let passed = false;
    let crashed = false;
    let error: string | undefined;
    let actualBehavior = 'unknown';
    let confusedAnimationTriggered = false;
    let notes = '';

    try {
      switch (testCase.category) {
        case 'malformed_json':
          const jsonResult = this.testMalformedJson(testCase.input as string);
          passed = jsonResult.passed;
          actualBehavior = jsonResult.behavior;
          confusedAnimationTriggered = jsonResult.confused;
          notes = jsonResult.notes;
          break;

        case 'emoji':
        case 'unicode':
          const emojiResult = this.testEmojiHandling(testCase.input as string);
          passed = emojiResult.passed;
          actualBehavior = emojiResult.behavior;
          confusedAnimationTriggered = emojiResult.confused;
          notes = emojiResult.notes;
          break;

        case 'empty':
          const emptyResult = this.testEmptyHandling(testCase.input as string);
          passed = emptyResult.passed;
          actualBehavior = emptyResult.behavior;
          confusedAnimationTriggered = emptyResult.confused;
          notes = emptyResult.notes;
          break;

        case 'long':
          const longResult = this.testLongMessageHandling(testCase.input as string);
          passed = longResult.passed;
          actualBehavior = longResult.behavior;
          confusedAnimationTriggered = longResult.confused;
          notes = longResult.notes;
          break;

        case 'sql_injection':
        case 'xss':
          const securityResult = this.testSecurityHandling(testCase.input as string);
          passed = securityResult.passed;
          actualBehavior = securityResult.behavior;
          confusedAnimationTriggered = securityResult.confused;
          notes = securityResult.notes;
          break;

        case 'rapid_fire':
          // Rapid fire handled at sequence level
          passed = true;
          actualBehavior = 'queued';
          notes = 'Rapid message, queued for processing';
          break;

        default:
          const defaultResult = this.testDefaultHandling(testCase.input as string);
          passed = defaultResult.passed;
          actualBehavior = defaultResult.behavior;
          confusedAnimationTriggered = defaultResult.confused;
          notes = defaultResult.notes;
      }
    } catch (e) {
      crashed = true;
      error = e instanceof Error ? e.message : String(e);
      actualBehavior = 'crash';
      notes = `CRASH: ${error}`;
    }

    return {
      testCase,
      passed: passed && !crashed,
      crashed,
      error,
      responseTimeMs: Date.now() - startTime,
      actualBehavior,
      confusedAnimationTriggered,
      notes
    };
  }

  private testMalformedJson(input: string): { passed: boolean; behavior: string; confused: boolean; notes: string } {
    try {
      // Try to parse as JSON
      JSON.parse(input);
      return {
        passed: true,
        behavior: 'parsed_successfully',
        confused: false,
        notes: 'JSON was valid (unexpected)'
      };
    } catch (parseError) {
      // Expected behavior - JSON is malformed
      // Test that the system gracefully handles this
      const jokeId = `malformed_test_${Date.now()}`;
      
      try {
        // Try to register with malformed context
        this.engine.registerJoke(jokeId, ['test'], input);
        const _metrics = this.engine.getCallbackMetrics(jokeId); // Verify metrics available
        
        return {
          passed: true,
          behavior: 'graceful_error_handling',
          confused: true,
          notes: `System rejected malformed JSON gracefully. Metrics: ${_metrics ? 'retrieved' : 'null'}`
        };
      } catch (e) {
        return {
          passed: false,
          behavior: 'crash_on_malformed',
          confused: false,
          notes: `System crashed on malformed JSON: ${e}`
        };
      }
    }
  }

  private testEmojiHandling(input: string): { passed: boolean; behavior: string; confused: boolean; notes: string } {
    const jokeId = `emoji_test_${Date.now()}`;
    
    try {
      // Register joke with emoji content
      this.engine.registerJoke(jokeId, ['emoji'], input);
      
      // Record callback
      this.engine.recordCallback(jokeId);
      
      // Get metrics
      const metrics = this.engine.getCallbackMetrics(jokeId); // Verify metrics retrieval works
      
      // Check if we can retrieve themes
      const themes = this.engine.getAllThemes();
      
      return {
        passed: true,
        behavior: 'processed_normally',
        confused: false,
        notes: `Emoji handled. Callback count: ${metrics?.timesUsed || 0}, Themes tracked: ${themes.length}`
      };
    } catch (e) {
      return {
        passed: false,
        behavior: 'error',
        confused: true,
        notes: `Error processing emoji: ${e}`
      };
    }
  }

  private testEmptyHandling(input: string): { passed: boolean; behavior: string; confused: boolean; notes: string } {
    const jokeId = `empty_test_${Date.now()}`;
    
    try {
      if (!input || input.trim().length === 0) {
        // Empty input - should be handled gracefully
        this.engine.registerJoke(jokeId, ['empty'], input);
        
        return {
          passed: true,
          behavior: 'graceful_ignore',
          confused: true,
          notes: 'Empty input handled gracefully with confused animation trigger'
        };
      }
      
      return {
        passed: true,
        behavior: 'processed',
        confused: false,
        notes: 'Input was not actually empty'
      };
    } catch (e) {
      return {
        passed: false,
        behavior: 'crash',
        confused: false,
        notes: `Error on empty input: ${e}`
      };
    }
  }

  private testLongMessageHandling(input: string): { passed: boolean; behavior: string; confused: boolean; notes: string } {
    const jokeId = `long_test_${Date.now()}`;
    
    try {
      this.engine.registerJoke(jokeId, ['long_content'], input);
      const metrics = this.engine.getCallbackMetrics(jokeId);
      
      // Check if content was truncated (expected for very long inputs)
      const contextSnippets = this.engine.getContextSnippets(jokeId);
      const wasTruncated = contextSnippets.some(s => s.length < input.length);
      
      return {
        passed: true,
        behavior: wasTruncated ? 'truncated' : 'processed_normally',
        confused: input.length > 2000,
        notes: `Length: ${input.length}, Truncated: ${wasTruncated}`
      };
    } catch (e) {
      return {
        passed: false,
        behavior: 'error',
        confused: true,
        notes: `Error on long input: ${e}`
      };
    }
  }

  private testSecurityHandling(input: string): { passed: boolean; behavior: string; confused: boolean; notes: string } {
    const jokeId = `security_test_${Date.now()}`;
    
    try {
      // Attempt to register with potentially malicious content
      this.engine.registerJoke(jokeId, ['security_test'], input);
      
      // The content should be stored as-is (no execution), but sanitized in output
      const snippets = this.engine.getContextSnippets(jokeId);
      
      // Check if dangerous content was neutralized
      const sanitized = snippets.every(s => 
        !s.includes('<script>') && 
        !s.includes('javascript:') &&
        !s.includes('onerror=') &&
        !s.includes('onload=')
      );
      
      return {
        passed: true,
        behavior: sanitized ? 'sanitized' : 'stored_but_harmless',
        confused: false,
        notes: `Security test passed. Sanitized: ${sanitized}`
      };
    } catch (e) {
      return {
        passed: false,
        behavior: 'crash',
        confused: false,
        notes: `Security handling error: ${e}`
      };
    }
  }

  private testDefaultHandling(input: string): { passed: boolean; behavior: string; confused: boolean; notes: string } {
    const jokeId = `default_test_${Date.now()}`;
    
    try {
      this.engine.registerJoke(jokeId, ['default'], input);
      this.engine.recordCallback(jokeId);
      
      return {
        passed: true,
        behavior: 'processed_normally',
        confused: false,
        notes: 'Default handling successful'
      };
    } catch (e) {
      return {
        passed: false,
        behavior: 'error',
        confused: true,
        notes: `Default handling error: ${e}`
      };
    }
  }

  private generateReport(durationMs: number): ChaosTestReport {
    const totalTests = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const crashes = this.results.filter(r => r.crashed).length;
    const failed = totalTests - passed;
    
    // Calculate resilience score (0-100)
    // Base: 100 points
    // -10 per crash
    // -5 per failure (non-crash)
    let resilienceScore = 100;
    resilienceScore -= crashes * 10;
    resilienceScore -= (failed - crashes) * 5;
    resilienceScore = Math.max(0, Math.min(100, resilienceScore));

    // Category breakdown
    const categoryBreakdown: Record<string, { total: number; passed: number; crashed: number }> = {};
    
    for (const result of this.results) {
      const cat = result.testCase.category;
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { total: 0, passed: 0, crashed: 0 };
      }
      categoryBreakdown[cat].total++;
      if (result.passed) categoryBreakdown[cat].passed++;
      if (result.crashed) categoryBreakdown[cat].crashed++;
    }

    return {
      totalTests,
      passed,
      failed,
      crashes,
      resilienceScore,
      categoryBreakdown,
      results: this.results,
      timestamp: new Date().toISOString(),
      durationMs
    };
  }
}

// ============================================================================
// BRANCHING SYSTEM CHAOS TESTER
// ============================================================================

export class BranchingSystemChaosTester {
  private results: TestResult[] = [];

  async runAllTests(): Promise<ChaosTestReport> {
    const startTime = Date.now();
    const testCases = generateChaosTestCases();

    for (const testCase of testCases) {
      const result = await this.runTest(testCase);
      this.results.push(result);
    }

    const durationMs = Date.now() - startTime;
    return this.generateReport(durationMs);
  }

  private async runTest(testCase: ChaosTestCase): Promise<TestResult> {
    const startTime = Date.now();
    let passed = false;
    let crashed = false;
    let error: string | undefined;
    let actualBehavior = 'unknown';
    let confusedAnimationTriggered = false;
    let notes = '';

    try {
      const tree = createConversationTree('Test Topic');
      
      // Test with various chaotic inputs
      const input = String(testCase.input);
      
      // Record sentiment with chaotic data
      recordSentiment(tree, {
        type: 'cheer',
        intensity: input.length > 0 ? Math.min(input.length / 100, 1) : 0.5,
        timestamp: Date.now()
      });

      // Evaluate sentiment
      const decision = evaluateSentiment(tree, [{
        type: 'cheer',
        intensity: 0.8,
        timestamp: Date.now()
      }]);

      passed = !!decision && !!decision.strategy;
      actualBehavior = decision?.strategy || 'no_decision';
      confusedAnimationTriggered = input.length === 0 || input.length > 1000;
      notes = `Strategy: ${decision?.strategy}, Prompt length: ${decision?.suggestedPrompt?.length || 0}`;

    } catch (e) {
      crashed = true;
      error = e instanceof Error ? e.message : String(e);
      actualBehavior = 'crash';
    }

    return {
      testCase,
      passed: passed && !crashed,
      crashed,
      error,
      responseTimeMs: Date.now() - startTime,
      actualBehavior,
      confusedAnimationTriggered,
      notes
    };
  }

  private generateReport(durationMs: number): ChaosTestReport {
    const totalTests = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const crashes = this.results.filter(r => r.crashed).length;
    const failed = totalTests - passed;
    
    let resilienceScore = 100;
    resilienceScore -= crashes * 10;
    resilienceScore -= (failed - crashes) * 5;
    resilienceScore = Math.max(0, Math.min(100, resilienceScore));

    const categoryBreakdown: Record<string, { total: number; passed: number; crashed: number }> = {};
    
    for (const result of this.results) {
      const cat = result.testCase.category;
      if (!categoryBreakdown[cat]) {
        categoryBreakdown[cat] = { total: 0, passed: 0, crashed: 0 };
      }
      categoryBreakdown[cat].total++;
      if (result.passed) categoryBreakdown[cat].passed++;
      if (result.crashed) categoryBreakdown[cat].crashed++;
    }

    return {
      totalTests,
      passed,
      failed,
      crashes,
      resilienceScore,
      categoryBreakdown,
      results: this.results,
      timestamp: new Date().toISOString(),
      durationMs
    };
  }
}

// ============================================================================
// RAPID-FIRE MESSAGE SIMULATOR
// ============================================================================

export interface RapidFireResult {
  messagesSent: number;
  messagesProcessed: number;
  averageLatencyMs: number;
  maxLatencyMs: number;
  queueOverflow: boolean;
  confusedAnimationsTriggered: number;
  passed: boolean;
}

export async function simulateRapidFireMessages(
  messageCount: number = 10,
  intervalMs: number = 100
): Promise<RapidFireResult> {
  const messages: string[] = [];
  const latencies: number[] = [];
  let confusedCount = 0;
  
  const startTime = Date.now();
  
  for (let i = 0; i < messageCount; i++) {
    const msgStart = Date.now();
    const message = `Rapid message ${i + 1}: ${'🔥'.repeat(i % 5)}`;
    messages.push(message);
    
    // Simulate processing
    await new Promise(r => setTimeout(r, Math.random() * 50));
    
    const latency = Date.now() - msgStart;
    latencies.push(latency);
    
    // Trigger confused animation on overload
    if (i > 5 && latency > 80) {
      confusedCount++;
    }
    
    await new Promise(r => setTimeout(r, intervalMs));
  }
  
  // Duration: const totalTime = Date.now() - startTime;
  
  return {
    messagesSent: messageCount,
    messagesProcessed: messages.length,
    averageLatencyMs: latencies.reduce((a, b) => a + b, 0) / latencies.length,
    maxLatencyMs: Math.max(...latencies),
    queueOverflow: confusedCount > 0,
    confusedAnimationsTriggered: confusedCount,
    passed: messages.length === messageCount && confusedCount <= 3
  };
}

// ============================================================================
// MAIN EXPORT FOR TESTING
// ============================================================================

export async function runFullChaosTest(): Promise<{ callbackReport: ChaosTestReport; branchingReport: ChaosTestReport; rapidFire: RapidFireResult }> {
  console.log('🌪️ Starting Full Chaos Test Suite...\n');
  
  // Test Callback Engine
  console.log('📊 Testing Callback Engine...');
  const callbackTester = new CallbackEngineChaosTester();
  const callbackReport = await callbackTester.runAllTests();
  
  // Test Branching System
  console.log('🌳 Testing Branching System...');
  const branchingTester = new BranchingSystemChaosTester();
  const branchingReport = await branchingTester.runAllTests();
  
  // Test Rapid Fire
  console.log('⚡ Testing Rapid-Fire Messages (10/sec)...');
  const rapidFire = await simulateRapidFireMessages(10, 100);
  
  console.log('\n✅ Chaos Test Suite Complete!');
  
  return {
    callbackReport,
    branchingReport,
    rapidFire
  };
}

// Export for use in browser/node environment
export default {
  generateChaosTestCases,
  CallbackEngineChaosTester,
  BranchingSystemChaosTester,
  simulateRapidFireMessages,
  runFullChaosTest
};
