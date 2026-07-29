import type { ProjectConfig } from '@/config/types'
import { DEFAULT_CONFIG } from '@/config/defaults'

export class ProjectLoader {
  static async load(): Promise<ProjectConfig> {
    try {
      const res = await fetch('/project.json')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const raw: Partial<ProjectConfig> = await res.json()
      return ProjectLoader.merge(raw)
    } catch (err) {
      console.warn('[ProjectLoader] Failed to load project.json — using defaults', err)
      return DEFAULT_CONFIG
    }
  }

  private static merge(raw: Partial<ProjectConfig>): ProjectConfig {
    return {
      ...DEFAULT_CONFIG,
      ...raw,
      centerpiece: { ...DEFAULT_CONFIG.centerpiece, ...raw.centerpiece },
      orbit: { ...DEFAULT_CONFIG.orbit, ...raw.orbit },
      theme: raw.theme ? { ...DEFAULT_CONFIG.theme!, ...raw.theme } : DEFAULT_CONFIG.theme,
      motion: raw.motion ? { ...DEFAULT_CONFIG.motion!, ...raw.motion } : DEFAULT_CONFIG.motion,
      interaction: raw.interaction
        ? { ...DEFAULT_CONFIG.interaction!, ...raw.interaction }
        : DEFAULT_CONFIG.interaction,
      gallery: raw.gallery ? { ...DEFAULT_CONFIG.gallery!, ...raw.gallery } : DEFAULT_CONFIG.gallery,
      assets: raw.assets ? { ...DEFAULT_CONFIG.assets!, ...raw.assets } : DEFAULT_CONFIG.assets,
    }
  }
}
