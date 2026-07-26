import { rateJoke } from './qualityFilter';
import type { AllowedSfxName } from '../audio/sfxCatalog';

export type AudienceReactionBand = 'cheer' | 'neutral' | 'groan';

export interface AudienceFeedbackEvent {
  reaction: AudienceReactionBand;
  sfx: AllowedSfxName | null;
  score: number;
}

export interface AudienceFeedbackThresholds {
  /** score >= this → cheer (applause/rimshot) */
  cheerAt: number;
  /** score < this → groan (boo) */
  groanBelow: number;
}

export const DEFAULT_AUDIENCE_FEEDBACK_THRESHOLDS: AudienceFeedbackThresholds = {
  cheerAt: 8,
  groanBelow: 4,
};

/** Minimum time between audience reactions reaching Stage/SFX, to avoid spam on rapid turns. */
export const DEFAULT_AUDIENCE_FEEDBACK_MIN_INTERVAL_MS = 2500;

/**
 * Pure score → { reaction, sfx } mapping. No I/O, no timers — the whole point is that
 * this is trivially unit-testable and reusable from any turn-completion call site
 * (live streaming turns, or prerendered turns being played back later).
 *
 * @param pick injectable RNG source (0-1) for the cheer sfx variety pick / mid-band
 *   chuckle chance, so tests can make the choice deterministic.
 */
export function mapScoreToAudienceFeedback(
  score: number,
  thresholds: AudienceFeedbackThresholds = DEFAULT_AUDIENCE_FEEDBACK_THRESHOLDS,
  pick: () => number = Math.random,
): AudienceFeedbackEvent {
  if (score >= thresholds.cheerAt) {
    const sfx: AllowedSfxName = pick() < 0.5 ? 'applause' : 'rimshot';
    return { reaction: 'cheer', sfx, score };
  }

  if (score < thresholds.groanBelow) {
    return { reaction: 'groan', sfx: 'boo', score };
  }

  // Mid band: a decent-but-not-great line gets an occasional light chuckle, otherwise
  // a quiet neutral beat — never a groan/cheer visual for merely-okay material.
  const sfx: AllowedSfxName | null = score >= thresholds.cheerAt - 2 && pick() < 0.35 ? 'laugh' : null;
  return { reaction: 'neutral', sfx, score };
}

/** Convenience: rate raw text (via qualityFilter.rateJoke) and map it in one call. */
export function scoreTextToAudienceFeedback(
  text: string,
  thresholds?: AudienceFeedbackThresholds,
  pick?: () => number,
): AudienceFeedbackEvent {
  const { score } = rateJoke(text);
  return mapScoreToAudienceFeedback(score, thresholds, pick);
}

export interface AudienceFeedbackSinks {
  triggerReaction: (reaction: AudienceReactionBand) => void;
  playSfx: (name: AllowedSfxName) => void;
}

/**
 * Rate-limited dispatcher: takes an already-mapped AudienceFeedbackEvent and forwards
 * it to Stage/SfxManager, dropping events that arrive faster than minIntervalMs apart
 * so rapid-fire turns can't spam applause/boo. Rate limiting applies uniformly
 * (including no-sfx neutral events) so behavior stays simple and predictable.
 */
export class AudienceFeedbackDriver {
  private lastFiredAt = -Infinity;

  constructor(
    private readonly sinks: AudienceFeedbackSinks,
    private readonly minIntervalMs: number = DEFAULT_AUDIENCE_FEEDBACK_MIN_INTERVAL_MS,
    private readonly now: () => number = Date.now,
  ) {}

  /** Returns true if the event was dispatched, false if it was rate-limited away. */
  handleEvent(event: AudienceFeedbackEvent): boolean {
    const t = this.now();
    if (t - this.lastFiredAt < this.minIntervalMs) return false;
    this.lastFiredAt = t;

    this.sinks.triggerReaction(event.reaction);
    if (event.sfx) this.sinks.playSfx(event.sfx);
    return true;
  }

  /** Score raw text and dispatch in one call (used at actual speak time). */
  handleSpokenText(text: string, thresholds?: AudienceFeedbackThresholds): boolean {
    return this.handleEvent(scoreTextToAudienceFeedback(text, thresholds));
  }
}
