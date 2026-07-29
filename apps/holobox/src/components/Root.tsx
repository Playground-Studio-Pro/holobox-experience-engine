import { useRef } from 'react'
import { useRenderer } from '@/hooks/useRenderer'
import { useScene } from '@/hooks/useScene'
import { useCenterPiece } from '@/hooks/useCenterPiece'
import { useOrbit } from '@/hooks/useOrbit'
import { useInteraction } from '@/hooks/useInteraction'
import { DEFAULT_CONFIG } from '@/config/defaults'
import './styles.css'

export default function Root() {
  const containerRef = useRef<HTMLDivElement>(null)

  const { rendererRef, ready } = useRenderer(containerRef)
  const { sceneRef, sceneReady } = useScene(rendererRef, ready)
  useCenterPiece(sceneRef, sceneReady, DEFAULT_CONFIG.centerpiece)
  const { engineRef: orbitEngineRef, orbitReady } = useOrbit(rendererRef, sceneRef, sceneReady)
  useInteraction(rendererRef, orbitEngineRef, orbitReady)

  return <div id="holobox-root" ref={containerRef} />
}
