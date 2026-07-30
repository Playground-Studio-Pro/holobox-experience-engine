import { useEffect } from 'react'
import { FocusView } from '@/objects/focus'
import { GridGallery } from '@/objects/gallery'
import type { SceneStateMachine } from '@/interactions'
import type { Scene } from '@/scene'
import type { ProjectConfig } from '@/config/types'

export function useGallery(
  sceneRef: React.RefObject<Scene | null>,
  machineRef: React.RefObject<SceneStateMachine | null>,
  // Mutable slot, not React.RefObject — RefObject<number>.current is
  // `readonly number | null`, which neither accepts assignment nor satisfies
  // FocusView.show(index: number).
  focusedIndexRef: { current: number },
  orbitReady: boolean,
  config: ProjectConfig,
) {
  useEffect(() => {
    const scene = sceneRef.current
    const machine = machineRef.current
    if (!orbitReady || !scene || !machine) return

    const players = config.assets?.players ?? []
    const uiLayer = scene.getLayer('ui')

    const focusView = new FocusView(
      players,
      () => machine.transition('idle'),
      () => machine.transition('gallery'),
    )

    const gridGallery = new GridGallery(
      players,
      (index) => {
        focusedIndexRef.current = index
        machine.transition('focused')
      },
      () => machine.transition('idle'),
    )

    const unsubscribe = machine.subscribe((to, from) => {
      if (to === 'focused') {
        gridGallery.close()
        const switchingPlayer = from === 'focused'
        focusView.show(focusedIndexRef.current, uiLayer, switchingPlayer)
      } else if (to === 'gallery') {
        focusView.hide()
        gridGallery.open(uiLayer)
      } else if (to === 'idle') {
        focusView.hide()
        gridGallery.close()
      }
    })

    return () => {
      unsubscribe()
      focusView.destroy()
      gridGallery.destroy()
    }
  }, [sceneRef, machineRef, focusedIndexRef, orbitReady])
}
