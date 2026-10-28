import { Box3 } from 'three'
import type { VRM } from '@pixiv/three-vrm'

export interface VrmLoadOptions {
  /**
   * The live renderer, used only to detect KTX2 transcode targets. Models without KTX2
   * textures load fine without it.
   */
  renderer?: unknown
  /** Base URL for the Basis transcoder (public/basis). */
  basisPath?: string
  signal?: AbortSignal
}

interface Ktx2Detect {
  setTranscoderPath(path: string): unknown
  detectSupport(renderer: never): unknown
  dispose(): void
}

let ktx2: Ktx2Detect | null = null

/**
 * Load a .vrm from a URL (hosted avatar or an object URL for a user upload).
 *
 * Everything heavy is imported dynamically so three-vrm, GLTFLoader and the Basis/Meshopt
 * decoders only ship to users who actually get VRM actors. Meshopt-compressed geometry and
 * KTX2 textures are decoded transparently.
 */
export async function loadVrm(url: string, options: VrmLoadOptions = {}): Promise<VRM> {
  const [{ GLTFLoader }, { KTX2Loader }, { MeshoptDecoder }, vrmLib] = await Promise.all([
    import('three/examples/jsm/loaders/GLTFLoader.js'),
    import('three/examples/jsm/loaders/KTX2Loader.js'),
    import('three/examples/jsm/libs/meshopt_decoder.module.js'),
    import('@pixiv/three-vrm'),
  ])

  const loader = new GLTFLoader()
  loader.setMeshoptDecoder(MeshoptDecoder)
  loader.register((parser) => new vrmLib.VRMLoaderPlugin(parser))

  if (options.renderer) {
    try {
      if (!ktx2) {
        const k = new KTX2Loader()
        k.setTranscoderPath(options.basisPath ?? `${import.meta.env.BASE_URL}basis/`)
        k.detectSupport(options.renderer as never)
        ktx2 = k as unknown as Ktx2Detect
      }
      loader.setKTX2Loader(ktx2 as unknown as InstanceType<typeof KTX2Loader>)
    } catch (err) {
      console.warn('[VRM] KTX2 setup failed — KTX2 textures will not decode:', (err as Error)?.message ?? err)
    }
  }

  const gltf = await loader.loadAsync(url)
  if (options.signal?.aborted) {
    vrmLib.VRMUtils.deepDispose(gltf.scene)
    throw new DOMException('VRM load aborted', 'AbortError')
  }

  const vrm = gltf.userData.vrm as VRM | undefined
  if (!vrm) {
    vrmLib.VRMUtils.deepDispose(gltf.scene)
    throw new Error('File loaded but contains no VRM extension')
  }

  // Perf: drop unused verts/joints and merge skeletons (one skinning pass per model).
  vrmLib.VRMUtils.removeUnnecessaryVertices(gltf.scene)
  vrmLib.VRMUtils.combineSkeletons(gltf.scene)
  // VRM0 faces -Z; normalize to the VRM1 convention (+Z toward the camera).
  vrmLib.VRMUtils.rotateVRM0(vrm)

  normalizeVrmHeight(vrm)

  // Skinned meshes get culled wrongly by their rest-pose bounds once posed procedurally.
  vrm.scene.traverse((o) => {
    o.frustumCulled = false
  })
  return vrm
}

/** Height every VRM is scaled to, matching the capsule actors (~1.6 body + antenna). */
export const TARGET_VRM_HEIGHT = 1.7

/** Uniformly scale to TARGET_VRM_HEIGHT and stand the feet on y=0 (VRM models vary 1.2–1.9 m). */
export function normalizeVrmHeight(vrm: VRM, target = TARGET_VRM_HEIGHT): void {
  vrm.scene.updateMatrixWorld(true)
  const box = new Box3().setFromObject(vrm.scene)
  const height = box.max.y - box.min.y
  if (!(height > 0.2) || !Number.isFinite(height)) return
  const scale = Math.min(1.8, Math.max(0.6, target / height))
  vrm.scene.scale.multiplyScalar(scale)
  vrm.scene.position.y -= box.min.y * scale
}
