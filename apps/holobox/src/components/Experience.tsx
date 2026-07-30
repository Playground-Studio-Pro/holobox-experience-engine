import { useRef } from 'react'
import { useRenderer } from '@/hooks/useRenderer'
import { useScene } from '@/hooks/useScene'
import { useCenterPiece } from '@/hooks/useCenterPiece'
import { useOrbit } from '@/hooks/useOrbit'
import { useInteraction } from '@/hooks/useInteraction'
import { useGallery } from '@/hooks/useGallery'
import { useDecorations } from '@/hooks/useDecorations'
import { useModeToggle } from '@/hooks/useModeToggle'
import type { ProjectConfig } from '@/config/types'

interface Props {
  config: ProjectConfig
}

export default function Experience({ config }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  const { rendererRef, ready } = useRenderer(containerRef)
  const { sceneRef, sceneReady } = useScene(rendererRef, ready)
  const cpRef = useCenterPiece(sceneRef, sceneReady, config.centerpiece)
  useModeToggle(cpRef)
  useDecorations(sceneRef, sceneReady, config.decorations)
  const { engineRef: orbitEngineRef, orbitReady } = useOrbit(rendererRef, sceneRef, sceneReady, config)
  const { machineRef, focusedIndexRef } = useInteraction(rendererRef, orbitEngineRef, orbitReady)
  useGallery(sceneRef, machineRef, focusedIndexRef, orbitReady, config)

  return <div id="holobox-root" ref={containerRef} />
}
