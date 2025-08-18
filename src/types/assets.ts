import { Object3D, Texture, Material, BufferGeometry, Group } from 'three'

// Asset types
export type AssetType = 'model' | 'texture' | 'audio' | 'material' | 'geometry'
export type AssetFormat = 'gltf' | 'glb' | 'fbx' | 'obj' | 'jpg' | 'png' | 'webp' | 'mp3' | 'wav'
export type LoadingState = 'idle' | 'loading' | 'loaded' | 'error' | 'cached'
export type CompressionLevel = 'none' | 'low' | 'medium' | 'high'

// Base asset interface
export interface Asset {
  id: string
  type: AssetType
  url: string
  size: number
  format: AssetFormat
  data?: any
  loadedAt?: Date
  lastUsed?: Date
}

// Asset metadata interface
export interface AssetMetadata {
  id: string
  type: AssetType
  size: number
  format: AssetFormat
  compressionLevel: CompressionLevel
  lodLevels?: string[]
  dependencies: string[]
  loadPriority: number
  tags: string[]
  version: string
}

// Texture asset interface
export interface TextureAsset extends Asset {
  type: 'texture'
  data: Texture
  width: number
  height: number
  compressed: boolean
  mipmaps: boolean
}

// Model asset interface
export interface ModelAsset extends Asset {
  type: 'model'
  data: Object3D | Group
  triangleCount: number
  vertexCount: number
  materials: Material[]
  animations?: any[]
  boundingBox?: {
    min: [number, number, number]
    max: [number, number, number]
  }
}

// Instanced asset interface
export interface InstancedAsset {
  originalId: string
  instanceId: string
  transform: {
    position: [number, number, number]
    rotation: [number, number, number]
    scale: [number, number, number]
  }
  visible: boolean
  lodLevel?: number
}

// Asset loading progress
export interface LoadingProgress {
  assetId: string
  loaded: number
  total: number
  percentage: number
  stage: 'downloading' | 'parsing' | 'processing' | 'complete'
}

// Asset cache entry
export interface CacheEntry {
  asset: Asset
  lastAccessed: Date
  accessCount: number
  memorySize: number
  persistent: boolean
}

// Asset manager interface
export interface AssetManager {
  // Loading methods
  loadAsset(url: string, type: AssetType): Promise<Asset>
  loadAssetProgressive(url: string, type: AssetType, onProgress: (progress: LoadingProgress) => void): Promise<Asset>
  loadBatch(urls: string[], onProgress?: (progress: LoadingProgress) => void): Promise<Asset[]>
  
  // Cache management
  cacheAsset(asset: Asset): void
  getCachedAsset(id: string): Asset | null
  removeCachedAsset(id: string): boolean
  clearCache(): void
  getCacheStats(): CacheStats
  
  // Asset optimization
  compressTexture(texture: Texture, level: CompressionLevel): Promise<Texture>
  optimizeGeometry(geometry: BufferGeometry): BufferGeometry
  generateMipmaps(texture: Texture): void
  
  // Instance management
  createInstance(originalId: string, transform?: Partial<InstancedAsset['transform']>): InstancedAsset
  updateInstance(instanceId: string, transform: Partial<InstancedAsset['transform']>): void
  disposeInstance(instanceId: string): void
  getInstances(originalId: string): InstancedAsset[]
  
  // Asset disposal
  disposeAsset(id: string): void
  disposeUnusedAssets(maxAge?: number): number
  
  // Metadata management
  setMetadata(id: string, metadata: AssetMetadata): void
  getMetadata(id: string): AssetMetadata | null
  
  // Asset queries
  getAssetsByType(type: AssetType): Asset[]
  getAssetsByTag(tag: string): Asset[]
  searchAssets(query: string): Asset[]
}

// Cache statistics
export interface CacheStats {
  totalAssets: number
  totalMemoryUsage: number
  hitRate: number
  missRate: number
  evictionCount: number
  oldestAsset?: Date
  newestAsset?: Date
}

// Asset loading options
export interface LoadingOptions {
  priority?: number
  cache?: boolean
  compress?: boolean
  generateLOD?: boolean
  timeout?: number
  retryCount?: number
  fallbackUrl?: string
}

// Asset state for context
export interface AssetState {
  loadedAssets: Map<string, Asset>
  loadingAssets: Map<string, LoadingProgress>
  cachedAssets: Map<string, CacheEntry>
  instances: Map<string, InstancedAsset>
  metadata: Map<string, AssetMetadata>
  cacheStats: CacheStats
}

// Asset context actions
export interface AssetActions {
  loadAsset: (url: string, type: AssetType, options?: LoadingOptions) => Promise<Asset>
  cacheAsset: (asset: Asset) => void
  disposeAsset: (id: string) => void
  createInstance: (originalId: string, transform?: Partial<InstancedAsset['transform']>) => InstancedAsset
  clearCache: () => void
}

// Combined asset context
export interface AssetContextType extends AssetState {
  actions: AssetActions
}

// Fallback asset configuration
export interface FallbackConfig {
  model: string // Default model URL
  texture: string // Default texture URL
  material: string // Default material URL
  showPlaceholder: boolean
  placeholderColor: string
}

// Asset preloading configuration
export interface PreloadConfig {
  essential: string[] // Assets to load immediately
  priority: string[] // Assets to load with high priority
  lazy: string[] // Assets to load when needed
  preloadDistance: number // Distance threshold for preloading
}