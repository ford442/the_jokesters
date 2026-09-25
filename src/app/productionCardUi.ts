import type { ProductionCardInput } from '../Director/productionCard'

export interface ProductionPanelValues {
  relA: string
  relB: string
  relLabel: string
  relPublic: boolean
  secretAgent: string
  secretGoal: string
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
  return input.relationships || input.secrets ? input : undefined
}

/** Wires the optional improv-panel production card (relationship chip + secret goal). */
export function wireProductionCardPanel(agents: { id: string; name: string }[]): () => ProductionCardInput | undefined {
  const el = <T extends HTMLElement>(id: string) => document.getElementById(id) as T | null
  const relA = el<HTMLSelectElement>('prod-rel-a')
  const relB = el<HTMLSelectElement>('prod-rel-b')
  const secretAgent = el<HTMLSelectElement>('prod-secret-agent')

  const fill = (select: HTMLSelectElement | null, selectedIndex: number) => {
    if (!select) return
    select.replaceChildren(...agents.map((a) => new Option(a.name, a.id)))
    select.selectedIndex = Math.min(selectedIndex, agents.length - 1)
  }
  fill(relA, 0)
  fill(relB, 1)
  fill(secretAgent, 0)

  return () =>
    buildProductionInput({
      relA: relA?.value ?? '',
      relB: relB?.value ?? '',
      relLabel: el<HTMLInputElement>('prod-rel-label')?.value ?? '',
      relPublic: el<HTMLInputElement>('prod-rel-public')?.checked ?? true,
      secretAgent: secretAgent?.value ?? '',
      secretGoal: el<HTMLInputElement>('prod-secret-goal')?.value ?? '',
    })
}
