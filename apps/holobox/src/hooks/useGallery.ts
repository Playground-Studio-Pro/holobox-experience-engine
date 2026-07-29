import { useEffect } from 'react'
import { GalleryModule } from '@/objects/gallery'
import type { SceneStateMachine } from '@/interactions'
import type { Scene } from '@/scene'
import { DEFAULT_CONFIG } from '@/config/defaults'

export function useGallery(
  sceneRef: React.RefObject<Scene | null>,
  machineRef: React.RefObject<SceneStateMachine | null>,
  orbitReady: boolean,
) {
  useEffect(() => {
    const scene = sceneRef.current
    const machine = machineRef.current
    if (!orbitReady || !scene || !machine) return

    const timeoutMs = DEFAULT_CONFIG.interaction?.focusTimeoutMs ?? 5000

    const gallery = new GalleryModule(
      scene.getLayer('ui'),
      timeoutMs,
      () => machine.transition('idle'),
    )

    const unsubscribe = machine.subscribe((to, from) => {
      if (to === 'gallery') {
        gallery.open()
      } else if (to === 'idle' && from === 'gallery') {
        gallery.close()
      }
    })

    return () => {
      unsubscribe()
      gallery.destroy()
    }
  }, [sceneRef, machineRef, orbitReady])
}
