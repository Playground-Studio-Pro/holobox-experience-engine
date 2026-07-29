import { useEffect } from 'react'
import { GalleryModule } from '@/objects/gallery'
import type { SceneStateMachine } from '@/interactions'
import type { OrbitItem } from '@/objects/orbit'
import type { Scene } from '@/scene'
import { DEFAULT_CONFIG } from '@/config/defaults'

export function useGallery(
  sceneRef: React.RefObject<Scene | null>,
  machineRef: React.RefObject<SceneStateMachine | null>,
  focusedItemRef: React.RefObject<OrbitItem | null>,
  orbitReady: boolean,
) {
  useEffect(() => {
    const scene = sceneRef.current
    const machine = machineRef.current
    if (!orbitReady || !scene || !machine) return

    const galleryConfig = DEFAULT_CONFIG.gallery ?? { targetX: 540, targetY: 380, targetScale: 3.0 }
    const timeoutMs = DEFAULT_CONFIG.interaction?.focusTimeoutMs ?? 5000

    const gallery = new GalleryModule(
      galleryConfig,
      timeoutMs,
      () => machine.transition('idle'),
    )

    const unsubscribe = machine.subscribe((to, from) => {
      if (to === 'gallery') {
        const item = focusedItemRef.current
        if (!item) return
        gallery.open(
          item,
          scene.getLayer('ui'),
          scene.getLayer('orbitBack'),
          scene.getLayer('orbitFront'),
        )
      } else if (to === 'idle' && from === 'gallery') {
        gallery.close()
      }
    })

    return () => {
      unsubscribe()
      gallery.destroy()
    }
  }, [sceneRef, machineRef, focusedItemRef, orbitReady])
}
