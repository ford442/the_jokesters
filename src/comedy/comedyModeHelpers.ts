import type { ModeContext } from '../Director/modes/ModeContext';
import { mapScoreToAudienceFeedback, scoreTextToAudienceFeedback } from './audienceFeedback';
import {
  buildComedySamplingPlan,
  derivePacing,
  isComedyDebugEnabled,
  type ComedySamplingPlan,
} from './comedySamplingPlan';
import type { ChatSamplingOverrides } from '../GroupChatManager';
import { mergeHiddenInstructions } from '../Director/productionPrompt';

type ComedyChatOptions = {
  maxTokens?: number;
  seed?: number;
  hiddenInstruction?: string;
  sampling?: ChatSamplingOverrides;
};

/**
 * Per-turn sampling plan from scene act + callback heat. Null when the mode has no comedy session.
 */
export function planComedySampling(ctx: ModeContext): ComedySamplingPlan | null {
  if (!ctx.comedy) return null;
  const act = ctx.getSceneAct?.() ?? null;
  const plan = buildComedySamplingPlan({
    act,
    callback: ctx.comedy.getSpotlightCallback(),
    pacing: derivePacing(act, ctx.comedy.getTurnCount()),
  });
  if (isComedyDebugEnabled()) console.debug('[comedySampling]', plan.label, plan);
  return plan;
}

/**
 * Merge a sampling plan under caller-supplied chat options (caller's explicit values win,
 * except maxTokens which takes the tighter of the two).
 */
export function applyComedySamplingPlan(
  plan: ComedySamplingPlan | null,
  base: ComedyChatOptions | undefined,
): ComedyChatOptions | undefined {
  if (!plan) return base;
  const hidden = [base?.hiddenInstruction, plan.promptSuffix].filter((s) => s?.trim()).join('\n');
  return {
    ...base,
    maxTokens: Math.min(base?.maxTokens ?? Infinity, plan.max_tokens),
    hiddenInstruction: hidden || undefined,
    sampling: {
      temperatureDelta: plan.temperatureDelta,
      top_p: plan.top_p,
      presence_penalty: plan.presence_penalty,
      stop: plan.stop,
      ...base?.sampling,
    },
  };
}

/**
 * Append callback prompt injection when comedy session is active.
 */
export function withComedyPrompt(
  ctx: ModeContext,
  prompt: string,
  callbackChance = 0.3,
): string {
  let result = prompt;
  if (ctx.comedy) {
    const injection = ctx.comedy.maybeInjectCallbackPrompt(callbackChance);
    if (injection) result += ` ${injection}`;
  }
  const arcInjection = ctx.getArcPromptInjection();
  if (arcInjection) result += ` ${arcInjection}`;
  return result;
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
    chatOptions?: ComedyChatOptions;
  } = {},
): Promise<string | null> {
  const { qualityGate = true } = options;
  const enrichedPrompt = withComedyPrompt(ctx, prompt, options.callbackChance ?? 0.25);
  const planned = applyComedySamplingPlan(planComedySampling(ctx), options.chatOptions);
  const hiddenInstruction = mergeHiddenInstructions(ctx.getProductionInstruction?.(agentId), planned?.hiddenInstruction);
  const chatOptions = hiddenInstruction ? { ...planned, hiddenInstruction } : planned;

  let responseText = '';
  await ctx.callbacks.onTurnStart(agentId);
  await ctx.manager.chatForAgent(agentId, enrichedPrompt, async (sentence) => {
    responseText += `${sentence} `;
    await onSpeak(sentence);
  }, chatOptions);

  let trimmed = responseText.trim();

  if (qualityGate && ctx.comedy && trimmed) {
    const assessment = ctx.comedy.rateAndMaybeRetry(trimmed);
    if (!assessment.passed && assessment.qualityPrompt) {
      let retryText = '';
      await ctx.manager.chatForAgent(agentId, `${enrichedPrompt} ${assessment.qualityPrompt}`, async (sentence) => {
        retryText += `${sentence} `;
        await onSpeak(sentence);
      }, chatOptions);
      const retryTrimmed = retryText.trim();
      if (retryTrimmed) trimmed = retryTrimmed;
    }
  }

  await ctx.callbacks.onTurnEnd();

  if (trimmed && ctx.comedy) {
    ctx.comedy.handleAgentResponse(trimmed, agentId);
  }
  if (trimmed) {
    ctx.recordSceneBeat(agentId, trimmed);
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
