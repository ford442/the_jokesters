#!/usr/bin/env node
// Lint gate used by CI (`npm run lint:ci`).
//
//  1. Any ESLint *error* fails the run.
//  2. `@typescript-eslint/no-explicit-any` is a warning, but its count is ratcheted against
//     scripts/lint-any-baseline.json: the run fails if the count goes UP, and asks you to lower
//     the baseline when it goes DOWN so the gain cannot be silently given back.
//
// Usage:
//   node scripts/check-any-ratchet.mjs            check
//   node scripts/check-any-ratchet.mjs --update   rewrite the baseline to the current count
import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const baselinePath = path.join(root, 'scripts', 'lint-any-baseline.json')
const ANY_RULE = '@typescript-eslint/no-explicit-any'
const update = process.argv.includes('--update')

const run = spawnSync('npx', ['eslint', '.', '--format', 'json'], {
  cwd: root,
  encoding: 'utf8',
  maxBuffer: 256 * 1024 * 1024,
})
if (run.error) throw run.error

let results
try {
  results = JSON.parse(run.stdout)
} catch {
  console.error('ESLint did not produce JSON output:\n' + (run.stderr || run.stdout))
  process.exit(2)
}

let errors = 0
let anyCount = 0
const perFile = new Map()
for (const file of results) {
  for (const msg of file.messages) {
    if (msg.ruleId === ANY_RULE) {
      anyCount++
      const rel = path.relative(root, file.filePath)
      perFile.set(rel, (perFile.get(rel) ?? 0) + 1)
    } else if (msg.severity === 2) {
      errors++
      console.error(`${path.relative(root, file.filePath)}:${msg.line}:${msg.column} ${msg.ruleId ?? 'fatal'}: ${msg.message}`)
    }
  }
}

if (errors > 0) {
  console.error(`\n${errors} ESLint error(s). Run \`npm run lint\` for details.`)
  process.exit(1)
}

if (update) {
  writeFileSync(baselinePath, JSON.stringify({ rule: ANY_RULE, count: anyCount }, null, 2) + '\n')
  console.log(`Baseline updated: ${anyCount} explicit any`)
  process.exit(0)
}

const baseline = JSON.parse(readFileSync(baselinePath, 'utf8')).count
if (anyCount > baseline) {
  console.error(`explicit any count went UP: ${anyCount} > baseline ${baseline}.`)
  console.error('Top files:')
  for (const [f, n] of [...perFile].sort((a, b) => b[1] - a[1]).slice(0, 10)) console.error(`  ${n}  ${f}`)
  console.error('Replace the new `any` with a real type or `unknown`.')
  process.exit(1)
}
if (anyCount < baseline) {
  console.error(`explicit any count dropped to ${anyCount} (baseline ${baseline}). Lock it in:`)
  console.error('  npm run lint:any:update')
  process.exit(1)
}
console.log(`lint OK: 0 errors, explicit any = ${anyCount} (baseline ${baseline})`)
