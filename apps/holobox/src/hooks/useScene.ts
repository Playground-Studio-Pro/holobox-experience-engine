import { useEffect, useRef } from 'react'
import { Scene } from '@/scene'
import type { Renderer } from '@/renderer'

export function useScene(rendererRef: React.RefObject<Renderer | null>, ready: boolean) {
  const sceneRef = useRef<Scene | null>(null)

  useEffect(() => {
    const renderer = rendererRef.current
    if (!ready || !renderer) return

    const scene = new Scene()
    sceneRef.current = scene
    scene.mount(renderer.stage)

    return () => {
      scene.destroy()
      sceneRef.current = null
    }
  }, [rendererRef, ready])

  return sceneRef
}
