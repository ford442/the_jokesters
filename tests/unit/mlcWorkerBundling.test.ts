import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Same guard as optimizedAudioEngineWorkerBundling.test.ts, for the MLC LLM worker:
 * Vite only bundles a worker when `new URL('...', import.meta.url)` is inlined directly
 * in `new Worker(...)`. Hoisting it into a variable ships the raw `.ts` as an asset and
 * the worker dies with a syntax error at runtime (which `npm test` would never notice).
 */
const read = (rel: string) => fs.readFileSync(path.join(__dirname, '../../', rel), 'utf8')

describe('MLC worker construction (Vite bundling)', () => {
  const clientSource = read('src/llm/worker/mlcWorkerEngine.ts')

  it('inlines `new URL(./mlc.worker.ts)` directly inside `new Worker(...)` as a module worker', () => {
    expect(clientSource).toMatch(
      /new Worker\(\s*new URL\(\s*'\.\/mlc\.worker\.ts',\s*import\.meta\.url\s*\),\s*\{[^}]*type:\s*'module'/,
    )
  })

  it('points at a worker entry that exists next to the client', () => {
    expect(fs.existsSync(path.join(__dirname, '../../src/llm/worker/mlc.worker.ts'))).toBe(true)
  })
})

describe('mlc.worker entry', () => {
  const workerSource = read('src/llm/worker/mlc.worker.ts')

  it('installs the VPS /resolve/main/ fetch + Cache rewrites before web-llm fetches weights', () => {
    const vpsImport = workerSource.indexOf("import '../../utils/installVpsFetch'")
    const webllmImport = workerSource.indexOf("from '@mlc-ai/web-llm'")
    expect(vpsImport).toBeGreaterThanOrEqual(0)
    expect(vpsImport).toBeLessThan(webllmImport)
  })

  it('uses the stock web-llm handler and re-installs the WebGPU limits / device-lost intercept', () => {
    expect(workerSource).toMatch(/extends WebWorkerMLCEngineHandler/)
    expect(workerSource).toMatch(/interceptWebGpuAdapterLimits\(/)
    expect(workerSource).toMatch(/buildComedyLogitProcessorRegistry\(/)
  })
})
