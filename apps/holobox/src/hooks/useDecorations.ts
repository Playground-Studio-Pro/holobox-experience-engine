import { useEffect } from 'react'
import { DecorationLayer } from '@/objects/decorations'
import type { Scene } from '@/scene'
import type { DecorationsConfig } from '@/config/types'

export function useDecorations(
  sceneRef: React.RefObject<Scene | null>,
  sceneReady: boolean,
  config: DecorationsConfig | undefined,
) {
  useEffect(() => {
    const scene = sceneRef.current
    if (!sceneReady || !scene || !config?.enabled) return

    const layer = new DecorationLayer()
    let active  = true

    layer
      .mount(scene.getLayer('decorBack'), scene.getLayer('decorFront'), config)
      .catch((err) => {
        if (active) console.error('[useDecorations] mount failed', err)
      })

    return () => {
      active = false
      layer.destroy()
    }
  }, [sceneReady, config?.enabled]) // eslint-disable-line react-hooks/exhaustive-deps
}
