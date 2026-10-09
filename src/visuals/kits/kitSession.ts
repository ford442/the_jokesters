/**
 * Owns the currently mounted stage kit and disposes it on unload.
 * The graph itself is supplied by the loader (or a test double).
 */

import { disposeKitGraph } from './disposeKit'
import { resolveStageKitId, type StageKitId } from '../stageKitIds'

export class StageKitSession {
  private root: object | null = null
  private kit: StageKitId = 'void'

  get activeKit(): StageKitId {
    return this.kit
  }

  /** Drop the current kit and dispose its GPU resources. Returns dispose count. */
  unmount(): number {
    const disposed = this.root ? disposeKitGraph(this.root) : 0
    this.root = null
    this.kit = 'void'
    return disposed
  }

  /**
   * Take ownership of a loaded graph. Disposes any previous kit first.
   * Unknown ids and void discard `root` (if one was passed) and stay on void.
   */
  mount(kit: string, root: object | null): number {
    const dropped = this.unmount()
    const resolved = resolveStageKitId(kit)
    if (resolved === 'void' || !root) {
      if (root) disposeKitGraph(root)
      return dropped
    }
    this.kit = resolved
    this.root = root
    return dropped
  }
}
