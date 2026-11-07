import {
  GUEST_AGENT_ID,
  arcLabelForAct,
  isGenreShiftActive,
  isGuestOnStage,
  isGuestSpeaker,
} from './productionCard';
import type { AgentStatus, GuestNpc, ProductionCard, StatusLevel } from './productionCard';
import type { SceneAct } from './sceneArc';
import type { Agent } from '../types/chat';

export interface ProductionPromptOptions {
  /** Resolve agent id → display name (defaults to the id). */
  nameOf?: (agentId: string) => string;
  /** Scene-arc close-act fragment; the tag beat always carries it so the button lands a callback. */
  closeActInstruction?: string | null;
  /** Current scene act (sceneArc.ts) — selects each agent's emotional-arc label. Omitted → no arc line. */
  act?: SceneAct | null;
}

const ACT_NAMES: Record<SceneAct, string> = { open: 'opening', middle: 'middle', close: 'closing' };

/** One status as this agent should read it: their level, and who it is relative to (if anyone). */
interface StatusView {
  level: StatusLevel;
  otherId?: string;
  public: boolean;
}

const FLIPPED_LEVEL: Record<StatusLevel, StatusLevel> = { high: 'low', peer: 'peer', low: 'high' };

/**
 * Statuses this agent plays: their own entries, plus the mirror image of anyone else's status
 * toward them (so naming "Comedian is low to Philosopher" also tells the Philosopher they outrank
 * the Comedian) — unless the agent already has an explicit entry toward that agent.
 */
function statusViewsFor(statuses: AgentStatus[], agentId: string): StatusView[] {
  const views: StatusView[] = [];
  for (const s of statuses) {
    if (s.agentId === agentId) views.push({ level: s.level, otherId: s.targetId, public: s.public });
  }
  for (const s of statuses) {
    if (s.targetId !== agentId || s.agentId === agentId) continue;
    const hasOwn = statuses.some((o) => o.agentId === agentId && o.targetId === s.agentId);
    if (!hasOwn) views.push({ level: FLIPPED_LEVEL[s.level], otherId: s.agentId, public: s.public });
  }
  return views;
}

function statusCore(level: StatusLevel, other: string | undefined): string {
  switch (level) {
    case 'high':
      return other
        ? `You hold HIGH status over ${other}: grant permission, interrupt, and speak in short, decisive lines.`
        : 'You hold HIGH status in this scene: grant permission, interrupt, and speak in short, decisive lines.';
    case 'low':
      return other
        ? `You hold LOW status beneath ${other}: hedge, apologize, and appeal to ${other} for approval.`
        : 'You hold LOW status in this scene: hedge, apologize, and appeal to the others for approval.';
    default:
      return other
        ? `You and ${other} are on equal footing: trade lines evenly and neither of you pulls rank.`
        : 'You are on equal footing with everyone: nobody pulls rank on you and you pull rank on nobody.';
  }
}

/**
 * The single production compiler: turns the scene's ProductionCard into a per-agent
 * hiddenInstruction (system-prompt only — never appended to the visible prompt/history,
 * so relationships marked non-public and secret objectives stay out of the transcript).
 * Returns undefined when there's nothing to say for this agent/beat.
 */
export function compileProductionInstruction(
  card: ProductionCard,
  agentId: string,
  options: ProductionPromptOptions = {},
): string | undefined {
  const nameOf = options.nameOf ?? ((id: string) => id);
  const lines: string[] = [];

  if (card.beat === 'cold_open') {
    lines.push('BEAT: COLD OPEN — drop straight into the middle of the situation with one quick, punchy moment. No introductions, no explaining the premise.');
  } else if (card.beat === 'tag') {
    lines.push('BEAT: TAG — this is the final button of the scene. Keep it to one line and land a callback to an earlier bit; do not open anything new.');
    if (options.closeActInstruction) lines.push(options.closeActInstruction);
  }

  if (isGenreShiftActive(card) && card.genreShift) {
    const { genre } = card.genreShift;
    lines.push(`GENRE SHIFT: The scene has turned into ${genre}. Keep the same characters and running bits, but play the situation as ${genre} from here on — adapt tone, diction and stakes to fit.`);
  }

  for (const view of statusViewsFor(card.statuses, agentId)) {
    const core = statusCore(view.level, view.otherId ? nameOf(view.otherId) : undefined);
    lines.push(view.public
      ? `STATUS: ${core} Everyone can see the pecking order; play it openly.`
      : `STATUS (subtext only): ${core} Never state it outright — show it through behavior and tone.`);
  }

  const arc = options.act ? card.arcs.find((a) => a.agentId === agentId) : undefined;
  if (arc && options.act) {
    lines.push(`EMOTION (${ACT_NAMES[options.act]} of the scene): You are feeling ${arcLabelForAct(arc, options.act)} right now. Let it color your delivery without announcing it.`);
  }

  for (const rel of card.relationships) {
    if (rel.a !== agentId && rel.b !== agentId) continue;
    const other = nameOf(rel.a === agentId ? rel.b : rel.a);
    lines.push(rel.public
      ? `RELATIONSHIP: You and ${other} are ${rel.label} — everyone knows it; let it color how you talk to them.`
      : `RELATIONSHIP (subtext only): You and ${other} are ${rel.label}. Never state it outright — let it leak through tone and loaded remarks.`);
  }

  for (const secret of card.secrets) {
    if (secret.agentId !== agentId) continue;
    const hint = secret.successHint ? ` (${secret.successHint})` : '';
    lines.push(`SECRET OBJECTIVE: ${secret.goal}${hint}. Pursue it subtly; never reveal or mention that you have an objective.`);
  }

  if (card.guestNpc && isGuestOnStage(card)) {
    const guest = card.guestNpc;
    if (isGuestSpeaker(guest)) {
      // Real sixth speaker: the persona is the only place it reaches the model (the shared
      // writers'-room prefix must not change mid-scene, so it rides in the per-turn note).
      lines.push(agentId === GUEST_AGENT_ID
        ? `GUEST ROLE: You are ${guest.name}, a guest on the show, not one of the regulars. ${guest.persona} Stay in this role and react to what the regulars just said.`
        : `GUEST: ${guest.name} is on stage — ${guest.persona} React to them; do not speak for them.`);
    } else {
      lines.push(guest.voiceAgentId === agentId
        ? `GUEST: ${guest.name} has entered the scene and you also play them — you may deliver a line as "${guest.name}:" instead of yourself.`
        : `GUEST: ${guest.name} has just entered the scene. React to them.`);
    }
  }

  return lines.length > 0 ? lines.join('\n') : undefined;
}

/** Merge production + another hidden instruction (either may be empty). */
export function mergeHiddenInstructions(...parts: (string | undefined | null)[]): string | undefined {
  const joined = parts.filter((p): p is string => !!p?.trim()).join('\n');
  return joined || undefined;
}

export const BEAT_LABELS: Record<ProductionCard['beat'], string> = {
  cold_open: '🎬 COLD OPEN',
  main: '🎭 MAIN SKETCH',
  tag: '🏷️ TAG',
};

/** Tint for the sixth speaker's chat/caption lines (distinct from the five regulars). */
export const GUEST_COLOR = '#d8a7ff';

/**
 * The transient Agent behind a persona guest. Deliberately thin: the persona itself travels once,
 * in the per-turn production note (see the GUEST ROLE line above), so it reaches the model under
 * both prompt layouts without touching the shared writers'-room prefix.
 */
export function buildGuestAgent(guest: GuestNpc): Agent {
  return {
    id: GUEST_AGENT_ID,
    name: guest.name,
    systemPrompt:
      `You are ${guest.name}, a guest on a live comedy show with five regulars. ` +
      `Stay in character and reply in one or two short spoken sentences. End your response with "###".`,
    temperature: 0.9,
    top_p: 0.95,
    color: GUEST_COLOR,
  };
}
