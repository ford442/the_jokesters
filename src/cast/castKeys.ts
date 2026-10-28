/** Kept out of castCard.ts so boot can cheaply check "is there a custom cast?" without loading zod. */
export const CAST_STORAGE_KEY = 'jokesters-cast'

export function hasStoredCast(storage: Pick<Storage, 'getItem'> = localStorage): boolean {
  try {
    return storage.getItem(CAST_STORAGE_KEY) !== null
  } catch {
    return false
  }
}
