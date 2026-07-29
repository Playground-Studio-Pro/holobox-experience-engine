import { useEffect, useRef } from 'react'
import { InteractionEngine, SceneStateMachine } from '@/interactions'
import type { OrbitItem } from '@/objects/orbit'
import type { OrbitEngine } from '@/objects/orbit'
import type { Renderer } from '@/renderer'
import { DEFAULT_CONFIG } from '@/config/defaults'

export function useInteraction(
  rendererRef: React.RefObject<Renderer | null>,
  orbitEngineRef: React.RefObject<OrbitEngine | null>,
  orbitReady: boolean,
) {
  const machineRef = useRef<SceneStateMachine | null>(null)
  const focusedItemRef = useRef<OrbitItem | null>(null)

  useEffect(() => {
    const renderer = rendererRef.current
    const orbitEngine = orbitEngineRef.current
    if (!orbitReady || !renderer || !orbitEngine) return

    const config = DEFAULT_CONFIG.interaction ?? { focusTimeoutMs: 5000 }

    const machine = new SceneStateMachine()
    machineRef.current = machine

    const engine = new InteractionEngine(
      orbitEngine.getItems(),
      orbitEngine,
      renderer.app.stage,
      machine,
      config,
      focusedItemRef,
    )

    engine.mount()

    return () => {
      engine.destroy()
      machine.reset()
      machineRef.current = null
      focusedItemRef.current = null
    }
  }, [rendererRef, orbitEngineRef, orbitReady])

  return { machineRef, focusedItemRef }
}
