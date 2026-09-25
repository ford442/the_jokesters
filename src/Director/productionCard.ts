/**
 * Production grammar for a scene — the *dramatic* layer on top of sceneArc.ts.
 *
 * One ProductionCard per scene, owned by Director: episode beat (cold open → main → tag),
 * pre-defined relationships, secret objectives, and an optional guest NPC. Pure state +
 * transitions only; prompt text lives in productionPrompt.ts (the single compiler).
 */

export type EpisodeBeat = 'cold_open' | 'main' | 'tag';

export interface AgentRelationship {
  a: string;
  b: string;
  /** e.g. 'exes' | 'boss-intern' | 'rivals' */
  label: string;
  /** false → subtext only (hiddenInstruction), never stated outright. */
  public: boolean;
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

export interface GuestNpc {
  name: string;
  /** Which of the five agents lends their voice/turns to the guest. */
  voiceAgentId: string;
  /** Guest is "on stage" once this many turns have completed. */
  entersAfterTurn: number;
}

/** User/mode-supplied card content (timing is derived from the turn budget). */
export interface ProductionCardInput {
  relationships?: AgentRelationship[];
  secrets?: SecretObjective[];
  guestNpc?: GuestNpc;
}

export interface ProductionCard {
  beat: EpisodeBeat;
  relationships: AgentRelationship[];
  secrets: SecretObjectiveState[];
  guestNpc?: GuestNpc;
  guestEntered: boolean;
  /** Turn budget the timing was derived from (null → open-ended, no tag). */
  turnBudget: number | null;
  coldOpenTurns: number;
  tagTurns: number;
  /** Completed turns this scene. */
  turnCount: number;
}

/** Budgets at/above this get a 1-turn cold open; below it, the cold open is skipped. */
export const COLD_OPEN_MIN_BUDGET = 10;

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

export function createProductionCard(turnBudget: number | null, input: ProductionCardInput = {}): ProductionCard {
  const budget = turnBudget && turnBudget > 0 ? turnBudget : null;
  const timing = { turnBudget: budget, ...deriveBeatTiming(budget) };
  const guest = input.guestNpc && input.guestNpc.name?.trim() && input.guestNpc.voiceAgentId
    ? { ...input.guestNpc, name: input.guestNpc.name.trim(), entersAfterTurn: Math.max(0, input.guestNpc.entersAfterTurn | 0) }
    : undefined;
  return {
    ...timing,
    beat: computeBeat(0, timing),
    relationships: sanitizeRelationships(input.relationships),
    secrets: sanitizeSecrets(input.secrets),
    ...(guest ? { guestNpc: guest } : {}),
    guestEntered: guest ? guest.entersAfterTurn === 0 : false,
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
  /** Secrets (by agentId) that flipped to achieved on this turn. */
  secretsAchieved: string[];
}

/**
 * Pure transition after one completed turn: advances turnCount/beat, guest entrance,
 * and the secret-objective heuristic (owner's line mentions a goal keyword).
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
  const guestEntered = !!card.guestNpc && !card.guestEntered && turnCount >= card.guestNpc.entersAfterTurn;
  return {
    card: { ...card, turnCount, beat, secrets, guestEntered: card.guestEntered || guestEntered },
    beatChanged: beat !== card.beat,
    guestEntered,
    secretsAchieved,
  };
}

// ── Episode export ──────────────────────────────────────────────────────────

/** Additive sceneState field version (mirrors SCENE_ARC_SCHEMA_VERSION's independence). */
export const PRODUCTION_SCHEMA_VERSION = 1 as const;

export interface EpisodeProductionSnapshot {
  version: typeof PRODUCTION_SCHEMA_VERSION;
  beat: EpisodeBeat;
  turnBudget: number | null;
  coldOpenTurns: number;
  tagTurns: number;
  turnCount: number;
  relationships: AgentRelationship[];
  secrets: SecretObjectiveState[];
  guestNpc?: GuestNpc;
  guestEntered: boolean;
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
    secrets: card.secrets.map((s) => ({ ...s })),
    ...(card.guestNpc ? { guestNpc: { ...card.guestNpc } } : {}),
    guestEntered: card.guestEntered,
  };
}

const BEATS: readonly EpisodeBeat[] = ['cold_open', 'main', 'tag'];

/** Lenient import of a snapshot from episode JSON; null when it isn't a recognisable v1 snapshot. */
export function parseProductionSnapshot(raw: unknown): EpisodeProductionSnapshot | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== PRODUCTION_SCHEMA_VERSION) return null;
  if (!BEATS.includes(o.beat as EpisodeBeat)) return null;
  const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
  const relationships = Array.isArray(o.relationships)
    ? sanitizeRelationships(o.relationships.filter(
        (r): r is AgentRelationship => !!r && typeof r === 'object' &&
          typeof (r as AgentRelationship).a === 'string' && typeof (r as AgentRelationship).b === 'string' &&
          typeof (r as AgentRelationship).label === 'string'))
    : [];
  const secrets: SecretObjectiveState[] = Array.isArray(o.secrets)
    ? o.secrets
        .filter((s): s is SecretObjectiveState => !!s && typeof s === 'object' &&
          typeof (s as SecretObjective).agentId === 'string' && typeof (s as SecretObjective).goal === 'string')
        .map((s) => ({
          agentId: s.agentId,
          goal: s.goal,
          ...(typeof s.successHint === 'string' ? { successHint: s.successHint } : {}),
          hits: num(s.hits),
          achieved: !!s.achieved,
        }))
    : [];
  const g = o.guestNpc as GuestNpc | undefined;
  const guestNpc = g && typeof g === 'object' && typeof g.name === 'string' && typeof g.voiceAgentId === 'string'
    ? { name: g.name, voiceAgentId: g.voiceAgentId, entersAfterTurn: num(g.entersAfterTurn) }
    : undefined;
  return {
    version: PRODUCTION_SCHEMA_VERSION,
    beat: o.beat as EpisodeBeat,
    turnBudget: typeof o.turnBudget === 'number' ? o.turnBudget : null,
    coldOpenTurns: num(o.coldOpenTurns),
    tagTurns: num(o.tagTurns),
    turnCount: num(o.turnCount),
    relationships,
    secrets,
    ...(guestNpc ? { guestNpc } : {}),
    guestEntered: !!o.guestEntered,
  };
}
