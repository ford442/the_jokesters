import { describe, expect, it } from 'vitest'
import { isSoftwareGlRenderer } from '../../src/visuals/renderBudget'

describe('isSoftwareGlRenderer', () => {
  it('detects CPU rasterizers', () => {
    expect(isSoftwareGlRenderer('ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver)')).toBe(true)
    expect(isSoftwareGlRenderer('llvmpipe (LLVM 15.0.7, 256 bits)')).toBe(true)
  })
  it('leaves hardware GPUs uncapped', () => {
    expect(isSoftwareGlRenderer('ANGLE (NVIDIA, NVIDIA GeForce RTX 3060)')).toBe(false)
    expect(isSoftwareGlRenderer(null)).toBe(false)
  })
})
