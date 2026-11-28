#!/usr/bin/env node
/**
 * "State of the App" markdown from smoke results (#452).
 *
 *   npm run release:report -- [--report smoke-report/report.json] [--release "2/5"] [--out state-of-the-app.md]
 *
 * Fills the Live-app and per-flow sections from report.json; build/test rows and the
 * verdict are left for the release owner when they are not in the report.
 */
import fs from 'node:fs'

const argv = process.argv.slice(2)
const opt = (name, dflt) => { const i = argv.indexOf(`--${name}`); return i >= 0 ? argv[i + 1] : dflt }
const reportPath = opt('report', 'smoke-report/report.json')
const release = opt('release', '?/5')
const outPath = opt('out', '')
const r = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
const flows = Object.values(r.flows)

const problems = flows.flatMap((f) => f.problems.map((p) => ({ flow: f.name, p })))
const consoleErrs = problems.filter((x) => x.p.startsWith('console:'))
const exceptions = problems.filter((x) => x.p.startsWith('exception:'))
const requests = problems.filter((x) => x.p.startsWith('request:'))
const coi = problems.some((x) => x.p.startsWith('crossOriginIsolated')) ? 'false' : (r.flows.launch ? 'true' : 'not checked')
const list = (xs) => (xs.length ? `${xs.length}: ${xs.map((x) => `\`${x.flow}\` ${x.p.replace(/\|/g, '\\|').slice(0, 160)}`).join('<br>')}` : '0')

const md = `## State of the App: Release ${release}
**Date:** ${r.finishedAt ?? r.startedAt}            **Verdict:** ${r.ok ? 'GO (smoke)' : 'NO-GO (smoke failed)'}
**Deployed URL:** ${r.url}
**Commit SHA (full):** ${r.versionSha ?? 'unknown'}            **Live version.json matches:** ${problems.some((x) => x.p.includes('version.json')) ? 'no' : (r.versionSha ? 'yes' : 'not checked')}
**Browser, OS, GPU:** headless Chromium (Playwright), ${process.platform}, software WebGL / no WebGPU adapter

### Build and tests
| Step | Result |
|---|---|
| npm ci | |
| verify:wllama | |
| typecheck | |
| lint:ci | |
| registry:check | |
| test:coverage:ci (passed/total, line %) | |
| build (warnings) | |
| budget:check (initial / largest / total JS / dist) | |
| CI runs for this SHA (links) | |

### Live app
| Check | Result |
|---|---|
| Console errors (count and text) | ${list(consoleErrs)} |
| Uncaught exceptions | ${list(exceptions)} |
| Failed or >= 400 requests | ${list(requests)} |
| crossOriginIsolated | ${coi} |
| Core flows exercised | ${flows.map((f) => `${f.name} ${f.ok ? '✅' : '❌'}`).join(', ')} |

### Smoke results per flow
${flows.map((f) => `- **${f.name}** — ${f.ok ? 'PASS' : 'FAIL'} (${(f.durationMs / 1000).toFixed(1)} s)` +
  f.notes.map((n) => `\n  - ${n}`).join('') +
  f.problems.map((p) => `\n  - ✗ ${p.slice(0, 300)}`).join('') +
  f.allowed.map((a) => `\n  - ~ allowlisted ${a.kind}: ${a.text.slice(0, 120)} (${a.reason})`).join('')).join('\n')}

### Screenshots of the deployed app
${flows.flatMap((f) => f.screenshots).map((s) => `- ${s}`).join('\n') || '_none_'}

### Known issues and waivers (with links)
### Not verified (and why)
`
if (outPath) fs.writeFileSync(outPath, md)
else process.stdout.write(md)
