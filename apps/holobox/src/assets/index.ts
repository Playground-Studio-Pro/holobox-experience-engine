export interface AssetEntry {
  id: string
  src: string
  type: 'image' | 'video' | 'font'
  preload: boolean
}

export type AssetRegistry = Map<string, AssetEntry>
