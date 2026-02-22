/**
 * Joke Loader Module
 * 
 * Imports and manages joke databases for spontaneous comedy content.
 * Supports multiple categories: absurdist, dark_tech, and crowd_work.
 * 
 * Features:
 * - Lazy-loaded JSON files (not bundled, fetched at runtime)
 * - Random joke retrieval by category
 * - Template substitution for crowd work (browser name, time of day)
 * - Browser API integration for dynamic content
 */

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface TimingCues {
  setup_duration: string
  punchline_delay: string
  reaction_type: string
}

export interface AbsurdistBit {
  setup: string
  punchline: string
  tags: string[]
  timing_cues: TimingCues
}

export interface AbsurdistData {
  description: string
  style: string
  bits: AbsurdistBit[]
}

export interface DarkTechBit {
  id: string
  title: string
  topic: string
  setup: string
  comedian: string
  philosopher: string
  scientist: string
}

export interface DarkTechData {
  title: string
  description: string
  tags: string[]
  bits: DarkTechBit[]
}

export interface CrowdWorkAdLib {
  id: string
  prompt: string
  tags: string[]
  dynamic_fields: string[]
}

export interface DynamicFieldDefinition {
  description: string
  example_values: string[]
}

export interface CrowdWorkData {
  crowd_work_ad_libs: CrowdWorkAdLib[]
  dynamic_field_definitions: Record<string, DynamicFieldDefinition>
  usage_notes: {
    purpose: string
    delivery_style: string
    best_practices: string[]
  }
}

export type JokeCategory = 'absurdist' | 'dark_tech' | 'crowd_work'

export interface JokeBit {
  id?: string
  setup: string
  punchline?: string
  content?: string
  tags: string[]
  category: JokeCategory
  // For dark_tech bits
  agentLines?: Record<string, string>
  // For timing
  timingCues?: TimingCues
}

export interface TemplateContext {
  browser_name: string
  time_of_day: string
  user_location?: string
}

// =============================================================================
// LAZY LOADING STATE
// =============================================================================

// Cache for loaded data
let absurdistBitsCache: AbsurdistBit[] | null = null
let darkTechBitsCache: DarkTechBit[] | null = null
let crowdWorkLibsCache: CrowdWorkAdLib[] | null = null
let isLoading = false
const loadingPromises: Map<string, Promise<void>> = new Map()

// =============================================================================
// LAZY LOADING FUNCTIONS
// =============================================================================

/**
 * Get the base path for loading JSON files
 * Handles both dev and production environments
 */
function getJsonBasePath(): string {
  // In production, files are in /jokes/ relative to the deployed app
  // In dev, they're served from public/jokes/
  return './jokes/'
}

/**
 * Load absurdist jokes lazily
 */
async function loadAbsurdistData(): Promise<void> {
  if (absurdistBitsCache !== null) return
  
  const cacheKey = 'absurdist'
  if (loadingPromises.has(cacheKey)) {
    return loadingPromises.get(cacheKey)
  }
  
  const promise = (async () => {
    try {
      const response = await fetch(`${getJsonBasePath()}absurdist.json`)
      if (!response.ok) throw new Error(`Failed to load absurdist.json: ${response.status}`)
      const data: AbsurdistData = await response.json()
      absurdistBitsCache = data.bits || []
    } catch (error) {
      console.warn('Failed to load absurdist jokes:', error)
      absurdistBitsCache = []
    }
  })()
  
  loadingPromises.set(cacheKey, promise)
  return promise
}

/**
 * Load dark tech jokes lazily
 */
async function loadDarkTechData(): Promise<void> {
  if (darkTechBitsCache !== null) return
  
  const cacheKey = 'dark_tech'
  if (loadingPromises.has(cacheKey)) {
    return loadingPromises.get(cacheKey)
  }
  
  const promise = (async () => {
    try {
      const response = await fetch(`${getJsonBasePath()}dark_tech.json`)
      if (!response.ok) throw new Error(`Failed to load dark_tech.json: ${response.status}`)
      const data: DarkTechData = await response.json()
      darkTechBitsCache = data.bits || []
    } catch (error) {
      console.warn('Failed to load dark tech jokes:', error)
      darkTechBitsCache = []
    }
  })()
  
  loadingPromises.set(cacheKey, promise)
  return promise
}

/**
 * Load crowd work jokes lazily
 */
async function loadCrowdWorkData(): Promise<void> {
  if (crowdWorkLibsCache !== null) return
  
  const cacheKey = 'crowd_work'
  if (loadingPromises.has(cacheKey)) {
    return loadingPromises.get(cacheKey)
  }
  
  const promise = (async () => {
    try {
      const response = await fetch(`${getJsonBasePath()}crowd_work.json`)
      if (!response.ok) throw new Error(`Failed to load crowd_work.json: ${response.status}`)
      const data: CrowdWorkData = await response.json()
      crowdWorkLibsCache = data.crowd_work_ad_libs || []
    } catch (error) {
      console.warn('Failed to load crowd work jokes:', error)
      crowdWorkLibsCache = []
    }
  })()
  
  loadingPromises.set(cacheKey, promise)
  return promise
}

/**
 * Preload all joke data (optional optimization)
 */
export async function preloadAllJokeData(): Promise<void> {
  if (isLoading) return
  isLoading = true
  
  await Promise.all([
    loadAbsurdistData(),
    loadDarkTechData(),
    loadCrowdWorkData()
  ])
  
  isLoading = false
}

// =============================================================================
// BROWSER DETECTION UTILITIES
// =============================================================================

/**
 * Detect browser name from user agent string
 */
export function detectBrowser(): string {
  const ua = navigator.userAgent
  
  if (ua.includes('Chrome') && !ua.includes('Edg') && !ua.includes('Brave')) {
    return 'Chrome'
  } else if (ua.includes('Firefox')) {
    return 'Firefox'
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    return 'Safari'
  } else if (ua.includes('Edg')) {
    return 'Edge'
  } else if (ua.includes('Opera') || ua.includes('OPR')) {
    return 'Opera'
  } else if (ua.includes('Brave')) {
    return 'Brave'
  }
  
  return 'a browser'
}

/**
 * Get time of day based on current hour
 */
export function getTimeOfDay(): string {
  const hour = new Date().getHours()
  
  if (hour >= 5 && hour < 12) {
    return 'morning'
  } else if (hour >= 12 && hour < 17) {
    return 'afternoon'
  } else if (hour >= 17 && hour < 21) {
    return 'evening'
  } else {
    return 'night'
  }
}

/**
 * Get approximate location from timezone
 */
export function getApproximateLocation(): string {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  
  // Map common timezones to locations
  const timezoneMap: Record<string, string> = {
    'America/New_York': 'New York',
    'America/Los_Angeles': 'Los Angeles',
    'America/Chicago': 'Chicago',
    'America/Denver': 'Denver',
    'Europe/London': 'London',
    'Europe/Paris': 'Paris',
    'Europe/Berlin': 'Berlin',
    'Asia/Tokyo': 'Tokyo',
    'Asia/Shanghai': 'Shanghai',
    'Asia/Singapore': 'Singapore',
    'Australia/Sydney': 'Sydney',
    'Pacific/Auckland': 'New Zealand',
  }
  
  // Try to extract region from timezone
  for (const [tz, location] of Object.entries(timezoneMap)) {
    if (timezone === tz) return location
  }
  
  // Fallback: extract region from timezone string
  const parts = timezone.split('/')
  if (parts.length > 1) {
    return parts[1].replace(/_/g, ' ')
  }
  
  return 'somewhere'
}

/**
 * Get current template context with real browser values
 */
export function getTemplateContext(): TemplateContext {
  return {
    browser_name: detectBrowser(),
    time_of_day: getTimeOfDay(),
    user_location: getApproximateLocation(),
  }
}

// =============================================================================
// TEMPLATE SUBSTITUTION
// =============================================================================

/**
 * Replace template variables in a string with actual values
 * Supports: {{browser_name}}, {{time_of_day}}, {{user_location}}
 */
export function substituteTemplate(template: string, context?: Partial<TemplateContext>): string {
  const ctx = { ...getTemplateContext(), ...context }
  
  return template
    .replace(/\{\{browser_name\}\}/g, ctx.browser_name)
    .replace(/\{\{time_of_day\}\}/g, ctx.time_of_day)
    .replace(/\{\{user_location\}\}/g, ctx.user_location || 'somewhere')
}

// =============================================================================
// JOKE RETRIEVAL (ASYNC - REQUIRES AWAIT)
// =============================================================================

/**
 * Get a random joke from the absurdist database
 */
async function getRandomAbsurdistJoke(): Promise<JokeBit> {
  await loadAbsurdistData()
  const bits = absurdistBitsCache || []
  
  if (bits.length === 0) {
    return {
      id: 'fallback_absurdist',
      setup: 'Why did the scarecrow win an award?',
      punchline: 'He was outstanding in his field!',
      tags: ['fallback'],
      category: 'absurdist',
    }
  }
  
  const bit = bits[Math.floor(Math.random() * bits.length)]
  
  return {
    id: `absurdist_${bits.indexOf(bit)}`,
    setup: bit.setup,
    punchline: bit.punchline,
    tags: bit.tags,
    category: 'absurdist',
    timingCues: bit.timing_cues,
  }
}

/**
 * Get a random joke from the dark tech database
 */
async function getRandomDarkTechJoke(): Promise<JokeBit> {
  await loadDarkTechData()
  const bits = darkTechBitsCache || []
  
  if (bits.length === 0) {
    return {
      id: 'fallback_darktech',
      setup: 'Why do programmers prefer dark mode?',
      tags: ['fallback', 'tech'],
      category: 'dark_tech',
      agentLines: {
        comedian: 'Because light attracts bugs!',
        philosopher: 'It represents the void within our digital existence.',
        scientist: 'It reduces eye strain by 40% in low-light conditions.',
      },
    }
  }
  
  const bit = bits[Math.floor(Math.random() * bits.length)]
  
  return {
    id: bit.id,
    setup: bit.setup,
    punchline: undefined, // Multi-agent format
    tags: [bit.topic, 'dark_humor', 'tech'],
    category: 'dark_tech',
    agentLines: {
      comedian: bit.comedian,
      philosopher: bit.philosopher,
      scientist: bit.scientist,
    },
  }
}

/**
 * Get a random crowd work ad-lib with template substitution
 */
async function getRandomCrowdWorkJoke(context?: Partial<TemplateContext>): Promise<JokeBit> {
  await loadCrowdWorkData()
  const libs = crowdWorkLibsCache || []
  
  if (libs.length === 0) {
    return {
      id: 'fallback_crowdwork',
      setup: 'Hey everyone! Great to be here!',
      content: 'Hey everyone! Great to be here!',
      tags: ['fallback'],
      category: 'crowd_work',
    }
  }
  
  const adLib = libs[Math.floor(Math.random() * libs.length)]
  const content = substituteTemplate(adLib.prompt, context)
  
  return {
    id: adLib.id,
    setup: content,
    content: content,
    tags: adLib.tags,
    category: 'crowd_work',
  }
}

/**
 * Get a random joke from any category or a specific one
 * @param category Optional category filter ('absurdist', 'dark_tech', 'crowd_work')
 * @param context Optional template context for crowd_work substitution
 * @returns JokeBit with joke data
 */
export async function getRandomJoke(category?: JokeCategory, context?: Partial<TemplateContext>): Promise<JokeBit> {
  // If specific category requested, return from that category
  if (category) {
    switch (category) {
      case 'absurdist':
        return getRandomAbsurdistJoke()
      case 'dark_tech':
        return getRandomDarkTechJoke()
      case 'crowd_work':
        return getRandomCrowdWorkJoke(context)
      default:
        // Fall through to random selection
    }
  }
  
  // Random selection across categories (weighted)
  const roll = Math.random()
  
  if (roll < 0.4) {
    return getRandomAbsurdistJoke()
  } else if (roll < 0.7) {
    return getRandomDarkTechJoke()
  } else {
    return getRandomCrowdWorkJoke(context)
  }
}

/**
 * Get a joke by specific ID
 */
export async function getJokeById(id: string): Promise<JokeBit | null> {
  // Check absurdist
  if (id.startsWith('absurdist_')) {
    await loadAbsurdistData()
    const bits = absurdistBitsCache || []
    const index = parseInt(id.replace('absurdist_', ''), 10)
    if (index >= 0 && index < bits.length) {
      const bit = bits[index]
      return {
        id,
        setup: bit.setup,
        punchline: bit.punchline,
        tags: bit.tags,
        category: 'absurdist',
        timingCues: bit.timing_cues,
      }
    }
  }
  
  // Check dark_tech
  await loadDarkTechData()
  const darkTechBits = darkTechBitsCache || []
  const darkTechBit = darkTechBits.find(b => b.id === id)
  if (darkTechBit) {
    return {
      id: darkTechBit.id,
      setup: darkTechBit.setup,
      tags: [darkTechBit.topic, 'dark_humor', 'tech'],
      category: 'dark_tech',
      agentLines: {
        comedian: darkTechBit.comedian,
        philosopher: darkTechBit.philosopher,
        scientist: darkTechBit.scientist,
      },
    }
  }
  
  // Check crowd_work
  await loadCrowdWorkData()
  const crowdWorkLibs = crowdWorkLibsCache || []
  const crowdWorkBit = crowdWorkLibs.find(b => b.id === id)
  if (crowdWorkBit) {
    const content = substituteTemplate(crowdWorkBit.prompt)
    return {
      id: crowdWorkBit.id,
      setup: content,
      content,
      tags: crowdWorkBit.tags,
      category: 'crowd_work',
    }
  }
  
  return null
}

/**
 * Get all jokes from a specific category
 */
export async function getAllJokes(category: JokeCategory): Promise<JokeBit[]> {
  switch (category) {
    case 'absurdist':
      await loadAbsurdistData()
      return (absurdistBitsCache || []).map((bit, index) => ({
        id: `absurdist_${index}`,
        setup: bit.setup,
        punchline: bit.punchline,
        tags: bit.tags,
        category: 'absurdist' as JokeCategory,
        timingCues: bit.timing_cues,
      }))
    case 'dark_tech':
      await loadDarkTechData()
      return (darkTechBitsCache || []).map(bit => ({
        id: bit.id,
        setup: bit.setup,
        tags: [bit.topic, 'dark_humor', 'tech'],
        category: 'dark_tech' as JokeCategory,
        agentLines: {
          comedian: bit.comedian,
          philosopher: bit.philosopher,
          scientist: bit.scientist,
        },
      }))
    case 'crowd_work':
      await loadCrowdWorkData()
      return (crowdWorkLibsCache || []).map(adLib => {
        const content = substituteTemplate(adLib.prompt)
        return {
          id: adLib.id,
          setup: content,
          content,
          tags: adLib.tags,
          category: 'crowd_work' as JokeCategory,
        }
      })
    default:
      return []
  }
}

/**
 * Search jokes by tag
 */
export async function searchJokesByTag(tag: string, category?: JokeCategory): Promise<JokeBit[]> {
  const categories = category ? [category] : ['absurdist', 'dark_tech', 'crowd_work'] as JokeCategory[]
  const results: JokeBit[] = []
  
  for (const cat of categories) {
    const jokes = await getAllJokes(cat)
    results.push(...jokes.filter(joke => 
      joke.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
    ))
  }
  
  return results
}

// =============================================================================
// STATISTICS
// =============================================================================

/**
 * Get joke database statistics
 */
export async function getJokeStats(): Promise<{
  total: number
  byCategory: Record<JokeCategory, number>
  tags: string[]
}> {
  const allTags = new Set<string>()
  
  await Promise.all([
    loadAbsurdistData(),
    loadDarkTechData(),
    loadCrowdWorkData()
  ])
  
  const absurdistBits = absurdistBitsCache || []
  const darkTechBits = darkTechBitsCache || []
  const crowdWorkLibs = crowdWorkLibsCache || []
  
  absurdistBits.forEach(bit => bit.tags.forEach(tag => allTags.add(tag)))
  darkTechBits.forEach(bit => allTags.add(bit.topic))
  crowdWorkLibs.forEach(adLib => adLib.tags.forEach(tag => allTags.add(tag)))
  
  return {
    total: absurdistBits.length + darkTechBits.length + crowdWorkLibs.length,
    byCategory: {
      absurdist: absurdistBits.length,
      dark_tech: darkTechBits.length,
      crowd_work: crowdWorkLibs.length,
    },
    tags: Array.from(allTags),
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  getRandomJoke,
  getJokeById,
  getAllJokes,
  searchJokesByTag,
  getJokeStats,
  substituteTemplate,
  getTemplateContext,
  detectBrowser,
  getTimeOfDay,
  getApproximateLocation,
  preloadAllJokeData,
}
