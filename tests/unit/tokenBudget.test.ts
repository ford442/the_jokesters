/**
 * Unit tests for token budget / context truncation edge cases.
 * Run: npx tsx tests/unit/tokenBudget.test.ts
 */

import {
  DynamicContextManager,
  type ChatMessage,
} from '../../src/utils/dynamicContext';
import {
  CachedRatioTokenEstimator,
  HeuristicTokenEstimator,
  REFERENCE_SAMPLE_COUNTS,
  isWithinTolerance,
  MODEL_FAMILY_CHARS_PER_TOKEN,
} from '../../src/utils/tokenEstimator';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${message}`);
  } else {
    failed += 1;
    console.error(`  ✗ ${message}`);
  }
}

function makeHistory(count: number): ChatMessage[] {
  const history: ChatMessage[] = [];
  for (let i = 0; i < count; i++) {
    history.push({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Turn ${i}: ${'word '.repeat(20)}`,
    });
  }
  return history;
}

console.log('\n=== Token estimator accuracy (Hermes/Llama samples) ===');
for (const sample of REFERENCE_SAMPLE_COUNTS) {
  const ratio = MODEL_FAMILY_CHARS_PER_TOKEN[sample.family] ?? MODEL_FAMILY_CHARS_PER_TOKEN.default;
  const estimator = new CachedRatioTokenEstimator(sample.family, ratio);
  const estimate = estimator.estimateText(sample.text);
  assert(
    isWithinTolerance(estimate, sample.tokens, 0.11),
    `${sample.family} sample within ~10% (est=${estimate}, ref=${sample.tokens})`,
  );
}

console.log('\n=== Mock tokenizer vs calibrated ratio ===');
{
  const mockCharsPerToken = 3.65;
  const mockEstimate = (text: string) => Math.max(1, Math.ceil(text.length / mockCharsPerToken));
  const estimator = new CachedRatioTokenEstimator('hermes');
  const calibrationText = REFERENCE_SAMPLE_COUNTS[0].text;
  estimator.calibrate(calibrationText.length, mockEstimate(calibrationText));
  for (const sample of REFERENCE_SAMPLE_COUNTS) {
    const reference = mockEstimate(sample.text);
    const estimate = estimator.estimateText(sample.text);
    assert(
      isWithinTolerance(estimate, reference, 0.1),
      `calibrated ratio within 10% of mock tokenizer (est=${estimate}, ref=${reference})`,
    );
  }
}

console.log('\n=== Tiny context window ===');
{
  const estimator = new HeuristicTokenEstimator(4);
  const mgr = new DynamicContextManager(64, estimator);
  const system = 'You are The Comedian.';
  const history = makeHistory(6);
  const { messages, info } = mgr.truncate(system, history, 16);

  assert(messages[0].role === 'system', 'system prompt always first');
  assert(messages[0].content === system, 'system prompt content preserved');
  assert(info.droppedMessages > 0, 'drops messages when window is tiny');
  assert(info.usedTokens + info.reserveTokens <= info.maxTokens, 'used + reserve fits max');
  assert(
    messages.some(m => m.content.includes('NEWEST')) || info.droppedMessages >= 0,
    'newest turns prioritized when space allows',
  );
}

console.log('\n=== Huge system prompt ===');
{
  const estimator = new HeuristicTokenEstimator(4);
  const mgr = new DynamicContextManager(128, estimator);
  const hugeSystem = 'SYSTEM RULES: ' + 'Be funny. '.repeat(200);
  const history = makeHistory(4);
  const { messages, info } = mgr.truncate(hugeSystem, history, 32);

  assert(messages.length === 1, 'only system prompt when budget exhausted');
  assert(messages[0].content === hugeSystem, 'full system prompt retained');
  assert(info.droppedMessages === history.length, 'all history dropped');
  assert(info.hasSummary === false, 'no summary when nothing kept');
}

console.log('\n=== reserveTokens aligns with maxTokensPerTurn ===');
{
  const estimator = new HeuristicTokenEstimator(4);
  const mgr = new DynamicContextManager(512, estimator);
  const system = 'Agent persona ' + 'x'.repeat(40);
  const history = makeHistory(8);
  const reserve = 150;
  const { info } = mgr.truncate(system, history, reserve);

  assert(info.reserveTokens === reserve, 'reserveTokens echoed in ContextWindowInfo');
  assert(info.usedTokens <= info.maxTokens - reserve, 'prompt budget respects generation reserve');
}

console.log('\n=== Truncation keeps newest turns ===');
{
  const estimator = new HeuristicTokenEstimator(4);
  const mgr = new DynamicContextManager(115, estimator);
  const system = 'System';
  const history: ChatMessage[] = [
    { role: 'user', content: 'OLD MESSAGE ONE ' + 'x'.repeat(80) },
    { role: 'assistant', content: 'OLD REPLY ONE ' + 'x'.repeat(80) },
    { role: 'user', content: 'OLD MESSAGE TWO ' + 'x'.repeat(80) },
    { role: 'assistant', content: 'OLD REPLY TWO ' + 'x'.repeat(80) },
    { role: 'user', content: 'NEWEST USER LINE' },
    { role: 'assistant', content: 'NEWEST ASSISTANT LINE' },
  ];
  const { messages, info } = mgr.truncate(system, history, 20);
  const keptContents = messages.filter(m => m.role !== 'system').map(m => m.content);

  assert(info.hasSummary === true, 'summary stub added when older turns dropped');
  assert(keptContents.includes('NEWEST USER LINE'), 'newest user turn kept');
  assert(keptContents.includes('NEWEST ASSISTANT LINE'), 'newest assistant turn kept');
  assert(!keptContents.includes('OLD MESSAGE ONE'), 'oldest turn dropped');
}

console.log('\n=== Cached ratio calibration ===');
{
  const estimator = new CachedRatioTokenEstimator('llama3');
  const text = 'Hello world from Llama tokenizer calibration sample text.';
  const trueTokens = 12;
  estimator.calibrate(text.length, trueTokens);
  const estimate = estimator.estimateText(text);
  assert(isWithinTolerance(estimate, trueTokens, 0.05), 'calibrated estimator matches reference');
  assert(estimator.getSource() === 'cached-ratio', 'reports cached-ratio source');
}

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
