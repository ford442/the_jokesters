/**
 * Streaming event helpers for LLM adapters.
 * Custom web-llm fork can emit sentence-boundary metadata for earlier TTS handoff.
 */

export interface ChatStreamChunk {
  content: string
  /** True when the delta ends on a sentence boundary (custom fork extension). */
  sentenceBoundary?: boolean
}

export type ChatStreamEvent = string | ChatStreamChunk

export function getStreamContent(event: ChatStreamEvent): string {
  return typeof event === 'string' ? event : event.content
}

export function isSentenceBoundaryEvent(event: ChatStreamEvent): boolean {
  return typeof event === 'object' && event.sentenceBoundary === true
}
