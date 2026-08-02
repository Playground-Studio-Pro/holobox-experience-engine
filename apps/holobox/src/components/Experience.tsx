import { useRef } from 'react'
import { useRenderer } from '@/hooks/useRenderer'
import { useScene } from '@/hooks/useScene'
import { useCenterPiece } from '@/hooks/useCenterPiece'
import { useOrbit } from '@/hooks/useOrbit'
import { useInteraction } from '@/hooks/useInteraction'
import { useGallery } from '@/hooks/useGallery'
import { useDecorations } from '@/hooks/useDecorations'
import { useModeToggle } from '@/hooks/useModeToggle'
import { useFooter } from '@/hooks/useFooter'
import { useEditorialComposition } from '@/hooks/useEditorialComposition'
import { useAmbientMotion } from '@/hooks/useAmbientMotion'
import type { ProjectConfig } from '@/config/types'

interface Props {
  config: ProjectConfig
}

export default function Experience({ config }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  const { rendererRef, ready } = useRenderer(containerRef, config.renderResolution)
  const { sceneRef, sceneReady } = useScene(rendererRef, ready)
  const cpRef = useCenterPiece(sceneRef, sceneReady, config.centerpiece)
  useModeToggle(cpRef, sceneRef, sceneReady)
  useDecorations(sceneRef, sceneReady, config.decorations)
  const { engineRef: orbitEngineRef, orbitReady } = useOrbit(rendererRef, sceneRef, sceneReady, config)
  // Orbit interaction and gallery are only active when composition mode is off.
  // When composition.enabled, orbit items are hidden and these systems are dead paths.
  const orbitInteractionReady = orbitReady && !config.composition?.enabled
  const { machineRef, focusedIndexRef } = useInteraction(rendererRef, orbitEngineRef, orbitInteractionReady)
  useGallery(sceneRef, machineRef, focusedIndexRef, orbitInteractionReady, config)
  useFooter(sceneRef, sceneReady, config.footer)
  const compositionRef = useEditorialComposition(sceneRef, orbitEngineRef, sceneReady, orbitReady, config)
  useAmbientMotion(rendererRef, sceneRef, compositionRef, sceneReady, orbitReady, config)

  return <div id="holobox-root" ref={containerRef} />
}
