import type { Agent, Message } from '../types/chat'
import {
  EPISODE_FORMAT_VERSION,
  type EpisodeAgent,
  type EpisodeSceneState,
  type EpisodeTurn,
  type EpisodeValidationResult,
  type JokestersEpisode,
} from './types'

/** Internal director / continue prompts that should not appear as spoken turns. */
const INTERNAL_USER_PROMPTS = new Set([
  '(continue)',
  '(reply naturally to the last thing said)',
  '(continue)',
])

function isInternalUserPrompt(content: string): boolean {
  const t = content.trim().toLowerCase()
  if (INTERNAL_USER_PROMPTS.has(t)) return true
  if (t.startsWith('(reply naturally')) return true
  if (t.includes('you are participating in an improv')) return true
  if (t.includes('###') && t.length < 40) return true
  // Scene seed lines are often short director prompts — keep only if labeled user-ish
  return false
}

/**
 * Build portable episode from chat history + agent roster.
 * Assistant messages map to rotating agents starting at agents[0]
 * (matches resetConversation + sequential turns).
 */
export function buildEpisodeFromHistory(options: {
  history: Message[]
  agents: Agent[] | EpisodeAgent[]
  modelId?: string | null
  sceneState?: EpisodeSceneState
  episodeId?: string
  /** Optional explicit turns (preferred when agentId is known). */
  turns?: EpisodeTurn[]
}): JokestersEpisode {
  const agentSnap: EpisodeAgent[] = options.agents.map((a) => ({
    id: a.id,
    name: a.name,
    color: 'color' in a ? a.color : undefined,
  }))

  let turns = options.turns
  if (!turns) {
    turns = historyToTurns(options.history, agentSnap.map((a) => a.id))
  }

  const id =
    options.episodeId ??
    new Date().toISOString().replace(/[:.]/g, '-')

  return {
    version: EPISODE_FORMAT_VERSION,
    modelId: options.modelId ?? null,
    agents: agentSnap,
    turns,
    sceneState: options.sceneState,
    episodeId: id,
    exportedAt: new Date().toISOString(),
  }
}

/**
 * Map Message[] history → EpisodeTurn[] using agent rotation for assistants.
 * User messages that look like real audience/heckles are kept as agentId "user".
 */
export function historyToTurns(history: Message[], agentIds: string[]): EpisodeTurn[] {
  const turns: EpisodeTurn[] = []
  let assistantIndex = 0
  const baseTs = Date.now() - history.length * 2000

  for (let i = 0; i < history.length; i++) {
    const msg = history[i]
    if (msg.role === 'assistant') {
      const text = (msg.content ?? '').trim()
      if (!text) continue
      const agentId =
        agentIds.length > 0
          ? agentIds[assistantIndex % agentIds.length]
          : 'unknown'
      turns.push({
        agentId,
        text,
        ts: baseTs + i * 2000,
      })
      assistantIndex++
    } else if (msg.role === 'user') {
      const text = (msg.content ?? '').trim()
      if (!text || isInternalUserPrompt(text)) continue
      // Keep human / heckle lines
      turns.push({
        agentId: 'user',
        text,
        ts: baseTs + i * 2000,
      })
    }
  }

  return turns
}

/**
 * Convert a MemoryManager-style episode blob `{ history, scenario, timestamp }`
 * into the portable format when possible.
 */
export function fromMemoryEpisode(
  data: unknown,
  agents: Agent[] | EpisodeAgent[],
  modelId?: string | null,
): JokestersEpisode | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>

  // Already portable?
  if (typeof d.version === 'number' && Array.isArray(d.turns)) {
    const v = validateEpisode(d)
    return v.ok && v.episode ? v.episode : null
  }

  if (!Array.isArray(d.history)) return null

  const scenario = d.scenario as Record<string, unknown> | undefined
  const sceneState: EpisodeSceneState | undefined = scenario
    ? {
        title: typeof scenario.title === 'string' ? scenario.title : undefined,
        description:
          typeof scenario.description === 'string' ? scenario.description : undefined,
        mode: typeof scenario.type === 'string' ? scenario.type : undefined,
      }
    : undefined

  return buildEpisodeFromHistory({
    history: d.history as Message[],
    agents,
    modelId,
    sceneState,
    episodeId:
      typeof d.timestamp === 'string'
        ? d.timestamp.replace(/[:.]/g, '-')
        : undefined,
  })
}

/** Strict schema validation for import safety. */
export function validateEpisode(raw: unknown): EpisodeValidationResult {
  const errors: EpisodeValidationResult['errors'] = []

  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      ok: false,
      errors: [{ code: 'not_object', message: 'Episode must be a JSON object.' }],
    }
  }

  const o = raw as Record<string, unknown>

  if (typeof o.version !== 'number' || !Number.isFinite(o.version) || o.version < 1) {
    errors.push({
      code: 'bad_version',
      message: 'Missing or invalid "version" (expected positive number).',
    })
  } else if (o.version > EPISODE_FORMAT_VERSION) {
    errors.push({
      code: 'bad_version',
      message: `Unsupported episode version ${o.version} (app supports up to ${EPISODE_FORMAT_VERSION}).`,
    })
  }

  if (o.modelId !== null && o.modelId !== undefined && typeof o.modelId !== 'string') {
    errors.push({ code: 'bad_model_id', message: '"modelId" must be a string or null.' })
  }

  if (!Array.isArray(o.agents)) {
    errors.push({ code: 'bad_agents', message: '"agents" must be an array.' })
  } else {
    for (let i = 0; i < o.agents.length; i++) {
      const a = o.agents[i]
      if (!a || typeof a !== 'object' || Array.isArray(a)) {
        errors.push({ code: 'bad_agents', message: `agents[${i}] must be an object.` })
        break
      }
      const agent = a as Record<string, unknown>
      if (typeof agent.id !== 'string' || !agent.id.trim()) {
        errors.push({ code: 'bad_agents', message: `agents[${i}].id must be a non-empty string.` })
        break
      }
      if (typeof agent.name !== 'string' || !agent.name.trim()) {
        errors.push({ code: 'bad_agents', message: `agents[${i}].name must be a non-empty string.` })
        break
      }
      if (agent.color !== undefined && typeof agent.color !== 'string') {
        errors.push({ code: 'bad_agents', message: `agents[${i}].color must be a string if present.` })
        break
      }
    }
  }

  if (!Array.isArray(o.turns)) {
    errors.push({ code: 'bad_turns', message: '"turns" must be an array.' })
  } else if (o.turns.length === 0) {
    errors.push({ code: 'empty_turns', message: '"turns" must contain at least one turn.' })
  } else {
    for (let i = 0; i < o.turns.length; i++) {
      const t = o.turns[i]
      if (!t || typeof t !== 'object' || Array.isArray(t)) {
        errors.push({ code: 'bad_turn_fields', message: `turns[${i}] must be an object.` })
        break
      }
      const turn = t as Record<string, unknown>
      if (typeof turn.agentId !== 'string' || !turn.agentId.trim()) {
        errors.push({
          code: 'bad_turn_fields',
          message: `turns[${i}].agentId must be a non-empty string.`,
        })
        break
      }
      if (typeof turn.text !== 'string') {
        errors.push({
          code: 'bad_turn_fields',
          message: `turns[${i}].text must be a string.`,
        })
        break
      }
      if (typeof turn.ts !== 'number' || !Number.isFinite(turn.ts)) {
        errors.push({
          code: 'bad_turn_fields',
          message: `turns[${i}].ts must be a finite number.`,
        })
        break
      }
      if (turn.sfx !== undefined && typeof turn.sfx !== 'string') {
        errors.push({
          code: 'bad_turn_fields',
          message: `turns[${i}].sfx must be a string if present.`,
        })
        break
      }
    }
  }

  if (o.sceneState !== undefined && o.sceneState !== null) {
    if (typeof o.sceneState !== 'object' || Array.isArray(o.sceneState)) {
      errors.push({
        code: 'not_object',
        message: '"sceneState" must be an object if present.',
      })
    }
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  const agents = (o.agents as EpisodeAgent[]).map((a) => ({
    id: String(a.id),
    name: String(a.name),
    color: a.color !== undefined ? String(a.color) : undefined,
  }))

  const turns: EpisodeTurn[] = (o.turns as EpisodeTurn[]).map((t) => {
    const turn: EpisodeTurn = {
      agentId: String(t.agentId),
      text: String(t.text),
      ts: Number(t.ts),
    }
    if (typeof t.sfx === 'string' && t.sfx.length > 0) {
      turn.sfx = t.sfx
    }
    return turn
  })

  const episode: JokestersEpisode = {
    version: Number(o.version),
    modelId: o.modelId === undefined ? null : (o.modelId as string | null),
    agents,
    turns,
  }

  if (o.sceneState && typeof o.sceneState === 'object') {
    episode.sceneState = o.sceneState as EpisodeSceneState
  }
  if (typeof o.episodeId === 'string') episode.episodeId = o.episodeId
  if (typeof o.exportedAt === 'string') episode.exportedAt = o.exportedAt

  return { ok: true, errors: [], episode }
}

/** Parse JSON text safely and validate. */
export function parseAndValidateEpisode(jsonText: string): EpisodeValidationResult {
  let raw: unknown
  try {
    raw = JSON.parse(jsonText)
  } catch {
    return {
      ok: false,
      errors: [{ code: 'not_object', message: 'Invalid JSON: could not parse file.' }],
    }
  }
  return validateEpisode(raw)
}

/** Markdown transcript for sharing / reading. */
export function episodeToMarkdown(episode: JokestersEpisode): string {
  const title = episode.sceneState?.title ?? 'Untitled Scene'
  const mode = episode.sceneState?.mode ?? 'improv'
  const desc = episode.sceneState?.description
  const model = episode.modelId ?? 'unknown'
  const when = episode.exportedAt ?? new Date().toISOString()

  const nameById = new Map(episode.agents.map((a) => [a.id, a.name]))
  nameById.set('user', 'Audience')
  nameById.set('system', 'System')

  const lines: string[] = [
    `# ${title}`,
    '',
    `- **Mode:** ${mode}`,
    `- **Model:** ${model}`,
    `- **Exported:** ${when}`,
    `- **Turns:** ${episode.turns.length}`,
  ]

  if (desc) {
    lines.push(`- **Description:** ${desc}`)
  }

  lines.push('', '---', '', '## Transcript', '')

  for (const turn of episode.turns) {
    const name = nameById.get(turn.agentId) ?? turn.agentId
    const sfx = turn.sfx ? ` *[sfx: ${turn.sfx}]*` : ''
    lines.push(`**${name}:** ${turn.text}${sfx}`, '')
  }

  lines.push('---', '', `_The Jokesters · episode format v${episode.version}_`, '')
  return lines.join('\n')
}

/** Plain text transcript (no markdown). */
export function episodeToPlainText(episode: JokestersEpisode): string {
  const title = episode.sceneState?.title ?? 'Untitled Scene'
  const nameById = new Map(episode.agents.map((a) => [a.id, a.name]))
  nameById.set('user', 'Audience')

  const lines: string[] = [`${title}`, '']
  for (const turn of episode.turns) {
    const name = nameById.get(turn.agentId) ?? turn.agentId
    lines.push(`${name}: ${turn.text}`)
  }
  lines.push('')
  return lines.join('\n')
}

/** Trigger a browser download of a text blob. */
export function downloadTextFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function downloadEpisodeJson(episode: JokestersEpisode, filename?: string): void {
  const id = episode.episodeId ?? 'episode'
  const name = filename ?? `${sanitizeFilename(id)}.jokesters.json`
  downloadTextFile(name, JSON.stringify(episode, null, 2), 'application/json')
}

export function downloadEpisodeMarkdown(episode: JokestersEpisode, filename?: string): void {
  const id = episode.episodeId ?? 'episode'
  const name = filename ?? `${sanitizeFilename(id)}.md`
  downloadTextFile(name, episodeToMarkdown(episode), 'text/markdown;charset=utf-8')
}

function sanitizeFilename(s: string): string {
  return s.replace(/[^\w.\-]+/g, '_').slice(0, 80) || 'episode'
}

/** Session store for last exportable episode (one-click export after stop). */
let lastEpisode: JokestersEpisode | null = null

export function setLastEpisode(episode: JokestersEpisode | null): void {
  lastEpisode = episode
}

export function getLastEpisode(): JokestersEpisode | null {
  return lastEpisode
}
