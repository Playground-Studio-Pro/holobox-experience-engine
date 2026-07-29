import { useRef } from 'react'
import { useRenderer } from '@/hooks/useRenderer'
import { useScene } from '@/hooks/useScene'
import { useCenterPiece } from '@/hooks/useCenterPiece'
import { useOrbit } from '@/hooks/useOrbit'
import { useInteraction } from '@/hooks/useInteraction'
import { useGallery } from '@/hooks/useGallery'
import type { ProjectConfig } from '@/config/types'

interface Props {
  config: ProjectConfig
}

export default function Experience({ config }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  const { rendererRef, ready } = useRenderer(containerRef)
  const { sceneRef, sceneReady } = useScene(rendererRef, ready)
  useCenterPiece(sceneRef, sceneReady, config.centerpiece)
  const { engineRef: orbitEngineRef, orbitReady } = useOrbit(rendererRef, sceneRef, sceneReady, config)
  const { machineRef, focusedItemRef } = useInteraction(rendererRef, orbitEngineRef, orbitReady, config)
  useGallery(sceneRef, machineRef, focusedItemRef, orbitReady, config)

  return <div id="holobox-root" ref={containerRef} />
}
