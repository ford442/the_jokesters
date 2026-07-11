import type { ModeCatalogEntry, ModeCategory } from '../Director/modes/registry'
import { FEATURED_MODE_IDS } from '../config/featuredModes'

export const MODE_CATEGORY_ORDER: ModeCategory[] = [
  'improv',
  'performance',
  'interactive',
  'media',
  'reporter',
  'creative',
  'dream',
]

export const MODE_CATEGORY_LABELS: Record<ModeCategory, string> = {
  improv: 'Improv',
  performance: 'Performance',
  interactive: 'Interactive',
  media: 'Media',
  reporter: 'Reporter',
  creative: 'Creative',
  dream: 'Dream',
}

const FAVORITES_KEY = 'jokesters-mode-favorites'
const RECENT_KEY = 'jokesters-mode-recent'
const MAX_RECENT = 8

export interface ModeBrowserPrefs {
  favorites: string[]
  recent: string[]
}

export function loadModeBrowserPrefs(): ModeBrowserPrefs {
  try {
    const favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]')
    const recent = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]')
    return {
      favorites: Array.isArray(favorites) ? favorites.filter((x) => typeof x === 'string') : [],
      recent: Array.isArray(recent) ? recent.filter((x) => typeof x === 'string') : [],
    }
  } catch {
    return { favorites: [], recent: [] }
  }
}

export function saveFavorites(ids: string[]): void {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids))
  } catch { /* quota */ }
}

export function recordRecentMode(id: string, prefs: ModeBrowserPrefs): ModeBrowserPrefs {
  const recent = [id, ...prefs.recent.filter((r) => r !== id)].slice(0, MAX_RECENT)
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent))
  } catch { /* quota */ }
  return { ...prefs, recent }
}

export function toggleFavorite(id: string, prefs: ModeBrowserPrefs): ModeBrowserPrefs {
  const set = new Set(prefs.favorites)
  if (set.has(id)) set.delete(id)
  else set.add(id)
  const favorites = [...set]
  saveFavorites(favorites)
  return { ...prefs, favorites }
}

/** Tokenize query for multi-word AND search. */
function queryTerms(query: string): string[] {
  return query.trim().toLowerCase().split(/\s+/).filter(Boolean)
}

function modeSearchHaystack(mode: ModeCatalogEntry): string {
  return [
    mode.id,
    mode.title,
    mode.description,
    mode.category,
    MODE_CATEGORY_LABELS[mode.category],
    ...(mode.tags ?? []),
  ]
    .join(' ')
    .toLowerCase()
}

/** Filter modes by category and search query (title, description, tags, id). */
export function filterModes(
  catalog: ModeCatalogEntry[],
  options: { category?: ModeCategory | 'all' | 'favorites'; query?: string; favoriteIds?: Set<string> },
): ModeCatalogEntry[] {
  let list = catalog

  if (options.category === 'favorites' && options.favoriteIds) {
    list = list.filter((m) => options.favoriteIds!.has(m.id))
  } else if (options.category && options.category !== 'all') {
    list = list.filter((m) => m.category === options.category)
  }

  const terms = queryTerms(options.query ?? '')
  if (terms.length === 0) return list

  return list.filter((m) => {
    const hay = modeSearchHaystack(m)
    return terms.every((t) => hay.includes(t))
  })
}

export function getFeaturedModes(catalog: ModeCatalogEntry[]): ModeCatalogEntry[] {
  const byId = new Map(catalog.map((m) => [m.id, m]))
  return FEATURED_MODE_IDS.map((id) => byId.get(id)).filter(
    (m): m is ModeCatalogEntry => m !== undefined,
  )
}

export function getRecentModes(
  catalog: ModeCatalogEntry[],
  recentIds: string[],
): ModeCatalogEntry[] {
  const byId = new Map(catalog.map((m) => [m.id, m]))
  return recentIds.map((id) => byId.get(id)).filter((m): m is ModeCatalogEntry => m !== undefined)
}

export function findModeById(
  catalog: ModeCatalogEntry[],
  id: string,
): ModeCatalogEntry | undefined {
  return catalog.find((m) => m.id === id)
}
