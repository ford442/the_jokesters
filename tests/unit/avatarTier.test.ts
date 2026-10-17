import { describe, expect, it } from 'vitest'
import { selectAvatarTier, VRM_MIN_VRAM_MB } from '../../src/visuals/avatarTier'
import { bundledAvatarUrl, BUNDLED_AVATAR_IDS } from '../../src/visuals/avatarManifest'
import { isStripeEligibleUrl } from '../../src/utils/dualDomainStripe'

describe('selectAvatarTier', () => {
  it('honors an explicit preference over everything', () => {
    expect(selectAvatarTier({ queryPref: 'vrm', coarsePointer: true }).tier).toBe('vrm')
    expect(selectAvatarTier({ queryPref: 'primitive', device: { webgpu: true, availableVramMB: 12000 } }).tier).toBe('primitive')
    expect(selectAvatarTier({ storedPref: 'vrm', device: { webgpu: false } }).tier).toBe('vrm')
    // query beats stored
    expect(selectAvatarTier({ queryPref: 'primitive', storedPref: 'vrm' }).tier).toBe('primitive')
  })

  it('keeps primitives on mobile and weak hardware', () => {
    expect(selectAvatarTier({ coarsePointer: true, device: { webgpu: true, availableVramMB: 8000 } }).tier).toBe('primitive')
    expect(selectAvatarTier({ deviceMemoryGb: 4, device: { webgpu: true, availableVramMB: 8000 } }).tier).toBe('primitive')
    expect(selectAvatarTier({ hardwareConcurrency: 4, device: { webgpu: true, availableVramMB: 8000 } }).tier).toBe('primitive')
  })

  it('uses the guided-launch VRAM probe', () => {
    expect(selectAvatarTier({ device: { webgpu: true, availableVramMB: VRM_MIN_VRAM_MB } }).tier).toBe('vrm')
    expect(selectAvatarTier({ device: { webgpu: true, availableVramMB: VRM_MIN_VRAM_MB - 1 } }).tier).toBe('primitive')
    expect(selectAvatarTier({ device: { webgpu: false } }).tier).toBe('primitive')
  })

  it('falls back to the GL renderer string without a probe', () => {
    expect(selectAvatarTier({ glRenderer: 'ANGLE (NVIDIA GeForce RTX 3070 Direct3D11)' }).tier).toBe('vrm')
    expect(selectAvatarTier({ glRenderer: 'ANGLE (Intel(R) UHD Graphics 620 Direct3D11)' }).tier).toBe('primitive')
    expect(selectAvatarTier({ glRenderer: 'Google SwiftShader' }).tier).toBe('primitive')
    expect(selectAvatarTier({}).tier).toBe('primitive')
  })
})

describe('bundledAvatarUrl', () => {
  it('builds one .vrm url per agent under /avatars/', () => {
    for (const id of BUNDLED_AVATAR_IDS) {
      expect(bundledAvatarUrl(id, 'https://x.test/models')).toBe(`https://x.test/models/avatars/${id}.vrm`)
    }
    expect(BUNDLED_AVATAR_IDS).toHaveLength(5)
  })

  it('rejects path-like ids', () => {
    expect(bundledAvatarUrl('../etc/passwd')).toBeNull()
    expect(bundledAvatarUrl('a/b')).toBeNull()
    expect(bundledAvatarUrl('')).toBeNull()
  })

  it('is striped by the service worker like other model binaries', () => {
    expect(isStripeEligibleUrl('https://storage.1ink.us/models/avatars/comedian.vrm')).toBe(true)
  })
})
