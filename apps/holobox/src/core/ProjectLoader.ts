import type { ProjectConfig, InstallationConfig } from '@/config/types'
import { DEFAULT_CONFIG } from '@/config/defaults'

export class ProjectLoader {
  static async load(): Promise<ProjectConfig> {
    const [installation, project] = await Promise.all([
      ProjectLoader.loadInstallation(),
      ProjectLoader.loadProject(),
    ])
    return ProjectLoader.merge(installation, project)
  }

  // ── Loaders ─────────────────────────────────────────────────────────────────

  private static async loadInstallation(): Promise<InstallationConfig> {
    try {
      const res = await fetch('/installation.json')
      if (!res.ok) return {}
      return await res.json()
    } catch {
      return {}
    }
  }

  private static async loadProject(): Promise<Partial<ProjectConfig>> {
    try {
      const res = await fetch('/project.json')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      console.warn('[ProjectLoader] Failed to load project.json — using defaults', err)
      return {}
    }
  }

  // ── Merge: defaults → installation → project ─────────────────────────────────
  // installation.json sets device-level geometry (safeZone, layerSplit).
  // project.json sets experience content and can override any field.

  private static merge(
    installation: InstallationConfig,
    project: Partial<ProjectConfig>,
  ): ProjectConfig {
    const defaultCp = DEFAULT_CONFIG.centerpiece
    const installationCp: NonNullable<InstallationConfig['centerpiece']> = installation.centerpiece ?? {}
    // Explicitly typed: `project.centerpiece ?? {}` otherwise widens to `{}`,
    // which hides `dev` and silently drops the dev-overlay merge below.
    const projectCp: Partial<ProjectConfig['centerpiece']> = project.centerpiece ?? {}

    return {
      ...DEFAULT_CONFIG,
      ...project,
      centerpiece: {
        ...defaultCp,
        safeZone: installationCp.safeZone ?? defaultCp.safeZone,
        layerSplit: installationCp.layerSplit ?? defaultCp.layerSplit,
        ...projectCp,
        dev: {
          ...defaultCp.dev,
          ...projectCp.dev,
        },
      },
      orbit: { ...DEFAULT_CONFIG.orbit, ...project.orbit },
      theme: project.theme ? { ...DEFAULT_CONFIG.theme!, ...project.theme } : DEFAULT_CONFIG.theme,
      motion: project.motion ? { ...DEFAULT_CONFIG.motion!, ...project.motion } : DEFAULT_CONFIG.motion,
      interaction: project.interaction
        ? { ...DEFAULT_CONFIG.interaction!, ...project.interaction }
        : DEFAULT_CONFIG.interaction,
      gallery: project.gallery ? { ...DEFAULT_CONFIG.gallery!, ...project.gallery } : DEFAULT_CONFIG.gallery,
      assets: project.assets ? { ...DEFAULT_CONFIG.assets!, ...project.assets } : DEFAULT_CONFIG.assets,
      decorations: project.decorations
        ? { ...DEFAULT_CONFIG.decorations!, ...project.decorations }
        : DEFAULT_CONFIG.decorations,
    }
  }
}

