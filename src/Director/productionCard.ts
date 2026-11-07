/**
 * Production grammar for a scene — the *dramatic* layer on top of sceneArc.ts.
 *
 * One ProductionCard per scene, owned by Director: episode beat (cold open → main → tag),
 * pre-defined relationships, status, per-agent emotional arc, an optional genre shift, secret
 * objectives, and an optional guest. Pure state + transitions only; prompt text lives in
 * productionPrompt.ts (the single compiler).
 */

import { DEFAULT_VOICE_STYLE, SUPERTONIC_STYLE_IDS, resolveVoiceStyle } from '../audio/voiceMap';
import type { SupertonicStyleId } from '../audio/voiceMap';
import type { ReactionClip } from '../visuals/actorAnimations';
import type { SceneAct } from './sceneArc';

export type EpisodeBeat = 'cold_open' | 'main' | 'tag';

export interface AgentRelationship {
  a: string;
  b: string;
  /** e.g. 'exes' | 'boss-intern' | 'rivals' */
  label: string;
  /** false → subtext only (hiddenInstruction), never stated outright. */
  public: boolean;
}

export type StatusLevel = 'high' | 'peer' | 'low';

/** Status game: how much rank `agentId` holds, optionally relative to one other agent. */
export interface AgentStatus {
  agentId: string;
  level: StatusLevel;
  /** "…relative to this agent" (e.g. level 'low' + target philosopher → the philosopher is the boss). */
  targetId?: string;
  /** Same flag relationships use: false → subtext only, never stated outright. */
  public: boolean;
}

/**
 * Per-agent emotional arc, keyed off the scene's existing act (sceneArc.ts): `start` plays in the
 * opening act, `mid` in the middle, `end` in the closing act. No LLM judge — a lookup.
 */
export interface EmotionalArc {
  agentId: string;
  start: string;
  mid: string;
  end: string;
}

/** A short genre name and the completed-turn count from which the scene plays in it. */
export interface GenreShift {
  genre: string;
  /** Applies once this many turns have completed (0 → from the first turn, no shift cue). */
  atTurn: number;
}

export interface SecretObjective {
  agentId: string;
  /** e.g. 'steer to pickles' */
  goal: string;
  successHint?: string;
}

/** Runtime tracking for a secret — never rendered into the public transcript. */
export interface SecretObjectiveState extends SecretObjective {
  /** Turns by the owning agent that touched a goal keyword. */
  hits: number;
  achieved: boolean;
}

/**
 * A guest on stage for part of the scene. With a `persona` the guest is a real sixth speaker
 * (own stage actor, own lines, own Supertonic style); without one it is the original "costume":
 * `voiceAgentId` lends their voice and turns.
 */
export interface GuestNpc {
  name: string;
  /**
   * Costume guests: which of the five agents lends their voice/turns. Persona guests: the
   * fallback voice when no `voiceStyle` is set.
   */
  voiceAgentId?: string;
  /** Guest is "on stage" once this many turns have completed. */
  entersAfterTurn: number;
  /** Short persona blurb — setting it makes the guest a real sixth speaker. */
  persona?: string;
  /** Supertonic style (M1/M2/F1/F2) for a persona guest. */
  voiceStyle?: SupertonicStyleId;
  /** Guest leaves once this many turns have completed (always after `entersAfterTurn`). */
  exitsAfterTurn?: number;
}

/** User/mode-supplied card content (timing is derived from the turn budget). */
export interface ProductionCardInput {
  relationships?: AgentRelationship[];
  statuses?: AgentStatus[];
  arcs?: EmotionalArc[];
  genreShift?: GenreShift;
  secrets?: SecretObjective[];
  guestNpc?: GuestNpc;
}

export interface ProductionCard {
  beat: EpisodeBeat;
  relationships: AgentRelationship[];
  statuses: AgentStatus[];
  arcs: EmotionalArc[];
  genreShift?: GenreShift;
  /** True once the genre-shift cue has fired (or the shift applied from turn 0, so there was no flip). */
  genreShiftFired: boolean;
  secrets: SecretObjectiveState[];
  guestNpc?: GuestNpc;
  guestEntered: boolean;
  guestExited: boolean;
  /** Turn budget the timing was derived from (null → open-ended, no tag). */
  turnBudget: number | null;
  coldOpenTurns: number;
  tagTurns: number;
  /** Completed turns this scene. */
  turnCount: number;
}

/** Budgets at/above this get a 1-turn cold open; below it, the cold open is skipped. */
export const COLD_OPEN_MIN_BUDGET = 10;

/** Stage id and rotation-exempt identity of the sixth speaker. */
export const GUEST_AGENT_ID = 'guest';

/** While on stage, a persona guest takes the floor on their entrance and every Nth turn after. */
export const GUEST_TURN_INTERVAL = 3;

const MAX_NAME_CHARS = 40;
const MAX_PERSONA_CHARS = 300;
const MAX_LABEL_CHARS = 40;

/**
 * Beat timing from a turn budget: open-ended scenes get neither; short scenes skip the
 * cold open but still land a 1-turn tag; long scenes get a 1-turn cold open + 1-turn tag.
 */
export function deriveBeatTiming(turnBudget: number | null): { coldOpenTurns: number; tagTurns: number } {
  if (!turnBudget || turnBudget < 3) return { coldOpenTurns: 0, tagTurns: 0 };
  return { coldOpenTurns: turnBudget >= COLD_OPEN_MIN_BUDGET ? 1 : 0, tagTurns: 1 };
}

/** Beat for the *next* turn, given how many turns have completed. */
export function computeBeat(
  turnCount: number,
  timing: { turnBudget: number | null; coldOpenTurns: number; tagTurns: number },
): EpisodeBeat {
  if (turnCount < timing.coldOpenTurns) return 'cold_open';
  if (timing.turnBudget && timing.tagTurns > 0 && turnCount >= timing.turnBudget - timing.tagTurns) return 'tag';
  return 'main';
}

function sanitizeRelationships(list: AgentRelationship[] | undefined): AgentRelationship[] {
  return (list ?? [])
    .filter((r) => r && r.a && r.b && r.a !== r.b && r.label?.trim())
    .map((r) => ({ a: r.a, b: r.b, label: r.label.trim(), public: !!r.public }));
}

const STATUS_LEVELS: readonly StatusLevel[] = ['high', 'peer', 'low'];

function sanitizeStatuses(list: AgentStatus[] | undefined): AgentStatus[] {
  return (list ?? [])
    .filter((s) => s && typeof s.agentId === 'string' && s.agentId && STATUS_LEVELS.includes(s.level))
    .map((s) => ({
      agentId: s.agentId,
      level: s.level,
      // A status toward yourself is meaningless — fall back to the room-wide reading.
      ...(s.targetId && s.targetId !== s.agentId ? { targetId: s.targetId } : {}),
      public: !!s.public,
    }));
}

function cleanLabel(v: unknown): string {
  return typeof v === 'string' ? v.trim().slice(0, MAX_LABEL_CHARS) : '';
}

function sanitizeArcs(list: EmotionalArc[] | undefined): EmotionalArc[] {
  return (list ?? [])
    .filter((a) => a && typeof a.agentId === 'string' && a.agentId)
    .map((a) => ({ agentId: a.agentId, start: cleanLabel(a.start), mid: cleanLabel(a.mid), end: cleanLabel(a.end) }))
    .filter((a) => a.start && a.mid && a.end);
}

function sanitizeGenreShift(g: GenreShift | undefined): GenreShift | undefined {
  const genre = typeof g?.genre === 'string' ? g.genre.trim().slice(0, MAX_LABEL_CHARS) : '';
  if (!genre) return undefined;
  const atTurn = typeof g?.atTurn === 'number' && Number.isFinite(g.atTurn) ? Math.max(0, Math.floor(g.atTurn)) : 0;
  return { genre, atTurn };
}

function sanitizeSecrets(list: SecretObjective[] | undefined): SecretObjectiveState[] {
  return (list ?? [])
    .filter((s) => s && s.agentId && s.goal?.trim())
    .map((s) => ({
      agentId: s.agentId,
      goal: s.goal.trim(),
      ...(s.successHint?.trim() ? { successHint: s.successHint.trim() } : {}),
      hits: 0,
      achieved: false,
    }));
}

function turnNumber(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.floor(v)) : undefined;
}

/** A guest needs a name and either a persona (sixth speaker) or a voice-lending agent (costume). */
function sanitizeGuest(g: Partial<GuestNpc> | undefined): GuestNpc | undefined {
  const name = typeof g?.name === 'string' ? g.name.trim().slice(0, MAX_NAME_CHARS) : '';
  if (!g || !name) return undefined;
  const persona = typeof g.persona === 'string' ? g.persona.trim().slice(0, MAX_PERSONA_CHARS) : '';
  const voiceAgentId = typeof g.voiceAgentId === 'string' && g.voiceAgentId ? g.voiceAgentId : undefined;
  if (!persona && !voiceAgentId) return undefined;
  const entersAfterTurn = turnNumber(g.entersAfterTurn) ?? 0;
  const exits = turnNumber(g.exitsAfterTurn);
  const voiceStyle = SUPERTONIC_STYLE_IDS.includes(g.voiceStyle as SupertonicStyleId) ? g.voiceStyle : undefined;
  return {
    name,
    ...(voiceAgentId ? { voiceAgentId } : {}),
    entersAfterTurn,
    ...(persona ? { persona } : {}),
    ...(persona && voiceStyle ? { voiceStyle } : {}),
    // Leaving before (or as) you arrive is a typo, not a choreography: stay for at least one turn.
    ...(exits !== undefined ? { exitsAfterTurn: Math.max(exits, entersAfterTurn + 1) } : {}),
  };
}

export function createProductionCard(turnBudget: number | null, input: ProductionCardInput = {}): ProductionCard {
  const budget = turnBudget && turnBudget > 0 ? turnBudget : null;
  const timing = { turnBudget: budget, ...deriveBeatTiming(budget) };
  const guest = sanitizeGuest(input.guestNpc);
  const genreShift = sanitizeGenreShift(input.genreShift);
  return {
    ...timing,
    beat: computeBeat(0, timing),
    relationships: sanitizeRelationships(input.relationships),
    statuses: sanitizeStatuses(input.statuses),
    arcs: sanitizeArcs(input.arcs),
    ...(genreShift ? { genreShift } : {}),
    // A scene that starts in its genre never "flips", so there is nothing to cue.
    genreShiftFired: !!genreShift && genreShift.atTurn <= 0,
    secrets: sanitizeSecrets(input.secrets),
    ...(guest ? { guestNpc: guest } : {}),
    guestEntered: guest ? guest.entersAfterTurn === 0 : false,
    guestExited: false,
    turnCount: 0,
  };
}

/** Re-derive timing for a new budget (e.g. a mode loop declaring its real length); keeps content. */
export function setProductionTurnBudget(card: ProductionCard, turnBudget: number | null): ProductionCard {
  const budget = turnBudget && turnBudget > 0 ? turnBudget : null;
  const timing = { turnBudget: budget, ...deriveBeatTiming(budget) };
  return { ...card, ...timing, beat: computeBeat(card.turnCount, timing) };
}

/** Add relationships only when the card has none yet (mode defaults never override the user's). */
export function withDefaultRelationships(card: ProductionCard, defaults: AgentRelationship[]): ProductionCard {
  if (card.relationships.length > 0) return card;
  return { ...card, relationships: sanitizeRelationships(defaults) };
}

// ── Genre shift ─────────────────────────────────────────────────────────────

/** True from the turn the shift begins on. */
export function isGenreShiftActive(card: ProductionCard): boolean {
  return !!card.genreShift && card.turnCount >= card.genreShift.atTurn;
}

/**
 * Set (or replace) the genre shift — the mode's hook, and where a later audience vote lands.
 * Re-arms the cue; call {@link consumeGenreFlip} to learn whether it is already due. Deliberately
 * touches nothing else on the card (and the scene-arc memory lives elsewhere entirely).
 */
export function setGenreShift(card: ProductionCard, genre: string, atTurn: number): ProductionCard {
  const shift = sanitizeGenreShift({ genre, atTurn });
  if (!shift) return card;
  return { ...card, genreShift: shift, genreShiftFired: false };
}

/** If the shift has begun and its cue has not fired, mark it fired and report the flip (once). */
export function consumeGenreFlip(card: ProductionCard): { card: ProductionCard; flipped: boolean } {
  if (!card.genreShift || card.genreShiftFired || !isGenreShiftActive(card)) return { card, flipped: false };
  return { card: { ...card, genreShiftFired: true }, flipped: true };
}

// ── Emotional arc ───────────────────────────────────────────────────────────

/** The arc label for an act: open → start, middle → mid, close → end. */
export function arcLabelForAct(arc: EmotionalArc, act: SceneAct): string {
  return act === 'open' ? arc.start : act === 'middle' ? arc.mid : arc.end;
}

/**
 * Parse "angry → confused → pleased" (also `->`, `>`, `,`). Needs at least a start and an end;
 * with two labels the middle act holds the start emotion and the turn lands at the close.
 */
export function parseEmotionArc(agentId: string, text: string): EmotionalArc | null {
  const parts = text.split(/\s*(?:→|->|=>|>|,)\s*/).map((p) => p.trim()).filter(Boolean);
  if (!agentId || parts.length < 2) return null;
  const [start, second, third] = parts;
  const arc = sanitizeArcs([{
    agentId,
    start,
    mid: parts.length >= 3 ? second : start,
    end: parts.length >= 3 ? third : second,
  }]);
  return arc[0] ?? null;
}

/**
 * Words that map to a reaction clip the actors already play. Typed against the actors' own
 * `ReactionClip` so a renamed clip fails the build instead of silently going quiet.
 */
const EMOTION_CLIPS = {
  laugh: 'laugh', amused: 'laugh', delighted: 'laugh', happy: 'laugh', joyful: 'laugh', gleeful: 'laugh',
  think: 'think', confused: 'think', puzzled: 'think', curious: 'think', thoughtful: 'think',
  gasp: 'gasp', shocked: 'gasp', surprised: 'gasp', astonished: 'gasp', horrified: 'gasp',
  angry: 'angry', furious: 'angry', enraged: 'angry', irate: 'angry', livid: 'angry',
  deadpan: 'deadpan', bored: 'deadpan', flat: 'deadpan', stoic: 'deadpan', unimpressed: 'deadpan',
  facepalm: 'facepalm', embarrassed: 'facepalm', mortified: 'facepalm', exasperated: 'facepalm',
  eyeroll: 'eyeroll', annoyed: 'eyeroll', sarcastic: 'eyeroll', dismissive: 'eyeroll',
  nod: 'nod', pleased: 'nod', satisfied: 'nod', agreeable: 'nod', content: 'nod', approving: 'nod',
  bounce: 'bounce', excited: 'bounce', thrilled: 'bounce', giddy: 'bounce', elated: 'bounce',
  shrug: 'shrug', resigned: 'shrug', indifferent: 'shrug', defeated: 'shrug', apathetic: 'shrug',
} as const satisfies Record<string, ReactionClip>;

/**
 * `[clip]` director tag for an emotion label the actors understand (exact clip name or a close
 * synonym), else null. Feeds `onReactToText`, whose tag parser takes it ahead of keyword guesses.
 */
export function emotionTagFor(label: string): string | null {
  const key = label.trim().toLowerCase();
  const clip = Object.prototype.hasOwnProperty.call(EMOTION_CLIPS, key)
    ? EMOTION_CLIPS[key as keyof typeof EMOTION_CLIPS]
    : null;
  return clip ? `[${clip}]` : null;
}

/** Tag for this agent's emotion in the current act, or null (no arc, no act, or no matching clip). */
export function arcEmotionTag(card: ProductionCard, agentId: string, act: SceneAct | null | undefined): string | null {
  if (!act) return null;
  const arc = card.arcs.find((a) => a.agentId === agentId);
  return arc ? emotionTagFor(arcLabelForAct(arc, act)) : null;
}

// ── Guest ───────────────────────────────────────────────────────────────────

/** True while the guest is between their entrance and exit. */
export function isGuestOnStage(card: ProductionCard): boolean {
  return !!card.guestNpc && card.guestEntered && !card.guestExited;
}

/** A persona guest is a real sixth speaker; a costume guest only borrows an agent's turns. */
export function isGuestSpeaker(guest: GuestNpc | undefined): guest is GuestNpc & { persona: string } {
  return !!guest?.persona;
}

/** Does the guest take the floor on the next turn? Entrance line first, then every Nth turn. */
export function isGuestTurn(card: ProductionCard): boolean {
  const guest = card.guestNpc;
  if (!isGuestOnStage(card) || !isGuestSpeaker(guest)) return false;
  return (card.turnCount - guest.entersAfterTurn) % GUEST_TURN_INTERVAL === 0;
}

/** Supertonic style for the guest: their own, else the borrowed agent's, else the default voice. */
export function guestVoiceStyle(guest: GuestNpc): SupertonicStyleId {
  if (guest.voiceStyle) return guest.voiceStyle;
  return guest.voiceAgentId ? resolveVoiceStyle(guest.voiceAgentId) : DEFAULT_VOICE_STYLE;
}

// ── Secrets ─────────────────────────────────────────────────────────────────

const GOAL_STOPWORDS = new Set([
  'steer', 'the', 'and', 'into', 'onto', 'with', 'that', 'this', 'about', 'conversation', 'scene',
  'talk', 'make', 'get', 'someone', 'everyone', 'mention', 'bring', 'topic', 'least', 'once', 'your',
]);

/** Cheap keyword extract for goal tracking: lowercase words ≥4 chars, minus filler. */
export function goalKeywords(goal: string): string[] {
  const words = goal.toLowerCase().match(/[a-z][a-z'-]{3,}/g) ?? [];
  const out = new Set<string>();
  for (const w of words) {
    if (GOAL_STOPWORDS.has(w)) continue;
    out.add(w.endsWith('s') && w.length > 4 ? w.slice(0, -1) : w);
  }
  return [...out];
}

export interface ProductionTurnResult {
  card: ProductionCard;
  beatChanged: boolean;
  guestEntered: boolean;
  guestExited: boolean;
  /** The genre shift began with this turn's completion (fires once). */
  genreFlipped: boolean;
  /** Secrets (by agentId) that flipped to achieved on this turn. */
  secretsAchieved: string[];
}

/**
 * Pure transition after one completed turn: advances turnCount/beat, guest entrance/exit,
 * the genre flip, and the secret-objective heuristic (owner's line mentions a goal keyword).
 */
export function recordProductionTurn(card: ProductionCard, agentId: string, text: string): ProductionTurnResult {
  const turnCount = card.turnCount + 1;
  const beat = computeBeat(turnCount, card);
  const lower = text.toLowerCase();
  const secretsAchieved: string[] = [];
  const secrets = card.secrets.map((s) => {
    if (s.agentId !== agentId) return s;
    const hit = goalKeywords(s.goal).some((k) => lower.includes(k));
    if (!hit) return s;
    if (!s.achieved) secretsAchieved.push(s.agentId);
    return { ...s, hits: s.hits + 1, achieved: true };
  });
  const guest = card.guestNpc;
  const guestEntered = !!guest && !card.guestEntered && turnCount >= guest.entersAfterTurn;
  const nowEntered = card.guestEntered || guestEntered;
  const guestExited = !!guest && nowEntered && !card.guestExited
    && guest.exitsAfterTurn !== undefined && turnCount >= guest.exitsAfterTurn;
  const advanced: ProductionCard = {
    ...card,
    turnCount,
    beat,
    secrets,
    guestEntered: nowEntered,
    guestExited: card.guestExited || guestExited,
  };
  const { card: next, flipped } = consumeGenreFlip(advanced);
  return {
    card: next,
    beatChanged: beat !== card.beat,
    guestEntered,
    guestExited,
    genreFlipped: flipped,
    secretsAchieved,
  };
}

// ── Episode export ──────────────────────────────────────────────────────────

/**
 * Additive sceneState field version (mirrors SCENE_ARC_SCHEMA_VERSION's independence).
 * v2 adds statuses, arcs, genreShift, guestExited and the guest persona/voice/exit fields;
 * v1 snapshots still import (the new fields default to empty).
 */
export const PRODUCTION_SCHEMA_VERSION = 2 as const;

export interface EpisodeProductionSnapshot {
  version: typeof PRODUCTION_SCHEMA_VERSION;
  beat: EpisodeBeat;
  turnBudget: number | null;
  coldOpenTurns: number;
  tagTurns: number;
  turnCount: number;
  relationships: AgentRelationship[];
  statuses: AgentStatus[];
  arcs: EmotionalArc[];
  genreShift?: GenreShift;
  genreShiftFired: boolean;
  secrets: SecretObjectiveState[];
  guestNpc?: GuestNpc;
  guestEntered: boolean;
  guestExited: boolean;
}

export function snapshotProductionCard(card: ProductionCard): EpisodeProductionSnapshot {
  return {
    version: PRODUCTION_SCHEMA_VERSION,
    beat: card.beat,
    turnBudget: card.turnBudget,
    coldOpenTurns: card.coldOpenTurns,
    tagTurns: card.tagTurns,
    turnCount: card.turnCount,
    relationships: card.relationships.map((r) => ({ ...r })),
    statuses: card.statuses.map((s) => ({ ...s })),
    arcs: card.arcs.map((a) => ({ ...a })),
    ...(card.genreShift ? { genreShift: { ...card.genreShift } } : {}),
    genreShiftFired: card.genreShiftFired,
    secrets: card.secrets.map((s) => ({ ...s })),
    ...(card.guestNpc ? { guestNpc: { ...card.guestNpc } } : {}),
    guestEntered: card.guestEntered,
    guestExited: card.guestExited,
  };
}

const BEATS: readonly EpisodeBeat[] = ['cold_open', 'main', 'tag'];
/** Snapshot versions this build can read (older ones simply lack the newer fields). */
const READABLE_PRODUCTION_VERSIONS: readonly number[] = [1, PRODUCTION_SCHEMA_VERSION];

function objectsOf(v: unknown): Record<string, unknown>[] {
  return Array.isArray(v) ? v.filter((x): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x)) : [];
}

/**
 * Lenient import of a snapshot from episode JSON; null when it isn't a recognisable v1/v2
 * snapshot. A v1 snapshot comes back as v2 with the new fields empty.
 */
export function parseProductionSnapshot(raw: unknown): EpisodeProductionSnapshot | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (!READABLE_PRODUCTION_VERSIONS.includes(o.version as number)) return null;
  if (!BEATS.includes(o.beat as EpisodeBeat)) return null;
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
  const str = (v: unknown) => (typeof v === 'string' ? v : '');
  const relationships = sanitizeRelationships(
    objectsOf(o.relationships)
      .filter((r) => typeof r.a === 'string' && typeof r.b === 'string' && typeof r.label === 'string')
      .map((r) => r as unknown as AgentRelationship),
  );
  const secrets: SecretObjectiveState[] = objectsOf(o.secrets)
    .filter((s) => typeof s.agentId === 'string' && typeof s.goal === 'string')
    .map((s) => ({
      agentId: s.agentId as string,
      goal: s.goal as string,
      ...(typeof s.successHint === 'string' ? { successHint: s.successHint } : {}),
      hits: num(s.hits),
      achieved: !!s.achieved,
    }));
  const statuses = sanitizeStatuses(
    objectsOf(o.statuses).map((s) => ({
      agentId: str(s.agentId),
      level: s.level as StatusLevel,
      targetId: str(s.targetId) || undefined,
      public: !!s.public,
    })),
  );
  const arcs = sanitizeArcs(
    objectsOf(o.arcs).map((a) => ({ agentId: str(a.agentId), start: str(a.start), mid: str(a.mid), end: str(a.end) })),
  );
  const g = objectsOf([o.guestNpc])[0];
  const guestNpc = g
    ? sanitizeGuest({
        name: str(g.name),
        voiceAgentId: str(g.voiceAgentId) || undefined,
        entersAfterTurn: num(g.entersAfterTurn),
        persona: str(g.persona) || undefined,
        voiceStyle: g.voiceStyle as SupertonicStyleId | undefined,
        exitsAfterTurn: turnNumber(g.exitsAfterTurn),
      })
    : undefined;
  const genreShift = objectsOf([o.genreShift])[0]
    ? sanitizeGenreShift({ genre: str((o.genreShift as Record<string, unknown>).genre), atTurn: num((o.genreShift as Record<string, unknown>).atTurn) })
    : undefined;
  return {
    version: PRODUCTION_SCHEMA_VERSION,
    beat: o.beat as EpisodeBeat,
    turnBudget: typeof o.turnBudget === 'number' ? o.turnBudget : null,
    coldOpenTurns: num(o.coldOpenTurns),
    tagTurns: num(o.tagTurns),
    turnCount: num(o.turnCount),
    relationships,
    statuses,
    arcs,
    ...(genreShift ? { genreShift } : {}),
    genreShiftFired: !!o.genreShiftFired,
    secrets,
    ...(guestNpc ? { guestNpc } : {}),
    guestEntered: !!o.guestEntered,
    guestExited: !!o.guestExited,
  };
}
