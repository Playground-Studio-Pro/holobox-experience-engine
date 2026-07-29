import { useEffect, useRef, useState } from 'react'
import { Renderer } from '@/renderer'
import type { RendererConfig } from '@/renderer'
import { env } from '@/config/env'

const CONFIG: RendererConfig = {
  width: env.canvasWidth,
  height: env.canvasHeight,
  antialias: true,
  resolution: window.devicePixelRatio || 1,
}

export function useRenderer(containerRef: React.RefObject<HTMLDivElement>) {
  const rendererRef = useRef<Renderer | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const renderer = new Renderer(CONFIG)
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
