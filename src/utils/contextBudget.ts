/**
 * Token-budget conversation window.
 *
 * Split out of the former `utils/dynamicContext.ts` god-file (#345). This layer
 * is orthogonal to VRAM/compile settings: it trims the *message list* by an
 * estimated token budget, after Director/conversation `memoryDepth` slicing and
 * before anything reaches the engine. See `docs/CONTEXT_DEPTH.md`.
 */
import type { TokenEstimator, TokenEstimationSource } from './tokenEstimator';
import { HeuristicTokenEstimator } from './tokenEstimator';

// ============================================================================
// Token-Level Context Manager
// ============================================================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Status information about the current context window */
export interface ContextWindowInfo {
  maxTokens: number;
  usedTokens: number;
  reserveTokens: number;
  messageCount: number;
  droppedMessages: number;
  hasSummary: boolean;
  summaryStub?: string;
  estimationSource: TokenEstimationSource;
  /** User/scene message-depth budget (soft limit before token truncation). */
  messageDepthLimit: number;
  /** Messages included after depth slicing (excludes system/summary). */
  messagesInWindow: number;
  /** One-turn director override label, if any. */
  memoryHintApplied?: string;
}

/**
 * Token-level context window manager.
 *
 * Replaces the old fixed-message-count truncation with a token-budget approach
 * that preserves the system prompt, adds a summary stub for discarded history,
 * and returns metadata for the UI.
 */
export class DynamicContextManager {
  private maxContextTokens: number;
  private summaryStub: string | null = null;
  private tokenEstimator: TokenEstimator;

  constructor(maxContextTokens: number, tokenEstimator?: TokenEstimator) {
    this.maxContextTokens = maxContextTokens;
    this.tokenEstimator = tokenEstimator ?? new HeuristicTokenEstimator();
  }

  /** Replace the token estimator (e.g. after model load exposes a real tokenizer). */
  setTokenEstimator(estimator: TokenEstimator): void {
    this.tokenEstimator = estimator;
  }

  getTokenEstimator(): TokenEstimator {
    return this.tokenEstimator;
  }

  /** Update context window budget (e.g. after model reload with different context) */
  setMaxContextTokens(tokens: number): void {
    this.maxContextTokens = tokens;
  }

  getMaxContextTokens(): number {
    return this.maxContextTokens;
  }

  /**
   * Estimate token count for a string using the active estimator chain.
   */
  estimateTokens(text: string): number {
    return this.tokenEstimator.estimateText(text);
  }

  /** @deprecated Use instance estimateTokens() — kept for tests and legacy callers. */
  static estimateTokens(text: string): number {
    return new HeuristicTokenEstimator().estimateText(text);
  }

  /**
   * Truncate a conversation to fit within the token budget.
   *
   * Priority order:
   *  1. System message (always kept)
   *  2. Summary stub of discarded history (if any messages were dropped)
   *  3. Most recent conversation messages, newest first
   *
   * @param systemMessage The full system prompt (always preserved)
   * @param history       The conversation history (user/assistant turns)
   * @param reserveTokens Tokens to reserve for generation output (default 128)
   * @returns The truncated message array and context window info
   */
  truncate(
    systemMessage: string,
    history: ChatMessage[],
    reserveTokens = 128,
  ): { messages: ChatMessage[]; info: ContextWindowInfo } {
    const baseInfo = {
      messageDepthLimit: history.length,
      messagesInWindow: history.length,
    };
    const systemTokens = this.estimateTokens(systemMessage);
    const budget = this.maxContextTokens - systemTokens - reserveTokens;
    const estimationSource = this.tokenEstimator.getSource();

    if (budget <= 0) {
      return {
        messages: [{ role: 'system', content: systemMessage }],
        info: {
          maxTokens: this.maxContextTokens,
          usedTokens: systemTokens,
          reserveTokens,
          messageCount: 1,
          droppedMessages: history.length,
          hasSummary: false,
          estimationSource,
          ...baseInfo,
          messagesInWindow: 0,
        },
      };
    }

    let usedTokens = 0;
    const kept: ChatMessage[] = [];

    for (let i = history.length - 1; i >= 0; i--) {
      const msgTokens = this.estimateTokens(history[i].content);
      if (usedTokens + msgTokens > budget) break;
      usedTokens += msgTokens;
      kept.unshift(history[i]);
    }

    const droppedCount = history.length - kept.length;
    const result: ChatMessage[] = [{ role: 'system', content: systemMessage }];
    let hasSummary = false;
    let summaryStubText: string | undefined;

    if (droppedCount > 0) {
      let stub = this.buildSummaryStub(history.slice(0, droppedCount));
      let stubTokens = this.estimateTokens(stub);

      // Ensure summary stub fits — drop oldest kept turns if needed
      while (kept.length > 0 && usedTokens + stubTokens > budget) {
        const removed = kept.shift();
        if (removed) {
          usedTokens -= this.estimateTokens(removed.content);
        }
      }

      // Recompute drop count if we evicted additional kept messages for the stub
      const finalDropped = history.length - kept.length;
      if (finalDropped > droppedCount) {
        stub = this.buildSummaryStub(history.slice(0, finalDropped));
        stubTokens = this.estimateTokens(stub);
      }

      if (stubTokens > budget) {
        stub = `[Earlier conversation: ${finalDropped} messages omitted to fit context window.]`;
        stubTokens = this.estimateTokens(stub);
      }

      result.push({ role: 'system', content: stub });
      usedTokens += stubTokens;
      hasSummary = true;
      summaryStubText = stub;
      this.summaryStub = stub;
    } else {
      this.summaryStub = null;
    }

    result.push(...kept);

    return {
      messages: result,
      info: {
        maxTokens: this.maxContextTokens,
        usedTokens: systemTokens + usedTokens,
        reserveTokens,
        messageCount: result.length,
        droppedMessages: history.length - kept.length,
        hasSummary,
        summaryStub: summaryStubText,
        estimationSource,
        ...baseInfo,
        messagesInWindow: kept.length,
      },
    };
  }

  /** Get the last summary stub (for UI display) */
  getLastSummaryStub(): string | null {
    return this.summaryStub;
  }

  private static readonly SUMMARY_SNIPPET_LENGTH = 80;

  /**
   * Build a short summary of dropped messages so the system prompt maintains
   * continuity. This is a deterministic stub — an LLM-generated summary could
   * replace it in the future.
   */
  private buildSummaryStub(dropped: ChatMessage[]): string {
    const turnCount = dropped.length;
    const lastUser = [...dropped].reverse().find(m => m.role === 'user');
    const lastAssistant = [...dropped].reverse().find(m => m.role === 'assistant');
    let stub = `[Earlier conversation: ${turnCount} messages omitted to fit context window.`;
    if (lastUser) {
      const snippet = lastUser.content.slice(0, DynamicContextManager.SUMMARY_SNIPPET_LENGTH).replace(/\n/g, ' ');
      stub += ` Last user topic: "${snippet}…"`;
    }
    if (lastAssistant) {
      const snippet = lastAssistant.content.slice(0, DynamicContextManager.SUMMARY_SNIPPET_LENGTH).replace(/\n/g, ' ');
      stub += ` Last response: "${snippet}…"`;
    }
    stub += ']';
    return stub;
  }
}
