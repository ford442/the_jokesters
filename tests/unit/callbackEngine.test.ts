import { describe, expect, it } from 'vitest';
import { CallbackEngine } from '../../src/comedy/callbackEngine';

describe('CallbackEngine status transitions', () => {
  it('moves fresh → building → peak → declining → dead', () => {
    const engine = new CallbackEngine();
    engine.registerJoke('banana-peel', ['slapstick', 'fruit']);

    expect(engine.getCallbackMetrics('banana-peel')?.status).toBe('fresh');

    engine.recordCallback('banana-peel');
    expect(engine.getCallbackMetrics('banana-peel')?.status).toBe('building');

    engine.recordCallback('banana-peel');
    expect(engine.getCallbackMetrics('banana-peel')?.status).toBe('building');

    engine.recordCallback('banana-peel');
    expect(engine.getCallbackMetrics('banana-peel')?.status).toBe('peak');

    engine.recordCallback('banana-peel');
    expect(engine.getCallbackMetrics('banana-peel')?.status).toBe('declining');

    engine.recordCallback('banana-peel');
    expect(engine.getCallbackMetrics('banana-peel')?.status).toBe('dead');
  });

  it('peaks callback value at the third use', () => {
    const engine = new CallbackEngine();
    engine.registerJoke('callback-bit', ['meta']);

    const values: number[] = [];
    for (let i = 0; i < 7; i++) {
      const metrics = engine.getCallbackMetrics('callback-bit');
      values.push(metrics?.value ?? 0);
      engine.recordCallback('callback-bit');
    }

    expect(values[3]).toBeGreaterThan(values[0]);
    expect(values[3]).toBeGreaterThan(values[6]);
    expect(values[6]).toBeLessThan(0.5);
  });

  it('indexes jokes by theme', () => {
    const engine = new CallbackEngine();
    engine.registerJoke('tech-joke', ['technology', 'startups']);

    const matches = engine.findByTheme('technology');
    expect(matches).toHaveLength(1);
    expect(matches[0].id).toBe('tech-joke');
  });
});
