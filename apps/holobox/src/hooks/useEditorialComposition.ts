import { useEffect } from 'react'
import type { Scene } from '@/scene'
import type { OrbitEngine } from '@/objects'
import type { ProjectConfig } from '@/config/types'
import { EditorialComposition } from '@/objects/composition/EditorialComposition'

export function useEditorialComposition(
  sceneRef: React.RefObject<Scene | null>,
  orbitEngineRef: React.RefObject<OrbitEngine | null>,
  sceneReady: boolean,
  orbitReady: boolean,
  config: ProjectConfig,
): void {
  useEffect(() => {
    const scene = sceneRef.current
    const engine = orbitEngineRef.current
    if (!sceneReady || !orbitReady || !scene || !engine) return
    if (!config.composition?.enabled) return

    const players = config.assets?.players ?? []
    const composition = new EditorialComposition(config.composition)

    // Hide orbit items so composition photos take visual ownership
    const orbitItems = engine.getItems()
    for (const item of orbitItems) {
      item.container.visible = false
    }

    let active = true
    composition
      .mount(
        { back: scene.getLayer('orbitBack'), front: scene.getLayer('orbitFront') },
        players,
      )
      .catch((err) => {
        if (active) console.error('[useEditorialComposition] mount failed', err)
      })

    return () => {
      active = false
      composition.destroy()
      // Restore orbit item visibility
      const items = orbitEngineRef.current?.getItems() ?? []
      for (const item of items) {
        item.container.visible = true
      }
    }
  }, [sceneRef, orbitEngineRef, sceneReady, orbitReady])
}
