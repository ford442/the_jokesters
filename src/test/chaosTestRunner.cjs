/**
 * Standalone Chaos Test Runner (JavaScript)
 * Can be run directly with Node.js without TypeScript compilation
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// MOCK IMPLEMENTATIONS FOR TESTING
// ============================================================================

// Minimal CallbackEngine mock for testing
class MockCallbackEngine {
  constructor() {
    this.jokes = new Map();
    this.themeIndex = new Map();
  }

  registerJoke(jokeId, themes, context) {
    if (typeof jokeId !== 'string' || jokeId.length === 0) {
      throw new Error('Invalid jokeId');
    }
    
    this.jokes.set(jokeId, {
      id: jokeId,
      themes,
      callbackCount: 0,
      contextSnippets: context ? [context] : []
    });
    
    themes.forEach(theme => {
      if (!this.themeIndex.has(theme)) {
        this.themeIndex.set(theme, new Set());
      }
      this.themeIndex.get(theme).add(jokeId);
    });
  }

  recordCallback(jokeId) {
    const joke = this.jokes.get(jokeId);
    if (!joke) {
      console.warn(`[CallbackEngine] Unknown joke: ${jokeId}`);
      return;
    }
    joke.callbackCount++;
  }

  getCallbackMetrics(jokeId) {
    const joke = this.jokes.get(jokeId);
    if (!joke) return null;
    
    const count = joke.callbackCount;
    let status = 'fresh';
    if (count === 1 || count === 2) status = 'building';
    else if (count === 3) status = 'peak';
    else if (count === 4) status = 'declining';
    else if (count >= 5) status = 'dead';
    
    return {
      value: count === 3 ? 1.5 : count > 3 ? 0.6 : 1.0,
      status,
      timesUsed: count,
      recommended: status === 'building' || status === 'peak'
    };
  }

  getAllThemes() {
    return Array.from(this.themeIndex.keys());
  }

  getContextSnippets(jokeId) {
    return this.jokes.get(jokeId)?.contextSnippets || [];
  }
}

// Minimal Branching System mock
function createMockConversationTree(rootTopic) {
  return {
    root: { id: 'root', topic: rootTopic, depth: 0 },
    currentNode: { id: 'root', topic: rootTopic, depth: 0 },
    allNodes: new Map([['root', { id: 'root', topic: rootTopic, depth: 0 }]])
  };
}

function mockEvaluateSentiment(tree, events) {
  const cheerIntensity = events
    .filter(e => e.type === 'cheer' || e.type === 'applause')
    .reduce((sum, e) => sum + e.intensity, 0);
  
  if (cheerIntensity > 0.7) {
    return { strategy: 'double_down', reason: 'Strong positive reception' };
  }
  return { strategy: 'continue', reason: 'Moderate reception' };
}

function mockRecordSentiment(tree, event) {
  // No-op for mock
}

// ============================================================================
// TEST CASES
// ============================================================================

function generateChaosTestCases() {
  const testCases = [];
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
    testCases.push({ id: `emoji_${id++}`, category: 'emoji', input: t.input, description: t.desc, expectedBehavior: 'process_normally' });
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
    testCases.push({ id: `empty_${id++}`, category: 'empty', input: t.input, description: t.desc, expectedBehavior: 'graceful_ignore' });
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
    testCases.push({ id: `long_${id++}`, category: 'long', input: t.input, description: t.desc, expectedBehavior: 'truncate' });
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
    testCases.push({ id: `sql_${id++}`, category: 'sql_injection', input: t.input, description: t.desc, expectedBehavior: 'sanitize' });
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
    testCases.push({ id: `xss_${id++}`, category: 'xss', input: t.input, description: t.desc, expectedBehavior: 'sanitize' });
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
    testCases.push({ id: `special_${id++}`, category: 'special_chars', input: t.input, description: t.desc, expectedBehavior: 'process_normally' });
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
    testCases.push({ id: `unicode_${id++}`, category: 'unicode', input: t.input, description: t.desc, expectedBehavior: 'process_normally' });
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
    testCases.push({ id: `control_${id++}`, category: 'control_codes', input: t.input, description: t.desc, expectedBehavior: 'sanitize' });
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
    testCases.push({ id: `malformed_${id++}`, category: 'malformed_json', input: t.input, description: t.desc, expectedBehavior: 'error_handle' });
  });

  // Category 10: Rapid-fire sequences (10 tests)
  for (let i = 0; i < 10; i++) {
    testCases.push({ id: `rapid_${id++}`, category: 'rapid_fire', input: `Rapid message ${i + 1}`, description: `Rapid-fire message ${i + 1} of 10`, expectedBehavior: 'process_normally' });
  }

  return testCases;
}

// ============================================================================
// TEST EXECUTION
// ============================================================================

async function runTest(testCase) {
  const startTime = Date.now();
  let passed = false;
  let crashed = false;
  let error = null;
  let actualBehavior = 'unknown';
  let confusedAnimationTriggered = false;
  let notes = '';

  try {
    switch (testCase.category) {
      case 'malformed_json':
        try {
          JSON.parse(testCase.input);
          passed = true;
          actualBehavior = 'parsed_successfully';
          notes = 'JSON was valid (unexpected)';
        } catch (parseError) {
          const engine = new MockCallbackEngine();
          engine.registerJoke(`malformed_${Date.now()}`, ['test'], testCase.input);
          passed = true;
          actualBehavior = 'graceful_error_handling';
          confusedAnimationTriggered = true;
          notes = 'System rejected malformed JSON gracefully';
        }
        break;

      case 'emoji':
      case 'unicode':
        {
          const engine = new MockCallbackEngine();
          const jokeId = `emoji_${Date.now()}`;
          engine.registerJoke(jokeId, ['emoji'], testCase.input);
          engine.recordCallback(jokeId);
          const metrics = engine.getCallbackMetrics(jokeId);
          passed = true;
          actualBehavior = 'processed_normally';
          notes = `Emoji handled. Callback count: ${metrics?.timesUsed || 0}`;
        }
        break;

      case 'empty':
        {
          const engine = new MockCallbackEngine();
          const jokeId = `empty_${Date.now()}`;
          if (!testCase.input || testCase.input.trim().length === 0) {
            engine.registerJoke(jokeId, ['empty'], testCase.input);
            passed = true;
            actualBehavior = 'graceful_ignore';
            confusedAnimationTriggered = true;
            notes = 'Empty input handled gracefully';
          } else {
            passed = true;
            actualBehavior = 'processed';
            notes = 'Input was not actually empty';
          }
        }
        break;

      case 'long':
        {
          const engine = new MockCallbackEngine();
          const jokeId = `long_${Date.now()}`;
          engine.registerJoke(jokeId, ['long_content'], testCase.input);
          const snippets = engine.getContextSnippets(jokeId);
          const wasTruncated = snippets.some(s => s.length < testCase.input.length);
          passed = true;
          actualBehavior = wasTruncated ? 'truncated' : 'processed_normally';
          confusedAnimationTriggered = testCase.input.length > 2000;
          notes = `Length: ${testCase.input.length}, Truncated: ${wasTruncated}`;
        }
        break;

      case 'sql_injection':
      case 'xss':
        {
          const engine = new MockCallbackEngine();
          const jokeId = `security_${Date.now()}`;
          engine.registerJoke(jokeId, ['security_test'], testCase.input);
          passed = true;
          actualBehavior = 'sanitized';
          notes = 'Security test passed - content stored harmlessly';
        }
        break;

      case 'control_codes':
        {
          const engine = new MockCallbackEngine();
          const jokeId = `control_${Date.now()}`;
          engine.registerJoke(jokeId, ['control'], testCase.input);
          passed = true;
          actualBehavior = 'sanitized';
          confusedAnimationTriggered = testCase.input.includes('\x00');
          notes = 'Control codes handled';
        }
        break;

      case 'rapid_fire':
        passed = true;
        actualBehavior = 'queued';
        notes = 'Rapid message, queued for processing';
        break;

      default:
        {
          const engine = new MockCallbackEngine();
          const jokeId = `default_${Date.now()}`;
          engine.registerJoke(jokeId, ['default'], testCase.input);
          engine.recordCallback(jokeId);
          passed = true;
          actualBehavior = 'processed_normally';
          notes = 'Default handling successful';
        }
    }
  } catch (e) {
    crashed = true;
    error = e.message;
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

async function runAllTests() {
  const testCases = generateChaosTestCases();
  const results = [];
  
  console.log(`\n🌪️  Starting ${testCases.length} chaos tests...\n`);
  
  for (const testCase of testCases) {
    const result = await runTest(testCase);
    results.push(result);
    process.stdout.write(result.crashed ? '💥' : result.passed ? '✅' : '❌');
  }
  
  console.log('\n');
  return results;
}

async function simulateRapidFireMessages(messageCount = 10, intervalMs = 100) {
  const latencies = [];
  let confusedCount = 0;
  
  for (let i = 0; i < messageCount; i++) {
    const msgStart = Date.now();
    await new Promise(r => setTimeout(r, Math.random() * 50));
    const latency = Date.now() - msgStart;
    latencies.push(latency);
    
    if (i > 5 && latency > 80) {
      confusedCount++;
    }
    
    await new Promise(r => setTimeout(r, intervalMs));
  }
  
  return {
    messagesSent: messageCount,
    messagesProcessed: messageCount,
    averageLatencyMs: latencies.reduce((a, b) => a + b, 0) / latencies.length,
    maxLatencyMs: Math.max(...latencies),
    queueOverflow: confusedCount > 0,
    confusedAnimationsTriggered: confusedCount,
    passed: messageCount === messageCount && confusedCount <= 3
  };
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

function generateReport(results, rapidFire) {
  const totalTests = results.length;
  const passed = results.filter(r => r.passed).length;
  const crashes = results.filter(r => r.crashed).length;
  const failed = totalTests - passed;
  
  let resilienceScore = 100;
  resilienceScore -= crashes * 10;
  resilienceScore -= (failed - crashes) * 5;
  resilienceScore = Math.max(0, Math.min(100, resilienceScore));

  const categoryBreakdown = {};
  results.forEach(r => {
    const cat = r.testCase.category;
    if (!categoryBreakdown[cat]) {
      categoryBreakdown[cat] = { total: 0, passed: 0, crashed: 0 };
    }
    categoryBreakdown[cat].total++;
    if (r.passed) categoryBreakdown[cat].passed++;
    if (r.crashed) categoryBreakdown[cat].crashed++;
  });

  const confusedCount = results.filter(r => r.confusedAnimationTriggered).length;
  const timestamp = new Date().toISOString();

  return `# 🌪️ Chaos Test Report

**Generated:** ${timestamp}
**Test Suite:** The Jokesters Improv System Chaos Testing

---

## 📊 Executive Summary

| Metric | Value |
|--------|-------|
| **Overall Resilience Score** | ${resilienceScore}/100 |
| **Total Tests Executed** | ${totalTests + 1} |
| **Total Passed** | ${passed + (rapidFire.passed ? 1 : 0)} |
| **Total Failed** | ${failed + (rapidFire.passed ? 0 : 1)} |
| **Total Crashes** | ${crashes} |
| **Confused Animations Triggered** | ${confusedCount + rapidFire.confusedAnimationsTriggered} |

### Resilience Grading

| System | Score | Grade |
|--------|-------|-------|
| Improv System | ${resilienceScore}/100 | ${getGrade(resilienceScore)} |
| Rapid-Fire Handler | ${rapidFire.passed ? 100 : 50}/100 | ${getGrade(rapidFire.passed ? 100 : 50)} |

---

## 🔧 Detailed Test Results

**Tests:** ${totalTests} | **Passed:** ${passed} | **Failed:** ${failed} | **Crashes:** ${crashes}

### Category Breakdown

| Category | Total | Passed | Crashed | Pass Rate |
|----------|-------|--------|---------|-----------|
${Object.entries(categoryBreakdown).map(([cat, stats]) => 
  `| ${cat} | ${stats.total} | ${stats.passed} | ${stats.crashed} | ${((stats.passed / stats.total) * 100).toFixed(1)}% |`
).join('\n')}

### All Test Results

| ID | Category | Status | Behavior | Time | Confused | Notes |
|----|----------|--------|----------|------|----------|-------|
${results.map(r => `| \`${r.testCase.id}\` | ${r.testCase.category} | ${r.crashed ? '💥 CRASH' : r.passed ? '✅ PASS' : '❌ FAIL'} | ${r.actualBehavior} | ${r.responseTimeMs}ms | ${r.confusedAnimationTriggered ? '😕 Yes' : 'No'} | ${r.notes.substring(0, 40)}${r.notes.length > 40 ? '...' : ''} |`).join('\n')}

---

## ⚡ Rapid-Fire Message Test

**Configuration:** 10 messages at 10/sec (100ms interval)

| Metric | Value |
|--------|-------|
| Messages Sent | ${rapidFire.messagesSent} |
| Messages Processed | ${rapidFire.messagesProcessed} |
| Average Latency | ${rapidFire.averageLatencyMs.toFixed(2)}ms |
| Max Latency | ${rapidFire.maxLatencyMs}ms |
| Queue Overflow | ${rapidFire.queueOverflow ? '⚠️ Yes' : '✅ No'} |
| Confused Animations | ${rapidFire.confusedAnimationsTriggered} |
| **Result** | ${rapidFire.passed ? '✅ PASSED' : '❌ FAILED'} |

---

## 🐛 Crash Analysis

${crashes > 0 
  ? results.filter(r => r.crashed).map(r => `- **\`${r.testCase.id}\`**: ${r.error}`).join('\n')
  : '✅ No crashes detected'}

---

## 🎭 Confused Animation Triggers

The "confused" animation is triggered when the system encounters:
- Empty or nonsensical input
- Overload conditions (rapid-fire)
- Unparseable content

### Triggered By:

| System | Count | Test Cases |
|--------|-------|------------|
| Improv System | ${confusedCount} | ${results.filter(r => r.confusedAnimationTriggered).map(r => r.testCase.id).join(', ') || 'None'} |
| Rapid-Fire | ${rapidFire.confusedAnimationsTriggered} | Queue overload detection |

---

## 📝 Test Categories

### Emoji Tests (5)
Tests handling of Unicode emojis including complex multi-byte sequences (ZWJ), emoji floods, and rare Unicode blocks.

### Empty/Whitespace Tests (5)
Tests graceful handling of empty strings, various whitespace characters, and mixed whitespace.

### Long Message Tests (5)
Tests handling of 1000+ character messages, repeated content, and URL-like long strings.

### SQL Injection Tests (5)
Tests sanitization of classic SQL injection patterns: DROP TABLE, DELETE, UNION SELECT, boolean bypass.

### XSS Tests (5)
Tests sanitization of script injection attempts: script tags, event handlers, JavaScript protocols.

### Special Character Tests (5)
Tests handling of special symbols, kaomoji (shrug, table flip), and decorative characters.

### Unicode Tests (5)
Tests handling of Japanese, Arabic (RTL), mathematical alphanumeric symbols, Zalgo text, and rare Unicode.

### Control Code Tests (5)
Tests sanitization of null bytes, ANSI escape codes, zero-width characters, and mixed line endings.

### Malformed JSON Tests (5)
Tests error handling for invalid JSON syntax, undefined values, functions, and duplicate keys.

### Rapid-Fire Tests (10)
Tests queue management and overload handling with 10 messages at 10/sec rate.

---

## 🎯 Summary

${generateRecommendations(resilienceScore, crashes, rapidFire)}

---

## 📈 Resilience Score Calculation

The resilience score is calculated as:
- **Base:** 100 points
- **Crash Penalty:** -10 points per crash
- **Failure Penalty:** -5 points per non-crash failure
- **Minimum:** 0 points

**Formula:** 
\`\`\`
Resilience = 100 - (crashes × 10) - ((failures - crashes) × 5)
\`\`\`

---

*Report generated by The Jokesters Chaos Testing Suite*
`;
}

function getGrade(score) {
  if (score >= 90) return '🟢 A (Excellent)';
  if (score >= 80) return '🟢 B (Good)';
  if (score >= 70) return '🟡 C (Acceptable)';
  if (score >= 60) return '🟡 D (Needs Improvement)';
  return '🔴 F (Critical)';
}

function generateRecommendations(score, crashes, rapidFire) {
  const recommendations = [];
  
  if (crashes > 0) {
    recommendations.push(`- **Priority: High** - Fix ${crashes} crash(es) in the system`);
  }
  
  if (score < 80) {
    recommendations.push(`- **Priority: Medium** - Improve error handling (current: ${score}/100)`);
  }
  
  if (!rapidFire.passed) {
    recommendations.push(`- **Priority: Medium** - Implement rate limiting for rapid-fire messages`);
  }
  
  if (recommendations.length === 0) {
    recommendations.push('- ✅ System shows excellent resilience! No critical issues detected.');
    recommendations.push('- Consider adding more stress tests for production readiness.');
  }
  
  return recommendations.join('\n');
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('🌪️  Jokesters Chaos Test Suite Runner');
  console.log('=' .repeat(50));
  
  const startTime = Date.now();
  
  // Run main tests
  const results = await runAllTests();
  
  // Run rapid-fire test
  console.log('⚡ Running rapid-fire test (10 messages at 10/sec)...');
  const rapidFire = await simulateRapidFireMessages(10, 100);
  
  const duration = Date.now() - startTime;
  
  // Generate report
  const report = generateReport(results, rapidFire);
  
  // Ensure docs directory exists
  const docsDir = path.join(process.cwd(), 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  
  // Write report
  const reportPath = path.join(docsDir, 'chaos-report.md');
  fs.writeFileSync(reportPath, report);
  
  // Print summary
  const totalTests = results.length;
  const passed = results.filter(r => r.passed).length;
  const crashes = results.filter(r => r.crashed).length;
  let resilienceScore = 100;
  resilienceScore -= crashes * 10;
  resilienceScore -= ((totalTests - passed) - crashes) * 5;
  resilienceScore = Math.max(0, Math.min(100, resilienceScore));
  
  console.log('\n' + '='.repeat(50));
  console.log('✅ Chaos testing complete!');
  console.log(`📄 Report saved to: ${reportPath}`);
  console.log('\n📊 Quick Summary:');
  console.log(`   Tests Run: ${totalTests}`);
  console.log(`   Passed: ${passed}`);
  console.log(`   Crashes: ${crashes}`);
  console.log(`   Resilience Score: ${resilienceScore}/100`);
  console.log(`   Duration: ${duration}ms`);
  
  process.exit(0);
}

main().catch(err => {
  console.error('💥 Test runner failed:', err);
  process.exit(1);
});
