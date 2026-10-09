import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getMode } from '../../src/Director/modes/registry'
import { stripForSpeakability } from '../../src/chat/speakableText'
import {
  isAllowedPropName,
  propAssetUrl,
  ALLOWED_PROPS,
} from '../../src/visuals/propCatalog'
import { takePropCues, stripPropTokens, stripStageTokens } from '../../src/visuals/propTokens'
import {
  isStageKitId,
  kitAssetUrl,
  resolveScenarioStageKit,
  resolveStageKitId,
} from '../../src/visuals/stageKitIds'
import {
  createCameraDirectorState,
  kitFov,
  lerpPose,
  poseForShot,
  selectCameraShot,
  stepCameraDirector,
  triggerWhip,
  whipLateralOffset,
} from '../../src/visuals/kits/cameraDirector'
import { StageKitSession } from '../../src/visuals/kits/kitSession'
import { shouldDisableShadows } from '../../src/visuals/kits/shadowPolicy'

describe('stage kit ids', () => {
  it('resolves unknown ids to void', () => {
    expect(resolveStageKitId(undefined)).toBe('void')
    expect(resolveStageKitId('')).toBe('void')
    expect(resolveStageKitId('spaceship')).toBe('void')
    expect(resolveStageKitId('../sets/secret.glb')).toBe('void')
    expect(resolveStageKitId('talkshow.glb')).toBe('void')
    expect(isStageKitId('talkshow')).toBe(true)
    expect(isStageKitId('void')).toBe(true)
  })

  it('lets an explicit scenario kit override registry metadata', () => {
    expect(resolveScenarioStageKit({ stageKit: 'news' }, { stageKit: 'talkshow' })).toBe('news')
    expect(resolveScenarioStageKit({ config: { stageKit: 'court' } }, { stageKit: 'talkshow' })).toBe('court')
    expect(resolveScenarioStageKit({}, { stageKit: 'talkshow' })).toBe('talkshow')
    expect(resolveScenarioStageKit({ stageKit: 'not-a-kit' }, { stageKit: 'talkshow' })).toBe('void')
  })

  it('builds kit URLs only from the whitelist map', () => {
    expect(kitAssetUrl('talkshow')).toBe('./sets/talkshow.glb')
    expect(kitAssetUrl('court')).toBe('./sets/court.glb')
    expect(kitAssetUrl('news')).toBe('./sets/news.glb')
    expect(kitAssetUrl('void')).toBeNull()
    expect(kitAssetUrl('../../secret')).toBeNull()
    expect(kitAssetUrl('talkshow/../../../x')).toBeNull()
    expect(kitAssetUrl('talkshow.glb')).toBeNull()
  })

  it('selects kits from existing mode metadata', () => {
    expect(getMode('talk_show')?.stageKit).toBe('talkshow')
    expect(getMode('news_desk')?.stageKit).toBe('news')
    expect(getMode('newsroom')?.stageKit).toBe('news')
    expect(getMode('reporter')?.stageKit).toBe('news')
    expect(getMode('trial')?.stageKit).toBe('court')
    expect(getMode('improv')?.stageKit).toBe('void')
    expect(getMode('roast')?.stageKit).toBeUndefined()
  })
})

describe('stage kit dispose', () => {
  it('disposes geometries and materials when the kit is unmounted', () => {
    const disposed: string[] = []
    const root = {
      geometry: { dispose: () => disposed.push('geo') },
      material: { dispose: () => disposed.push('mat'), map: { dispose: () => disposed.push('map') } },
      removeFromParent: () => disposed.push('detach'),
    }
    const session = new StageKitSession()
    session.mount('talkshow', root)
    expect(session.activeKit).toBe('talkshow')
    const count = session.unmount()
    expect(count).toBe(3)
    expect(disposed).toEqual(['geo', 'map', 'mat', 'detach'])
    expect(session.activeKit).toBe('void')
  })

  it('discards a graph when the kit id is unknown', () => {
    const disposed: string[] = []
    const root = {
      geometry: { dispose: () => disposed.push('geo') },
      material: null,
      removeFromParent: () => undefined,
    }
    const session = new StageKitSession()
    session.mount('not-a-kit', root)
    expect(session.activeKit).toBe('void')
    expect(disposed).toContain('geo')
    expect(session.unmount()).toBe(0)
  })
})

describe('camera director', () => {
  it('idles with no speaker, two-shots a handoff, then pushes in', () => {
    expect(selectCameraShot({
      activeActorId: null,
      previousActorId: 'comedian',
      secondsOnSpeaker: 0,
    })).toBe('idle')
    expect(selectCameraShot({
      activeActorId: 'philosopher',
      previousActorId: null,
      secondsOnSpeaker: 0,
    })).toBe('speakerClose')
    expect(selectCameraShot({
      activeActorId: 'philosopher',
      previousActorId: 'comedian',
      secondsOnSpeaker: 0.2,
    })).toBe('twoShot')
    expect(selectCameraShot({
      activeActorId: 'philosopher',
      previousActorId: 'comedian',
      secondsOnSpeaker: 2,
    })).toBe('speakerClose')
  })

  it('uses a wider lens for court than for the talk show', () => {
    expect(kitFov('court', 'speakerClose')).toBeGreaterThan(kitFov('talkshow', 'speakerClose'))
    expect(kitFov('court', 'idle')).toBeGreaterThan(kitFov('news', 'idle'))
  })

  it('pushes in on the speaker without mutating the source pose', () => {
    const idle = poseForShot('idle', null, null, 'talkshow')
    const close = poseForShot('speakerClose', 'comedian', null, 'talkshow')
    const idleCopy = JSON.parse(JSON.stringify(idle)) as typeof idle
    expect(close.lookAt.x).toBeCloseTo(-3.2)
    expect(close.position.z).toBeLessThan(idle.position.z)
    const mid = lerpPose(idle, close, 0.5)
    expect(idle).toEqual(idleCopy)
    expect(mid.position.z).toBeGreaterThan(close.position.z)
    expect(mid.position.z).toBeLessThan(idle.position.z)
    expect(lerpPose(idle, close, 0).position).toEqual(idle.position)
    expect(lerpPose(idle, close, 1).lookAt).toEqual(close.lookAt)
  })

  it('whips laterally and settles', () => {
    expect(whipLateralOffset(-1)).toBe(0)
    expect(whipLateralOffset(0.21)).toBeGreaterThan(0.8)
    expect(whipLateralOffset(1)).toBe(0)

    let state = triggerWhip(createCameraDirectorState('talkshow'))
    expect(state.whipElapsed).toBe(0)
    state = stepCameraDirector(state, {
      dt: 0.05,
      activeActorId: 'scientist',
      previousActorId: null,
      kit: 'talkshow',
    })
    expect(state.pose.position.z).toBeLessThan(6.5)
    for (let i = 0; i < 20; i++) {
      state = stepCameraDirector(state, {
        dt: 0.05,
        activeActorId: 'scientist',
        previousActorId: null,
        kit: 'talkshow',
      })
    }
    expect(state.whipElapsed).toBe(-1)
    expect(state.pose.lookAt.x).toBeCloseTo(0, 1)
  })
})

describe('prop catalog', () => {
  it('ignores names outside the whitelist, including path traversal', () => {
    expect(isAllowedPropName('mug')).toBe(true)
    expect(isAllowedPropName('briefcase')).toBe(true)
    expect(isAllowedPropName('gun')).toBe(false)
    expect(isAllowedPropName('../etc/passwd')).toBe(false)
    expect(isAllowedPropName('mug.glb')).toBe(false)
    expect(isAllowedPropName('mug/../../../x')).toBe(false)
    expect(isAllowedPropName('')).toBe(false)

    expect(propAssetUrl('mug')).toBe('procedural:mug')
    expect(propAssetUrl('briefcase')).toBe('procedural:briefcase')
    expect(propAssetUrl('../../secret')).toBeNull()
    expect(propAssetUrl('mug/../../../x')).toBeNull()
    expect(propAssetUrl('gun')).toBeNull()

    for (const name of ALLOWED_PROPS) {
      const url = propAssetUrl(name)
      expect(url).toBe(`procedural:${name}`)
      expect(url).not.toMatch(/\.\./)
    }
  })

  it('parses show/hide cues and drops everything else', () => {
    const { cleanText, cues } = takePropCues(
      'Coffee [prop:mug] then [prop:gun] [prop:../../etc/passwd] [prop:mug:hide] PROP:briefcase:off',
    )
    expect(cues).toEqual([
      { name: 'mug', action: 'show' },
      { name: 'mug', action: 'hide' },
      { name: 'briefcase', action: 'hide' },
    ])
    expect(cleanText).toBe('Coffee then')
    expect(cleanText.toLowerCase()).not.toContain('prop:')
    expect(stripPropTokens('[prop:../../etc/passwd] hello')).toBe('hello')
    expect(stripStageTokens('[sfx:rimshot] [prop:mug] hello')).toBe('hello')
    expect(stripForSpeakability('[prop:mug] hello')).toMatch(/hello/)
    expect(stripForSpeakability('[prop:mug]')).toBe('')
  })
})

describe('shadow policy', () => {
  it('drops shadows only after a sustained sub-30 FPS window', () => {
    expect(shouldDisableShadows(Array(19).fill(10), false)).toBe(false)
    expect(shouldDisableShadows(Array(20).fill(24), false)).toBe(true)
    expect(shouldDisableShadows(Array(20).fill(40), false)).toBe(false)
    expect(shouldDisableShadows([60], true)).toBe(true)
  })
})

describe('stage kit glb assets', () => {
  it('ships talk show, news, and court as static GLBs outside the JS bundle', () => {
    const loader = readFileSync(join('src/visuals/kits/loadStageKit.ts'), 'utf8')
    expect(loader).not.toMatch(/import\s+[^;]*\.glb/)
    expect(loader).toContain('kitAssetUrl')

    for (const name of ['talkshow.glb', 'news.glb', 'court.glb']) {
      const buf = readFileSync(join('public/sets', name))
      expect(buf.readUInt32LE(0)).toBe(0x46546c67)
      expect(buf.readUInt32LE(4)).toBe(2)
      expect(buf.length).toBeLessThan(1024 * 1024)
      const jsonLength = buf.readUInt32LE(12)
      const json = JSON.parse(buf.subarray(20, 20 + jsonLength).toString('utf8')) as {
        asset: { version: string }
        buffers: Array<{ byteLength: number }>
        meshes: unknown[]
      }
      expect(json.asset.version).toBe('2.0')
      expect(json.meshes.length).toBeGreaterThan(0)
      expect(json.meshes.length).toBeLessThanOrEqual(4)
    }
  })
})
