import { describe, expect, it, vi } from 'vitest'
import golden from './fixtures/showGamesGolden.json'
import { digestLoop } from './helpers/modeTrace'

const hoisted = vi.hoisted(() => ({ impl: null as null | ((...a: unknown[]) => Promise<unknown>) }))
vi.mock('../../src/comedy/comedyModeHelpers', () => ({
  chatForAgentWithComedy: (...a: unknown[]) => hoisted.impl!(...a),
}))

import * as ShowGames from '../../src/Director/modes/ExpandedRealityModes_ShowGames'
import { validateSceneScript, type SceneScript } from '../../src/Director/modes/sceneRunner'

/**
 * tests/unit/fixtures/showGamesGolden.json was recorded from the hand-written loops these scripts
 * replaced. Each case is a sha256 of the full event trace (banner, user echo, speaker, prompt, onSpeak
 * routing) for a config x Math.random sequence x early-stop combination; `prompts` lists the old
 * literals for reviewers. Not to be regenerated to make a failing run pass.
 */
const GOLDEN = golden as unknown as Record<string, { prompts: Array<[string, string]>; digests: string[] }>

describe('show-games modes on the scene runner match the old hand-written loops', () => {
  for (const [name, want] of Object.entries(GOLDEN)) {
    it(name, async () => {
      const loop = (ShowGames as Record<string, unknown>)[name] as Parameters<typeof digestLoop>[0]
      const got = await digestLoop(loop, (impl) => { hoisted.impl = impl as never })
      expect(got.prompts).toEqual(want.prompts)
      expect(got.digests).toEqual(want.digests)
    })
  }

  it('every script in the file is sound', () => {
    const scripts = Object.entries(ShowGames).filter(([k]) => k.endsWith('_SCRIPT')) as Array<[string, SceneScript]>
    expect(scripts).toHaveLength(Object.keys(GOLDEN).length)
    for (const [name, script] of scripts) expect({ name, problems: validateSceneScript(script) }).toEqual({ name, problems: [] })
  })
})
