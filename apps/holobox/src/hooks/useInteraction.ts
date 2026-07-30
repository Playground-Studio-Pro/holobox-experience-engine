import { useEffect, useRef } from 'react'
import { InteractionEngine, SceneStateMachine } from '@/interactions'
import type { OrbitItem } from '@/objects/orbit'
import type { OrbitEngine } from '@/objects/orbit'
import type { Renderer } from '@/renderer'

export function useInteraction(
  rendererRef: React.RefObject<Renderer | null>,
  orbitEngineRef: React.RefObject<OrbitEngine | null>,
  orbitReady: boolean,
) {
  const machineRef = useRef<SceneStateMachine | null>(null)
  const focusedItemRef = useRef<OrbitItem | null>(null)
  const focusedIndexRef = useRef<number>(-1)

  useEffect(() => {
    const renderer = rendererRef.current
    const orbitEngine = orbitEngineRef.current
    if (!orbitReady || !renderer || !orbitEngine) return

    const machine = new SceneStateMachine()
    machineRef.current = machine

    // NOTE: config.interaction.focusTimeoutMs is intentionally not wired up.
    // Focus is dismissed explicitly (close button / backdrop tap). Idle auto-reset
    // after inactivity is a separate, unbuilt behaviour — see ENGINE_TASKS 0010-D-2.
    const engine = new InteractionEngine(
      orbitEngine.getItems(),
      orbitEngine,
      renderer.app.stage,
      machine,
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
