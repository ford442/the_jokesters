/**
 * Load a stage kit GLB from `public/sets/` (or the deployed equivalent).
 * The GLB is not part of the JS bundle — GLTFLoader is code-split, and the
 * file URL comes only from `kitAssetUrl`.
 *
 * Independent of LLM WebGPU. A software-WebGL page can still show the set.
 */

import * as THREE from 'three'
import { kitAssetUrl, type StageKitId } from '../stageKitIds'

export async function loadKitObject(kit: Exclude<StageKitId, 'void'>): Promise<THREE.Group> {
  const url = kitAssetUrl(kit)
  if (!url) {
    throw new Error(`No stage-kit asset for "${kit}"`)
  }
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js')
  const loader = new GLTFLoader()
  const gltf = await loader.loadAsync(url)
  const root = gltf.scene
  root.name = `stage-kit:${kit}`
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return
    // A handful of set meshes, not per-audience draws. Skip extra shadow casters.
    mesh.castShadow = false
    mesh.receiveShadow = true
    mesh.frustumCulled = true
  })
  return root
}
