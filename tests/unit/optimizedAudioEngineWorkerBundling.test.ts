import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Vite's worker plugin only detects `new Worker(new URL('...', import.meta.url), opts)`
 * when the `new URL(...)` is inlined directly in the constructor call. Hoisting it to an
 * intermediate variable (`const url = new URL(...); new Worker(url, ...)`) breaks static
 * analysis: the worker module is copied as a raw, unparsed .ts asset instead of being
 * bundled to .js, and Worker construction fails at runtime with a syntax error. This bit
 * OptimizedAudioEngine once already (see PR history) and was invisible in CI because
 * `npm test` doesn't run a production build. Guard against a regression here.
 */
describe('OptimizedAudioEngine worker construction', () => {
  it('inlines `new URL(...)` directly inside `new Worker(...)` so Vite can bundle the worker chunk', () => {
    const source = fs.readFileSync(
      path.join(__dirname, '../../src/audio/OptimizedAudioEngine.ts'),
      'utf8',
    )

    expect(source).toMatch(/new Worker\(\s*new URL\(/)
  })
})
