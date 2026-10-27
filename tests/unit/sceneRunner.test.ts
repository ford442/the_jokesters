import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTraceCtx } from './helpers/modeTrace'

const hoisted = vi.hoisted(() => ({ impl: null as null | ((...a: unknown[]) => Promise<unknown>) }))
vi.mock('../../src/comedy/comedyModeHelpers', () => ({
  chatForAgentWithComedy: (...a: unknown[]) => hoisted.impl!(...a),
}))

import { runSceneScript, validateSceneScript, type SceneScript } from '../../src/Director/modes/sceneRunner'

const SCRIPT: SceneScript = {
  banner: 'BANNER {{topic}}',
  bannerColor: '#123456',
  userLabel: 'Guest (You)',
  roles: { host: 'scientist', wit: 'comedian' },
  beats: [
    { when: 'open', speaker: 'host', prompt: '(open about "{{topic}}")' },
    { speaker: 'wit', prompt: '(react to "{{input}}" re {{topic}})' },
    { speaker: 'host', prompt: '(wrap up)' },
  ],
}

function setup(opts: Parameters<typeof createTraceCtx>[0]) {
  const t = createTraceCtx(opts)
  hoisted.impl = t.recordingChatForAgentWithComedy as never
  return t
}

afterEach(() => vi.restoreAllMocks())

describe('runSceneScript', () => {
  it('plays banner, open beat, then echo + beats per user line, and stops when input ends', async () => {
    const t = setup({ inputs: ['hello'] })
    await runSceneScript(SCRIPT, t.ctx, { topic: 'tea' })
    t.restore()

    const summary = t.events.filter((e) => e.t !== 'speak').map((e) =>
      e.t === 'msg' ? `msg|${e.sender}|${e.message}|${e.color}` : `chat|${e.agent}|${e.prompt}`)
    expect(summary).toEqual([
      'msg|Director|BANNER tea|#123456',
      'chat|scientist|(open about "tea")',
      'msg|Guest (You)|hello|#ffffff',
      'chat|comedian|(react to "hello" re tea)',
      'chat|scientist|(wrap up)',
      'msg|Guest (You)||#ffffff', // the stopping wait still echoes, as the hand-written loops did
    ])
  })

  it('routes each spoken sentence to onSpeak under the beat\'s agent id', async () => {
    const t = setup({ inputs: ['x'] })
    await runSceneScript(SCRIPT, t.ctx, { topic: 'tea' })
    t.restore()
    expect(t.events.filter((e) => e.t === 'speak')).toEqual([
      { t: 'speak', sentence: 'line 1', agent: 'scientist' },
      { t: 'speak', sentence: 'line 2', agent: 'comedian' },
      { t: 'speak', sentence: 'line 3', agent: 'scientist' },
    ])
  })

  it('stops mid-round when isRunning flips, without playing the remaining beats', async () => {
    const t = setup({ inputs: ['a', 'b', 'c'], stopAfterChats: 2 }) // open + first user beat
    await runSceneScript(SCRIPT, t.ctx, { topic: 'tea' })
    t.restore()
    const chats = t.events.filter((e) => e.t === 'chat')
    expect(chats).toHaveLength(2)
    expect(t.events.filter((e) => e.t === 'msg' && e.sender === 'Guest (You)')).toHaveLength(1)
  })

  it('does not wait for input when the scene is already stopped after the open beat', async () => {
    const t = setup({ inputs: ['never read'], stopAfterChats: 1 })
    const waited = vi.spyOn(t.ctx, 'waitForInput')
    await runSceneScript(SCRIPT, t.ctx, { topic: 'tea' })
    t.restore()
    expect(waited).not.toHaveBeenCalled()
  })

  it('inserts var and input values verbatim (no re-scan, no $-pattern expansion)', async () => {
    const t = setup({ inputs: ['{{topic}} $& $1'] })
    await runSceneScript(SCRIPT, t.ctx, { topic: '{{input}} $`' })
    t.restore()
    const prompts = t.events.flatMap((e) => (e.t === 'chat' ? [e.prompt] : []))
    expect(prompts[1]).toBe('(react to "{{topic}} $& $1" re {{input}} $`)')
  })

  it('leaves unknown placeholders alone and treats an unknown speaker as a raw agent id', async () => {
    const t = setup({ inputs: [] })
    await runSceneScript(
      { ...SCRIPT, beats: [{ when: 'open', speaker: 'robot', prompt: '{{nope}} {{toString}}' }, SCRIPT.beats[1]] },
      t.ctx,
    )
    t.restore()
    expect(t.events.find((e) => e.t === 'chat')).toEqual({ t: 'chat', agent: 'robot', prompt: '{{nope}} {{toString}}' })
  })

  describe('oneOf', () => {
    const CHOICE: SceneScript = {
      ...SCRIPT,
      beats: [{ oneOf: [{ speaker: 'host', prompt: 'A' }, { speaker: 'wit', prompt: 'B' }, { speaker: 'host', prompt: 'C' }] }],
    }
    it.each([[0.0, 'A'], [0.32, 'A'], [0.34, 'B'], [0.65, 'B'], [0.67, 'C'], [0.999, 'C']])('roll %f plays %s', async (roll, want) => {
      const t = setup({ inputs: ['x'], rolls: [roll] })
      await runSceneScript(CHOICE, t.ctx)
      t.restore()
      expect(t.events.flatMap((e) => (e.t === 'chat' ? [e.prompt] : []))).toEqual([want])
    })
  })

  describe('skipChance', () => {
    const GATED: SceneScript = { ...SCRIPT, beats: [{ speaker: 'wit', prompt: 'gated', skipChance: 0.3 }, { speaker: 'host', prompt: 'always' }] }
    it.each([[0.2, ['always']], [0.31, ['gated', 'always']]])('roll %f plays %j', async (roll, want) => {
      const t = setup({ inputs: ['x'], rolls: [roll] })
      await runSceneScript(GATED, t.ctx)
      t.restore()
      expect(t.events.flatMap((e) => (e.t === 'chat' ? [e.prompt] : []))).toEqual(want)
    })
  })
})

describe('validateSceneScript', () => {
  it('accepts a sound script', () => {
    expect(validateSceneScript(SCRIPT)).toEqual([])
  })
  it('flags authoring mistakes', () => {
    const bad: SceneScript = {
      ...SCRIPT,
      beats: [
        { when: 'open', speaker: 'host', prompt: 'uses {{input}}' },
        { speaker: 'ghost', prompt: 'x', skipChance: 1 },
        { oneOf: [] },
      ],
    }
    expect(validateSceneScript(bad)).toEqual(
      expect.arrayContaining(['empty oneOf', 'unknown speaker "ghost"', 'skipChance out of range for ghost']),
    )
    expect(validateSceneScript(bad).some((p) => p.startsWith('open beat uses {{input}}'))).toBe(true)
    expect(validateSceneScript({ ...SCRIPT, beats: [SCRIPT.beats[0]] })).toContain('no per-round beats')
  })
})
