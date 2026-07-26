import type { ModeContext } from '../Director/modes/ModeContext';
import { mapScoreToAudienceFeedback, scoreTextToAudienceFeedback } from './audienceFeedback';

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
    // ctx.processTurn() above already awaits onTurnEnd internally, so by the time we
    // get here the line has actually finished playing — fire the audience reaction
    // at that (speak) time, not back when generation completed.
    ctx.callbacks.onAudienceReaction?.(mapScoreToAudienceFeedback(assessment.score));
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
  options: {
    callbackChance?: number;
    qualityGate?: boolean;
    /** Passed through verbatim to the underlying `GroupChatManager.chatForAgent` call. */
    chatOptions?: { maxTokens?: number; seed?: number; hiddenInstruction?: string };
  } = {},
): Promise<string | null> {
  const { qualityGate = true } = options;
  const enrichedPrompt = withComedyPrompt(ctx, prompt, options.callbackChance ?? 0.25);

  let responseText = '';
  await ctx.callbacks.onTurnStart(agentId);
  await ctx.manager.chatForAgent(agentId, enrichedPrompt, async (sentence) => {
    responseText += `${sentence} `;
    await onSpeak(sentence);
  }, options.chatOptions);

  let trimmed = responseText.trim();

  if (qualityGate && ctx.comedy && trimmed) {
    const assessment = ctx.comedy.rateAndMaybeRetry(trimmed);
    if (!assessment.passed && assessment.qualityPrompt) {
      let retryText = '';
      await ctx.manager.chatForAgent(agentId, `${enrichedPrompt} ${assessment.qualityPrompt}`, async (sentence) => {
        retryText += `${sentence} `;
        await onSpeak(sentence);
      }, options.chatOptions);
      const retryTrimmed = retryText.trim();
      if (retryTrimmed) trimmed = retryTrimmed;
    }
  }

  await ctx.callbacks.onTurnEnd();

  if (trimmed && ctx.comedy) {
    ctx.comedy.handleAgentResponse(trimmed, agentId);
  }

  // Fired after onTurnEnd (which waits for the line to actually finish playing), and
  // re-scored on whatever text actually ended up spoken (original or the retry).
  if (trimmed) {
    ctx.callbacks.onAudienceReaction?.(scoreTextToAudienceFeedback(trimmed));
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
