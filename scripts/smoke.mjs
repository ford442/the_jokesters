#!/usr/bin/env node
/**
 * Production-mode browser smoke test (#452).
 *
 *   npm run smoke                                 # build must exist: serves dist/ via `vite preview`
 *   npm run smoke -- --url https://staging/...    # any deployed URL
 *   npm run smoke -- --flows launch,script,presets,error,cpu --expect-sha <sha>
 *
 * Fails (exit 1) on: console error, uncaught exception, failed request or status >= 400,
 * crossOriginIsolated !== true, version.json SHA mismatch, unresponsive main thread, or a
 * flow assertion. Expected noise lives in scripts/smoke-allowlist.json — each entry needs a
 * `reason`; there are no blanket filters.
 *
 * Output: <out>/report.json + <out>/*.png (default smoke-report/).
 */
import { chromium } from 'playwright'
import { spawn, execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function parseArgs(argv) {
  const out = { url: '', flows: 'launch,script,presets,error', outDir: 'smoke-report', expectSha: '', cpuBudgetSec: 600 }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    const next = () => argv[++i]
    if (a === '--url') out.url = next()
    else if (a === '--flows') out.flows = next()
    else if (a === '--out') out.outDir = next()
    else if (a === '--expect-sha') out.expectSha = next()
    else if (a === '--cpu-budget') out.cpuBudgetSec = Number(next())
    else if (a === '--help' || a === '-h') {
      console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0])
      process.exit(0)
    }
  }
  return out
}

const args = parseArgs(process.argv.slice(2))
const flows = new Set(args.flows.split(',').map((s) => s.trim()).filter(Boolean))
const outDir = path.resolve(repoRoot, args.outDir)
fs.mkdirSync(outDir, { recursive: true })

const allowlist = JSON.parse(fs.readFileSync(path.join(repoRoot, 'scripts/smoke-allowlist.json'), 'utf8'))
for (const e of allowlist.entries) {
  if (!e.match || !e.reason) throw new Error(`smoke-allowlist entry needs "match" and "reason": ${JSON.stringify(e)}`)
}
function allowed(kind, text, flow) {
  return allowlist.entries.find((e) =>
    (e.kind ?? kind) === kind && text.includes(e.match) && (!e.flows || e.flows.includes(flow)))
}

// ---------------------------------------------------------------- server
/** Production deploy subpath (vite.config.ts pwaScope) — the SW only registers correctly under it. */
const DEPLOY_BASE = '/the-jokesters/'
let server = null
async function startPreview() {
  if (!fs.existsSync(path.join(repoRoot, 'dist/index.html'))) {
    throw new Error('dist/ missing — run `npm run build` first (or pass --url).')
  }
  const port = 4173
  server = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort', '--base', DEPLOY_BASE], { cwd: repoRoot, stdio: 'pipe' })
  const url = `http://localhost:${port}${DEPLOY_BASE}`
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(url)
      if (r.ok) return url
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error('vite preview did not start')
}

// ---------------------------------------------------------------- harness
const report = { startedAt: new Date().toISOString(), url: '', flows: {}, ok: true }

function newFlowResult(name) {
  const r = { name, ok: true, problems: [], allowed: [], notes: [], screenshots: [], durationMs: 0 }
  report.flows[name] = r
  return r
}

function fail(r, msg) {
  r.ok = false
  r.problems.push(msg)
}

/** Attach console/network/exception watchers to a page, scoped to one flow. */
function watch(page, r, flowName, opts = {}) {
  const record = (kind, text) => {
    const hit = allowed(kind, text, flowName)
    if (hit) r.allowed.push({ kind, text: text.slice(0, 300), reason: hit.reason })
    else fail(r, `${kind}: ${text.slice(0, 500)}`)
  }
  page.on('console', (m) => { if (m.type() === 'error') record('console', m.text()) })
  page.on('pageerror', (e) => record('exception', String(e?.stack ?? e)))
  page.on('requestfailed', (req) => {
    const why = req.failure()?.errorText ?? ''
    // Aborts we cause ourselves (navigation away, forced-failure flow) are not findings.
    if (why.includes('ERR_ABORTED') && opts.ignoreAborts) return
    record('request', `${req.method()} ${req.url()} failed: ${why}`)
  })
  page.on('response', (res) => {
    if (res.status() >= 400) record('request', `${res.status()} ${res.request().method()} ${res.url()}`)
  })
}

/** Main thread must answer a trivial evaluate within `ms`. */
async function assertResponsive(page, r, label, ms = 10_000) {
  const t0 = Date.now()
  const ok = await Promise.race([
    page.evaluate(() => true).then(() => true, () => false),
    new Promise((res) => setTimeout(() => res(false), ms)),
  ])
  if (!ok) fail(r, `main thread unresponsive for > ${ms / 1000}s (${label})`)
  return { ok, ms: Date.now() - t0 }
}

async function shot(page, r, name) {
  const file = path.join(outDir, `${r.name}-${name}.png`)
  await page.screenshot({ path: file }).catch(() => {})
  r.screenshots.push(path.relative(repoRoot, file))
}

/** Is the element's centre the topmost hit target (i.e. a real pointer would reach it)? */
async function hitTest(page, selector) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel)
    if (!el) return { ok: false, why: 'missing' }
    const b = el.getBoundingClientRect()
    const x = b.left + b.width / 2
    const y = b.top + b.height / 2
    if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return { ok: false, why: `off-screen at ${Math.round(x)},${Math.round(y)}` }
    const top = document.elementFromPoint(x, y)
    const ok = !!top && (top === el || el.contains(top))
    return { ok, why: ok ? '' : `covered by ${top?.tagName}#${top?.id}.${top?.className}` }
  }, selector)
}

async function checkPlatform(page, r, base) {
  const coi = await page.evaluate(() => self.crossOriginIsolated)
  if (coi !== true) fail(r, `crossOriginIsolated is ${coi}`)
  try {
    const v = await (await fetch(new URL('version.json', base))).json()
    r.notes.push(`version.json sha=${v.sha}`)
    report.versionSha = v.sha
    if (args.expectSha && v.sha !== args.expectSha) fail(r, `version.json sha ${v.sha} != expected ${args.expectSha}`)
  } catch (e) {
    fail(r, `version.json unreadable: ${e}`)
  }
}

// ---------------------------------------------------------------- flows
const VIEWPORTS = [
  [1920, 1080], [1366, 768], [1280, 720], [390, 844], [844, 390],
]

async function flowLaunch(browser, base) {
  const r = newFlowResult('launch')
  for (const [w, h] of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } })
    const page = await ctx.newPage()
    watch(page, r, 'launch', { ignoreAborts: true })
    await page.goto(base, { waitUntil: 'load' })
    await page.waitForSelector('#launch-btn', { state: 'visible', timeout: 30_000 })
    if (w === 1920) await checkPlatform(page, r, base)
    // Real pointer path: wheel-scroll the picker until the button is on screen, then hit-test.
    let hit = await hitTest(page, '#launch-btn')
    for (let i = 0; i < 20 && !hit.ok; i++) {
      const box = await page.locator('.loading').boundingBox()
      if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.wheel(0, 200)
      await page.waitForTimeout(100)
      hit = await hitTest(page, '#launch-btn')
    }
    if (!hit.ok) fail(r, `${w}x${h}: Load button not pointer-reachable (${hit.why})`)
    await shot(page, r, `${w}x${h}`)
    if (hit.ok && w === 1366) {
      const b = await page.locator('#launch-btn').boundingBox()
      await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2)
      // A real click must start loading: the progress UI replaces the picker.
      const started = await page.waitForFunction(() => {
        const t = document.querySelector('.loading')?.textContent ?? ''
        return /Initializing|Loading|Downloading|Setting up/i.test(t)
      }, null, { timeout: 15_000 }).then(() => true, () => false)
      if (!started) fail(r, 'clicking Load did not start loading')
      await assertResponsive(page, r, 'after Load click')
    }
    await ctx.close()
  }
  return r
}

async function flowScript(browser, base) {
  const r = newFlowResult('script')
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } })
  const page = await ctx.newPage()
  watch(page, r, 'script')
  const t0 = Date.now()
  await page.goto(new URL('?mode=script', base).href, { waitUntil: 'load' })
  const ready = await page.waitForFunction(() => {
    const t = document.querySelector('#script-player')?.textContent ?? ''
    return /Ready — press Play|Voice offline/.test(t)
  }, null, { timeout: 180_000 }).then(() => true, () => false)
  if (!ready) { fail(r, 'script player never became ready'); await shot(page, r, 'stuck'); await ctx.close(); return r }
  const text = await page.locator('#script-player').innerText()
  if (/voice offline/i.test(text)) fail(r, 'voice offline in Script Player')
  r.notes.push(`voice ready after ${((Date.now() - t0) / 1000).toFixed(1)}s`)
  report.voiceReadySec = (Date.now() - t0) / 1000
  const lineCount = await page.evaluate(async () => {
    // The default packet is bundled; count its turns from the "<n> lines" description if shown.
    const m = /(\d+) lines/.exec(document.querySelector('#script-player')?.textContent ?? '')
    return m ? Number(m[1]) : null
  })
  await page.getByRole('button', { name: /Play/ }).click()
  await page.waitForFunction(() => document.querySelector('#script-player')?.dataset.playing === 'true', null, { timeout: 10_000 }).catch(() => {})
  const deadline = Date.now() + 300_000
  while (Date.now() < deadline) {
    await assertResponsive(page, r, 'script playback')
    const playing = await page.evaluate(() => document.querySelector('#script-player')?.dataset.playing)
    if (playing === 'false') break
    await page.waitForTimeout(1000)
  }
  const spoken = Number(await page.evaluate(() => document.querySelector('#script-player')?.dataset.utterances ?? '0'))
  r.notes.push(`${spoken} utterances played${lineCount ? ` of ${lineCount} lines` : ''}`)
  if (spoken === 0) fail(r, 'Play produced no audio')
  else if (lineCount && spoken < lineCount) fail(r, `only ${spoken}/${lineCount} lines were voiced`)
  // Stop: replay again, stop mid-way, and expect playback to end promptly.
  await page.getByRole('button', { name: /Play/ }).click()
  await page.waitForTimeout(1500)
  await page.getByRole('button', { name: /Stop/ }).click()
  const stopped = await page.waitForFunction(() => document.querySelector('#script-player')?.dataset.playing === 'false', null, { timeout: 5_000 })
    .then(() => true, () => false)
  if (!stopped) fail(r, 'Stop did not end playback within 5 s')
  await assertResponsive(page, r, 'after Stop')
  await shot(page, r, 'done')
  await ctx.close()
  return r
}

async function flowPresets() {
  const r = newFlowResult('presets')
  const out = execSync('npx tsx scripts/smoke/presetUrls.ts', { cwd: repoRoot }).toString()
  const urls = JSON.parse(out)
  const status = async (url) => {
    try {
      let res = await fetch(url, { method: 'HEAD', redirect: 'follow' })
      if (res.status === 405 || res.status === 403) res = await fetch(url, { headers: { Range: 'bytes=0-0' } })
      return res.status
    } catch (e) {
      return `unreachable (${e})`
    }
  }
  const okStatus = (s) => typeof s === 'number' && s < 400
  await Promise.all(urls.map(async ({ id, kind, url, fallbacks = [] }) => {
    const s = await status(url)
    if (okStatus(s)) return
    for (const fb of fallbacks) {
      if (okStatus(await status(fb))) {
        r.notes.push(`${id} ${kind}: primary ${s} ${url} → loads from fallback ${fb}`)
        return
      }
    }
    fail(r, `${id} ${kind} ${s} ${url}${fallbacks.length ? ' (and every fallback)' : ''}`)
  }))
  r.notes.push(`checked ${urls.length} URLs`)
  return r
}

async function flowError(browser, base) {
  const r = newFlowResult('error')
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } })
  const page = await ctx.newPage()
  watch(page, r, 'error', { ignoreAborts: true })
  // Every model-weight request fails until we lift the block.
  let blocked = true
  await ctx.route(/\.(onnx|bin|gguf|wasm|safetensors)(\?|$)|tokenizer|config\.json|mlc-chat-config/, (route) => {
    const u = route.request().url()
    if (blocked && !u.startsWith(base)) return route.abort('failed')
    return route.continue()
  })
  await page.goto(base, { waitUntil: 'load' })
  await page.waitForSelector('#launch-btn', { state: 'visible', timeout: 30_000 })
  await page.locator('#launch-btn').click()
  const panel = await page.waitForSelector('.error-panel', { timeout: 180_000 }).then(() => true, () => false)
  if (!panel) { fail(r, 'forced download failure never showed the error panel'); await shot(page, r, 'no-panel'); await ctx.close(); return r }
  await shot(page, r, 'panel')
  blocked = false
  await page.locator('.error-panel .retry-btn').click()
  const recovered = await page.waitForFunction(() => !document.querySelector('.error-panel') ||
    getComputedStyle(document.querySelector('.error-panel')).display === 'none', null, { timeout: 30_000 }).then(() => true, () => false)
  if (!recovered) fail(r, 'Retry did not clear the error panel')
  await assertResponsive(page, r, 'after Retry')
  await ctx.close()
  return r
}

async function flowCpu(browser, base) {
  const r = newFlowResult('cpu')
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } })
  const page = await ctx.newPage()
  watch(page, r, 'cpu')
  await page.goto(base, { waitUntil: 'load' })
  await page.waitForSelector('#launch-btn', { state: 'visible', timeout: 30_000 })
  const t0 = Date.now()
  await page.locator('#launch-btn').click()
  const budgetMs = args.cpuBudgetSec * 1000
  let ready = false
  while (Date.now() - t0 < budgetMs) {
    // Unstubbed rendering: the main thread must keep answering while the model loads.
    const resp = await assertResponsive(page, r, 'during CPU load', 30_000)
    if (!resp.ok) break
    ready = await page.evaluate(() => !!document.querySelector('#chat-container.enabled'))
    if (ready) break
    await page.waitForTimeout(2000)
  }
  if (!ready) { fail(r, `show screen not ready within ${args.cpuBudgetSec}s`); await shot(page, r, 'stuck'); await ctx.close(); return r }
  r.notes.push(`show screen ready ${((Date.now() - t0) / 1000).toFixed(0)}s after click`)
  const opacity = await page.evaluate(() => getComputedStyle(document.querySelector('#chat-container')).opacity)
  if (opacity !== '1') fail(r, `chat container opacity ${opacity}`)
  const controls = await page.evaluate(() => {
    const els = [...document.querySelectorAll('#chat-container button, #chat-container input, #chat-container select, #chat-container textarea')]
    return els.filter((e) => !e.disabled && e.offsetParent !== null && e.getClientRects().length > 0)
      .map((e, i) => { e.setAttribute('data-smoke-id', String(i)); return { i, label: e.id || e.textContent?.trim().slice(0, 30) || e.tagName } })
  })
  let failedHits = 0
  for (const c of controls) {
    await page.locator(`[data-smoke-id="${c.i}"]`).scrollIntoViewIfNeeded().catch(() => {})
    const h = await hitTest(page, `[data-smoke-id="${c.i}"]`)
    if (!h.ok) { failedHits++; fail(r, `control "${c.label}" fails hit-test: ${h.why}`) }
  }
  r.notes.push(`hit-tested ${controls.length} controls, ${failedHits} failed`)
  await shot(page, r, 'ready')
  const before = await page.locator('#chat-log > *').count()
  await page.locator('#user-input').fill('Tell me a joke about cats.')
  await page.locator('#send-btn').click()
  const t1 = Date.now()
  const replied = await page.waitForFunction((n) => document.querySelectorAll('#chat-log > *').length > n + 1, before, { timeout: budgetMs })
    .then(() => true, () => false)
  if (!replied) fail(r, 'no reply to chat message')
  else r.notes.push(`first reply ${((Date.now() - t1) / 1000).toFixed(0)}s after send`)
  const start = page.locator('#start-improv-btn')
  if (await start.isVisible()) {
    await start.click()
    await page.waitForTimeout(5000)
    await assertResponsive(page, r, 'Director mode running', 30_000)
    const stop = page.locator('#stop-improv-btn')
    if (await stop.isVisible()) await stop.click()
    else fail(r, 'Stop Scene button never appeared')
  }
  await shot(page, r, 'after-mode')
  await ctx.close()
  return r
}

// ---------------------------------------------------------------- main
async function main() {
  const base = args.url || (await startPreview())
  report.url = base
  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] })
  const t = (fn) => async (...a) => { const s = Date.now(); const r = await fn(...a); r.durationMs = Date.now() - s; return r }
  try {
    if (flows.has('launch')) await t(flowLaunch)(browser, base)
    if (flows.has('script')) await t(flowScript)(browser, base)
    if (flows.has('presets')) await t(flowPresets)()
    if (flows.has('error')) await t(flowError)(browser, base)
    if (flows.has('cpu')) await t(flowCpu)(browser, base)
  } finally {
    await browser.close()
    server?.kill()
  }
  report.ok = Object.values(report.flows).every((f) => f.ok)
  report.finishedAt = new Date().toISOString()
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2))
  for (const f of Object.values(report.flows)) {
    console.log(`${f.ok ? 'PASS' : 'FAIL'} ${f.name} (${(f.durationMs / 1000).toFixed(1)}s)`)
    for (const n of f.notes) console.log(`   · ${n}`)
    for (const p of f.problems) console.log(`   ✗ ${p}`)
    for (const a of f.allowed) console.log(`   ~ allowed ${a.kind}: ${a.text.slice(0, 120)} — ${a.reason}`)
  }
  console.log(`\nReport: ${path.relative(repoRoot, path.join(outDir, 'report.json'))}`)
  process.exit(report.ok ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  server?.kill()
  process.exit(1)
})
