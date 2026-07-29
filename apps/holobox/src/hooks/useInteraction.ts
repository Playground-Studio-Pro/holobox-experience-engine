import { useEffect, useRef } from 'react'
import { InteractionEngine, SceneStateMachine } from '@/interactions'
import type { OrbitItem } from '@/objects/orbit'
import type { OrbitEngine } from '@/objects/orbit'
import type { Renderer } from '@/renderer'
import type { ProjectConfig } from '@/config/types'

export function useInteraction(
  rendererRef: React.RefObject<Renderer | null>,
  orbitEngineRef: React.RefObject<OrbitEngine | null>,
  orbitReady: boolean,
  config: ProjectConfig,
) {
  const machineRef = useRef<SceneStateMachine | null>(null)
  const focusedItemRef = useRef<OrbitItem | null>(null)
  const focusedIndexRef = useRef<number>(-1)

  useEffect(() => {
    const renderer = rendererRef.current
    const orbitEngine = orbitEngineRef.current
    if (!orbitReady || !renderer || !orbitEngine) return

    const interactionConfig = config.interaction ?? { focusTimeoutMs: 5000 }

    const machine = new SceneStateMachine()
    machineRef.current = machine

    const engine = new InteractionEngine(
      orbitEngine.getItems(),
      orbitEngine,
      renderer.app.stage,
      machine,
      interactionConfig,
      focusedItemRef,
      focusedIndexRef,
    )

    engine.mount()

    return () => {
      engine.destroy()
      machine.reset()
      machineRef.current = null
      focusedItemRef.current = null
      focusedIndexRef.current = -1
    }
  }, [rendererRef, orbitEngineRef, orbitReady])

  return { machineRef, focusedItemRef, focusedIndexRef }
}
