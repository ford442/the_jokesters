import { describe, expect, it } from 'vitest';
import { rateJoke } from '../../src/comedy/qualityFilter';

describe('qualityFilter.rateJoke', () => {
  it('scores cliché jokes below surprise threshold', () => {
    const rating = rateJoke('Why did the chicken cross the road? To get to the other side.');
    expect(rating.score).toBeLessThanOrEqual(5);
    expect(rating.surpriseMetrics.originalityScore).toBeLessThanOrEqual(5);
  });

  it('scores subversive wordplay higher than clichés', () => {
    const cliché = rateJoke('A man walks into a bar. Ouch.');
    const clever = rateJoke(
      'I told my therapist I have a fear of speed bumps… but I\'m slowly getting over it.',
    );

    expect(clever.score).toBeGreaterThan(cliché.score);
    expect(clever.surpriseMetrics.subversionScore).toBeGreaterThanOrEqual(cliché.surpriseMetrics.subversionScore);
  });

  it('returns scores in 1–10 range with metric breakdown', () => {
    const rating = rateJoke('They said lightning never strikes twice… so I bought two lottery tickets.');
    expect(rating.score).toBeGreaterThanOrEqual(1);
    expect(rating.score).toBeLessThanOrEqual(10);
    expect(rating.surpriseMetrics).toMatchObject({
      subversionScore: expect.any(Number),
      wordplayScore: expect.any(Number),
      timingScore: expect.any(Number),
      originalityScore: expect.any(Number),
    });
    expect(Array.isArray(rating.suggestions)).toBe(true);
  });
});
