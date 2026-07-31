import { useEffect } from 'react'
import { Container, Graphics, BlurFilter } from 'pixi.js'
import type { Ticker } from 'pixi.js'
import type { Scene } from '@/scene'
import type { Renderer } from '@/renderer'
import type { EditorialComposition } from '@/objects/composition/EditorialComposition'
import type { ProjectConfig } from '@/config/types'
import { FloatingMotionSystem } from '@/objects/motion/FloatingMotionSystem'
import { AmbientParticleSystem } from '@/objects/particles/AmbientParticleSystem'
import { OrbitDecorationLayer } from '@/objects/orbit/OrbitDecorationLayer'
import { TrophyHalo } from '@/objects/effects/TrophyHalo'
import { InteractionController } from '@/objects/composition/InteractionController'
import { HeroTransitionController } from '@/objects/composition/HeroTransitionController'
import { lerp } from '@/utils'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/config/defaults'

/**
 * Injects a soft drop shadow into a photo container.
 * Shadow lives as child[0] — behind the photo — and follows it automatically
 * as FloatingMotionSystem moves the container.
 */
function injectShadow(
  container: Container,
  width: number,
  height: number,
  radius: number,
  depth: number,
): void {
  const shadowAlpha = lerp(0, 0.13, depth)
  if (shadowAlpha < 0.01) return

  const hw = width / 2
  const hh = height / 2

  const shadowGfx = new Graphics()
  shadowGfx.roundRect(-hw, -hh, width, height, radius)
  shadowGfx.fill({ color: 0x000000, alpha: 0.85 })

  const shadowCt = new Container()
  shadowCt.addChild(shadowGfx)
  // Shadow blur scales with depth: hero 80px, far ghost near 0
  shadowCt.filters = [new BlurFilter({ strength: Math.max(1, lerp(4, 80, depth)) })]
  shadowCt.y = lerp(8, 26, depth)    // offset: hero drops further, ghost barely moves
  shadowCt.alpha = shadowAlpha

  // Insert behind all other children of this container
  container.addChildAt(shadowCt, 0)
}

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

    const slots = config.composition.slots
    const containers = composition.getPhotoContainers()

    // ── Depth processing: scale + shadow ──────────────────────────────────────
    // Applied once at mount — shadows follow their container automatically
    containers.forEach((container, i) => {
      const slot = slots[i]
      if (!slot) return

      const depth = slot.depth ?? 0.5

      // Depth-driven container scale — hero at 1.0, far ghost at 0.65
      container.scale.set(lerp(0.65, 1.0, depth))

      // Drop shadow — only on non-blurred cards (ghost cards are already blurred)
      if (!slot.blur) {
        injectShadow(container, slot.width, slot.height, slot.radius ?? 14, depth)
      }
    })

    // ── System 1: Floating motion ─────────────────────────────────────────────
    const floatingTargets = containers.map((container, i) => ({
      container,
      depth: slots[i]?.depth ?? 0.5,
    }))
    const floating = new FloatingMotionSystem(floatingTargets)

    // ── System 2: Ambient dust particles ──────────────────────────────────────
    const particles = new AmbientParticleSystem()
    particles.mount(scene.getLayer('effects'))

    // ── System 3: Orbit ellipse (breathing) + sparks + comet ─────────────────
    const ellipse = config.composition.ellipse
    const layerSplit = (config.centerpiece.layerSplit ?? 0.5) * CANVAS_HEIGHT
    const orbitDeco = ellipse
      ? new OrbitDecorationLayer(ellipse, layerSplit)
      : null
    orbitDeco?.mount(scene.getLayer('orbitBack'), scene.getLayer('orbitFront'))

    // ── System 4: Trophy halo ─────────────────────────────────────────────────
    const haloX = CANVAS_WIDTH / 2
    const haloY = config.orbit.centerY ?? CANVAS_HEIGHT / 2
    const halo = new TrophyHalo(haloX, haloY, 480)
    halo.mount(scene.getLayer('orbitBack'))

    // ── System 5: Composition interaction — hover + hero transitions ──────────
    const interactionCtrl = new InteractionController(containers, slots)
    interactionCtrl.mount()

    const heroTransition = new HeroTransitionController(
      containers,
      slots,
      floating,
      orbitDeco,
      interactionCtrl,
    )
    interactionCtrl.onSlotClick((index) => heroTransition.triggerSwap(index))

    // ── Unified ticker ────────────────────────────────────────────────────────
    const onTick = (ticker: Ticker) => {
      floating.update(ticker)
      particles.update(ticker)
      orbitDeco?.update(ticker)
      halo.update(ticker)
    }
    renderer.ticker.add(onTick)

    return () => {
      renderer.ticker.remove(onTick)
      interactionCtrl.destroy()
      heroTransition.destroy()
      floating.destroy()
      particles.destroy()
      orbitDeco?.destroy()
      halo.destroy()
      // Shadows are children of composition photo containers —
      // they are destroyed automatically when composition.destroy() runs
    }
  }, [rendererRef, sceneRef, compositionRef, sceneReady, orbitReady])
}
