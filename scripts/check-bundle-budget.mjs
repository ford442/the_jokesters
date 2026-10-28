#!/usr/bin/env node
// Enforces the byte budgets in perf-budget.json (thresholds.bundleSize / thresholds.distSize)
// against a finished `npm run build`. Exits non-zero when a `max` is exceeded.
//
//   node scripts/check-bundle-budget.mjs [distDir]
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dist = path.resolve(process.argv[2] ?? path.join(root, 'dist'))
const budget = JSON.parse(readFileSync(path.join(root, 'perf-budget.json'), 'utf8')).thresholds

if (!existsSync(path.join(dist, 'index.html'))) {
  console.error(`No build found at ${dist} (run \`npm run build\` first).`)
  process.exit(2)
}

const kb = (n) => `${(n / 1024).toFixed(1)} KiB`
const mb = (n) => `${(n / 1024 / 1024).toFixed(1)} MiB`
const gz = new Map()
const gzipSize = (file) => {
  if (!gz.has(file)) gz.set(file, gzipSync(readFileSync(file), { level: 9 }).length)
  return gz.get(file)
}

// --- Per-chunk and total gzip ------------------------------------------------------------
const assetsDir = path.join(dist, 'assets')
const jsFiles = readdirSync(assetsDir).filter((f) => f.endsWith('.js')).map((f) => path.join(assetsDir, f))
const sizes = jsFiles.map((f) => ({ file: f, gzip: gzipSize(f) }))
const totalGzip = sizes.reduce((a, b) => a + b.gzip, 0)
const largest = sizes.reduce((a, b) => (b.gzip > a.gzip ? b : a))

// --- Initial load: entry scripts + modulepreloads + their static import graph ---------------
const html = readFileSync(path.join(dist, 'index.html'), 'utf8')
const entryRefs = [
  ...html.matchAll(/<script[^>]+type="module"[^>]+src="([^"]+)"/g),
  ...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g),
].map((m) => path.resolve(dist, m[1]))

const staticImportRe = /(?:\bfrom|\bimport)\s*["'](\.{1,2}\/[^"']+\.js)["']/g
const initial = new Set()
const visit = (file) => {
  if (initial.has(file) || !existsSync(file)) return
  initial.add(file)
  const src = readFileSync(file, 'utf8')
  for (const m of src.matchAll(staticImportRe)) visit(path.resolve(path.dirname(file), m[1]))
}
entryRefs.forEach(visit)
const initialGzip = [...initial].reduce((a, f) => a + gzipSize(f), 0)

// --- Whole dist/ -------------------------------------------------------------------------
const dirSize = (dir) =>
  readdirSync(dir, { withFileTypes: true }).reduce((sum, e) => {
    const p = path.join(dir, e.name)
    return sum + (e.isDirectory() ? dirSize(p) : statSync(p).size)
  }, 0)
const distBytes = dirSize(dist)

const checks = [
  ['initial JS (gzip)', initialGzip, budget.bundleSize.initialGzipMax, kb],
  ['largest chunk (gzip)', largest.gzip, budget.bundleSize.chunkGzipMax, kb],
  ['total JS (gzip)', totalGzip, budget.bundleSize.max, kb],
  ['dist/ total', distBytes, budget.distSize.max, mb],
]

let failed = false
for (const [label, value, max, fmt] of checks) {
  const ok = value <= max
  failed ||= !ok
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}: ${fmt(value)} (max ${fmt(max)})`)
}
console.log(`\nInitial load (${initial.size} files):`)
for (const f of [...initial].sort((a, b) => gzipSize(b) - gzipSize(a))) {
  console.log(`  ${kb(gzipSize(f)).padStart(10)}  ${path.relative(dist, f)}`)
}
console.log(`Largest chunk: ${path.relative(dist, largest.file)}`)
process.exit(failed ? 1 : 0)
