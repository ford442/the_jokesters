import { MODE_REGISTRY, type ModeCatalogEntry } from '../Director/modes/registry'
import {
  MODE_CATEGORY_LABELS,
  MODE_CATEGORY_ORDER,
  filterModes,
  getFeaturedModes,
  getRecentModes,
  loadModeBrowserPrefs,
  recordRecentMode,
  toggleFavorite,
  type ModeBrowserPrefs,
} from './modeBrowserCore'

export interface ModeBrowserSelection {
  modeId: string
  title: string
  description: string
  recordStart(): void
}

export interface ModeBrowserOptions {
  onSelect?: (mode: ModeCatalogEntry) => void
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderModeCard(
  mode: ModeCatalogEntry,
  selectedId: string,
  isFavorite: boolean,
): string {
  const selected = mode.id === selectedId ? ' mode-card-selected' : ''
  const fav = isFavorite ? ' mode-card-fav-active' : ''
  return `<button type="button" class="mode-card${selected}${fav}" data-mode-id="${escapeHtml(mode.id)}" title="${escapeHtml(mode.description)}">
    <span class="mode-card-title">${escapeHtml(mode.title)}</span>
    <span class="mode-card-meta">${escapeHtml(MODE_CATEGORY_LABELS[mode.category])}</span>
    <span class="mode-card-fav" data-fav-toggle="${escapeHtml(mode.id)}" role="button" aria-label="Toggle favorite" title="Favorite">★</span>
  </button>`
}

/**
 * Categorized mode browser: featured row, search, category tabs, favorites + recent.
 */
export function wireModeBrowser(options: ModeBrowserOptions = {}): ModeBrowserSelection {
  const searchInput = document.getElementById('mode-search') as HTMLInputElement
  const categoryTabs = document.getElementById('mode-category-tabs')!
  const featuredGrid = document.getElementById('mode-featured-grid')!
  const recentSection = document.getElementById('mode-recent-section')!
  const recentGrid = document.getElementById('mode-recent-grid')!
  const modeList = document.getElementById('mode-list')!
  const selectedInput = document.getElementById('selected-mode-id') as HTMLInputElement
  const sceneTitleInput = document.getElementById('scene-title') as HTMLInputElement
  const sceneDescriptionInput = document.getElementById('scene-description') as HTMLInputElement

  let prefs: ModeBrowserPrefs = loadModeBrowserPrefs()
  let activeCategory: 'all' | 'favorites' | (typeof MODE_CATEGORY_ORDER)[number] = 'all'
  let selectedId = selectedInput?.value || 'improv'

  const applySelection = (mode: ModeCatalogEntry) => {
    selectedId = mode.id
    if (selectedInput) selectedInput.value = mode.id
    sceneTitleInput.value = mode.title
    sceneDescriptionInput.value = mode.description
    options.onSelect?.(mode)
    render()
  }

  const renderList = () => {
    const favoriteSet = new Set(prefs.favorites)
    const featured = getFeaturedModes(MODE_REGISTRY)
    featuredGrid.innerHTML = featured
      .map((m) => renderModeCard(m, selectedId, favoriteSet.has(m.id)))
      .join('')

    const recent = getRecentModes(MODE_REGISTRY, prefs.recent)
    if (recent.length > 0) {
      recentSection.style.display = 'block'
      recentGrid.innerHTML = recent
        .map((m) => renderModeCard(m, selectedId, favoriteSet.has(m.id)))
        .join('')
    } else {
      recentSection.style.display = 'none'
    }

    const filtered = filterModes(MODE_REGISTRY, {
      category: activeCategory,
      query: searchInput?.value ?? '',
      favoriteIds: favoriteSet,
    })

    const countLabel = filtered.length === MODE_REGISTRY.length
      ? `${MODE_REGISTRY.length} modes`
      : `${filtered.length} of ${MODE_REGISTRY.length}`

    modeList.innerHTML = filtered.length === 0
      ? `<p class="mode-browser-empty">No modes match. Try another search or category.</p>`
      : `<div class="mode-browser-count">${countLabel}</div>${filtered
        .map((m) => renderModeCard(m, selectedId, favoriteSet.has(m.id)))
        .join('')}`
  }

  const renderTabs = () => {
    const tabs: { id: typeof activeCategory; label: string }[] = [
      { id: 'all', label: 'All' },
      { id: 'favorites', label: '★ Favorites' },
      ...MODE_CATEGORY_ORDER.map((c) => ({ id: c, label: MODE_CATEGORY_LABELS[c] })),
    ]
    categoryTabs.innerHTML = tabs
      .map(
        (t) =>
          `<button type="button" class="mode-category-tab${activeCategory === t.id ? ' active' : ''}" data-category="${t.id}">${t.label}</button>`,
      )
      .join('')
  }

  const render = () => {
    renderTabs()
    renderList()
  }

  categoryTabs.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-category]') as HTMLElement | null
    if (!btn) return
    activeCategory = btn.dataset.category as typeof activeCategory
    render()
  })

  const handleGridClick = (e: Event) => {
    const favBtn = (e.target as HTMLElement).closest('[data-fav-toggle]') as HTMLElement | null
    if (favBtn) {
      e.stopPropagation()
      e.preventDefault()
      const id = favBtn.dataset.favToggle!
      prefs = toggleFavorite(id, prefs)
      render()
      return
    }
    const card = (e.target as HTMLElement).closest('[data-mode-id]') as HTMLElement | null
    if (!card) return
    const mode = MODE_REGISTRY.find((m) => m.id === card.dataset.modeId)
    if (mode) applySelection(mode)
  }

  featuredGrid.addEventListener('click', handleGridClick)
  recentGrid.addEventListener('click', handleGridClick)
  modeList.addEventListener('click', handleGridClick)

  searchInput?.addEventListener('input', () => render())

  const defaultMode = MODE_REGISTRY.find((m) => m.id === 'improv') ?? MODE_REGISTRY[0]
  if (defaultMode) applySelection(defaultMode)

  const api: ModeBrowserSelection = {
    get modeId() {
      return selectedId
    },
    get title() {
      return sceneTitleInput.value.trim()
    },
    get description() {
      return sceneDescriptionInput.value.trim()
    },
    recordStart() {
      prefs = recordRecentMode(selectedId, prefs)
      render()
    },
  }

  return api
}
