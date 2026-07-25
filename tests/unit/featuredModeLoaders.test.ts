import { describe, expect, it } from 'vitest'
import { FEATURED_MODE_IDS } from '../../src/config/featuredModes'
import { loadModeLoop, getMode } from '../../src/Director/modes/registry'
import { MODE_LOADER_BY_ID } from '../../src/Director/modes/modeLoaders'

describe('featured mode loaders', () => {
  it('every featured mode id is registered with a lazy (dynamic-import) loader', () => {
    for (const id of FEATURED_MODE_IDS) {
      expect(getMode(id), `${id} should be in MODE_REGISTRY`).toBeDefined()

      const loader = MODE_LOADER_BY_ID[id]
      expect(loader, `${id} should have a loader in MODE_LOADER_BY_ID`).toBeTypeOf('function')

      // Each loader must be a dynamic `import()` — a static top-level import would
      // pull the entire Dream/Expanded corpus into the same chunk as the registry.
      expect(
        loader.toString(),
        `${id}'s loader should use a dynamic import(), not an eager static import`,
      ).toMatch(/import\(|__vite_ssr_dynamic_import__\(/)
    }
  })

  it('resolves a mode loop function for each featured mode id', async () => {
    for (const id of FEATURED_MODE_IDS) {
      const loop = await loadModeLoop(id)
      expect(loop, `loadModeLoop('${id}') should resolve`).toBeTypeOf('function')
    }
  })
})
