import { useState, useEffect } from 'react'
import { ProjectLoader } from '@/core/ProjectLoader'
import type { ProjectConfig } from '@/config/types'
import Experience from './Experience'
import './styles.css'

export default function Root() {
  const [config, setConfig] = useState<ProjectConfig | null>(null)

  useEffect(() => {
    ProjectLoader.load().then(setConfig)
  }, [])

  if (!config) return null

  return <Experience config={config} />
}
