import { useRef } from 'react'
import { useRenderer } from '@/hooks/useRenderer'
import { useScene } from '@/hooks/useScene'
import { useCenterPiece } from '@/hooks/useCenterPiece'
import { useOrbit } from '@/hooks/useOrbit'
import { useInteraction } from '@/hooks/useInteraction'
import { useGallery } from '@/hooks/useGallery'
import { DEFAULT_CONFIG } from '@/config/defaults'
import './styles.css'

export default function Root() {
  const containerRef = useRef<HTMLDivElement>(null)

  const { rendererRef, ready } = useRenderer(containerRef)
  const { sceneRef, sceneReady } = useScene(rendererRef, ready)
  useCenterPiece(sceneRef, sceneReady, DEFAULT_CONFIG.centerpiece)
  const { engineRef: orbitEngineRef, orbitReady } = useOrbit(rendererRef, sceneRef, sceneReady)
  const { machineRef } = useInteraction(rendererRef, orbitEngineRef, orbitReady)
  useGallery(sceneRef, machineRef, orbitReady)

  return <div id="holobox-root" ref={containerRef} />
}
