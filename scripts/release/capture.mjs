import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer'

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'laptop', width: 1280, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 },
]

function sha256(data) {
  return createHash('sha256').update(data).digest('hex')
}

function normalizedBaseUrl(value) {
  const url = new URL(value)
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('RELEASE_BASE_URL must be an HTTP(S) URL without credentials.')
  }
  url.pathname = `${url.pathname.replace(/\/+$/, '')}/`
  return url
}

async function fetchPage(url) {
  const response = await fetch(url, { redirect: 'follow' })
  return {
    response,
    body: Buffer.from(await response.arrayBuffer()),
  }
}

async function capture() {
  const target = process.env.RELEASE_BASE_URL || process.argv[2]
  if (!target) {
    throw new Error('Usage: npm run release:capture -- https://host/the-jokesters-staging/')
  }

  const baseUrl = normalizedBaseUrl(target)
  const bareUrl = baseUrl.href
  const indexUrl = new URL('index.html', baseUrl).href
  const outputDir = path.resolve(
    process.env.RELEASE_CAPTURE_DIR || process.argv[3] || 'release-evidence',
  )
  await mkdir(outputDir, { recursive: true })

  const [bare, index, versionResponse] = await Promise.all([
    fetchPage(bareUrl),
    fetchPage(indexUrl),
    fetch(new URL('version.json', baseUrl), { redirect: 'follow' }),
  ])
  const bareHash = sha256(bare.body)
  const indexHash = sha256(index.body)
  const headers = {
    'cross-origin-opener-policy': bare.response.headers.get('cross-origin-opener-policy'),
    'cross-origin-embedder-policy': bare.response.headers.get('cross-origin-embedder-policy'),
  }
  let version = null
  if (versionResponse.ok) version = await versionResponse.json()

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  const page = await browser.newPage()
  const consoleErrors = []
  const pageErrors = []
  const failedRequests = []
  const badResponses = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => pageErrors.push(error.stack || error.message))
  page.on('requestfailed', (request) => {
    failedRequests.push({ url: request.url(), error: request.failure()?.errorText || 'unknown' })
  })
  page.on('response', (response) => {
    if (response.status() >= 400) {
      badResponses.push({ url: response.url(), status: response.status() })
    }
  })

  try {
    await page.goto(bareUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await new Promise((resolve) => setTimeout(resolve, 1_000))
    const crossOriginIsolated = await page.evaluate(() => window.crossOriginIsolated)
    const screenshots = []
    for (const viewport of viewports) {
      await page.setViewport({ width: viewport.width, height: viewport.height })
      const screenshot = path.join(outputDir, `${viewport.name}.png`)
      await page.screenshot({ path: screenshot })
      screenshots.push(screenshot)
    }

    const report = {
      capturedAt: new Date().toISOString(),
      url: bareUrl,
      version,
      bareUrl: { status: bare.response.status, sha256: bareHash },
      indexUrl: { url: indexUrl, status: index.response.status, sha256: indexHash },
      identicalEntryBytes: bareHash === indexHash,
      headers,
      crossOriginIsolated,
      consoleErrors,
      pageErrors,
      failedRequests,
      badResponses,
      screenshots,
    }
    await writeFile(path.join(outputDir, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)
    console.info(JSON.stringify(report, null, 2))
    if (
      !bare.response.ok ||
      !index.response.ok ||
      bareHash !== indexHash ||
      !crossOriginIsolated ||
      badResponses.length > 0 ||
      failedRequests.length > 0
    ) {
      process.exitCode = 1
    }
  } finally {
    await browser.close()
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  capture().catch((error) => {
    console.error('[release:capture] Failed:', error)
    process.exitCode = 1
  })
}
