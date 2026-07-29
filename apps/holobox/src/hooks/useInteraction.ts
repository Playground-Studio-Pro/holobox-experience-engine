import { useEffect } from 'react'
import { InteractionEngine } from '@/interactions'
import type { OrbitEngine } from '@/objects/orbit'
import type { Renderer } from '@/renderer'
import { DEFAULT_CONFIG } from '@/config/defaults'

export function useInteraction(
  rendererRef: React.RefObject<Renderer | null>,
  orbitEngineRef: React.RefObject<OrbitEngine | null>,
  orbitReady: boolean,
) {
  useEffect(() => {
    const renderer = rendererRef.current
    const orbitEngine = orbitEngineRef.current
    if (!orbitReady || !renderer || !orbitEngine) return

    const config = DEFAULT_CONFIG.interaction ?? { focusTimeoutMs: 5000 }

    const engine = new InteractionEngine(
      orbitEngine.getItems(),
      orbitEngine,
      renderer.app.stage,
      config,
    )

    engine.mount()

    return () => {
      engine.destroy()
    }
  }, [rendererRef, orbitEngineRef, orbitReady])
}
