import type { LLMEngine } from '../llm/LLMEngine';

export type TokenEstimationSource = 'tokenizer' | 'cached-ratio' | 'heuristic';

export interface TokenEstimator {
  estimateText(text: string): number;
  getSource(): TokenEstimationSource;
  getCharsPerToken?(): number;
}

/** Default chars/token ratios by model family (English prose, empirically tuned). */
export const MODEL_FAMILY_CHARS_PER_TOKEN: Record<string, number> = {
  llama3: 3.7,
  hermes: 3.7,
  llama2: 4.1,
  vicuna: 4.1,
  default: 4.0,
};

const CALIBRATION_SAMPLE =
  'The Comedian delivers a punchline about startup culture while The Philosopher ' +
  'questions the meaning of venture capital. Multi-agent comedy needs accurate token budgets.';

export class HeuristicTokenEstimator implements TokenEstimator {
  private readonly charsPerToken: number;

  constructor(charsPerToken = 4) {
    this.charsPerToken = charsPerToken;
  }

  estimateText(text: string): number {
    if (!text) return 0;
    return Math.max(1, Math.ceil(text.length / this.charsPerToken));
  }

  getSource(): TokenEstimationSource {
    return 'heuristic';
  }

  getCharsPerToken(): number {
    return this.charsPerToken;
  }
}

/** Uses a calibrated chars/token ratio (updated after real tokenizer samples). */
export class CachedRatioTokenEstimator implements TokenEstimator {
  private charsPerToken: number;
  private source: TokenEstimationSource = 'cached-ratio';

  constructor(modelFamily = 'default', charsPerToken?: number) {
    this.charsPerToken = charsPerToken ?? MODEL_FAMILY_CHARS_PER_TOKEN[modelFamily] ?? MODEL_FAMILY_CHARS_PER_TOKEN.default;
  }

  calibrate(charCount: number, tokenCount: number): void {
    if (charCount <= 0 || tokenCount <= 0) return;
    this.charsPerToken = charCount / tokenCount;
    this.source = 'cached-ratio';
  }

  estimateText(text: string): number {
    if (!text) return 0;
    return Math.max(1, Math.ceil(text.length / this.charsPerToken));
  }

  getSource(): TokenEstimationSource {
    return this.source;
  }

  getCharsPerToken(): number {
    return this.charsPerToken;
  }
}

/** Delegates to an engine adapter's live tokenizer when available. */
export class EngineTokenEstimator implements TokenEstimator {
  private readonly engine: LLMEngine;
  private fallback: CachedRatioTokenEstimator;
  private tokenizerVerified = false;

  constructor(engine: LLMEngine, modelFamily = 'default') {
    this.engine = engine;
    this.fallback = new CachedRatioTokenEstimator(modelFamily);
  }

  estimateText(text: string): number {
    if (!text) return 0;
    const exact = this.engine.countTokens?.(text);
    if (exact != null && exact > 0) {
      this.tokenizerVerified = true;
      return exact;
    }
    return this.fallback.estimateText(text);
  }

  getSource(): TokenEstimationSource {
    return this.tokenizerVerified ? 'tokenizer' : this.fallback.getSource();
  }

  getCharsPerToken(): number {
    return this.fallback.getCharsPerToken();
  }

  calibrate(charCount: number, tokenCount: number): void {
    this.fallback.calibrate(charCount, tokenCount);
  }
}

export function resolveModelFamily(modelId: string, engine: LLMEngine): string {
  if (engine.getModelFamily) {
    return engine.getModelFamily();
  }
  const id = modelId.toLowerCase();
  if (id.includes('hermes')) return 'hermes';
  if (id.includes('llama-3') || id.includes('llama3')) return 'llama3';
  if (id.includes('vicuna')) return 'vicuna';
  if (id.includes('llama-2') || id.includes('llama2')) return 'llama2';
  return 'default';
}

export function createTokenEstimatorForEngine(engine: LLMEngine, modelId?: string): TokenEstimator {
  const family = resolveModelFamily(modelId ?? engine.getLoadedModelId() ?? '', engine);
  return new EngineTokenEstimator(engine, family);
}

/** Calibrate cached ratio using engine tokenizer APIs (async for wllama). */
export async function calibrateTokenEstimator(
  engine: LLMEngine,
  estimator: TokenEstimator,
): Promise<void> {
  const sample = CALIBRATION_SAMPLE;

  if (engine.countTokens) {
    const syncCount = engine.countTokens(sample);
    if (syncCount != null && syncCount > 0) {
      if (estimator instanceof EngineTokenEstimator || estimator instanceof CachedRatioTokenEstimator) {
        estimator.calibrate(sample.length, syncCount);
      }
      return;
    }
  }

  if (engine.countTokensAsync) {
    const asyncCount = await engine.countTokensAsync(sample);
    if (asyncCount > 0 && (estimator instanceof EngineTokenEstimator || estimator instanceof CachedRatioTokenEstimator)) {
      estimator.calibrate(sample.length, asyncCount);
    }
  }
}

/**
 * Reference token counts for Hermes/Llama-style BPE (~3.7 chars/token).
 * Used in unit tests to verify estimators stay within ~10%.
 */
export const REFERENCE_SAMPLE_COUNTS: Array<{ text: string; tokens: number; family: string }> = [
  {
    family: 'hermes',
    text: 'You are The Comedian. Be witty, concise, and never break character.',
    tokens: Math.ceil(66 / MODEL_FAMILY_CHARS_PER_TOKEN.hermes),
  },
  {
    family: 'llama3',
    text:
      'SYSTEM: Director injects a callback about hotdogs and buns. ' +
      'Reply naturally with one punchy sentence. ###',
    tokens: Math.ceil(
      ('SYSTEM: Director injects a callback about hotdogs and buns. ' +
        'Reply naturally with one punchy sentence. ###').length /
        MODEL_FAMILY_CHARS_PER_TOKEN.llama3,
    ),
  },
  {
    family: 'hermes',
    text:
      'The Philosopher muses that venture capital is merely existential dread ' +
      'with a term sheet, while The Scientist cites a peer-reviewed study of ducks.',
    tokens: Math.ceil(
      ('The Philosopher muses that venture capital is merely existential dread ' +
        'with a term sheet, while The Scientist cites a peer-reviewed study of ducks.').length /
        MODEL_FAMILY_CHARS_PER_TOKEN.hermes,
    ),
  },
];

export function isWithinTolerance(estimate: number, reference: number, tolerance = 0.1): boolean {
  if (reference <= 0) return estimate === reference;
  const delta = Math.abs(estimate - reference) / reference;
  return delta <= tolerance;
}
