import { 
  Asset, 
  AssetType, 
  AssetMetadata, 
  LoadingProgress, 
  CacheEntry, 
  CacheStats, 
  InstancedAsset, 
  LoadingOptions,
  FallbackConfig,
  TextureAsset,
  ModelAsset,
  CompressionLevel
} from '../../types/assets'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { TextureLoader, Object3D, Texture, BufferGeometry } from 'three'
import { TextureOptimizer } from './TextureOptimizer'
import { ModelOptimizer } from './ModelOptimizer'

export class AssetManager {
  private cache = new Map<string, CacheEntry>()
  private loadingPromises = new Map<string, Promise<Asset>>()
  private instances = new Map<string, InstancedAsset>()
  private metadata = new Map<string, AssetMetadata>()
  private textureOptimizer = new TextureOptimizer()
  private modelOptimizer = new ModelOptimizer()
  
  // Loaders
  private gltfLoader = new GLTFLoader()
  private textureLoader = new TextureLoader()
  
  // Configuration
  private maxCacheSize = 500 * 1024 * 1024 // 500MB
  private maxCacheAge = 30 * 60 * 1000 // 30 minutes
  private fallbackConfig: FallbackConfig = {
    model: '/assets/fallback/default-model.glb',
    texture: '/assets/fallback/default-texture.jpg',
    material: '/assets/fallback/default-material.json',
    showPlaceholder: true,
    placeholderColor: '#cccccc'
  }

  // Statistics
  private stats: CacheStats = {
    totalAssets: 0,
    totalMemoryUsage: 0,
    hitRate: 0,
    missRate: 0,
    evictionCount: 0
  }

  /**
   * Load an asset with basic loading
   */
  async loadAsset(url: string, type: AssetType, options: LoadingOptions = this.getDefaultOptions()): Promise<Asset> {
    const assetId = this.generateAssetId(url, type)
    
    // Check cache first
    const cached = this.getCachedAsset(assetId)
    if (cached && options.cache) {
      this.updateCacheAccess(assetId)
      this.stats.hitRate++
      return cached
    }
    
    this.stats.missRate++
    
    // Check if already loading
    if (this.loadingPromises.has(assetId)) {
      return this.loadingPromises.get(assetId)!
    }
    
    // Start loading
    const loadingPromise = this.performAssetLoad(url, type, assetId, options)
    this.loadingPromises.set(assetId, loadingPromise)
    
    try {
      const asset = await loadingPromise
      
      // Cache if enabled
      if (options.cache) {
        this.cacheAsset(asset)
      }
      
      return asset
    } finally {
      this.loadingPromises.delete(assetId)
    }
  }

  /**
   * Load asset with progressive loading and progress callbacks
   */
  async loadAssetProgressive(
    url: string, 
    type: AssetType, 
    onProgress: (progress: LoadingProgress) => void,
    options: LoadingOptions = this.getDefaultOptions()
  ): Promise<Asset> {
    const assetId = this.generateAssetId(url, type)
    
    // Check cache first
    const cached = this.getCachedAsset(assetId)
    if (cached && options.cache) {
      onProgress({
        assetId,
        loaded: 1,
        total: 1,
        percentage: 100,
        stage: 'complete'
      })
      return cached
    }
    
    return this.performProgressiveLoad(url, type, assetId, onProgress, options)
  }

  /**
   * Load asset with chunked progressive loading for large files
   */
  async loadAssetProgressiveChunked(
    url: string,
    type: AssetType,
    onProgress: (progress: LoadingProgress) => void,
    chunkSize: number = 1024 * 1024, // 1MB chunks
    options: LoadingOptions = this.getDefaultOptions()
  ): Promise<Asset> {
    const assetId = this.generateAssetId(url, type)
    
    // Check cache first
    const cached = this.getCachedAsset(assetId)
    if (cached && options.cache) {
      onProgress({
        assetId,
        loaded: 1,
        total: 1,
        percentage: 100,
        stage: 'complete'
      })
      return cached
    }

    onProgress({
      assetId,
      loaded: 0,
      total: 1,
      percentage: 0,
      stage: 'downloading'
    })

    try {
      // For large assets, implement chunked loading
      if (type === 'model') {
        return await this.loadModelWithChunks(url, assetId, onProgress, chunkSize, options)
      } else {
        return await this.performProgressiveLoad(url, type, assetId, onProgress, options)
      }
    } catch (error) {
      // Try fallback if available
      if (options.fallbackUrl && options.fallbackUrl !== url) {
        console.warn(`Failed to load ${url}, trying fallback: ${options.fallbackUrl}`)
        return this.loadAssetProgressiveChunked(
          options.fallbackUrl, 
          type, 
          onProgress, 
          chunkSize,
          { ...options, fallbackUrl: undefined }
        )
      }
      
      // Try system fallback
      const systemFallback = this.getSystemFallback(type)
      if (systemFallback) {
        console.warn(`Using system fallback for ${type}: ${systemFallback}`)
        return this.loadAssetProgressiveChunked(
          systemFallback,
          type,
          onProgress,
          chunkSize,
          { ...options, fallbackUrl: undefined }
        )
      }
      
      throw error
    }
  }

  /**
   * Load multiple assets in batch
   */
  async loadBatch(
    requests: Array<{url: string, type: AssetType, options?: LoadingOptions}>,
    onProgress?: (progress: LoadingProgress) => void
  ): Promise<Asset[]> {
    const totalAssets = requests.length
    let loadedAssets = 0
    
    const loadPromises = requests.map(async (request, index) => {
      const asset = await this.loadAssetProgressive(
        request.url,
        request.type,
        (progress) => {
          if (onProgress) {
            onProgress({
              assetId: `batch-${index}`,
              loaded: loadedAssets,
              total: totalAssets,
              percentage: (loadedAssets / totalAssets) * 100,
              stage: progress.stage
            })
          }
        },
        request.options
      )
      
      loadedAssets++
      return asset
    })
    
    return Promise.all(loadPromises)
  }

  /**
   * Cache an asset
   */
  cacheAsset(asset: Asset): void {
    const entry: CacheEntry = {
      asset,
      lastAccessed: new Date(),
      accessCount: 1,
      memorySize: this.estimateAssetSize(asset),
      persistent: false
    }
    
    // Check cache size limits
    this.enforceCacheLimits()
    
    this.cache.set(asset.id, entry)
    this.updateCacheStats()
  }

  /**
   * Get cached asset
   */
  getCachedAsset(id: string): Asset | null {
    const entry = this.cache.get(id)
    if (!entry) return null
    
    // Check if expired
    if (this.isCacheEntryExpired(entry)) {
      this.cache.delete(id)
      return null
    }
    
    return entry.asset
  }

  /**
   * Remove asset from cache
   */
  removeCachedAsset(id: string): boolean {
    const removed = this.cache.delete(id)
    if (removed) {
      this.updateCacheStats()
    }
    return removed
  }

  /**
   * Clear entire cache
   */
  clearCache(): void {
    // Dispose of all cached assets
    Array.from(this.cache.entries()).forEach(([id, entry]) => {
      this.disposeAssetData(entry.asset)
    })
    
    this.cache.clear()
    this.updateCacheStats()
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Compress texture with specified level
   */
  async compressTexture(texture: Texture, level: CompressionLevel): Promise<Texture> {
    return this.textureOptimizer.compressTexture(texture, level)
  }

  /**
   * Optimize geometry
   */
  optimizeGeometry(geometry: BufferGeometry): BufferGeometry {
    return this.modelOptimizer.optimizeGeometry(geometry)
  }

  /**
   * Generate mipmaps for texture
   */
  generateMipmaps(texture: Texture): void {
    this.textureOptimizer.generateMipmaps(texture)
  }

  /**
   * Create instance of an asset
   */
  createInstance(originalId: string, transform?: Partial<InstancedAsset['transform']>): InstancedAsset {
    const instanceId = `${originalId}_instance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const instance: InstancedAsset = {
      originalId,
      instanceId,
      transform: {
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        ...transform
      },
      visible: true
    }
    
    this.instances.set(instanceId, instance)
    return instance
  }

  /**
   * Update instance transform
   */
  updateInstance(instanceId: string, transform: Partial<InstancedAsset['transform']>): void {
    const instance = this.instances.get(instanceId)
    if (instance) {
      instance.transform = { ...instance.transform, ...transform }
    }
  }

  /**
   * Dispose instance
   */
  disposeInstance(instanceId: string): void {
    this.instances.delete(instanceId)
  }

  /**
   * Get all instances of an asset
   */
  getInstances(originalId: string): InstancedAsset[] {
    return Array.from(this.instances.values()).filter(
      instance => instance.originalId === originalId
    )
  }

  /**
   * Dispose asset and cleanup resources
   */
  disposeAsset(id: string): void {
    const entry = this.cache.get(id)
    if (entry) {
      this.disposeAssetData(entry.asset)
      this.cache.delete(id)
      this.updateCacheStats()
    }
    
    // Remove all instances
    const instancesToRemove = Array.from(this.instances.entries())
      .filter(([_, instance]) => instance.originalId === id)
      .map(([instanceId]) => instanceId)
    
    instancesToRemove.forEach(instanceId => this.instances.delete(instanceId))
  }

  /**
   * Dispose unused assets older than maxAge
   */
  disposeUnusedAssets(maxAge: number = this.maxCacheAge): number {
    const now = Date.now()
    let disposedCount = 0
    
    Array.from(this.cache.entries()).forEach(([id, entry]) => {
      if (!entry.persistent && (now - entry.lastAccessed.getTime()) > maxAge) {
        this.disposeAsset(id)
        disposedCount++
      }
    })
    
    return disposedCount
  }

  /**
   * Set metadata for an asset
   */
  setMetadata(id: string, metadata: AssetMetadata): void {
    this.metadata.set(id, metadata)
  }

  /**
   * Get metadata for an asset
   */
  getMetadata(id: string): AssetMetadata | null {
    return this.metadata.get(id) || null
  }

  /**
   * Get assets by type
   */
  getAssetsByType(type: AssetType): Asset[] {
    return Array.from(this.cache.values())
      .map(entry => entry.asset)
      .filter(asset => asset.type === type)
  }

  /**
   * Get assets by tag
   */
  getAssetsByTag(tag: string): Asset[] {
    const assetsWithTag: Asset[] = []
    
    Array.from(this.cache.entries()).forEach(([id, entry]) => {
      const metadata = this.metadata.get(id)
      if (metadata && metadata.tags.includes(tag)) {
        assetsWithTag.push(entry.asset)
      }
    })
    
    return assetsWithTag
  }

  /**
   * Search assets by query
   */
  searchAssets(query: string): Asset[] {
    const lowerQuery = query.toLowerCase()
    
    return Array.from(this.cache.values())
      .map(entry => entry.asset)
      .filter(asset => 
        asset.id.toLowerCase().includes(lowerQuery) ||
        asset.url.toLowerCase().includes(lowerQuery)
      )
  }

  // Private helper methods

  private async performAssetLoad(url: string, type: AssetType, assetId: string, options: LoadingOptions): Promise<Asset> {
    try {
      switch (type) {
        case 'model':
          return await this.loadModel(url, assetId, options)
        case 'texture':
          return await this.loadTexture(url, assetId, options)
        default:
          throw new Error(`Unsupported asset type: ${type}`)
      }
    } catch (error) {
      if (options.fallbackUrl) {
        console.warn(`Failed to load ${url}, trying fallback: ${options.fallbackUrl}`)
        return this.performAssetLoad(options.fallbackUrl, type, assetId, { ...options, fallbackUrl: undefined })
      }
      throw error
    }
  }

  private async performProgressiveLoad(
    url: string,
    type: AssetType,
    assetId: string,
    onProgress: (progress: LoadingProgress) => void,
    options: LoadingOptions
  ): Promise<Asset> {
    onProgress({
      assetId,
      loaded: 0,
      total: 1,
      percentage: 0,
      stage: 'downloading'
    })

    try {
      const asset = await this.performAssetLoad(url, type, assetId, options)
      
      onProgress({
        assetId,
        loaded: 1,
        total: 1,
        percentage: 100,
        stage: 'complete'
      })
      
      return asset
    } catch (error) {
      onProgress({
        assetId,
        loaded: 0,
        total: 1,
        percentage: 0,
        stage: 'complete'
      })
      throw error
    }
  }

  private async loadModel(url: string, assetId: string, options: LoadingOptions): Promise<ModelAsset> {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          const model = gltf.scene
          
          // Optimize if requested
          if (options.compress) {
            this.modelOptimizer.optimizeModel(model)
          }
          
          const asset: ModelAsset = {
            id: assetId,
            type: 'model',
            url,
            size: this.estimateModelSize(model),
            format: 'gltf',
            data: model,
            triangleCount: this.modelOptimizer.getTriangleCount(model),
            vertexCount: this.modelOptimizer.getVertexCount(model),
            materials: this.modelOptimizer.extractMaterials(model),
            animations: gltf.animations,
            loadedAt: new Date()
          }
          
          resolve(asset)
        },
        undefined,
        reject
      )
    })
  }

  private async loadTexture(url: string, assetId: string, options: LoadingOptions): Promise<TextureAsset> {
    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        (texture) => {
          // Optimize if requested
          if (options.compress) {
            this.textureOptimizer.optimizeTexture(texture)
          }
          
          const asset: TextureAsset = {
            id: assetId,
            type: 'texture',
            url,
            size: this.estimateTextureSize(texture),
            format: this.getTextureFormat(url),
            data: texture,
            width: texture.image.width,
            height: texture.image.height,
            compressed: false,
            mipmaps: texture.generateMipmaps,
            loadedAt: new Date()
          }
          
          resolve(asset)
        },
        undefined,
        reject
      )
    })
  }

  private generateAssetId(url: string, type: AssetType): string {
    return `${type}_${btoa(url).replace(/[^a-zA-Z0-9]/g, '')}`
  }

  private getDefaultOptions(): LoadingOptions {
    return {
      priority: 1,
      cache: true,
      compress: false,
      generateLOD: false,
      timeout: 30000,
      retryCount: 3
    }
  }

  private estimateAssetSize(asset: Asset): number {
    switch (asset.type) {
      case 'texture':
        return this.estimateTextureSize((asset as TextureAsset).data)
      case 'model':
        return this.estimateModelSize((asset as ModelAsset).data)
      default:
        return asset.size || 0
    }
  }

  private estimateTextureSize(texture: Texture): number {
    if (!texture.image) return 0
    const { width, height } = texture.image
    return width * height * 4 // RGBA
  }

  private estimateModelSize(model: Object3D): number {
    // Rough estimation based on geometry and materials
    return 1024 * 1024 // 1MB default estimate
  }

  private getTextureFormat(url: string): 'jpg' | 'png' | 'webp' {
    const extension = url.split('.').pop()?.toLowerCase()
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'jpg'
      case 'png':
        return 'png'
      case 'webp':
        return 'webp'
      default:
        return 'jpg'
    }
  }

  private enforceCacheLimits(): void {
    const currentSize = this.getCurrentCacheSize()
    
    if (currentSize > this.maxCacheSize) {
      // Remove oldest non-persistent entries
      const entries = Array.from(this.cache.entries())
        .filter(([_, entry]) => !entry.persistent)
        .sort((a, b) => a[1].lastAccessed.getTime() - b[1].lastAccessed.getTime())
      
      let removedSize = 0
      entries.forEach(([id, entry]) => {
        if (currentSize - removedSize <= this.maxCacheSize * 0.8) return
        
        this.disposeAsset(id)
        removedSize += entry.memorySize
        this.stats.evictionCount++
      })
    }
  }

  private getCurrentCacheSize(): number {
    return Array.from(this.cache.values())
      .reduce((total, entry) => total + entry.memorySize, 0)
  }

  private isCacheEntryExpired(entry: CacheEntry): boolean {
    if (entry.persistent) return false
    return (Date.now() - entry.lastAccessed.getTime()) > this.maxCacheAge
  }

  private updateCacheAccess(id: string): void {
    const entry = this.cache.get(id)
    if (entry) {
      entry.lastAccessed = new Date()
      entry.accessCount++
    }
  }

  private updateCacheStats(): void {
    const entries = Array.from(this.cache.values())
    
    this.stats.totalAssets = entries.length
    this.stats.totalMemoryUsage = entries.reduce((total, entry) => total + entry.memorySize, 0)
    
    if (entries.length > 0) {
      const dates = entries.map(e => e.lastAccessed.getTime())
      this.stats.oldestAsset = new Date(Math.min(...dates))
      this.stats.newestAsset = new Date(Math.max(...dates))
    }
  }

  private disposeAssetData(asset: Asset): void {
    if (asset.type === 'texture') {
      const textureAsset = asset as TextureAsset
      textureAsset.data.dispose()
    } else if (asset.type === 'model') {
      const modelAsset = asset as ModelAsset
      this.modelOptimizer.disposeModel(modelAsset.data)
    }
  }

  private async loadModelWithChunks(
    url: string,
    assetId: string,
    onProgress: (progress: LoadingProgress) => void,
    chunkSize: number,
    options: LoadingOptions
  ): Promise<ModelAsset> {
    return new Promise((resolve, reject) => {
      // For now, use standard GLTF loader with progress tracking
      // In a real implementation, you would implement actual chunked loading
      this.gltfLoader.load(
        url,
        (gltf) => {
          onProgress({
            assetId,
            loaded: 0.8,
            total: 1,
            percentage: 80,
            stage: 'processing'
          })

          const model = gltf.scene
          
          // Optimize if requested
          if (options.compress) {
            this.modelOptimizer.optimizeModel(model)
          }
          
          const asset: ModelAsset = {
            id: assetId,
            type: 'model',
            url,
            size: this.estimateModelSize(model),
            format: 'gltf',
            data: model,
            triangleCount: this.modelOptimizer.getTriangleCount(model),
            vertexCount: this.modelOptimizer.getVertexCount(model),
            materials: this.modelOptimizer.extractMaterials(model),
            animations: gltf.animations,
            loadedAt: new Date()
          }
          
          onProgress({
            assetId,
            loaded: 1,
            total: 1,
            percentage: 100,
            stage: 'complete'
          })
          
          resolve(asset)
        },
        (progressEvent) => {
          if (progressEvent.lengthComputable) {
            const percentage = (progressEvent.loaded / progressEvent.total) * 70 // Reserve 30% for processing
            onProgress({
              assetId,
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage,
              stage: 'downloading'
            })
          }
        },
        reject
      )
    })
  }

  private getSystemFallback(type: AssetType): string | null {
    switch (type) {
      case 'model':
        return this.fallbackConfig.model
      case 'texture':
        return this.fallbackConfig.texture
      default:
        return null
    }
  }
}