import {
  base64Bytes,
  CAST_SLOT_IDS,
  looksLikeGlb,
  MAX_EMBEDDED_AVATAR_BYTES,
  stripLocalAvatars,
  validateCastCard,
  type CastCard,
  type CastSlotId,
} from './castCard'

import { CAST_STORAGE_KEY } from './castKeys'
export { CAST_STORAGE_KEY }

/** Where uploaded .vrm files live. Binary and large, so IndexedDB rather than localStorage. */
export interface AvatarStore {
  get(slot: CastSlotId): Promise<{ name: string; blob: Blob } | null>
  put(slot: CastSlotId, name: string, blob: Blob): Promise<void>
  delete(slot: CastSlotId): Promise<void>
}

export class MemoryAvatarStore implements AvatarStore {
  private map = new Map<string, { name: string; blob: Blob }>()
  async get(slot: CastSlotId) { return this.map.get(slot) ?? null }
  async put(slot: CastSlotId, name: string, blob: Blob) { this.map.set(slot, { name, blob }) }
  async delete(slot: CastSlotId) { this.map.delete(slot) }
}

const DB_NAME = 'jokesters-cast'
const STORE = 'avatars'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const req = fn(db.transaction(STORE, mode).objectStore(STORE))
        req.onsuccess = () => { resolve(req.result); db.close() }
        req.onerror = () => { reject(req.error); db.close() }
      }),
  )
}

export class IdbAvatarStore implements AvatarStore {
  async get(slot: CastSlotId) {
    const v = await tx<{ name: string; blob: Blob } | undefined>('readonly', (s) => s.get(slot))
    return v ?? null
  }
  async put(slot: CastSlotId, name: string, blob: Blob) {
    await tx('readwrite', (s) => s.put({ name, blob }, slot))
  }
  async delete(slot: CastSlotId) {
    await tx('readwrite', (s) => s.delete(slot))
  }
}

/** The card the user last applied, or null. Invalid/tampered storage is ignored, never thrown. */
export function loadActiveCard(storage: Pick<Storage, 'getItem'> = localStorage): CastCard | null {
  try {
    const raw = storage.getItem(CAST_STORAGE_KEY)
    if (!raw) return null
    const result = validateCastCard(JSON.parse(raw))
    return result.ok ? result.card! : null
  } catch {
    return null
  }
}

/** Persist the active card. Embedded avatar bytes never go to localStorage (they are moved to the AvatarStore on import). */
export function saveActiveCard(card: CastCard, storage: Pick<Storage, 'setItem'> = localStorage): void {
  try {
    storage.setItem(CAST_STORAGE_KEY, JSON.stringify(card))
  } catch (err) {
    console.warn('[cast] could not persist the active cast:', err)
  }
}

export function clearActiveCard(storage: Pick<Storage, 'removeItem'> = localStorage): void {
  try {
    storage.removeItem(CAST_STORAGE_KEY)
  } catch { /* storage blocked */ }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(String(fr.result).split(',')[1] ?? '')
    fr.onerror = () => reject(fr.error)
    fr.readAsDataURL(blob)
  })
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

export interface ExportOptions {
  /** Embed uploaded .vrm files in the card (large). Otherwise uploads fall back to the default avatar. */
  embedAvatars: boolean
  blobToBase64?: (b: Blob) => Promise<string>
}

/** JSON text for a card, safe to share. */
export async function exportCastCard(card: CastCard, store: AvatarStore, opts: ExportOptions): Promise<string> {
  if (!opts.embedAvatars) return JSON.stringify(stripLocalAvatars(card), null, 2)
  const toB64 = opts.blobToBase64 ?? blobToBase64
  const slots = await Promise.all(
    card.slots.map(async (s) => {
      if (s.avatar.kind !== 'upload') return s
      const stored = await store.get(s.id)
      if (!stored || stored.blob.size > MAX_EMBEDDED_AVATAR_BYTES) return { ...s, avatar: { kind: 'default' as const } }
      return { ...s, avatar: { kind: 'embedded' as const, name: stored.name, data: await toB64(stored.blob) } }
    }),
  )
  return JSON.stringify({ ...card, slots }, null, 2)
}

export interface ImportResult {
  card: CastCard
  /** Slots whose embedded avatar was rejected (not a GLB / too large) and reset to default. */
  rejectedAvatars: CastSlotId[]
}

/**
 * Take a validated card from another machine: move embedded avatars into the local AvatarStore
 * (after checking they really are GLB files) and rewrite them as `upload` references.
 */
export async function importCastCard(card: CastCard, store: AvatarStore): Promise<ImportResult> {
  const rejected: CastSlotId[] = []
  const slots = await Promise.all(
    card.slots.map(async (s) => {
      if (s.avatar.kind !== 'embedded') {
        // A card may name an upload this browser never had.
        return s.avatar.kind === 'upload' ? { ...s, avatar: { kind: 'default' as const } } : s
      }
      const bytes = base64ToBytes(s.avatar.data)
      if (bytes.length > MAX_EMBEDDED_AVATAR_BYTES || base64Bytes(s.avatar.data) > MAX_EMBEDDED_AVATAR_BYTES || !looksLikeGlb(bytes)) {
        rejected.push(s.id)
        return { ...s, avatar: { kind: 'default' as const } }
      }
      await store.put(s.id, s.avatar.name, new Blob([bytes as BlobPart], { type: 'model/gltf-binary' }))
      return { ...s, avatar: { kind: 'upload' as const, name: s.avatar.name } }
    }),
  )
  return { card: { ...card, slots }, rejectedAvatars: rejected }
}

/** Slots in a stable order for UIs. */
export function orderedSlots(card: CastCard) {
  return [...card.slots].sort((a, b) => CAST_SLOT_IDS.indexOf(a.id) - CAST_SLOT_IDS.indexOf(b.id))
}
