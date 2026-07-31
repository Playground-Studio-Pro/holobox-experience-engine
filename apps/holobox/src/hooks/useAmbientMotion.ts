import { useEffect } from 'react'
import type { Ticker } from 'pixi.js'
import type { Scene } from '@/scene'
import type { Renderer } from '@/renderer'
import type { EditorialComposition } from '@/objects/composition/EditorialComposition'
import type { ProjectConfig } from '@/config/types'
import { FloatingMotionSystem } from '@/objects/motion/FloatingMotionSystem'
import { AmbientParticleSystem } from '@/objects/particles/AmbientParticleSystem'
import { OrbitDecorationLayer } from '@/objects/orbit/OrbitDecorationLayer'
import { TrophyHalo } from '@/objects/effects/TrophyHalo'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/config/defaults'

export function useAmbientMotion(
  rendererRef: React.RefObject<Renderer | null>,
  sceneRef: React.RefObject<Scene | null>,
  compositionRef: React.RefObject<EditorialComposition | null>,
  sceneReady: boolean,
  orbitReady: boolean,
  config: ProjectConfig,
): void {
  useEffect(() => {
    const renderer = rendererRef.current
    const scene = sceneRef.current
    const composition = compositionRef.current
    if (!sceneReady || !orbitReady || !renderer || !scene || !composition) return
    if (!config.composition?.enabled) return

    // ── System 1: Floating motion on composition photos ────────────────────────
    const floating = new FloatingMotionSystem(composition.getPhotoContainers())

    // ── System 2: Ambient dust particles ──────────────────────────────────────
    const particles = new AmbientParticleSystem()
    particles.mount(scene.getLayer('effects'))

    // ── System 3: Orbit sparks + comet ────────────────────────────────────────
    const ellipse = config.composition.ellipse
    const layerSplit = (config.centerpiece.layerSplit ?? 0.5) * CANVAS_HEIGHT
    const orbitDeco = ellipse
      ? new OrbitDecorationLayer(ellipse, layerSplit)
      : null
    orbitDeco?.mount(scene.getLayer('orbitBack'), scene.getLayer('orbitFront'))

    // ── System 4: Trophy halo ──────────────────────────────────────────────────
    const haloX = CANVAS_WIDTH / 2
    const haloY = config.orbit.centerY ?? CANVAS_HEIGHT / 2
    const halo = new TrophyHalo(haloX, haloY, 420)
    halo.mount(scene.getLayer('orbitBack'))

    // ── Unified ticker ─────────────────────────────────────────────────────────
    const onTick = (ticker: Ticker) => {
      floating.update(ticker)
      particles.update(ticker)
      orbitDeco?.update(ticker)
      halo.update(ticker)
    }
    renderer.ticker.add(onTick)

    return () => {
      renderer.ticker.remove(onTick)
      floating.destroy()
      particles.destroy()
      orbitDeco?.destroy()
      halo.destroy()
    }
  }, [rendererRef, sceneRef, compositionRef, sceneReady, orbitReady])
}
