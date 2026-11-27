import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

const isDevelopmentArtifact = (relativePath) =>
  relativePath === 'test-custom-webllm-model.html' ||
  relativePath.endsWith('.ipynb') ||
  /^scenarios\/test_.*\.json$/.test(relativePath) ||
  /^(sets|tts|sfx)\/README\.md$/.test(relativePath)

function listFiles(directory, prefix = '') {
  if (!existsSync(directory)) return []
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name
    const absolutePath = path.join(directory, entry.name)
    return entry.isDirectory() ? listFiles(absolutePath, relativePath) : [relativePath]
  })
}

export function finalizeBuild({
  rootDir = repoRoot,
  distDir = path.join(rootDir, 'dist'),
  builtAt = new Date(),
  sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: rootDir, encoding: 'utf8' }).trim(),
  dirty = execFileSync('git', ['status', '--porcelain'], { cwd: rootDir, encoding: 'utf8' }).trim().length > 0,
} = {}) {
  const serviceWorkerPath = path.join(distDir, 'service-worker.js')
  if (!existsSync(serviceWorkerPath)) {
    throw new Error('Production build must contain the single injected service-worker.js.')
  }

  const files = listFiles(distDir)
  for (const relativePath of files) {
    if (isDevelopmentArtifact(relativePath) || /\.(?:br|gz)$/.test(relativePath)) {
      rmSync(path.join(distDir, relativePath), { force: true })
    }
  }

  const remaining = listFiles(distDir)
  const leaked = remaining.filter(
    (relativePath) => isDevelopmentArtifact(relativePath) || /\.(?:br|gz)$/.test(relativePath),
  )
  const serviceWorkers = remaining.filter((relativePath) => /^service-worker\.(?:js|mjs)$/.test(relativePath))
  if (serviceWorkers.length !== 1 || serviceWorkers[0] !== 'service-worker.js') {
    throw new Error(`Expected one stable service-worker.js; found: ${serviceWorkers.join(', ') || 'none'}`)
  }
  if (leaked.length) {
    throw new Error(`Release artifacts leaked into dist: ${leaked.join(', ')}`)
  }

  const version = { sha, builtAt: builtAt.toISOString(), dirty }
  mkdirSync(distDir, { recursive: true })
  writeFileSync(path.join(distDir, 'version.json'), `${JSON.stringify(version, null, 2)}\n`)
  console.info(`[release] ${sha.slice(0, 7)} built ${version.builtAt}; dirty=${dirty}`)
  return version
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  finalizeBuild()
}
