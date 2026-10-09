/**
 * Dispose a kit (or prop) graph without importing Three.js, so unit tests can
 * pass a plain object. Geometries, materials, and optional maps are released
 * once each, then the root is detached.
 */

export interface DisposableResource {
  dispose(): void
}

export interface KitDisposableNode {
  geometry?: DisposableResource | null
  material?: (DisposableResource & { map?: DisposableResource | null }) | Array<DisposableResource & { map?: DisposableResource | null }> | null
  children?: KitDisposableNode[]
  traverse?: (cb: (child: KitDisposableNode) => void) => void
  parent?: { remove(child: KitDisposableNode): void } | null
  removeFromParent?: () => void
}

export function disposeKitGraph(root: object): number {
  const node = root as KitDisposableNode
  const seen = new Set<DisposableResource>()
  let count = 0

  const disposeOne = (resource: DisposableResource | null | undefined) => {
    if (!resource || seen.has(resource)) return
    seen.add(resource)
    resource.dispose()
    count += 1
  }

  const visit = (node: KitDisposableNode) => {
    disposeOne(node.geometry)
    const material = node.material
    const materials = Array.isArray(material) ? material : material ? [material] : []
    for (const mat of materials) {
      disposeOne(mat.map)
      disposeOne(mat)
    }
  }

  if (node.traverse) {
    node.traverse(visit)
  } else {
    const walk = (current: KitDisposableNode) => {
      visit(current)
      for (const child of current.children ?? []) walk(child)
    }
    walk(node)
  }

  if (node.removeFromParent) node.removeFromParent()
  else node.parent?.remove(node)

  return count
}
