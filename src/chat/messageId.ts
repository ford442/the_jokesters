import type { Message } from '../types/chat'

/** Stable per-message id, minted when a message is appended to history. */
export function newMessageId(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto
  if (c?.randomUUID) return c.randomUUID()
  return `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

function fnv1a(text: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36)
}

/**
 * Gives every message without an id one derived from its position, role and content, so
 * episodes saved before ids existed stamp identically on every device and a shared prefix
 * still matches across a merge. Messages that already have an id are returned untouched.
 */
export function stampLegacyMessageIds(history: Message[]): Message[] {
  return history.map((m, i) => (m.id ? m : { ...m, id: `legacy-${i}-${fnv1a(`${m.role}:${m.content}`)}` }))
}
