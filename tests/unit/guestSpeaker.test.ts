import { describe, expect, it } from 'vitest'
import { GroupChatManager } from '../../src/GroupChatManager'
import { MockLLMEngine } from '../../src/llm/MockLLMEngine'
import { castAgents as agents } from '../../src/cast/defaultCast'
import { historyToTurns } from '../../src/episode'
import type { Agent } from '../../src/types/chat'
import { ACTOR_STAGE_X, GUEST_STAGE_X, actorFocus } from '../../src/visuals/kits/cameraDirector'

const GUEST: Agent = {
  id: 'guest',
  name: 'Grandma',
  systemPrompt: 'You are Grandma, a guest. End your response with "###".',
  temperature: 0.9,
  top_p: 0.95,
  color: '#d8a7ff',
}

async function setup() {
  const manager = new GroupChatManager(agents.map((a) => ({ ...a })))
  manager.setPromptLayout('per-speaker')
  const engine = new MockLLMEngine('mock', 'Mock')
  await engine.initialize({ id: 'mock-model', name: 'Mock', vram_required_MB: 0, context_window_size: 4096 })
  engine.queueResponses('Regular one.', 'Guest line.', 'Regular two.', 'Regular three.')
  manager.attachSessionForTests(engine, 'mock')
  return { manager, engine }
}

describe('GroupChatManager: temporary sixth speaker', () => {
  it('the guest speaks without moving the five-agent rotation', async () => {
    const { manager } = await setup()
    manager.setGuestAgent(GUEST)

    const first = await manager.chat('go')
    expect(first.agentId).toBe('comedian')
    expect(manager.getCurrentAgent().id).toBe('philosopher')

    const guest = await manager.chatForAgent('guest', 'your line')
    expect(guest).toEqual({ agentId: 'guest', response: 'Guest line.' })
    // Still the philosopher's turn: the guest did not consume or skip a slot.
    expect(manager.getCurrentAgent().id).toBe('philosopher')
    expect(manager.getAgents().map((a) => a.id)).toEqual(agents.map((a) => a.id))

    const next = await manager.chat('go')
    expect(next.agentId).toBe('philosopher')
  })

  it('tags only the guest line in history', async () => {
    const { manager } = await setup()
    manager.setGuestAgent(GUEST)
    await manager.chat('go')
    await manager.chatForAgent('guest', 'your line')
    await manager.chat('go')
    const assistants = manager.getHistory().filter((m) => m.role === 'assistant')
    expect(assistants.map((m) => m.guestId)).toEqual([undefined, 'guest', undefined])
  })

  it('is unavailable once cleared, and resetConversation clears it too', async () => {
    const { manager } = await setup()
    manager.setGuestAgent(GUEST)
    expect(manager.getGuestAgent()).toBe(GUEST)
    manager.setGuestAgent(null)
    await expect(manager.chatForAgent('guest', 'x')).rejects.toThrow('not found')

    manager.setGuestAgent(GUEST)
    manager.resetConversation()
    expect(manager.getGuestAgent()).toBeNull()
  })

  it('leaves the rotation where it was if the guest turn fails', async () => {
    const { manager, engine } = await setup()
    manager.setGuestAgent(GUEST)
    await manager.chat('go') // comedian → philosopher is next
    engine.chat = (async () => { throw new Error('boom') }) as never
    await expect(manager.chatForAgent('guest', 'x')).rejects.toThrow('boom')
    expect(manager.getCurrentAgent().id).toBe('philosopher')
  })
})

describe('episode turns with a guest', () => {
  const roster = [...agents.map((a) => a.id), 'guest']
  const said = (content: string, guestId?: string) => ({ role: 'assistant' as const, content, ...(guestId ? { guestId } : {}) })

  it('attributes guest lines explicitly and keeps rotation for everyone else', () => {
    const turns = historyToTurns(
      [said('a'), said('b'), said('g1', 'guest'), said('c'), said('d'), said('e'), said('f')],
      roster,
    )
    expect(turns.map((t) => t.agentId)).toEqual(['comedian', 'philosopher', 'guest', 'scientist', 'techBro', 'robot', 'comedian'])
  })

  it('without any guest-tagged line the roster is used as-is (legacy exports unchanged)', () => {
    const ids = agents.map((a) => a.id)
    const turns = historyToTurns(Array.from({ length: 7 }, (_, i) => said(`l${i}`)), ids)
    expect(turns.map((t) => t.agentId)).toEqual([...ids, ...ids].slice(0, 7))
  })
})

describe('camera: guest seat', () => {
  it('frames the guest at stage right and leaves the five regulars where they were', () => {
    expect(ACTOR_STAGE_X.guest).toBe(GUEST_STAGE_X)
    expect(actorFocus('guest').x).toBe(GUEST_STAGE_X)
    expect(GUEST_STAGE_X).toBeGreaterThan(ACTOR_STAGE_X.robot)
    expect(ACTOR_STAGE_X.comedian).toBe(-3.2)
    expect(actorFocus('someone-unknown').x).toBe(0)
  })
})
