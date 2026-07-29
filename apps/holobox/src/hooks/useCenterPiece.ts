import { useEffect, useRef } from 'react'
import { CenterPiece } from '@/objects/centerpiece'
import type { Scene } from '@/scene'
import type { CenterPieceConfig } from '@/objects/centerpiece'

export function useCenterPiece(
  sceneRef: React.RefObject<Scene | null>,
  sceneReady: boolean,
  config: CenterPieceConfig,
) {
  const configRef = useRef(config)
  const cpRef = useRef<CenterPiece | null>(null)

  useEffect(() => {
    const scene = sceneRef.current
    if (!sceneReady || !scene) return

    const cp = new CenterPiece(configRef.current)
    cpRef.current = cp
    cp.mount(scene.getLayer('centerpiece'))

    return () => {
      cp.destroy()
      cpRef.current = null
    }
  }, [sceneRef, sceneReady])

  return cpRef
}
