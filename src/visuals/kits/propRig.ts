/**
 * One mesh per whitelisted prop. Shown or hidden by cue; disposed with the scene.
 * Names that fail the catalog are ignored and never become geometry.
 */

import * as THREE from 'three'
import { isAllowedPropName, type AllowedPropName, type PropAction } from '../propCatalog'
import { disposeKitGraph } from './disposeKit'

export interface PropAnchor {
  x: number
  y: number
  z: number
}

export class PropRig {
  private readonly group = new THREE.Group()
  private readonly meshes = new Map<AllowedPropName, THREE.Object3D>()

  constructor(scene: THREE.Scene) {
    this.group.name = 'stage-props'
    scene.add(this.group)
  }

  apply(name: string, action: PropAction, anchor: PropAnchor, onDesk: boolean): boolean {
    if (!isAllowedPropName(name)) return false
    if (action === 'hide') return this.hide(name)
    return this.show(name, anchor, onDesk)
  }

  show(name: AllowedPropName, anchor: PropAnchor, onDesk: boolean): boolean {
    let obj = this.meshes.get(name)
    if (!obj) {
      obj = name === 'mug' ? makeMug() : makeBriefcase()
      this.meshes.set(name, obj)
      this.group.add(obj)
    }
    obj.visible = true
    // Desk kits: sit on the set (z ~ 1.1, above the desktop). Bare stage: mug at
    // chest height, briefcase on the floor, so neither sinks into the ground.
    if (onDesk) {
      const side = name === 'mug' ? 0.45 : -0.55
      obj.position.set(anchor.x + side, 0.9, name === 'mug' ? 1.02 : 1.2)
    } else if (name === 'mug') {
      obj.position.set(anchor.x + 0.42, 0.95, anchor.z + 0.8)
    } else {
      obj.position.set(anchor.x - 0.48, 0.16, anchor.z + 0.45)
    }
    return true
  }

  hide(name: AllowedPropName): boolean {
    const obj = this.meshes.get(name)
    if (obj) obj.visible = false
    return true
  }

  /** Dispose every prop geometry. Called when the scene (or kit) stops. */
  clear(): number {
    let disposed = 0
    for (const obj of this.meshes.values()) {
      disposed += disposeKitGraph(obj)
    }
    this.meshes.clear()
    return disposed
  }
}

function makeMug(): THREE.Group {
  const group = new THREE.Group()
  group.name = 'prop:mug'
  const material = new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.45 })
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, 0.16, 10), material)
  cup.castShadow = false
  const handle = new THREE.Mesh(
    new THREE.TorusGeometry(0.045, 0.012, 6, 8, Math.PI),
    material,
  )
  handle.position.set(0.1, 0, 0)
  handle.rotation.z = Math.PI / 2
  handle.castShadow = false
  group.add(cup, handle)
  return group
}

function makeBriefcase(): THREE.Group {
  const group = new THREE.Group()
  group.name = 'prop:briefcase'
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.24, 0.12),
    new THREE.MeshStandardMaterial({ color: 0x4a3424, roughness: 0.62 }),
  )
  body.castShadow = false
  const handle = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.035, 0.03),
    new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.4, metalness: 0.35 }),
  )
  handle.position.y = 0.14
  handle.castShadow = false
  group.add(body, handle)
  return group
}
