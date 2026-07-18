import { describe, expect, it } from 'vitest';
import {
  applyMemoryHint,
  clampMemoryDepth,
  getContextDepthForMode,
  getDefaultContextDepthForCategory,
  getDirectorCritiqueDepth,
  parseMemoryHint,
  CATEGORY_CONTEXT_DEPTH_DEFAULTS,
  MIN_MEMORY_DEPTH,
  MAX_MEMORY_DEPTH,
} from '../../src/config/contextDepth';
import { ConversationStore } from '../../src/chat/ConversationStore';
import { agents } from '../../src/config/agents';

describe('clampMemoryDepth', () => {
  it('clamps below minimum and above maximum', () => {
    expect(clampMemoryDepth(2)).toBe(MIN_MEMORY_DEPTH);
    expect(clampMemoryDepth(99)).toBe(MAX_MEMORY_DEPTH);
    expect(clampMemoryDepth(15)).toBe(15);
  });
});

describe('applyMemoryHint', () => {
  it('adjusts depth for zoom and recall hints', () => {
    expect(applyMemoryHint(16, 'zoom_in')).toBe(8);
    expect(applyMemoryHint(10, 'zoom_out')).toBe(15);
    expect(applyMemoryHint(20, 'recall:pickles')).toBe(30);
  });
});

describe('parseMemoryHint', () => {
  it('parses known hints and rejects unknown ones', () => {
    expect(parseMemoryHint('zoom_in')).toBe('zoom_in');
    expect(parseMemoryHint('recall:hotdogs')).toBe('recall:hotdogs');
    expect(parseMemoryHint('nonsense')).toBeNull();
  });
});

describe('category defaults', () => {
  it('keeps every category default within allowed range', () => {
    for (const category of Object.keys(CATEGORY_CONTEXT_DEPTH_DEFAULTS) as Array<
      keyof typeof CATEGORY_CONTEXT_DEPTH_DEFAULTS
    >) {
      const depth = getDefaultContextDepthForCategory(category);
      expect(depth).toBeGreaterThanOrEqual(MIN_MEMORY_DEPTH);
      expect(depth).toBeLessThanOrEqual(MAX_MEMORY_DEPTH);
    }
  });
});

describe('getDirectorCritiqueDepth', () => {
  it('scales critique depth with memory depth', () => {
    expect(getDirectorCritiqueDepth(15)).toBe(6);
    expect(getDirectorCritiqueDepth(4)).toBe(4);
  });
});

describe('getContextDepthForMode', () => {
  it('maps estimatedTurns labels relative to category default', () => {
    const improvMode = {
      id: 'improv',
      title: 'Improv',
      category: 'improv' as const,
      description: 'test',
      estimatedTurns: 'short' as const,
    };
    expect(getContextDepthForMode(improvMode)).toBe(11);

    const longPerformance = {
      id: 'roast',
      title: 'Roast',
      category: 'performance' as const,
      description: 'test',
      estimatedTurns: 'long' as const,
    };
    expect(getContextDepthForMode(longPerformance)).toBe(22);
  });

  it('uses numeric estimatedTurns as explicit message budget', () => {
    const trivia = {
      id: 'trivia',
      title: 'Trivia',
      category: 'interactive' as const,
      description: 'test',
      estimatedTurns: 8,
    };
    expect(getContextDepthForMode(trivia)).toBe(8);
  });
});

describe('ConversationStore memory depth', () => {
  const miniAgents = agents.slice(0, 1).map((a) => ({ ...a }));

  it('applies mid-session slider changes on the next turn', () => {
    const store = new ConversationStore(miniAgents);
    store.setMemoryDepth(20);
    for (let i = 0; i < 25; i++) {
      store.addTurn(`user turn ${i}`, `assistant reply ${i}`);
    }

    store.setMemoryDepth(6);
    const { history, depthLimit } = store.prepareHistoryForContext();
    expect(depthLimit).toBe(6);
    expect(history.length).toBe(6);
    expect(history[0].content).toContain('user turn 22')
  });

  it('consumes director memory hints for a single turn', () => {
    const store = new ConversationStore(miniAgents);
    store.setMemoryDepth(16);
    for (let i = 0; i < 20; i++) {
      store.addTurn(`user turn ${i}`, `assistant reply ${i}`);
    }

    store.applyMemoryHint('zoom_in');
    const hinted = store.prepareHistoryForContext();
    expect(hinted.depthLimit).toBe(8);
    expect(hinted.hintLabel).toBe('zoom_in');

    const next = store.prepareHistoryForContext();
    expect(next.depthLimit).toBe(16);
    expect(next.hintLabel).toBeUndefined();
  });

  it('recalls older messages matching a recall theme', () => {
    const store = new ConversationStore(miniAgents);
    store.setMemoryDepth(4);
    store.addTurn('user mentions pickles early', 'assistant agrees about pickles');
    for (let i = 0; i < 12; i++) {
      store.addTurn(`user filler ${i}`, `assistant filler ${i}`);
    }

    store.applyMemoryHint('recall:pickles');
    const { history, depthLimit } = store.prepareHistoryForContext();
    const combined = history.map((m) => m.content).join(' ');
    expect(combined.toLowerCase()).toContain('pickles');
    expect(depthLimit).toBe(6);
    expect(history.length).toBeLessThanOrEqual(6);
  });

  it('prefers scene depth over user slider', () => {
    const store = new ConversationStore(miniAgents);
    store.setMemoryDepth(20);
    store.setSceneMemoryDepth(10);
    for (let i = 0; i < 15; i++) {
      store.addTurn(`user turn ${i}`, `assistant reply ${i}`);
    }

    const { depthLimit, history } = store.prepareHistoryForContext();
    expect(depthLimit).toBe(10);
    expect(history.length).toBe(10);
  });
});
