import { Rectangle, type Container, type FederatedPointerEvent } from 'pixi.js'
import type { OrbitItem } from '@/objects/orbit'
import type { OrbitEngine } from '@/objects/orbit'
import type { InteractionConfig } from '@/config/types'
import type { SceneStateMachine } from './SceneStateMachine'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/config/defaults'

export class InteractionEngine {
  private focusedItem: OrbitItem | null = null
  private unsubscribe: (() => void) | null = null

  constructor(
    private readonly items: OrbitItem[],
    private readonly orbitEngine: OrbitEngine,
    private readonly stage: Container,
    private readonly machine: SceneStateMachine,
    private readonly config: InteractionConfig,
    private readonly focusedItemSlot: { current: OrbitItem | null },
    private readonly focusedIndexSlot: { current: number },
  ) {}

  mount(): void {
    this.stage.eventMode = 'static'
    this.stage.hitArea = new Rectangle(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    this.stage.on('pointerdown', this.onStageTap, this)

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i]
      const index = i
      item.container.eventMode = 'static'
      item.container.cursor = 'pointer'
      item.container.on('pointerdown', (e: FederatedPointerEvent) => {
        e.stopPropagation()
        this.onItemTap(item, index)
      })
    }

    this.unsubscribe = this.machine.subscribe((to) => {
      if (to === 'idle') this.applyIdle()
    })
  }

  destroy(): void {
    this.unsubscribe?.()
    this.stage.off('pointerdown', this.onStageTap, this)

    for (const item of this.items) {
      item.container.removeAllListeners()
      item.container.eventMode = 'none'
    }
  }

  private onItemTap(item: OrbitItem, index: number): void {
    const state = this.machine.state
    // Gallery owns its own interaction — orbit items ignored while gallery is open
    if (state === 'gallery') return

    if (this.focusedItem && this.focusedItem !== item) {
      this.focusedItem.unfocus()
      this.focusedItem.dim()
    }

    this.focusedItem = item
    this.focusedItemSlot.current = item
    this.focusedIndexSlot.current = index

    item.focus()
    item.undim()

    for (const other of this.items) {
      if (other !== item) other.dim()
    }

    this.orbitEngine.setSlowMotion(true)
    // From idle → focused; from focused → focused (self-transition, switches player in FocusView)
    this.machine.transition('focused')
  }

  private onStageTap = (_e: FederatedPointerEvent): void => {
    // FocusView's backdrop handles closing while focused.
    // Stage tap only fires when nothing in FocusView captured the event (i.e., outside FocusView).
    if (this.machine.state === 'focused') {
      this.machine.transition('idle')
    }
  }

  private applyIdle(): void {
    if (this.focusedItem) {
      this.focusedItem.unfocus()
      this.focusedItem = null
      this.focusedItemSlot.current = null
    }
    this.focusedIndexSlot.current = -1
    for (const item of this.items) {
      item.undim()
    }
    this.orbitEngine.setSlowMotion(false)
  }
}
