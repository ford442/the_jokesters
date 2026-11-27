import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { finalizeBuild } from '../../scripts/release/finalize-build.mjs'

const temporaryDirectories: string[] = []

afterEach(() => {
  vi.restoreAllMocks()
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true })
  }
})

describe('finalizeBuild', () => {
  it('removes development/compressed artifacts and writes commit metadata', () => {
    const root = mkdtempSync(path.join(os.tmpdir(), 'jokesters-release-'))
    temporaryDirectories.push(root)
    const dist = path.join(root, 'dist')
    mkdirSync(path.join(dist, 'assets'), { recursive: true })
    mkdirSync(path.join(dist, 'scenarios'), { recursive: true })
    mkdirSync(path.join(dist, 'sets'), { recursive: true })
    writeFileSync(path.join(dist, 'index.html'), '<html></html>')
    writeFileSync(path.join(dist, 'service-worker.js'), 'self')
    writeFileSync(path.join(dist, 'assets', 'app.js'), 'app')
    writeFileSync(path.join(dist, 'assets', 'app.js.br'), 'stale')
    writeFileSync(path.join(dist, 'assets', 'app.js.gz'), 'stale')
    writeFileSync(path.join(dist, 'test-custom-webllm-model.html'), 'test')
    writeFileSync(path.join(dist, 'guide.ipynb'), '{}')
    writeFileSync(path.join(dist, 'scenarios', 'test_reaction.json'), '{}')
    writeFileSync(path.join(dist, 'sets', 'README.md'), 'dev notes')

    vi.spyOn(console, 'info').mockImplementation(() => undefined)
    const version = finalizeBuild({
      rootDir: root,
      distDir: dist,
      sha: '1234567890abcdef1234567890abcdef12345678',
      builtAt: new Date('2026-11-27T12:00:00.000Z'),
      dirty: false,
    })

    expect(version).toEqual({
      sha: '1234567890abcdef1234567890abcdef12345678',
      builtAt: '2026-11-27T12:00:00.000Z',
      dirty: false,
    })
    expect(JSON.parse(readFileSync(path.join(dist, 'version.json'), 'utf8'))).toEqual(version)
    expect(readdirSync(dist, { recursive: true })).toEqual(
      expect.arrayContaining(['index.html', 'version.json', 'assets', 'assets/app.js']),
    )
    expect(readdirSync(dist, { recursive: true })).not.toEqual(
      expect.arrayContaining([
        'test-custom-webllm-model.html',
        'guide.ipynb',
        'scenarios/test_reaction.json',
        'sets/README.md',
        'assets/app.js.br',
        'assets/app.js.gz',
      ]),
    )
  })
})
