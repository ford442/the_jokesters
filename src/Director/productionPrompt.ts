import type { ProductionCard } from './productionCard';

export interface ProductionPromptOptions {
  /** Resolve agent id → display name (defaults to the id). */
  nameOf?: (agentId: string) => string;
  /** Scene-arc close-act fragment; the tag beat always carries it so the button lands a callback. */
  closeActInstruction?: string | null;
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

  if (card.guestNpc && card.guestEntered) {
    const guest = card.guestNpc;
    lines.push(guest.voiceAgentId === agentId
      ? `GUEST: ${guest.name} has entered the scene and you also play them — you may deliver a line as "${guest.name}:" instead of yourself.`
      : `GUEST: ${guest.name} has just entered the scene. React to them.`);
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
