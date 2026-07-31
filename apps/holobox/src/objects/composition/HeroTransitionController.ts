import { Container } from 'pixi.js'
import { gsap } from 'gsap'
import type { CompositionSlotConfig } from '@/config/types'  // retained for constructor signature
import type { FloatingMotionSystem } from '@/objects/motion/FloatingMotionSystem'
import type { OrbitDecorationLayer } from '@/objects/orbit/OrbitDecorationLayer'
import type { InteractionController } from './InteractionController'

const TRANSITION_DURATION = 0.65  // 650ms
const TRANSITION_EASE = 'power2.inOut'  // cubic-equivalent smooth in-out

/**
 * Animates a slot swap between a supporting card and the hero card.
 *
 * The animation works by moving FloatingMotionSystem base positions rather
 * than the containers directly — so floating motion continues running on top
 * of the transition path, creating the physical photograph in space feel.
 *
 * Orbit decorations slow to 25% during the transition and restore smoothly.
 */
export class HeroTransitionController {
  private readonly containers: Container[]
  private readonly floating: FloatingMotionSystem
  private readonly orbitDeco: OrbitDecorationLayer | null
  private readonly interactionCtrl: InteractionController | null

  private heroIndex = 0
  private isTransitioning = false

  constructor(
    containers: Container[],
    _slots: CompositionSlotConfig[],
    floating: FloatingMotionSystem,
    orbitDeco: OrbitDecorationLayer | null = null,
    interactionCtrl: InteractionController | null = null,
  ) {
    this.containers = containers
    this.floating = floating
    this.orbitDeco = orbitDeco
    this.interactionCtrl = interactionCtrl
  }

  triggerSwap(targetIndex: number): void {
    if (targetIndex === this.heroIndex) return
    if (this.isTransitioning) return

    const heroContainer   = this.containers[this.heroIndex]
    const targetContainer = this.containers[targetIndex]

    const heroProxy   = this.floating.getBaseProxy(heroContainer)
    const targetProxy = this.floating.getBaseProxy(targetContainer)

    // Base proxies may be null if composition wasn't mounted with ambient motion
    if (!heroProxy || !targetProxy) return

    this.isTransitioning = true
    this.orbitDeco?.setSlowMotion(true)

    // Record destination values before any mutation
    const heroDestX     = targetProxy.baseX
    const heroDestY     = targetProxy.baseY
    const targetDestX   = heroProxy.baseX
    const targetDestY   = heroProxy.baseY

    const heroDestScale  = targetContainer.scale.x
    const targetDestScale = heroContainer.scale.x

    const heroDestAlpha  = targetContainer.alpha
    const targetDestAlpha = heroContainer.alpha

    const newHeroIndex = targetIndex
    const prevHeroIndex = this.heroIndex

    // ── Animate base positions — float continues on top ───────────────────────
    gsap.to(heroProxy,   { baseX: heroDestX,   baseY: heroDestY,   duration: TRANSITION_DURATION, ease: TRANSITION_EASE })
    gsap.to(targetProxy, { baseX: targetDestX, baseY: targetDestY, duration: TRANSITION_DURATION, ease: TRANSITION_EASE,
      onComplete: () => {
        this.heroIndex = newHeroIndex
        this.orbitDeco?.setSlowMotion(false)
        this.isTransitioning = false

        // Sync InteractionController's hero index and base scales
        if (this.interactionCtrl) {
          this.interactionCtrl.setHeroIndex(newHeroIndex)
          this.interactionCtrl.updateBaseScale(newHeroIndex,  targetDestScale)
          this.interactionCtrl.updateBaseScale(prevHeroIndex, heroDestScale)
        }
      },
    })

    // ── Animate depth scale — cards grow/shrink as they swap roles ────────────
    gsap.to(heroContainer.scale,   { x: heroDestScale,   y: heroDestScale,   duration: TRANSITION_DURATION, ease: TRANSITION_EASE })
    gsap.to(targetContainer.scale, { x: targetDestScale, y: targetDestScale, duration: TRANSITION_DURATION, ease: TRANSITION_EASE })

    // ── Animate alpha — cards adopt the target slot's opacity ─────────────────
    gsap.to(heroContainer,   { alpha: heroDestAlpha,   duration: TRANSITION_DURATION, ease: TRANSITION_EASE })
    gsap.to(targetContainer, { alpha: targetDestAlpha, duration: TRANSITION_DURATION, ease: TRANSITION_EASE })
  }

  destroy(): void {
    for (const container of this.containers) {
      gsap.killTweensOf(container)
      gsap.killTweensOf(container.scale)
      const proxy = this.floating.getBaseProxy(container)
      if (proxy) gsap.killTweensOf(proxy)
    }
    this.isTransitioning = false
  }
}
