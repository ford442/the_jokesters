import puppeteer from 'puppeteer';
import fs from 'node:fs';

const HEADLESS = process.env.HEADLESS !== '0';
const ENGINE = process.env.ENGINE || 'mlc';
const MODEL = process.env.MODEL || 'Hermes-3-Llama-3.2-3B-q4f32_1-MLC';
const OUT = process.env.OUT || '/tmp/hw';
fs.mkdirSync(OUT, { recursive: true });

const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

const browser = await puppeteer.launch({
  headless: HEADLESS,
  executablePath: '/opt/google/chrome/chrome',
  args: [
    '--no-sandbox',
    '--enable-unsafe-webgpu',
    '--enable-features=Vulkan',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--disable-dev-shm-usage',
    '--autoplay-policy=no-user-gesture-required',
    '--window-size=1820,1040',
  ],
  defaultViewport: HEADLESS ? { width: 1820, height: 1040 } : null,
  userDataDir: process.env.PROFILE || '/tmp/hw-profile',
});

const page = await browser.newPage();

// Network-layer rewrite of WebLLM's HF-style /resolve/main/ URLs to the VPS
// flat paths. In normal browser usage the registered service worker does this,
// but it is flaky to get the SW to control the page in a fresh headless dev
// session, so we replicate the SAME rewrite the SW performs (see
// src/utils/vpsStorageUrl.ts / src/service-worker.ts) at the harness level.
// Only needed for the MLC engine; llama.cpp uses direct flat VPS GGUF URLs and
// streams large files, which request interception can stall, so leave it off.
if (process.env.REWRITE === '1') {
  await page.setRequestInterception(true);
  const RESOLVE_RE = /^(https:\/\/storage\.1ink\.us\/models\/[^/]+)\/resolve\/main\/(.+)$/;
  page.on('request', (req) => {
    const url = req.url();
    const m = url.match(RESOLVE_RE);
    if (m) { req.continue({ url: `${m[1]}/${m[2]}` }); return; }
    req.continue();
  });
}

page.on('console', (m) => log('[page]', m.text().slice(0, 300)));
page.on('pageerror', (e) => log('[pageerror]', String(e).slice(0, 300)));
page.on('requestfailed', (r) => log('[reqfail]', r.failure()?.errorText, r.url().slice(0, 160)));
page.on('response', (r) => { if (r.status() >= 400) log('[http %d]', r.status(), r.url().slice(0, 160)); });

log('navigating...');
await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 60000 });

// Ensure WebGPU gate passed (setup panel visible)
await page.waitForSelector('#launch-btn', { visible: true, timeout: 30000 });
log('setup panel visible, WebGPU gate passed');


// Select engine + model FIRST (the model 'change' handler resets the context
// dropdown to the model default), then apply context / max-tokens overrides.
await page.select('#engine-select', ENGINE).catch(() => {});
await page.evaluate((model) => {
  const sel = document.getElementById('model-select-launch');
  if (![...sel.options].some((o) => o.value === model)) {
    const opt = document.createElement('option');
    opt.value = model; opt.textContent = model; sel.appendChild(opt);
  }
  sel.value = model;
  sel.dispatchEvent(new Event('change', { bubbles: true }));
}, MODEL);
log('selected engine=%s model=%s', ENGINE, MODEL);
// Dismiss the Cloud Conflict Dashboard modal which overlays the page by default
await page.evaluate(() => {
  const m = document.getElementById('cloud-dashboard-modal');
  if (m) m.style.display = 'none';
});
// Let any async model-change handler settle first.
await new Promise((r) => setTimeout(r, 2000));
await page.screenshot({ path: `${OUT}/01_setup.png` });

// Set context / max-tokens and click launch in ONE synchronous evaluate so the
// async model-change handler can't reset the context dropdown in between.
const applied = await page.evaluate((ctx, maxtok) => {
  const cs = document.getElementById('context-size-select');
  if (cs && ctx) cs.value = ctx;
  const ms = document.getElementById('max-tokens-slider');
  if (ms && maxtok) ms.value = maxtok;
  const result = { ctx: cs ? cs.value : null, maxtok: ms ? ms.value : null };
  document.getElementById('launch-btn').click();
  return result;
}, process.env.CTX || '', process.env.MAXTOK || '');
log('applied settings at launch click:', JSON.stringify(applied));
log('clicked launch, waiting for model load...');

// Poll progress while waiting for chat container to appear (display:flex)
const LOAD_TIMEOUT = 20 * 60 * 1000;
const start = Date.now();
let lastStatus = '';
let ready = false;
while (Date.now() - start < LOAD_TIMEOUT) {
  const state = await page.evaluate(() => {
    const cc = document.getElementById('chat-container');
    const prog = document.getElementById('progress');
    const err = document.querySelector('.error-panel');
    return {
      chatVisible: cc && getComputedStyle(cc).display !== 'none',
      status: prog ? prog.textContent : '',
      error: err ? err.textContent : null,
    };
  });
  if (state.status && state.status !== lastStatus) {
    lastStatus = state.status;
    log('progress:', state.status.slice(0, 120));
  }
  if (state.error) { log('ERROR PANEL:', state.error.slice(0, 300)); break; }
  if (state.chatVisible) { ready = true; break; }
  const waited = Math.round((Date.now() - start) / 1000);
  if (waited % 20 === 0) { log('...still loading, %ss, status=%j', waited, state.status); await page.screenshot({ path: `${OUT}/load_${waited}.png` }).catch(()=>{}); }
  await new Promise((r) => setTimeout(r, 2000));
}
if (!ready) { log('NOT READY - aborting'); await page.screenshot({ path: `${OUT}/99_notready.png` }); await browser.close(); process.exit(2); }

log('MODEL READY in %ss', ((Date.now() - start) / 1000).toFixed(0));
await page.screenshot({ path: `${OUT}/02_ready.png` });

// Send a chat message
const PROMPT = process.env.PROMPT || 'Tell me a one-line joke about debugging code.';
await page.waitForSelector('#user-input', { visible: true });
await page.type('#user-input', PROMPT);
await page.screenshot({ path: `${OUT}/03_typed.png` });
await page.click('#send-btn');
log('sent prompt:', PROMPT);

// Wait for agent response: last .message .content non-empty and stable
const GEN_TIMEOUT = (process.env.GEN_TIMEOUT_MIN ? parseInt(process.env.GEN_TIMEOUT_MIN) : 15) * 60 * 1000;
const gstart = Date.now();
let lastLen = -1, stableCount = 0, finalText = '';
while (Date.now() - gstart < GEN_TIMEOUT) {
  const r = await page.evaluate(() => {
    const msgs = [...document.querySelectorAll('#chat-log .message')];
    const last = msgs[msgs.length - 1];
    const content = last ? last.querySelector('.content') : null;
    const sendDisabled = document.getElementById('send-btn')?.disabled;
    return { text: content ? content.textContent : '', count: msgs.length, sendDisabled };
  });
  const t = (r.text || '').trim();
  if (t && t !== '...') {
    if (t.length === lastLen) { stableCount++; } else { stableCount = 0; lastLen = t.length; }
    finalText = t;
    // consider done when text stable for several polls AND send re-enabled
    if (stableCount >= 3 && r.sendDisabled === false) break;
  }
  await new Promise((r) => setTimeout(r, 2000));
}
log('RESPONSE (%ss):', ((Date.now() - gstart) / 1000).toFixed(0), JSON.stringify(finalText.slice(0, 500)));
await page.screenshot({ path: `${OUT}/04_response.png`, fullPage: false });

if (!finalText || finalText === '...') { log('NO RESPONSE GENERATED'); await browser.close(); process.exit(3); }
log('SUCCESS');
if (process.env.KEEP_OPEN === '1') { await new Promise((r) => setTimeout(r, 600000)); }
await browser.close();
