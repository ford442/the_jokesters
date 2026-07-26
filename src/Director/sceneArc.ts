import { extractThemes } from '../comedy/ComedySession';
import type { ModeCatalogEntry } from './modes/registry';

/** Rolling narrative act, derived from turnCount vs. estimatedTurns. */
export type SceneAct = 'open' | 'middle' | 'close';

export interface SceneBeat {
  turnIndex: number;
  agentId: string;
  /** Cheap heuristic extract (first sentence or a hard clamp) — never an LLM call. */
  summary: string;
  themes: string[];
}

export interface SceneArcState {
  premise: string;
  /** Rolling window — oldest beats fall off past MAX_TRACKED_BEATS. */
  beats: SceneBeat[];
  /** Themes recurring at least twice within the current rolling beat window. */
  runningGags: string[];
  act: SceneAct;
  turnCount: number;
  /** Turn budget for this scene, if the mode's estimatedTurns metadata resolved to one. */
  estimatedTurns: number | null;
}

/** Keep the arc "short" per the design brief — only the most recent beats are tracked. */
export const MAX_TRACKED_BEATS = 12;

/** Below this fraction of the turn budget, the scene is still opening. */
export const ACT_OPEN_FRACTION = 0.25;
/** At/above this fraction of the turn budget, force the closing act. */
export const ACT_CLOSE_FRACTION = 0.75;

/** Turns-without-a-budget heuristic: stay "open" for this many turns, then "middle". */
const NO_BUDGET_OPEN_TURNS = 2;

export function createSceneArc(premise: string, estimatedTurns: number | null = null): SceneArcState {
  return {
    premise: premise.trim(),
    beats: [],
    runningGags: [],
    act: 'open',
    turnCount: 0,
    estimatedTurns: estimatedTurns && estimatedTurns > 0 ? estimatedTurns : null,
  };
}

/** Maps a mode registry entry's estimatedTurns (number | short/medium/long | undefined) to a turn budget. */
export function estimateSceneTurnBudget(mode: ModeCatalogEntry | undefined): number | null {
  const turns = mode?.estimatedTurns;
  if (typeof turns === 'number') return turns > 0 ? turns : null;
  switch (turns) {
    case 'short':
      return 8;
    case 'long':
      return 20;
    case 'medium':
      return 14;
    default:
      return null;
  }
}

/** Cheap heuristic beat summary: first sentence if short enough, else a hard character clamp. */
export function summarizeBeat(text: string, maxLen = 140): string {
  const clean = text.trim().replace(/\s+/g, ' ');
  if (!clean) return '';
  const firstSentenceMatch = clean.match(/^[^.!?]*[.!?]/);
  const firstSentence = firstSentenceMatch?.[0]?.trim();
  const candidate = firstSentence && firstSentence.length <= maxLen ? firstSentence : clean;
  return candidate.length > maxLen ? `${candidate.slice(0, maxLen - 1)}…` : candidate;
}

function computeAct(turnCount: number, estimatedTurns: number | null): SceneAct {
  if (!estimatedTurns) {
    return turnCount <= NO_BUDGET_OPEN_TURNS ? 'open' : 'middle';
  }
  const fraction = turnCount / estimatedTurns;
  if (fraction >= ACT_CLOSE_FRACTION) return 'close';
  if (fraction < ACT_OPEN_FRACTION) return 'open';
  return 'middle';
}

export interface SceneBeatInput {
  agentId: string;
  text: string;
}

/**
 * Pure state transition: records one turn's heuristic summary/themes, recomputes
 * running gags (within the rolling beat window) and the current act. No I/O, no LLM.
 */
export function updateSceneArc(state: SceneArcState, input: SceneBeatInput): SceneArcState {
  const summary = summarizeBeat(input.text);
  if (!summary) return state;

  const turnCount = state.turnCount + 1;
  const themes = extractThemes(input.text);

  const beats = [...state.beats, { turnIndex: turnCount, agentId: input.agentId, summary, themes }];
  const rolling = beats.length > MAX_TRACKED_BEATS ? beats.slice(beats.length - MAX_TRACKED_BEATS) : beats;

  const themeCounts = new Map<string, number>();
  for (const beat of rolling) {
    for (const theme of beat.themes) {
      themeCounts.set(theme, (themeCounts.get(theme) ?? 0) + 1);
    }
  }
  const runningGags = [...themeCounts.entries()]
    .filter(([, count]) => count >= 2)
    .map(([theme]) => theme);

  return {
    ...state,
    beats: rolling,
    runningGags,
    turnCount,
    act: computeAct(turnCount, state.estimatedTurns),
  };
}

/** Force the act forward a step (open→middle→close), independent of the turn-budget math. */
export function advanceSceneAct(state: SceneArcState): SceneArcState {
  if (state.act === 'open') return { ...state, act: 'middle' };
  if (state.act === 'middle') return { ...state, act: 'close' };
  return state;
}

/**
 * Director-style prompt fragment referencing the premise + recurring bits, for prompt
 * injection so agents can "remember" earlier beats without a full LLM summarization call.
 * Returns null when there's nothing worth recalling yet.
 */
export function buildArcRecallInjection(state: SceneArcState): string | null {
  if (!state.premise && state.runningGags.length === 0) return null;

  const parts: string[] = [];
  if (state.premise) parts.push(`Scene premise: "${state.premise}".`);
  if (state.runningGags.length > 0) {
    parts.push(`Running bits so far: ${state.runningGags.join(', ')} — callback to one if it fits.`);
  }
  if (parts.length === 0) return null;
  return `(SCENE MEMORY: ${parts.join(' ')})`;
}

/** Close-act guidance: nudge agents toward a tag/payoff instead of opening new threads. */
export function buildCloseActInstruction(state: SceneArcState): string {
  const gag = state.runningGags[0];
  const tag = gag ? ` Land a final callback to the "${gag}" bit for a satisfying tag.` : '';
  return `(SYSTEM: The scene is wrapping up — start moving toward a strong closing beat instead of opening new threads.${tag})`;
}

/** The single prompt fragment a caller should inject for the current act. */
export function buildArcPromptInjection(state: SceneArcState): string | null {
  if (state.act === 'close') return buildCloseActInstruction(state);
  return buildArcRecallInjection(state);
}
