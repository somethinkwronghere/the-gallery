import { DisposableResource, ResourcePool as IResourcePool } from '../../types/memory'

export class ResourcePool<T extends DisposableResource> implements IResourcePool<T> {
  private available: T[] = []
  private inUse: Set<T> = new Set()
  private createResource: () => T
  private resetResource?: (resource: T) => void
  private maxPoolSize: number
  private name: string

  constructor(
    createResource: () => T,
    options: {
      maxPoolSize?: number
      resetResource?: (resource: T) => void
      name?: string
    } = {}
  ) {
    this.createResource = createResource
    this.resetResource = options.resetResource
    this.maxPoolSize = options.maxPoolSize || 50
    this.name = options.name || 'ResourcePool'
  }

  acquire(): T {
    let resource: T

    if (this.available.length > 0) {
      resource = this.available.pop()!
      console.debug(`[${this.name}] Acquired resource from pool (${this.available.length} remaining)`)
    } else {
      resource = this.createResource()
      console.debug(`[${this.name}] Created new resource (pool empty)`)
    }

    this.inUse.add(resource)
    return resource
  }

  release(resource: T): void {
    if (!this.inUse.has(resource)) {
      console.warn(`[${this.name}] Attempted to release resource not in use`)
      return
    }

    this.inUse.delete(resource)

    // Reset resource if reset function provided
    if (this.resetResource) {
      try {
        this.resetResource(resource)
      } catch (error) {
        console.error(`[${this.name}] Error resetting resource:`, error)
        // Dispose the resource instead of returning it to pool
        if ('dispose' in resource && typeof resource.dispose === 'function') {
          resource.dispose()
        }
        return
      }
    }

    // Return to pool if under max size
    if (this.available.length < this.maxPoolSize) {
      this.available.push(resource)
      console.debug(`[${this.name}] Returned resource to pool (${this.available.length} available)`)
    } else {
      // Pool is full, dispose the resource
      if ('dispose' in resource && typeof resource.dispose === 'function') {
        resource.dispose()
      }
      console.debug(`[${this.name}] Pool full, disposed resource`)
    }
  }

  clear(): void {
    // Dispose all available resources
    this.available.forEach(resource => {
      if ('dispose' in resource && typeof resource.dispose === 'function') {
        resource.dispose()
      }
    })
    this.available = []

    // Note: We don't dispose in-use resources as they're still being used
    console.info(`[${this.name}] Pool cleared (${this.inUse.size} resources still in use)`)
  }

  getStats() {
    return {
      total: this.available.length + this.inUse.size,
      available: this.available.length,
      inUse: this.inUse.size
    }
  }

  // Preload resources into the pool
  preload(count: number): void {
    const toCreate = Math.min(count, this.maxPoolSize - this.available.length)
    
    for (let i = 0; i < toCreate; i++) {
      try {
        const resource = this.createResource()
        this.available.push(resource)
      } catch (error) {
        console.error(`[${this.name}] Error preloading resource:`, error)
        break
      }
    }

    console.info(`[${this.name}] Preloaded ${toCreate} resources`)
  }

  // Trim pool to target size
  trim(targetSize: number = Math.floor(this.maxPoolSize / 2)): number {
    const toRemove = Math.max(0, this.available.length - targetSize)
    let removed = 0

    for (let i = 0; i < toRemove; i++) {
      const resource = this.available.pop()
      if (resource) {
        if ('dispose' in resource && typeof resource.dispose === 'function') {
          resource.dispose()
        }
        removed++
      }
    }

    if (removed > 0) {
      console.info(`[${this.name}] Trimmed ${removed} resources from pool`)
    }

    return removed
  }

  // Get detailed statistics
  getDetailedStats() {
    return {
      ...this.getStats(),
      maxPoolSize: this.maxPoolSize,
      utilizationRate: this.inUse.size / (this.available.length + this.inUse.size),
      poolEfficiency: this.available.length / this.maxPoolSize
    }
  }
}

// Specialized pools for common Three.js resources
import { BufferGeometry, Material, Texture } from 'three'

// Geometry pool factory
export function createGeometryPool<T extends BufferGeometry>(
  createGeometry: () => T,
  maxSize = 20
): ResourcePool<T> {
  return new ResourcePool(createGeometry, {
    maxPoolSize: maxSize,
    resetResource: (geometry) => {
      // Clear any custom attributes or user data
      geometry.userData = {}
      // Reset any transforms if applicable
      if ('resetTransform' in geometry && typeof geometry.resetTransform === 'function') {
        (geometry as any).resetTransform()
      }
    },
    name: 'GeometryPool'
  })
}

// Material pool factory
export function createMaterialPool<T extends Material>(
  createMaterial: () => T,
  maxSize = 10
): ResourcePool<T> {
  return new ResourcePool(createMaterial, {
    maxPoolSize: maxSize,
    resetResource: (material) => {
      // Reset material properties to defaults
      material.userData = {}
      material.opacity = 1
      material.transparent = false
      material.visible = true
      // Reset any custom uniforms if it's a shader material
      if ('uniforms' in material && material.uniforms) {
        // Reset uniforms to default values would go here
      }
    },
    name: 'MaterialPool'
  })
}

// Texture pool factory (less common but useful for procedural textures)
export function createTexturePool<T extends Texture>(
  createTexture: () => T,
  maxSize = 5
): ResourcePool<T> {
  return new ResourcePool(createTexture, {
    maxPoolSize: maxSize,
    resetResource: (texture) => {
      // Reset texture properties
      texture.userData = {}
      texture.offset.set(0, 0)
      texture.repeat.set(1, 1)
      texture.rotation = 0
      texture.center.set(0, 0)
    },
    name: 'TexturePool'
  })
}