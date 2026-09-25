import type { SceneAct } from '../Director/sceneArc';
import type { ComedyCallbackStatus } from './ComedySession';

/**
 * Per-turn generation tuning derived from comedy state (scene act, callback heat, beat pacing).
 *
 * Pure + deterministic: no RNG, no GPU, no engine access. The resulting plan is applied by
 * `chatForAgentWithComedy` via `GroupChatManager.chat`'s `sampling` option. Stock web-llm is
 * enough — this only varies standard OpenAI-style sampling params (see issue: Phase A).
 */

/** Setup = establish the premise, punchline = land it tight. */
export type ComedyPacing = 'setup' | 'punchline';

export interface ComedySamplingInput {
  act: SceneAct | null;
  /** Hottest callback currently in play, if any. */
  callback: { status: ComedyCallbackStatus; snippet: string } | null;
  pacing: ComedyPacing;
}

export interface ComedySamplingPlan {
  /** Added to the agent's own temperature (agents keep their personality spread). */
  temperatureDelta: number;
  top_p?: number;
  max_tokens: number;
  /** Absolute presence penalty; undefined keeps the manager default. */
  presence_penalty?: number;
  /** Extra stop strings, appended to the manager's defaults. */
  stop: string[];
  /** Hidden director note (system prompt); empty string when nothing to add. */
  promptSuffix: string;
  /** Short debug label, e.g. "middle/punchline/peak". */
  label: string;
}

export const SETUP_MAX_TOKENS = 160;
export const PUNCHLINE_MAX_TOKENS = 90;
export const CLOSE_ACT_MAX_TOKENS = 70;

export const PEAK_PRESENCE_PENALTY = 0.8;
export const DEAD_PRESENCE_PENALTY = 1.3;

/** Clamp a callback snippet so the hidden note stays short. */
function clip(snippet: string, max = 60): string {
  const s = snippet.replace(/\s+/g, ' ').trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

export function buildComedySamplingPlan(input: ComedySamplingInput): ComedySamplingPlan {
  const { act, callback, pacing } = input;
  const notes: string[] = [];
  let plan: ComedySamplingPlan;

  if (act === 'close') {
    plan = {
      temperatureDelta: -0.1,
      max_tokens: CLOSE_ACT_MAX_TOKENS,
      stop: ['\n\n'],
      promptSuffix: '',
      label: 'close',
    };
    notes.push('Wrap it up: one tight closing line or tag, no new premises.');
  } else if (pacing === 'setup') {
    plan = {
      temperatureDelta: act === 'open' ? 0.15 : 0.1,
      top_p: 0.95,
      max_tokens: SETUP_MAX_TOKENS,
      stop: [],
      promptSuffix: '',
      label: `${act ?? 'none'}/setup`,
    };
  } else {
    plan = {
      temperatureDelta: -0.15,
      top_p: 0.85,
      max_tokens: PUNCHLINE_MAX_TOKENS,
      stop: ['\n\n'],
      promptSuffix: '',
      label: `${act ?? 'none'}/punchline`,
    };
    notes.push('Land the punchline in at most two short sentences.');
  }

  if (callback?.snippet) {
    const snippet = clip(callback.snippet);
    if (callback.status === 'peak') {
      plan.presence_penalty = PEAK_PRESENCE_PENALTY;
      notes.push(`Call back to "${snippet}" with a new twist — don't repeat it word for word.`);
    } else if (callback.status === 'dead') {
      plan.presence_penalty = DEAD_PRESENCE_PENALTY;
      notes.push(`Do NOT reuse the "${snippet}" bit again — it's played out. Find fresh material.`);
    }
    plan.label += `/${callback.status}`;
  }

  plan.promptSuffix = notes.join(' ');
  return plan;
}

/** Setup/punchline rhythm: open act sets up, close act lands, middle alternates by turn. */
export function derivePacing(act: SceneAct | null, turnCount: number): ComedyPacing {
  if (act === 'open') return 'setup';
  if (act === 'close') return 'punchline';
  return turnCount % 2 === 0 ? 'setup' : 'punchline';
}

/** Debug-only: `?comedyDebug` in the page URL. */
export function isComedyDebugEnabled(): boolean {
  try {
    return typeof location !== 'undefined' && new URLSearchParams(location.search).has('comedyDebug');
  } catch {
    return false;
  }
}
