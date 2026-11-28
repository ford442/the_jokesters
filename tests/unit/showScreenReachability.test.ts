import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Regression for #452 blockers 1 + 2. The live pointer hit-test of every show-screen
 * control is `npm run smoke -- --flows cpu`; these pin the source contracts it relies on.
 */
const root = path.resolve(__dirname, '../..')
const css = fs.readFileSync(path.join(root, 'src/style.css'), 'utf8')
const bootstrap = fs.readFileSync(path.join(root, 'src/app/bootstrap.ts'), 'utf8')

function rule(selector: string): string {
  const re = new RegExp(`(^|\\n)${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`)
  const m = re.exec(css)
  if (!m) throw new Error(`no rule for ${selector}`)
  return m[2]
}

describe('show screen (.chat-container)', () => {
  it('is inert until .enabled, and .enabled restores pointer + full opacity', () => {
    expect(rule('.chat-container')).toMatch(/pointer-events:\s*none/)
    const enabled = rule('.chat-container.enabled')
    expect(enabled).toMatch(/pointer-events:\s*auto/)
    expect(enabled).toMatch(/opacity:\s*1/)
  })

  it('bootstrap adds .enabled when ready and removes it on teardown', () => {
    expect(bootstrap).toMatch(/chatContainer\.classList\.add\('enabled'\)/)
    expect(bootstrap).toMatch(/run\.add\(\(\) => chatContainer\.classList\.remove\('enabled'\)\)/)
  })
})

describe('launch picker (.loading)', () => {
  it('scrolls when taller than the viewport so Load stays reachable', () => {
    const loading = rule('.loading')
    expect(loading).toMatch(/overflow-y:\s*auto/)
    expect(loading).toMatch(/justify-content:\s*safe center/)
  })
})
