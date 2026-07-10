import { describe, expect, it } from 'vitest';
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

describe('Token estimator accuracy', () => {
  it('matches Hermes/Llama reference samples within tolerance', () => {
    for (const sample of REFERENCE_SAMPLE_COUNTS) {
      const ratio = MODEL_FAMILY_CHARS_PER_TOKEN[sample.family] ?? MODEL_FAMILY_CHARS_PER_TOKEN.default;
      const estimator = new CachedRatioTokenEstimator(sample.family, ratio);
      const estimate = estimator.estimateText(sample.text);
      expect(isWithinTolerance(estimate, sample.tokens, 0.11)).toBe(true);
    }
  });

  it('calibrates against a mock tokenizer', () => {
    const mockCharsPerToken = 3.65;
    const mockEstimate = (text: string) => Math.max(1, Math.ceil(text.length / mockCharsPerToken));
    const estimator = new CachedRatioTokenEstimator('hermes');
    const calibrationText = REFERENCE_SAMPLE_COUNTS[0].text;
    estimator.calibrate(calibrationText.length, mockEstimate(calibrationText));

    for (const sample of REFERENCE_SAMPLE_COUNTS) {
      const reference = mockEstimate(sample.text);
      const estimate = estimator.estimateText(sample.text);
      expect(isWithinTolerance(estimate, reference, 0.1)).toBe(true);
    }
  });
});

describe('DynamicContextManager.truncate', () => {
  it('preserves system prompt in tiny context windows', () => {
    const estimator = new HeuristicTokenEstimator(4);
    const mgr = new DynamicContextManager(64, estimator);
    const system = 'You are The Comedian.';
    const history = makeHistory(6);
    const { messages, info } = mgr.truncate(system, history, 16);

    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toBe(system);
    expect(info.droppedMessages).toBeGreaterThan(0);
    expect(info.usedTokens + info.reserveTokens).toBeLessThanOrEqual(info.maxTokens);
  });

  it('keeps only system prompt when budget is exhausted by huge system text', () => {
    const estimator = new HeuristicTokenEstimator(4);
    const mgr = new DynamicContextManager(128, estimator);
    const hugeSystem = 'SYSTEM RULES: ' + 'Be funny. '.repeat(200);
    const history = makeHistory(4);
    const { messages, info } = mgr.truncate(hugeSystem, history, 32);

    expect(messages).toHaveLength(1);
    expect(messages[0].content).toBe(hugeSystem);
    expect(info.droppedMessages).toBe(history.length);
    expect(info.hasSummary).toBe(false);
  });

  it('respects reserveTokens / maxTokensPerTurn budget', () => {
    const estimator = new HeuristicTokenEstimator(4);
    const mgr = new DynamicContextManager(512, estimator);
    const system = 'Agent persona ' + 'x'.repeat(40);
    const history = makeHistory(8);
    const reserve = 150;
    const { info } = mgr.truncate(system, history, reserve);

    expect(info.reserveTokens).toBe(reserve);
    expect(info.usedTokens).toBeLessThanOrEqual(info.maxTokens - reserve);
  });

  it('keeps newest turns and adds summary stub when dropping older history', () => {
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
    const keptContents = messages.filter((m) => m.role !== 'system').map((m) => m.content);

    expect(info.hasSummary).toBe(true);
    expect(keptContents).toContain('NEWEST USER LINE');
    expect(keptContents).toContain('NEWEST ASSISTANT LINE');
    expect(keptContents).not.toContain('OLD MESSAGE ONE');
  });
});

describe('Cached ratio calibration', () => {
  it('matches reference after calibrate()', () => {
    const estimator = new CachedRatioTokenEstimator('llama3');
    const text = 'Hello world from Llama tokenizer calibration sample text.';
    const trueTokens = 12;
    estimator.calibrate(text.length, trueTokens);
    const estimate = estimator.estimateText(text);

    expect(isWithinTolerance(estimate, trueTokens, 0.05)).toBe(true);
    expect(estimator.getSource()).toBe('cached-ratio');
  });
});
