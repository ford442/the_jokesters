#!/usr/bin/env node
// Soft coverage ratchet (CI: `npm run test:coverage:ci`).
//
// Reads coverage/coverage-summary.json (vitest `json-summary` reporter, all of src/**) and compares
// each total against scripts/coverage-baseline.json:
//   - fails if any metric drops more than TOLERANCE percentage points below its baseline
//     (small slack so unrelated refactors don't flap the build);
//   - when a metric rises by TOLERANCE or more, asks you to lock it in with `--update`.
//
// Usage:
//   node scripts/check-coverage-ratchet.mjs            check
//   node scripts/check-coverage-ratchet.mjs --update   rewrite the baseline to the current totals
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const TOLERANCE = 0.5
const METRICS = ['lines', 'statements', 'functions', 'branches']

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const summaryPath = path.join(root, 'coverage', 'coverage-summary.json')
const baselinePath = path.join(root, 'scripts', 'coverage-baseline.json')

if (!existsSync(summaryPath)) {
  console.error(`No ${path.relative(root, summaryPath)} — run \`npm run test:coverage\` first.`)
  process.exit(2)
}

const total = JSON.parse(readFileSync(summaryPath, 'utf8')).total
const current = Object.fromEntries(METRICS.map((m) => [m, Math.round(total[m].pct * 100) / 100]))

if (process.argv.includes('--update')) {
  writeFileSync(baselinePath, JSON.stringify(current, null, 2) + '\n')
  console.log('Coverage baseline updated:', current)
  process.exit(0)
}

const baseline = JSON.parse(readFileSync(baselinePath, 'utf8'))
let failed = false
let improved = false
for (const m of METRICS) {
  const delta = current[m] - baseline[m]
  const line = `${m.padEnd(10)} ${current[m].toFixed(2)}% (baseline ${baseline[m].toFixed(2)}%, ${delta >= 0 ? '+' : ''}${delta.toFixed(2)})`
  if (delta < -TOLERANCE) {
    failed = true
    console.error(`✗ ${line}`)
  } else {
    if (delta >= TOLERANCE) improved = true
    console.log(`✓ ${line}`)
  }
}

if (failed) {
  console.error(`\nCoverage dropped more than ${TOLERANCE}pp below scripts/coverage-baseline.json. Add tests for the code you changed.`)
  process.exit(1)
}
if (improved) {
  console.log('\nCoverage went up — lock it in: npm run coverage:update')
}
