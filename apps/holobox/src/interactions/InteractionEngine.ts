import { Rectangle, type Container, type FederatedPointerEvent } from 'pixi.js'
import type { OrbitItem } from '@/objects/orbit'
import type { OrbitEngine } from '@/objects/orbit'
import type { InteractionConfig } from '@/config/types'
import type { SceneStateMachine } from './SceneStateMachine'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/config/defaults'

export class InteractionEngine {
  private focusedItem: OrbitItem | null = null
  private timeoutHandle: ReturnType<typeof setTimeout> | null = null

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
  }

  destroy(): void {
    this.clearTimeout()
    this.orbitEngine.setSlowMotion(false)
    this.stage.off('pointerdown', this.onStageTap, this)

    for (const item of this.items) {
      item.container.removeAllListeners()
      item.container.eventMode = 'none'
    }
  }

  private onItemTap(item: OrbitItem): void {
    if (this.focusedItem === item) {
      // Re-tapping the focused item resets the timeout.
      // Ticket 0008 will drive machine.transition('gallery') from here.
      this.resetTimeout()
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
    this.returnToIdle()
  }

  private returnToIdle(): void {
    if (this.machine.state === 'idle') return

    this.clearTimeout()

    if (this.focusedItem) {
      this.focusedItem.unfocus()
      this.focusedItem = null
    }

    for (const item of this.items) {
      item.undim()
    }

    this.orbitEngine.setSlowMotion(false)
    this.machine.transition('idle')
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
