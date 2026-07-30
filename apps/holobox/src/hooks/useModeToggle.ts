import { useEffect } from 'react'
import type React from 'react'
import type { CenterPiece } from '@/objects/centerpiece'

/** D key — toggle digital / physical centerpiece mode at runtime (dev only). */
export function useModeToggle(cpRef: React.RefObject<CenterPiece | null>): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'd' && e.key !== 'D') return
      const cp = cpRef.current
      if (!cp) return
      cp.setMode(cp.getMode() === 'physical' ? 'digital' : 'physical')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [cpRef])
}
