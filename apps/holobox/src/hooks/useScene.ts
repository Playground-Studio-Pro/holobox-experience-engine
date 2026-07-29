import { useEffect, useRef, useState } from 'react'
import { Scene } from '@/scene'
import type { Renderer } from '@/renderer'

export function useScene(rendererRef: React.RefObject<Renderer | null>, ready: boolean) {
  const sceneRef = useRef<Scene | null>(null)
  const [sceneReady, setSceneReady] = useState(false)

  useEffect(() => {
    const renderer = rendererRef.current
    if (!ready || !renderer) return

    const scene = new Scene()
    sceneRef.current = scene
    scene.mount(renderer.stage)
    setSceneReady(true)

    return () => {
      scene.destroy()
      sceneRef.current = null
      setSceneReady(false)
    }
  }, [rendererRef, ready])

  return { sceneRef, sceneReady }
}
