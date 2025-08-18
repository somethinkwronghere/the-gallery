import { BufferGeometry, Material, Texture, Object3D } from 'three'
import {
  ResourceManager as IResourceManager,
  DisposableResource,
  ResourceMetadata,
  MemoryUsage,
  MemoryLeakInfo,
  MemoryWarning,
  MemoryWarningLevel,
  CleanupConfig
} from '../../types/memory'

export class ResourceManager implements IResourceManager {
  private resources: Map<string, { resource: DisposableResource; metadata: ResourceMetadata }> = new Map()
  private config: CleanupConfig
  private monitoringInterval: number | null = null
  private memoryCheckInterval: number | null = null
  private warnings: MemoryWarning[] = []
  private resourceIdCounter = 0

  constructor() {
    this.config = this.getDefaultConfig()
  }

  private getDefaultConfig(): CleanupConfig {
    return {
      maxAge: 5 * 60 * 1000, // 5 minutes
      maxUnusedTime: 2 * 60 * 1000, // 2 minutes
      memoryThreshold: 512, // 512 MB
      checkInterval: 30 * 1000, // 30 seconds
      enableAutoCleanup: true,
      enableLeakDetection: true
    }
  }

  private generateResourceId(): string {
    return `resource_${++this.resourceIdCounter}_${Date.now()}`
  }

  private getResourceSize(resource: DisposableResource): number {
    if (resource instanceof BufferGeometry) {
      return this.calculateGeometrySize(resource)
    } else if (resource instanceof Material) {
      return this.calculateMaterialSize(resource)
    } else if (resource instanceof Texture) {
      return this.calculateTextureSize(resource)
    } else if (resource instanceof Object3D) {
      return this.calculateObject3DSize(resource)
    }
    return 0
  }

  private calculateGeometrySize(geometry: BufferGeometry): number {
    let size = 0
    const attributes = geometry.attributes
    
    for (const name in attributes) {
      const attribute = attributes[name]
      size += attribute.array.byteLength
    }
    
    if (geometry.index) {
      size += geometry.index.array.byteLength
    }
    
    return size
  }

  private calculateMaterialSize(material: Material): number {
    let size = 1024 // Base material size estimate
    
    // Add texture sizes if any
    const textureProperties = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap']
    textureProperties.forEach(prop => {
      const texture = (material as any)[prop]
      if (texture instanceof Texture || (texture && texture.image)) {
        size += this.calculateTextureSize(texture)
      }
    })
    
    return size
  }

  private calculateTextureSize(texture: Texture): number {
    const image = texture.image
    if (!image) return 0
    
    const width = image.width || image.videoWidth || 512
    const height = image.height || image.videoHeight || 512
    
    // Estimate based on format (assuming RGBA)
    return width * height * 4
  }

  private calculateObject3DSize(object: Object3D): number {
    let size = 512 // Base object size
    
    // Add geometry and material sizes
    const mesh = object as any
    if (mesh.geometry) {
      size += this.calculateGeometrySize(mesh.geometry)
    }
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((mat: Material) => {
          size += this.calculateMaterialSize(mat)
        })
      } else {
        size += this.calculateMaterialSize(mesh.material)
      }
    }
    
    // Add children sizes recursively
    object.children.forEach(child => {
      size += this.calculateObject3DSize(child)
    })
    
    return size
  }

  trackResource(resource: DisposableResource, metadata: Partial<ResourceMetadata> = {}): string {
    const id = this.generateResourceId()
    const now = Date.now()
    
    const fullMetadata: ResourceMetadata = {
      id,
      type: this.getResourceType(resource),
      size: this.getResourceSize(resource),
      createdAt: now,
      lastUsed: now,
      refCount: 1,
      disposed: false,
      ...metadata
    }

    this.resources.set(id, { resource, metadata: fullMetadata })
    
    console.debug(`[ResourceManager] Tracked ${fullMetadata.type} resource: ${id} (${(fullMetadata.size / 1024).toFixed(2)} KB)`)
    
    return id
  }

  private getResourceType(resource: DisposableResource): ResourceMetadata['type'] {
    // Check for Three.js types using duck typing since instanceof might not work with mocks
    if (resource instanceof BufferGeometry || 
        (resource as any).attributes !== undefined) return 'geometry'
    if (resource instanceof Material || 
        (resource as any).type === 'Material' ||
        ('dispose' in resource && !('attributes' in resource) && !('image' in resource))) return 'material'
    if (resource instanceof Texture || 
        (resource as any).image !== undefined) return 'texture'
    if (resource instanceof Object3D || 
        (resource as any).children !== undefined) return 'object3d'
    return 'geometry' // fallback
  }

  untrackResource(resourceId: string): void {
    const entry = this.resources.get(resourceId)
    if (entry) {
      entry.metadata.refCount--
      if (entry.metadata.refCount <= 0) {
        this.resources.delete(resourceId)
        console.debug(`[ResourceManager] Untracked resource: ${resourceId}`)
      }
    }
  }

  disposeResource(resourceId: string): boolean {
    const entry = this.resources.get(resourceId)
    if (!entry || entry.metadata.disposed) {
      return false
    }

    try {
      const { resource, metadata } = entry
      
      // Dispose the resource based on its type
      if ('dispose' in resource && typeof resource.dispose === 'function') {
        resource.dispose()
      }
      
      // Special handling for Object3D
      if (resource instanceof Object3D) {
        this.disposeObject3D(resource)
      }
      
      metadata.disposed = true
      this.resources.delete(resourceId)
      
      console.debug(`[ResourceManager] Disposed ${metadata.type} resource: ${resourceId} (${(metadata.size / 1024).toFixed(2)} KB)`)
      
      return true
    } catch (error) {
      console.error(`[ResourceManager] Error disposing resource ${resourceId}:`, error)
      return false
    }
  }

  private disposeObject3D(object: Object3D): void {
    // Recursively dispose children
    object.children.forEach(child => {
      this.disposeObject3D(child)
    })
    
    // Dispose geometry and materials
    const mesh = object as any
    if (mesh.geometry && 'dispose' in mesh.geometry) {
      mesh.geometry.dispose()
    }
    
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((mat: Material) => {
          if ('dispose' in mat) mat.dispose()
        })
      } else if ('dispose' in mesh.material) {
        mesh.material.dispose()
      }
    }
    
    // Remove from parent
    if (object.parent) {
      object.parent.remove(object)
    }
  }

  disposeUnusedResources(maxAge?: number): number {
    const now = Date.now()
    const ageThreshold = maxAge || this.config.maxUnusedTime
    let disposedCount = 0

    for (const [id, entry] of Array.from(this.resources.entries())) {
      const { metadata } = entry
      const age = now - metadata.lastUsed
      
      if (age > ageThreshold && !metadata.disposed) {
        if (this.disposeResource(id)) {
          disposedCount++
        }
      }
    }

    if (disposedCount > 0) {
      console.info(`[ResourceManager] Disposed ${disposedCount} unused resources`)
    }

    return disposedCount
  }

  emergencyCleanup(): number {
    console.warn('[ResourceManager] Emergency cleanup initiated!')
    
    let disposedCount = 0
    const sortedResources = Array.from(this.resources.entries())
      .sort(([, a], [, b]) => a.metadata.lastUsed - b.metadata.lastUsed)

    // Dispose oldest 50% of resources
    const halfCount = Math.floor(sortedResources.length / 2)
    for (let i = 0; i < halfCount; i++) {
      const [id] = sortedResources[i]
      if (this.disposeResource(id)) {
        disposedCount++
      }
    }

    // Force garbage collection if available
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc()
    }

    console.warn(`[ResourceManager] Emergency cleanup disposed ${disposedCount} resources`)
    return disposedCount
  }

  getMemoryUsage(): MemoryUsage {
    let geometries = 0
    let materials = 0
    let textures = 0

    for (const [, entry] of Array.from(this.resources.entries())) {
      const { metadata } = entry
      if (!metadata.disposed) {
        switch (metadata.type) {
          case 'geometry':
            geometries += metadata.size
            break
          case 'material':
            materials += metadata.size
            break
          case 'texture':
            textures += metadata.size
            break
          case 'object3d':
            // Object3D size is distributed across its components
            geometries += metadata.size * 0.6
            materials += metadata.size * 0.4
            break
        }
      }
    }

    const total = geometries + materials + textures
    
    // Get JS heap info if available
    const memoryInfo = (performance as any).memory
    const jsHeap = memoryInfo ? memoryInfo.usedJSHeapSize : 0
    const jsHeapLimit = memoryInfo ? memoryInfo.totalJSHeapSize : 0

    return {
      geometries: Math.round(geometries / 1024 / 1024), // Convert to MB
      materials: Math.round(materials / 1024 / 1024),
      textures: Math.round(textures / 1024 / 1024),
      total: Math.round(total / 1024 / 1024),
      jsHeap: Math.round(jsHeap / 1024 / 1024),
      jsHeapLimit: Math.round(jsHeapLimit / 1024 / 1024)
    }
  }

  checkMemoryLeaks(): MemoryLeakInfo[] {
    if (!this.config.enableLeakDetection) {
      return []
    }

    const now = Date.now()
    const leaks: MemoryLeakInfo[] = []
    const suspiciousAge = 10 * 60 * 1000 // 10 minutes

    for (const [, entry] of Array.from(this.resources.entries())) {
      const { metadata } = entry
      const age = now - metadata.createdAt
      const unusedTime = now - metadata.lastUsed

      // Detect potential leaks
      const suspected = (
        age > suspiciousAge && 
        unusedTime > suspiciousAge && 
        metadata.refCount > 0 &&
        !metadata.disposed
      )

      if (suspected) {
        leaks.push({
          resourceId: metadata.id,
          type: metadata.type,
          size: Math.round(metadata.size / 1024), // KB
          age: Math.round(age / 1000), // seconds
          refCount: metadata.refCount,
          suspected: true
        })
      }
    }

    return leaks
  }

  getMemoryWarnings(): MemoryWarning[] {
    return [...this.warnings]
  }

  private checkMemoryPressure(): void {
    const usage = this.getMemoryUsage()
    const threshold = this.config.memoryThreshold
    
    // Clear old warnings (older than 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    this.warnings = this.warnings.filter(w => w.timestamp > fiveMinutesAgo)

    if (usage.total > threshold) {
      const level: MemoryWarningLevel = 
        usage.total > threshold * 1.5 ? 'critical' :
        usage.total > threshold * 1.2 ? 'high' : 'medium'

      const warning: MemoryWarning = {
        level,
        message: `Memory usage is ${level}: ${usage.total}MB / ${threshold}MB`,
        currentUsage: usage.total,
        threshold,
        recommendations: this.getMemoryRecommendations(usage, level),
        timestamp: Date.now()
      }

      this.warnings.push(warning)
      
      if (level === 'critical') {
        console.error('[ResourceManager] Critical memory usage detected!', warning)
        if (this.config.enableAutoCleanup) {
          this.emergencyCleanup()
        }
      } else {
        console.warn('[ResourceManager] High memory usage detected:', warning)
      }
    }
  }

  private getMemoryRecommendations(usage: MemoryUsage, level: MemoryWarningLevel): string[] {
    const recommendations: string[] = []

    if (level === 'critical') {
      recommendations.push('Emergency cleanup recommended')
      recommendations.push('Consider reducing scene complexity')
    }

    if (usage.textures > usage.total * 0.5) {
      recommendations.push('Optimize texture sizes and formats')
      recommendations.push('Enable texture compression')
    }

    if (usage.geometries > usage.total * 0.3) {
      recommendations.push('Reduce geometry complexity')
      recommendations.push('Enable LOD system')
    }

    const leaks = this.checkMemoryLeaks()
    if (leaks.length > 0) {
      recommendations.push(`${leaks.length} potential memory leaks detected`)
      recommendations.push('Review resource disposal patterns')
    }

    return recommendations
  }

  setCleanupConfig(config: Partial<CleanupConfig>): void {
    this.config = { ...this.config, ...config }
    
    // Restart monitoring with new config
    if (this.monitoringInterval) {
      this.stopMonitoring()
      this.startMonitoring()
    }
  }

  getCleanupConfig(): CleanupConfig {
    return { ...this.config }
  }

  startMonitoring(): void {
    if (this.monitoringInterval) {
      return // Already monitoring
    }

    // Resource cleanup monitoring
    this.monitoringInterval = window.setInterval(() => {
      if (this.config.enableAutoCleanup) {
        this.disposeUnusedResources()
      }
    }, this.config.checkInterval)

    // Memory pressure monitoring
    this.memoryCheckInterval = window.setInterval(() => {
      this.checkMemoryPressure()
    }, 10000) // Check every 10 seconds

    console.info('[ResourceManager] Monitoring started')
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval)
      this.memoryCheckInterval = null
    }

    console.info('[ResourceManager] Monitoring stopped')
  }

  dispose(): void {
    this.stopMonitoring()
    
    // Dispose all tracked resources
    const resourceIds = Array.from(this.resources.keys())
    resourceIds.forEach(id => this.disposeResource(id))
    
    this.resources.clear()
    this.warnings = []
    
    console.info('[ResourceManager] Disposed')
  }

  // Utility methods for external use
  updateResourceUsage(resourceId: string): void {
    const entry = this.resources.get(resourceId)
    if (entry) {
      entry.metadata.lastUsed = Date.now()
    }
  }

  getResourceStats() {
    const stats = {
      total: this.resources.size,
      byType: {
        geometry: 0,
        material: 0,
        texture: 0,
        object3d: 0
      },
      disposed: 0,
      totalSize: 0
    }

    for (const [, entry] of Array.from(this.resources.entries())) {
      const { metadata } = entry
      ;(stats.byType as any)[metadata.type]++
      stats.totalSize += metadata.size
      if (metadata.disposed) {
        stats.disposed++
      }
    }

    return stats
  }
}

// Singleton instance
export const resourceManager = new ResourceManager()