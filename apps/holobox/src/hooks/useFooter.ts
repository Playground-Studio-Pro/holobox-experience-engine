import { useEffect } from 'react'
import { FooterLayer } from '@/objects/footer/FooterLayer'
import type { Scene } from '@/scene'
import type { FooterConfig } from '@/config/types'

export function useFooter(
  sceneRef: React.RefObject<Scene | null>,
  sceneReady: boolean,
  footer: FooterConfig | undefined,
) {
  useEffect(() => {
    const scene = sceneRef.current
    if (!sceneReady || !scene || !footer) return

    const layer = new FooterLayer()
    layer.mount(scene.getLayer('ui'), footer)

    return () => {
      layer.destroy()
    }
  }, [sceneRef, sceneReady])
}
