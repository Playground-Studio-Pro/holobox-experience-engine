import { useEffect, useRef, useState } from 'react'
import { Renderer } from '@/renderer'
import type { RendererConfig } from '@/renderer'
import { env } from '@/config/env'

export function useRenderer(containerRef: React.RefObject<HTMLDivElement>, resolution?: number) {
  const rendererRef = useRef<Renderer | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const config: RendererConfig = {
      width: env.canvasWidth,
      height: env.canvasHeight,
      antialias: true,
      resolution: resolution ?? 1,
    }
    const renderer = new Renderer(config)
    rendererRef.current = renderer
    let active = true
    let initialized = false

    renderer
      .init(container)
      .then(() => {
        initialized = true
        if (active) setReady(true)
        else renderer.destroy()
      })
      .catch((err) => {
        if (active) console.error('[Holobox] Renderer init failed:', err)
      })

    return () => {
      active = false
      setReady(false)
      rendererRef.current = null
      if (initialized) renderer.destroy()
    }
  }, [containerRef])

  return { rendererRef, ready }
}
