export interface AssetManifest {
  images: Record<string, string>
  fonts: Record<string, string>
}

export interface SystemRegistry {
  assets: AssetManifest | null
  configLoaded: boolean
}
