import {
  CallbackEngine,
  getGlobalCallbackEngine,
  resetGlobalCallbackEngine,
  type CallbackMetrics,
} from './callbackEngine';
import { rateJoke } from './qualityFilter';
import { getRandomJoke } from './jokeLoader';
import type { JokeBit } from './jokeLoader';

export type ComedyCallbackStatus = CallbackMetrics['status'];

export interface ComedyQualityResult {
  passed: boolean;
  score: number;
  qualityPrompt?: string;
  alternative?: JokeBit;
}

export interface ComedySessionOptions {
  onCallbackVisual?: (
    agentId: string,
    jokeId: string,
    count: number,
    status: ComedyCallbackStatus,
  ) => void;
  /** When false, rateAndMaybeRetry still scores but never suggests re-prompts. */
  qualityGating?: boolean;
}

const QUALITY_THRESHOLD = 6;
const MAX_QUALITY_FALLBACKS = 3;

const THEME_PATTERNS: Record<string, RegExp[]> = {
  tech: [/tech/, /computer/, /ai/, /algorithm/, /code/, /app/],
  relationships: [/dating/, /marriage/, /boyfriend/, /girlfriend/, /single/],
  work: [/job/, /boss/, /office/, /work/, /career/, /startup/],
  money: [/money/, /rich/, /poor/, /expensive/, /cheap/],
  food: [/food/, /eat/, /restaurant/, /cook/, /meal/],
  existential: [/life/, /death/, /meaning/, /purpose/, /universe/],
};

/**
 * Shared comedy memory for a scene: callbacks, quality gating, theme tracking.
 */
export class ComedySession {
  private engine: CallbackEngine;
  private registeredJokes = new Set<string>();
  private fallbackAttempts = 0;
  private turnCount = 0;
  private readonly onCallbackVisual?: ComedySessionOptions['onCallbackVisual'];
  private readonly qualityGating: boolean;

  constructor(options?: ComedySessionOptions) {
    this.engine = getGlobalCallbackEngine();
    this.onCallbackVisual = options?.onCallbackVisual;
    this.qualityGating = options?.qualityGating ?? true;
  }

  reset(): void {
    resetGlobalCallbackEngine();
    this.engine = getGlobalCallbackEngine();
    this.registeredJokes.clear();
    this.fallbackAttempts = 0;
    this.turnCount = 0;
  }

  getTurnCount(): number {
    return this.turnCount;
  }

  incrementTurn(): void {
    this.turnCount += 1;
  }

  /**
   * Register a joke theme with optional context snippet.
   */
  recordJoke(theme: string | string[], text: string, agentId?: string): string | null {
    const themes = (Array.isArray(theme) ? theme : [theme]).filter(Boolean);
    if (themes.length === 0) return null;

    const jokeId = `joke_${this.turnCount}_${Date.now()}`;
    this.engine.registerJoke(jokeId, themes, text.substring(0, 100));
    this.registeredJokes.add(jokeId);

    if (agentId && this.onCallbackVisual) {
      this.onCallbackVisual(agentId, jokeId, 0, 'fresh');
    }

    return jokeId;
  }

  /**
   * Extract themes from agent text, register jokes, and detect callbacks to earlier bits.
   */
  handleAgentResponse(text: string, agentId?: string): void {
    const beforeIds = new Set(Object.keys(this.engine.export()));
    const themes = extractThemes(text);
    if (themes.length > 0) {
      this.recordJoke(themes, text, agentId);
    }
    this.detectCallbacksInResponse(text, agentId, beforeIds);
    this.incrementTurn();
  }

  /**
   * Return a director prompt fragment suggesting a callback, or null.
   */
  suggestCallback(): string | null {
    const peakCallbacks = this.engine.getPeakCallbacks();
    if (peakCallbacks.length > 0) {
      const callback = peakCallbacks[0];
      const snippet = callback.contextSnippets.at(-1);
      if (snippet) {
        return `(SYSTEM: Reference this earlier bit: "${snippet}" - bring it back for a callback!)`;
      }
    }

    const allJokes = Object.values(this.engine.export());
    const building = allJokes.filter((j) => j.callbackCount >= 1 && j.callbackCount < 3);

    const themes = this.engine.getAllThemes();
    for (const theme of themes) {
      const best = this.engine.getBestCallbackForTheme(theme);
      if (best && best.callbackCount > 0 && best.callbackCount < 5) {
        const snippet = best.contextSnippets.at(-1);
        if (snippet) {
          return `(SYSTEM: Callback opportunity on "${theme}": "${snippet}" — weave it back in!)`;
        }
      }
    }

    if (building.length > 0) {
      const joke = building[0];
      const snippet = joke.contextSnippets.at(-1);
      if (snippet) {
        return `(SYSTEM: Build on your earlier "${snippet}" bit — audience remembers it!)`;
      }
    }

    return null;
  }

  /**
   * Maybe append a callback prompt based on probability (0–1).
   */
  maybeInjectCallbackPrompt(probability = 0.3): string | null {
    if (Math.random() >= probability) return null;
    return this.suggestCallback();
  }

  /**
   * Cheap synchronous quality check. Async-safe: no awaits unless fallback joke needed.
   */
  rateAndMaybeRetry(text: string): ComedyQualityResult {
    const rating = rateJoke(text);
    const passed = rating.score >= QUALITY_THRESHOLD;

    if (!this.qualityGating || passed) {
      if (passed) this.fallbackAttempts = 0;
      return { passed, score: rating.score };
    }

    if (this.fallbackAttempts < MAX_QUALITY_FALLBACKS) {
      this.fallbackAttempts += 1;
      return {
        passed: false,
        score: rating.score,
        qualityPrompt: this.getQualityPrompt(rating.score),
      };
    }

    return { passed: false, score: rating.score, qualityPrompt: this.getQualityPrompt(rating.score) };
  }

  /**
   * Async variant when a fallback joke bit may be fetched.
   */
  async rateAndMaybeRetryAsync(text: string): Promise<ComedyQualityResult> {
    const result = this.rateAndMaybeRetry(text);
    if (!result.passed && this.qualityGating && this.fallbackAttempts <= MAX_QUALITY_FALLBACKS) {
      const alternative = await getRandomJoke();
      return { ...result, alternative };
    }
    return result;
  }

  getQualityPrompt(score: number): string {
    if (score < 4) {
      return '(SYSTEM: That was weak. Punch it up with something surprising or unexpected!)';
    }
    if (score < QUALITY_THRESHOLD) {
      return '(SYSTEM: Add a twist or subvert expectations. Make it land harder!)';
    }
    return '';
  }

  getSummary(): string {
    return this.engine.getSummary();
  }

  private detectCallbacksInResponse(
    text: string,
    agentId: string | undefined,
    existingBeforeTurn: Set<string>,
  ): void {
    const lower = text.toLowerCase();

    for (const joke of Object.values(this.engine.export())) {
      if (!existingBeforeTurn.has(joke.id)) continue;

      const referencesTheme = joke.themes.some((theme) => {
        const words = theme.split(/\s+/);
        return words.some((word) => word.length > 3 && lower.includes(word));
      });

      const referencesSnippet = joke.contextSnippets.some((snippet) => {
        const key = snippet.toLowerCase().slice(0, 30);
        return key.length > 10 && lower.includes(key.slice(0, 15));
      });

      if (referencesTheme || referencesSnippet) {
        this.recordCallback(joke.id, agentId);
      }
    }
  }

  private recordCallback(jokeId: string, agentId?: string): void {
    this.engine.recordCallback(jokeId);
    const metrics = this.engine.getCallbackMetrics(jokeId);
    if (metrics && agentId && this.onCallbackVisual) {
      this.onCallbackVisual(agentId, jokeId, metrics.timesUsed, metrics.status);
    }
  }
}

/** Extract comedy themes from free-form agent text. */
export function extractThemes(text: string): string[] {
  const lower = text.toLowerCase();
  const matched: string[] = [];

  for (const [theme, patterns] of Object.entries(THEME_PATTERNS)) {
    if (patterns.some((pattern) => pattern.test(lower))) {
      matched.push(theme);
    }
  }

  return matched;
}

export function getCallbackBadgeLabel(status: ComedyCallbackStatus, count: number): string {
  const icons: Record<ComedyCallbackStatus, string> = {
    fresh: '✨',
    building: '📈',
    peak: '🔥',
    declining: '📉',
    dead: '💀',
  };
  const label = icons[status] ?? '✨';
  return count > 0 ? `${label} x${count}` : label;
}
