import type { Agent } from '../types/chat'
import { agents as defaultAgents } from '../config/agents'

const STORAGE_PREFIX = 'jokesters-evolved-adjustments-'
const MAX_ADJUSTMENTS = 5

const POSITIVE_ADJUSTMENT =
  ' (You received positive feedback: lean more into your current traits and be more confident.)'
const NEGATIVE_ADJUSTMENT =
  ' (You received negative feedback: dial back your extreme traits and try to be more agreeable.)'

function basePromptFor(agentId: string, fallback: string): string {
  return defaultAgents.find((a) => a.id === agentId)?.systemPrompt ?? fallback
}

function loadAdjustments(agentId: string): string[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${agentId}`)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}

function saveAdjustments(agentId: string, adjustments: string[]): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${agentId}`, JSON.stringify(adjustments))
  } catch {
    console.warn(`Could not save personality adjustments for ${agentId}`)
  }
}

function rebuildSystemPrompt(agent: Agent, adjustments: string[]): void {
  agent.systemPrompt = basePromptFor(agent.id, agent.systemPrompt) + adjustments.join('')
}

/**
 * Structured personality evolution — stores adjustment snippets, not unbounded prompt growth.
 */
export class PersonalityStore {
  constructor(private readonly agents: Agent[]) {}

  loadIntoAgents(): void {
    for (const agent of this.agents) {
      const adjustments = loadAdjustments(agent.id)
      if (adjustments.length > 0) {
        rebuildSystemPrompt(agent, adjustments)
        console.log(`Loaded evolved personality for ${agent.name} (${adjustments.length} adjustments)`)
      }
    }
  }

  evolve(agentId: string, feedback: 'positive' | 'negative'): void {
    const agent = this.agents.find((a) => a.id === agentId)
    if (!agent) return

    const adjustment = feedback === 'positive' ? POSITIVE_ADJUSTMENT : NEGATIVE_ADJUSTMENT
    const adjustments = loadAdjustments(agentId)
    if (!adjustments.includes(adjustment)) {
      adjustments.push(adjustment)
    }
    while (adjustments.length > MAX_ADJUSTMENTS) {
      adjustments.shift()
    }
    saveAdjustments(agentId, adjustments)
    rebuildSystemPrompt(agent, adjustments)
    console.log(`Evolved personality for ${agent.name} saved (${adjustments.length} adjustments).`)
  }
}
