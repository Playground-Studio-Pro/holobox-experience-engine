import { useEffect, useRef } from 'react'
import type React from 'react'
import type { CenterPiece } from '@/objects/centerpiece'
import type { Scene } from '@/scene'
import { PhysicalZoneOverlay } from '@/objects/centerpiece/dev/PhysicalZoneOverlay'

/**
 * Dev keyboard shortcuts:
 *   D    — toggle physical / digital centerpiece mode
 *   G    — toggle physical zone overlay (trophy + pedestal rectangles)
 */
export function useModeToggle(
  cpRef: React.RefObject<CenterPiece | null>,
  sceneRef: React.RefObject<Scene | null>,
  sceneReady: boolean,
): void {
  const zonesVisible = useRef(false)
  const overlayRef   = useRef<PhysicalZoneOverlay | null>(null)

  // Mount the overlay once the scene is ready
  useEffect(() => {
    const scene = sceneRef.current
    if (!sceneReady || !scene) return

    const overlay = new PhysicalZoneOverlay()
    overlayRef.current = overlay
    scene.getLayer('ui').addChild(overlay.container)

    return () => {
      overlay.destroy()
      overlayRef.current = null
    }
  }, [sceneRef, sceneReady])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const cp = cpRef.current

      // D — toggle physical / digital mode
      if ((e.key === 'd' || e.key === 'D') && !e.ctrlKey && !e.metaKey) {
        cp?.setMode(cp.getMode() === 'physical' ? 'digital' : 'physical')
        return
      }

      // G — toggle physical zone boxes
      if (e.key === 'g' || e.key === 'G') {
        zonesVisible.current = !zonesVisible.current
        overlayRef.current?.setVisible(zonesVisible.current)
        return
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [cpRef])
}
