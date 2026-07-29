import { Rectangle, type Container, type FederatedPointerEvent } from 'pixi.js'
import type { OrbitItem } from '@/objects/orbit'
import type { OrbitEngine } from '@/objects/orbit'
import type { InteractionConfig } from '@/config/types'
import type { SceneStateMachine } from './SceneStateMachine'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/config/defaults'

export class InteractionEngine {
  private focusedItem: OrbitItem | null = null
  private timeoutHandle: ReturnType<typeof setTimeout> | null = null
  private unsubscribe: (() => void) | null = null

  constructor(
    private readonly items: OrbitItem[],
    private readonly orbitEngine: OrbitEngine,
    private readonly stage: Container,
    private readonly machine: SceneStateMachine,
    private readonly config: InteractionConfig,
  ) {}

  mount(): void {
    this.stage.eventMode = 'static'
    this.stage.hitArea = new Rectangle(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    this.stage.on('pointerdown', this.onStageTap, this)

    for (const item of this.items) {
      item.container.eventMode = 'static'
      item.container.cursor = 'pointer'
      item.container.on('pointerdown', (e: FederatedPointerEvent) => {
        e.stopPropagation()
        this.onItemTap(item)
      })
    }

    // When any external actor (Gallery timeout, etc.) drives machine → idle,
    // this engine still owns the orbit and focus visual cleanup.
    this.unsubscribe = this.machine.subscribe((to) => {
      if (to === 'idle') this.applyIdle()
    })
  }

  destroy(): void {
    this.unsubscribe?.()
    this.clearTimeout()
    this.stage.off('pointerdown', this.onStageTap, this)

    for (const item of this.items) {
      item.container.removeAllListeners()
      item.container.eventMode = 'none'
    }
  }

  private onItemTap(item: OrbitItem): void {
    if (this.focusedItem === item && this.machine.state === 'focused') {
      // Focused item tapped again — open Gallery
      this.clearTimeout()
      this.machine.transition('gallery')
      return
    }

    if (this.focusedItem) {
      this.focusedItem.unfocus()
      this.focusedItem.dim()
    }

    this.focusedItem = item
    item.focus()
    item.undim()

    for (const other of this.items) {
      if (other !== item) other.dim()
    }

    if (this.machine.state !== 'focused') {
      this.orbitEngine.setSlowMotion(true)
    }

    this.machine.transition('focused')
    this.resetTimeout()
  }

  private onStageTap = (_e: FederatedPointerEvent): void => {
    if (this.machine.state === 'focused') {
      this.returnToIdle()
    }
    // If state === 'gallery', the GalleryModule's overlay handles the tap
  }

  private returnToIdle(): void {
    if (this.machine.state === 'idle') return
    this.applyIdle()
    this.machine.transition('idle')
  }

  // Idempotent — safe to call from both returnToIdle() and the machine subscription
  private applyIdle(): void {
    this.clearTimeout()
    if (this.focusedItem) {
      this.focusedItem.unfocus()
      this.focusedItem = null
    }
    for (const item of this.items) {
      item.undim()
    }
    this.orbitEngine.setSlowMotion(false)
  }

  private resetTimeout(): void {
    this.clearTimeout()
    this.timeoutHandle = setTimeout(() => this.returnToIdle(), this.config.focusTimeoutMs)
  }

  private clearTimeout(): void {
    if (this.timeoutHandle !== null) {
      clearTimeout(this.timeoutHandle)
      this.timeoutHandle = null
    }
  }
}
