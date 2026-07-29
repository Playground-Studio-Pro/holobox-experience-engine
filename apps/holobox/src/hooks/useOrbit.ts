import { useEffect, useRef, useState } from 'react'
import type { Ticker } from 'pixi.js'
import { OrbitEngine } from '@/objects/orbit'
import type { Scene } from '@/scene'
import type { Renderer } from '@/renderer'
import type { ProjectConfig } from '@/config/types'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/config/defaults'

export function useOrbit(
  rendererRef: React.RefObject<Renderer | null>,
  sceneRef: React.RefObject<Scene | null>,
  sceneReady: boolean,
  config: ProjectConfig,
) {
  const engineRef = useRef<OrbitEngine | null>(null)
  const [orbitReady, setOrbitReady] = useState(false)

  useEffect(() => {
    const renderer = rendererRef.current
    const scene = sceneRef.current
    if (!sceneReady || !renderer || !scene) return

    const { orbit, motion, assets } = config

    const engine = new OrbitEngine({
      itemCount: orbit.itemCount,
      ellipseX: orbit.ellipseX ?? 420,
      ellipseY: orbit.ellipseY ?? 280,
      speed: motion?.orbitSpeed ?? 0.3,
      floatAmplitude: motion?.floatAmplitude ?? 8,
      floatFrequency: motion?.floatFrequency ?? 0.4,
      slowMotionScale: motion?.slowMotionScale ?? 0.15,
      center: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 },
      photos: assets?.photos ?? [],
    })

    engineRef.current = engine

    let active = true
    let onTick: ((ticker: Ticker) => void) | null = null

    engine
      .mount(scene.getLayer('orbitBack'), scene.getLayer('orbitFront'))
      .then(() => {
        if (!active) return
        onTick = (ticker: Ticker) => engine.update(ticker)
        renderer.ticker.add(onTick)
        setOrbitReady(true)
      })
      .catch((err) => {
        if (active) console.error('[useOrbit] mount failed', err)
      })

    return () => {
      active = false
      if (onTick) renderer.ticker.remove(onTick)
      engine.destroy()
      engineRef.current = null
      setOrbitReady(false)
    }
  }, [rendererRef, sceneRef, sceneReady])

  return { engineRef, orbitReady }
}
