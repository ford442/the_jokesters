import { parseEmotionArc } from '../Director/productionCard'
import type { ProductionCardInput, StatusLevel } from '../Director/productionCard'
import { SUPERTONIC_STYLE_IDS } from '../audio/voiceMap'
import type { SupertonicStyleId } from '../audio/voiceMap'

export interface ProductionPanelValues {
  relA: string
  relB: string
  relLabel: string
  relPublic: boolean
  secretAgent: string
  secretGoal: string
  /** Status game: who, how much rank, relative to whom (blank = the room). */
  statusAgent?: string
  statusLevel?: StatusLevel | ''
  statusTarget?: string
  statusPublic?: boolean
  /** Emotional arc: "angry → confused → pleased" for one agent. */
  arcAgent?: string
  arcLabels?: string
  /** Persona guest (a real sixth speaker). Needs both a name and a persona. */
  guestName?: string
  guestPersona?: string
  guestVoice?: string
  guestEnters?: string
  guestExits?: string
}

/** Pure: panel values → card input (undefined when nothing usable was filled in). */
export function buildProductionInput(v: ProductionPanelValues): ProductionCardInput | undefined {
  const input: ProductionCardInput = {}
  const label = v.relLabel.trim()
  if (label && v.relA && v.relB && v.relA !== v.relB) {
    input.relationships = [{ a: v.relA, b: v.relB, label, public: v.relPublic }]
  }
  const goal = v.secretGoal.trim()
  if (goal && v.secretAgent) {
    input.secrets = [{ agentId: v.secretAgent, goal }]
  }
  if (v.statusAgent && v.statusLevel) {
    const target = v.statusTarget && v.statusTarget !== v.statusAgent ? v.statusTarget : undefined
    input.statuses = [{
      agentId: v.statusAgent,
      level: v.statusLevel,
      ...(target ? { targetId: target } : {}),
      public: v.statusPublic ?? true,
    }]
  }
  const arc = v.arcAgent ? parseEmotionArc(v.arcAgent, v.arcLabels ?? '') : null
  if (arc) input.arcs = [arc]
  const guestName = v.guestName?.trim()
  const guestPersona = v.guestPersona?.trim()
  if (guestName && guestPersona) {
    const enters = Number.parseInt(v.guestEnters ?? '', 10)
    const exits = Number.parseInt(v.guestExits ?? '', 10)
    const voice = SUPERTONIC_STYLE_IDS.find((id) => id === v.guestVoice)
    input.guestNpc = {
      name: guestName,
      persona: guestPersona,
      entersAfterTurn: Number.isFinite(enters) && enters >= 0 ? enters : 2,
      ...(voice ? { voiceStyle: voice as SupertonicStyleId } : {}),
      ...(Number.isFinite(exits) && exits > 0 ? { exitsAfterTurn: exits } : {}),
    }
  }
  return Object.keys(input).length > 0 ? input : undefined
}

/** Wires the optional improv-panel production card (relationship, status, arc, secret, guest). */
export function wireProductionCardPanel(agents: { id: string; name: string }[]): () => ProductionCardInput | undefined {
  const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null
  const relA = el<HTMLSelectElement>('prod-rel-a')
  const relB = el<HTMLSelectElement>('prod-rel-b')
  const secretAgent = el<HTMLSelectElement>('prod-secret-agent')
  const statusAgent = el<HTMLSelectElement>('prod-status-agent')
  const statusTarget = el<HTMLSelectElement>('prod-status-target')
  const arcAgent = el<HTMLSelectElement>('prod-arc-agent')

  // `selectedIndex` indexes the agents; -1 selects the leading "(everyone)" option when there is one.
  const fill = (select: HTMLSelectElement | null, selectedIndex: number, leading?: HTMLOptionElement) => {
    if (!select) return
    select.replaceChildren(...(leading ? [leading] : []), ...agents.map((a) => new Option(a.name, a.id)))
    select.selectedIndex = Math.min(selectedIndex + (leading ? 1 : 0), agents.length - (leading ? 0 : 1))
  }
  fill(relA, 0)
  fill(relB, 1)
  fill(secretAgent, 0)
  fill(statusAgent, 0)
  fill(statusTarget, -1, new Option('(everyone)', ''))
  fill(arcAgent, 0)

  const value = (id: string) => el<HTMLInputElement | HTMLSelectElement>(id)?.value ?? ''

  return () =>
    buildProductionInput({
      relA: relA?.value ?? '',
      relB: relB?.value ?? '',
      relLabel: value('prod-rel-label'),
      relPublic: el<HTMLInputElement>('prod-rel-public')?.checked ?? true,
      secretAgent: secretAgent?.value ?? '',
      secretGoal: value('prod-secret-goal'),
      statusAgent: statusAgent?.value ?? '',
      statusLevel: value('prod-status-level') as StatusLevel | '',
      statusTarget: statusTarget?.value ?? '',
      statusPublic: el<HTMLInputElement>('prod-status-public')?.checked ?? true,
      arcAgent: arcAgent?.value ?? '',
      arcLabels: value('prod-arc-labels'),
      guestName: value('prod-guest-name'),
      guestPersona: value('prod-guest-persona'),
      guestVoice: value('prod-guest-voice'),
      guestEnters: value('prod-guest-enter'),
      guestExits: value('prod-guest-exit'),
    })
}
