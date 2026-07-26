import { describe, it, expect } from 'vitest';
import {
  createSceneArc,
  updateSceneArc,
  advanceSceneAct,
  summarizeBeat,
  estimateSceneTurnBudget,
  buildArcRecallInjection,
  buildCloseActInstruction,
  buildArcPromptInjection,
  MAX_TRACKED_BEATS,
} from '../../src/Director/sceneArc';
import type { ModeCatalogEntry } from '../../src/Director/modes/registry';

function modeWith(estimatedTurns: ModeCatalogEntry['estimatedTurns']): ModeCatalogEntry {
  return { estimatedTurns } as ModeCatalogEntry;
}

describe('createSceneArc', () => {
  it('defaults to open act with no beats and trims premise', () => {
    const arc = createSceneArc('  A robot falls in love  ');
    expect(arc.premise).toBe('A robot falls in love');
    expect(arc.beats).toEqual([]);
    expect(arc.runningGags).toEqual([]);
    expect(arc.act).toBe('open');
    expect(arc.turnCount).toBe(0);
    expect(arc.estimatedTurns).toBeNull();
  });

  it('rejects zero/negative estimatedTurns as null', () => {
    expect(createSceneArc('x', 0).estimatedTurns).toBeNull();
    expect(createSceneArc('x', -5).estimatedTurns).toBeNull();
    expect(createSceneArc('x', 10).estimatedTurns).toBe(10);
  });
});

describe('estimateSceneTurnBudget', () => {
  it('handles numeric, named, and undefined estimatedTurns', () => {
    expect(estimateSceneTurnBudget(modeWith(12))).toBe(12);
    expect(estimateSceneTurnBudget(modeWith(0))).toBeNull();
    expect(estimateSceneTurnBudget(modeWith('short'))).toBe(8);
    expect(estimateSceneTurnBudget(modeWith('medium'))).toBe(14);
    expect(estimateSceneTurnBudget(modeWith('long'))).toBe(20);
    expect(estimateSceneTurnBudget(modeWith(undefined))).toBeNull();
    expect(estimateSceneTurnBudget(undefined)).toBeNull();
  });
});

describe('summarizeBeat', () => {
  it('returns empty string for blank input', () => {
    expect(summarizeBeat('   ')).toBe('');
    expect(summarizeBeat('')).toBe('');
  });

  it('collapses whitespace and prefers the first sentence when short enough', () => {
    expect(summarizeBeat('Hello   world.  This is more.')).toBe('Hello world.');
  });

  it('truncates long text with an ellipsis', () => {
    const long = 'a'.repeat(200);
    const result = summarizeBeat(long, 140);
    expect(result.length).toBe(140);
    expect(result.endsWith('…')).toBe(true);
  });
});

describe('updateSceneArc', () => {
  it('is a no-op for blank text', () => {
    const arc = createSceneArc('premise');
    const next = updateSceneArc(arc, { agentId: 'comedian', text: '   ' });
    expect(next).toBe(arc);
  });

  it('adds a beat and increments turnCount', () => {
    const arc = createSceneArc('premise');
    const next = updateSceneArc(arc, { agentId: 'comedian', text: 'My job is so boring.' });
    expect(next.turnCount).toBe(1);
    expect(next.beats).toHaveLength(1);
    expect(next.beats[0]).toMatchObject({ turnIndex: 1, agentId: 'comedian' });
    expect(next.beats[0].themes).toContain('work');
  });

  it('caps the rolling beat window at MAX_TRACKED_BEATS', () => {
    let arc = createSceneArc('premise');
    for (let i = 0; i < MAX_TRACKED_BEATS + 5; i++) {
      arc = updateSceneArc(arc, { agentId: 'comedian', text: `Beat number ${i}.` });
    }
    expect(arc.beats).toHaveLength(MAX_TRACKED_BEATS);
    expect(arc.turnCount).toBe(MAX_TRACKED_BEATS + 5);
    expect(arc.beats[0].turnIndex).toBe(6);
  });

  it('only counts a theme as a running gag once it recurs within the window', () => {
    let arc = createSceneArc('premise');
    arc = updateSceneArc(arc, { agentId: 'comedian', text: 'My boss is the worst at the office.' });
    expect(arc.runningGags).not.toContain('work');
    arc = updateSceneArc(arc, { agentId: 'philosopher', text: 'What is the meaning of a career anyway?' });
    expect(arc.runningGags).toContain('work');
  });

  it('computes act boundaries against an estimated turn budget', () => {
    let arc = createSceneArc('premise', 10);
    for (let i = 0; i < 2; i++) {
      arc = updateSceneArc(arc, { agentId: 'a', text: `line ${i}` });
    }
    expect(arc.act).toBe('open');

    for (let i = 0; i < 4; i++) {
      arc = updateSceneArc(arc, { agentId: 'a', text: `line ${i}` });
    }
    expect(arc.turnCount).toBe(6);
    expect(arc.act).toBe('middle');

    for (let i = 0; i < 2; i++) {
      arc = updateSceneArc(arc, { agentId: 'a', text: `line ${i}` });
    }
    expect(arc.turnCount).toBe(8);
    expect(arc.act).toBe('close');
  });

  it('uses a fixed open-turn heuristic when there is no estimated budget', () => {
    let arc = createSceneArc('premise', null);
    arc = updateSceneArc(arc, { agentId: 'a', text: 'first' });
    expect(arc.act).toBe('open');
    arc = updateSceneArc(arc, { agentId: 'a', text: 'second' });
    expect(arc.act).toBe('open');
    arc = updateSceneArc(arc, { agentId: 'a', text: 'third' });
    expect(arc.act).toBe('middle');
  });
});

describe('advanceSceneAct', () => {
  it('advances open -> middle -> close and stays at close', () => {
    let arc = createSceneArc('premise');
    expect(arc.act).toBe('open');
    arc = advanceSceneAct(arc);
    expect(arc.act).toBe('middle');
    arc = advanceSceneAct(arc);
    expect(arc.act).toBe('close');
    arc = advanceSceneAct(arc);
    expect(arc.act).toBe('close');
  });
});

describe('prompt builders', () => {
  it('buildArcRecallInjection returns null with no premise or gags', () => {
    const arc = createSceneArc('');
    expect(buildArcRecallInjection(arc)).toBeNull();
  });

  it('buildArcRecallInjection includes premise and running gags when present', () => {
    const arc = createSceneArc('A tech bro invents a toaster');
    const injection = buildArcRecallInjection(arc);
    expect(injection).toContain('A tech bro invents a toaster');
  });

  it('buildCloseActInstruction includes a callback tag only when a running gag exists', () => {
    const noGags = createSceneArc('premise');
    expect(buildCloseActInstruction(noGags)).not.toContain('Land a final callback');

    let withGags = createSceneArc('premise');
    withGags = updateSceneArc(withGags, { agentId: 'a', text: 'My job is terrible.' });
    withGags = updateSceneArc(withGags, { agentId: 'b', text: 'Careers are a scam.' });
    expect(buildCloseActInstruction(withGags)).toContain('Land a final callback');
    expect(buildCloseActInstruction(withGags)).toContain('work');
  });

  it('buildArcPromptInjection dispatches by act', () => {
    let arc = createSceneArc('A premise');
    expect(buildArcPromptInjection(arc)).toContain('A premise');

    arc = { ...arc, act: 'close' };
    expect(buildArcPromptInjection(arc)).toContain('wrapping up');
  });
});
