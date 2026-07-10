import type { ModeContext } from '../Director/modes/ModeContext';

/**
 * Append callback prompt injection when comedy session is active.
 */
export function withComedyPrompt(
  ctx: ModeContext,
  prompt: string,
  callbackChance = 0.3,
): string {
  if (!ctx.comedy) return prompt;
  const injection = ctx.comedy.maybeInjectCallbackPrompt(callbackChance);
  return injection ? `${prompt} ${injection}` : prompt;
}

/**
 * Run processTurn with comedy prompt injection; returns captured agent text.
 */
export async function processTurnWithComedy(
  ctx: ModeContext,
  prompt: string,
  options: { callbackChance?: number; qualityGate?: boolean } = {},
): Promise<string | null> {
  const { qualityGate = true } = options;
  if (!ctx.comedy) {
    await ctx.processTurn(prompt);
    return null;
  }

  let responseText = '';
  const originalOnMessage = ctx.callbacks.onMessage;
  const wrappedCallbacks = {
    ...ctx.callbacks,
    onMessage: (sender: string, text: string, color: string) => {
      if (sender !== 'Director' && sender !== 'System' && sender !== 'Audience') {
        responseText += `${text} `;
      }
      originalOnMessage(sender, text, color);
    },
  };

  const modifiedCtx: ModeContext = { ...ctx, callbacks: wrappedCallbacks };
  await modifiedCtx.processTurn(prompt);

  const trimmed = responseText.trim();
  if (!trimmed) return null;

  if (qualityGate && ctx.comedy) {
    const assessment = ctx.comedy.rateAndMaybeRetry(trimmed);
    if (!assessment.passed && assessment.qualityPrompt) {
      await ctx.processTurn(assessment.qualityPrompt);
    }
  }

  return trimmed || null;
}

/**
 * chatForAgent wrapper that registers agent output with the comedy session.
 */
export async function chatForAgentWithComedy(
  ctx: ModeContext,
  agentId: string,
  prompt: string,
  onSpeak: (sentence: string) => Promise<void>,
  options: { callbackChance?: number } = {},
): Promise<string | null> {
  const enrichedPrompt = withComedyPrompt(ctx, prompt, options.callbackChance ?? 0.25);

  let responseText = '';
  await ctx.callbacks.onTurnStart(agentId);
  await ctx.manager.chatForAgent(agentId, enrichedPrompt, async (sentence) => {
    responseText += `${sentence} `;
    await onSpeak(sentence);
  });
  await ctx.callbacks.onTurnEnd();

  const trimmed = responseText.trim();
  if (trimmed && ctx.comedy) {
    ctx.comedy.handleAgentResponse(trimmed, agentId);
  }
  return trimmed || null;
}

/**
 * Register a completed agent line without re-running generation.
 */
export function registerComedyResponse(
  ctx: ModeContext,
  text: string,
  agentId: string,
): void {
  ctx.comedy?.handleAgentResponse(text, agentId);
}
