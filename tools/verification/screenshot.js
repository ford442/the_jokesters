import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, 'dist');
const PORT = process.env.PORT || 3002;
const BASE_URL = process.argv[2] || `http://localhost:${PORT}`;
const URL = BASE_URL.includes('?')
  ? BASE_URL + '&renderer=webgpu'
  : BASE_URL + '?renderer=webgpu';
const OUT = process.argv[3] || path.join(__dirname, 'headless_chrome', 'screenshot.png');

// Serve dist/ with COOP/COEP headers for WebGPU/SharedArrayBuffer.
function serveDist() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.wasm': 'application/wasm',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
      };
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        res.end(data);
      });
    });
    server.listen(PORT, '127.0.0.1', () => {
      console.log(`Serving ${DIST_DIR} at ${BASE_URL}`);
      resolve(server);
    });
  });
}

const chromeArgs = [
  '--no-sandbox',
  '--headless=new',
  '--enable-unsafe-webgpu',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
  '--enable-features=Vulkan,UseSkiaRenderer',
  '--use-angle=vulkan',
  '--disable-vulkan-surface',
  '--enable-gpu-rasterization',
  '--enable-zero-copy',
  '--disable-search-engine-choice-screen',
  '--ash-no-nudges',
  '--no-first-run',
  '--disable-features=Translate',
  '--no-default-browser-check',
  '--window-size=1280,720',
  '--hide-scrollbars',
];

async function run() {
  const server = await serveDist();

  const browser = await puppeteer.launch({
    headless: 'new',
    ignoreDefaultArgs: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome',
    args: chromeArgs,
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(`[console] ${text}`);
    console.log(text);
  });
  page.on('pageerror', err => {
    const stack = err.stack || '';
    logs.push(`[pageerror] ${err.message}\n${stack}`);
    console.error('Page error:', err.message, stack);
  });
  page.on('requestfailed', req => {
    logs.push(`[requestfailed] ${req.url()}: ${req.failure()?.errorText}`);
  });

  console.log(`Navigating to ${URL} ...`);
  await page.goto(URL, { waitUntil: 'load', timeout: 60000 });

  // Wait for the launch button.
  await page.waitForSelector('#launch-btn', { timeout: 30000 });

  // Confirm Vicuna 7B is selected.
  const modelSelect = await page.$('#model-select-launch');
  if (modelSelect) {
    await modelSelect.select('vicuna-7b-q4f32-webllm-vps');
    console.log('Selected Vicuna 7B q4f32');
  }

  // Click load model.
  console.log('Clicking Load Model & Start...');
  await page.click('#launch-btn');

  // Wait for model load to progress. Poll status text for up to 10 minutes.
  console.log('Waiting for model load progress...');
  const startTime = Date.now();
  const maxWaitMs = 10 * 60 * 1000;
  let lastProgress = 0;
  let lastScreenshotTime = 0;
  while (Date.now() - startTime < maxWaitMs) {
    const status = await page.evaluate(() => {
      const statusEl = document.getElementById('status');
      const progressEl = document.getElementById('progress');
      const ready = document.getElementById('chat-container')?.style.display !== 'none';
      return {
        status: statusEl?.textContent || '',
        progress: parseFloat(progressEl?.style.width || '0'),
        ready,
      };
    });

    if (status.progress > lastProgress) {
      lastProgress = status.progress;
      console.log(`Progress: ${status.progress.toFixed(1)}% — ${status.status}`);
    }

    if (status.ready) {
      console.log('Chat container visible — model loaded.');
      break;
    }

    // Take intermediate screenshots every 30s.
    if (Date.now() - lastScreenshotTime > 30000) {
      fs.mkdirSync(path.dirname(OUT), { recursive: true });
      const intermediate = OUT.replace(/\.png$/i, `_${Math.round((Date.now() - startTime) / 1000)}s.png`);
      await page.screenshot({ path: intermediate, fullPage: false });
      console.log(`Intermediate screenshot: ${intermediate}`);
      lastScreenshotTime = Date.now();
    }

    await new Promise(r => setTimeout(r, 2000));
  }

  // Final screenshot.
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  await page.screenshot({ path: OUT, fullPage: false });
  console.log(`Screenshot saved to ${OUT}`);

  // Save logs.
  fs.writeFileSync(OUT.replace(/\.png$/i, '.log.txt'), logs.join('\n'));

  await browser.close();
  server.close();
}

run().catch(err => {
  console.error('Screenshot script failed:', err);
  process.exit(1);
});
