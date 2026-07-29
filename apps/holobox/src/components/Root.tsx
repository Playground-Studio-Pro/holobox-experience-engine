import { useRef } from 'react'
import { useRenderer } from '@/hooks/useRenderer'
import { useScene } from '@/hooks/useScene'
import './styles.css'

export default function Root() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const { rendererRef, ready } = useRenderer(canvasRef, containerRef)
  useScene(rendererRef, ready)

  return (
    <div id="holobox-root" ref={containerRef}>
      <canvas id="holobox-canvas" ref={canvasRef} />
    </div>
  )
}
