/**
 * Chaos Test Runner
 * Executes the chaos test suite and generates markdown report
 */

import { 
  runFullChaosTest, 
  ChaosTestReport, 
  RapidFireResult,
  TestResult 
} from './chaosTest';

// ============================================================================
// REPORT FORMATTING
// ============================================================================

function formatTestResult(result: TestResult): string {
  const status = result.crashed ? '💥 CRASH' : result.passed ? '✅ PASS' : '❌ FAIL';
  const confused = result.confusedAnimationTriggered ? '😕 Confused' : '';
  return `| \`${result.testCase.id}\` | ${result.testCase.category} | ${status} | ${result.actualBehavior} | ${result.responseTimeMs}ms | ${confused} | ${result.notes.substring(0, 50)}${result.notes.length > 50 ? '...' : ''} |`;
}

function generateMarkdownReport(
  callbackReport: ChaosTestReport,
  branchingReport: ChaosTestReport,
  rapidFire: RapidFireResult
): string {
  const timestamp = new Date().toISOString();
  
  return `# 🌪️ Chaos Test Report

**Generated:** ${timestamp}
**Test Suite:** The Jokesters Improv System Chaos Testing

---

## 📊 Executive Summary

| Metric | Value |
|--------|-------|
| **Overall Resilience Score** | ${calculateOverallResilience(callbackReport, branchingReport, rapidFire)}/100 |
| **Total Tests Executed** | ${callbackReport.totalTests + branchingReport.totalTests + 1} |
| **Total Passed** | ${callbackReport.passed + branchingReport.passed + (rapidFire.passed ? 1 : 0)} |
| **Total Failed** | ${callbackReport.failed + branchingReport.failed + (rapidFire.passed ? 0 : 1)} |
| **Total Crashes** | ${callbackReport.crashes + branchingReport.crashes} |
| **Confused Animations Triggered** | ${countConfusedAnimations(callbackReport) + countConfusedAnimations(branchingReport) + rapidFire.confusedAnimationsTriggered} |

### Resilience Grading

| System | Score | Grade |
|--------|-------|-------|
| Callback Engine | ${callbackReport.resilienceScore}/100 | ${getGrade(callbackReport.resilienceScore)} |
| Branching System | ${branchingReport.resilienceScore}/100 | ${getGrade(branchingReport.resilienceScore)} |
| Rapid-Fire Handler | ${rapidFire.passed ? 100 : 50}/100 | ${getGrade(rapidFire.passed ? 100 : 50)} |

---

## 🔧 Callback Engine Test Results

**Duration:** ${callbackReport.durationMs}ms  
**Tests:** ${callbackReport.totalTests} | **Passed:** ${callbackReport.passed} | **Failed:** ${callbackReport.failed} | **Crashes:** ${callbackReport.crashes}

### Category Breakdown

| Category | Total | Passed | Crashed | Pass Rate |
|----------|-------|--------|---------|-----------|
${Object.entries(callbackReport.categoryBreakdown).map(([cat, stats]) => 
  `| ${cat} | ${stats.total} | ${stats.passed} | ${stats.crashed} | ${((stats.passed / stats.total) * 100).toFixed(1)}% |`
).join('\n')}

### Detailed Results

| ID | Category | Status | Behavior | Time | Confused | Notes |
|----|----------|--------|----------|------|----------|-------|
${callbackReport.results.map(formatTestResult).join('\n')}

---

## 🌳 Branching System Test Results

**Duration:** ${branchingReport.durationMs}ms  
**Tests:** ${branchingReport.totalTests} | **Passed:** ${branchingReport.passed} | **Failed:** ${branchingReport.failed} | **Crashes:** ${branchingReport.crashes}

### Category Breakdown

| Category | Total | Passed | Crashed | Pass Rate |
|----------|-------|--------|---------|-----------|
${Object.entries(branchingReport.categoryBreakdown).map(([cat, stats]) => 
  `| ${cat} | ${stats.total} | ${stats.passed} | ${stats.crashed} | ${((stats.passed / stats.total) * 100).toFixed(1)}% |`
).join('\n')}

### Detailed Results

| ID | Category | Status | Behavior | Time | Confused | Notes |
|----|----------|--------|----------|------|----------|-------|
${branchingReport.results.map(formatTestResult).join('\n')}

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

### Callback Engine Crashes
${callbackReport.results.filter(r => r.crashed).length > 0 
  ? callbackReport.results.filter(r => r.crashed).map(r => `- **\`${r.testCase.id}\`**: ${r.error}`).join('\n')
  : '✅ No crashes detected'}

### Branching System Crashes
${branchingReport.results.filter(r => r.crashed).length > 0 
  ? branchingReport.results.filter(r => r.crashed).map(r => `- **\`${r.testCase.id}\`**: ${r.error}`).join('\n')
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
| Callback Engine | ${countConfusedAnimations(callbackReport)} | ${callbackReport.results.filter(r => r.confusedAnimationTriggered).map(r => r.testCase.id).join(', ') || 'None'} |
| Branching System | ${countConfusedAnimations(branchingReport)} | ${branchingReport.results.filter(r => r.confusedAnimationTriggered).map(r => r.testCase.id).join(', ') || 'None'} |
| Rapid-Fire | ${rapidFire.confusedAnimationsTriggered} | Queue overload detection |

---

## 📝 Test Case Descriptions

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

## 🎯 Recommendations

${generateRecommendations(callbackReport, branchingReport, rapidFire)}

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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateOverallResilience(
  callbackReport: ChaosTestReport,
  branchingReport: ChaosTestReport,
  rapidFire: RapidFireResult
): number {
  const callbackWeight = 0.4;
  const branchingWeight = 0.4;
  const rapidFireWeight = 0.2;
  
  const rapidFireScore = rapidFire.passed ? 100 : 50;
  
  const overall = Math.round(
    callbackReport.resilienceScore * callbackWeight +
    branchingReport.resilienceScore * branchingWeight +
    rapidFireScore * rapidFireWeight
  );
  
  return Math.min(100, Math.max(0, overall));
}

function getGrade(score: number): string {
  if (score >= 90) return '🟢 A (Excellent)';
  if (score >= 80) return '🟢 B (Good)';
  if (score >= 70) return '🟡 C (Acceptable)';
  if (score >= 60) return '🟡 D (Needs Improvement)';
  return '🔴 F (Critical)';
}

function countConfusedAnimations(report: ChaosTestReport): number {
  return report.results.filter(r => r.confusedAnimationTriggered).length;
}

function generateRecommendations(
  callbackReport: ChaosTestReport,
  branchingReport: ChaosTestReport,
  rapidFire: RapidFireResult
): string {
  const recommendations: string[] = [];
  
  if (callbackReport.crashes > 0) {
    recommendations.push(`- **Priority: High** - Fix ${callbackReport.crashes} crash(es) in Callback Engine`);
  }
  
  if (branchingReport.crashes > 0) {
    recommendations.push(`- **Priority: High** - Fix ${branchingReport.crashes} crash(es) in Branching System`);
  }
  
  if (callbackReport.resilienceScore < 80) {
    recommendations.push(`- **Priority: Medium** - Improve Callback Engine error handling (current: ${callbackReport.resilienceScore}/100)`);
  }
  
  if (branchingReport.resilienceScore < 80) {
    recommendations.push(`- **Priority: Medium** - Improve Branching System error handling (current: ${branchingReport.resilienceScore}/100)`);
  }
  
  if (!rapidFire.passed) {
    recommendations.push(`- **Priority: Medium** - Implement rate limiting or backpressure for rapid-fire messages`);
  }
  
  const emptyTests = callbackReport.results.filter(r => r.testCase.category === 'empty' && !r.passed);
  if (emptyTests.length > 0) {
    recommendations.push(`- **Priority: Low** - Improve handling of empty/whitespace inputs (${emptyTests.length} failures)`);
  }
  
  if (recommendations.length === 0) {
    recommendations.push('- ✅ System shows excellent resilience! No critical issues detected.');
    recommendations.push('- Consider adding more stress tests for production readiness.');
  }
  
  return recommendations.join('\n');
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('🌪️ Jokesters Chaos Test Suite Runner\n');
  console.log('=' .repeat(50));
  
  try {
    // Import and run tests
    const { runFullChaosTest } = await import('./chaosTest');
    const results = await runFullChaosTest();
    
    // Generate report
    const report = generateMarkdownReport(
      results.callbackReport,
      results.branchingReport,
      results.rapidFire
    );
    
    // Write to file
    const fs = await import('fs');
    const path = await import('path');
    const reportPath = path.join(process.cwd(), 'docs', 'chaos-report.md');
    
    fs.writeFileSync(reportPath, report);
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ Chaos testing complete!');
    console.log(`📄 Report saved to: ${reportPath}`);
    console.log('\n📊 Quick Summary:');
    console.log(`   Callback Engine: ${results.callbackReport.resilienceScore}/100`);
    console.log(`   Branching System: ${results.branchingReport.resilienceScore}/100`);
    console.log(`   Rapid-Fire: ${results.rapidFire.passed ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Overall Resilience: ${calculateOverallResilience(results.callbackReport, results.branchingReport, results.rapidFire)}/100`);
    
    // Exit with error code if there are crashes
    if (results.callbackReport.crashes > 0 || results.branchingReport.crashes > 0) {
      console.log('\n⚠️  Crashes detected - check report for details');
      process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Test runner failed:', error);
    process.exit(2);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { generateMarkdownReport, calculateOverallResilience };
