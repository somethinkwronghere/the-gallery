import { ResourceManager } from '../ResourceManager'
import { BufferGeometry, Material, Texture } from 'three'

// Mock Three.js objects
class MockBufferGeometry {
  attributes = {
    position: { array: new Float32Array(300) }, // 300 * 4 = 1200 bytes
    normal: { array: new Float32Array(300) }    // 300 * 4 = 1200 bytes
  }
  index = { array: new Uint16Array(150) }       // 150 * 2 = 300 bytes
  
  dispose() {
    // Mock dispose
  }
}

class MockMaterial {
  map = null // Could have textures
  
  dispose() {
    // Mock dispose
  }
}

class MockTexture {
  image = { width: 512, height: 512 } // 512 * 512 * 4 = 1MB
  
  dispose() {
    // Mock dispose
  }
}

describe('ResourceManager', () => {
  let resourceManager: ResourceManager

  beforeEach(() => {
    resourceManager = new ResourceManager()
  })

  afterEach(() => {
    resourceManager.dispose()
  })

  describe('Resource Tracking', () => {
    test('should track a geometry resource', () => {
      const geometry = new MockBufferGeometry() as any
      const resourceId = resourceManager.trackResource(geometry)
      
      expect(resourceId).toBeDefined()
      expect(typeof resourceId).toBe('string')
      
      const stats = resourceManager.getResourceStats()
      expect(stats.total).toBe(1)
      expect(stats.byType.geometry).toBe(1)
    })

    test('should track a material resource', () => {
      const material = new MockMaterial() as any
      const resourceId = resourceManager.trackResource(material)
      
      expect(resourceId).toBeDefined()
      
      const stats = resourceManager.getResourceStats()
      expect(stats.total).toBe(1)
      expect(stats.byType.material).toBe(1)
    })

    test('should track a texture resource', () => {
      const texture = new MockTexture() as any
      const resourceId = resourceManager.trackResource(texture)
      
      expect(resourceId).toBeDefined()
      
      const stats = resourceManager.getResourceStats()
      expect(stats.total).toBe(1)
      expect(stats.byType.texture).toBe(1)
    })
  })

  describe('Resource Disposal', () => {
    test('should dispose a tracked resource', () => {
      const geometry = new MockBufferGeometry() as any
      const resourceId = resourceManager.trackResource(geometry)
      
      const disposed = resourceManager.disposeResource(resourceId)
      expect(disposed).toBe(true)
      
      const stats = resourceManager.getResourceStats()
      expect(stats.total).toBe(0)
    })

    test('should not dispose an already disposed resource', () => {
      const geometry = new MockBufferGeometry() as any
      const resourceId = resourceManager.trackResource(geometry)
      
      resourceManager.disposeResource(resourceId)
      const secondDisposal = resourceManager.disposeResource(resourceId)
      
      expect(secondDisposal).toBe(false)
    })

    test('should dispose unused resources based on age', () => {
      const geometry1 = new MockBufferGeometry() as any
      const geometry2 = new MockBufferGeometry() as any
      
      const id1 = resourceManager.trackResource(geometry1)
      const id2 = resourceManager.trackResource(geometry2)
      
      // Simulate old resource by manually setting lastUsed
      const resources = (resourceManager as any).resources
      const entry1 = resources.get(id1)
      if (entry1) {
        entry1.metadata.lastUsed = Date.now() - 10000 // 10 seconds ago
      }
      
      const disposedCount = resourceManager.disposeUnusedResources(5000) // 5 second threshold
      expect(disposedCount).toBe(1)
      
      const stats = resourceManager.getResourceStats()
      expect(stats.total).toBe(1)
    })
  })

  describe('Memory Usage', () => {
    test('should calculate memory usage correctly', () => {
      const geometry = new MockBufferGeometry() as any
      const material = new MockMaterial() as any
      const texture = new MockTexture() as any
      
      const geometryId = resourceManager.trackResource(geometry)
      const materialId = resourceManager.trackResource(material)
      const textureId = resourceManager.trackResource(texture)
      
      // Check usage before disposal
      const usage = resourceManager.getMemoryUsage()
      
      expect(usage.geometries).toBeGreaterThan(0)
      expect(usage.materials).toBeGreaterThan(0)
      expect(usage.textures).toBeGreaterThan(0)
      expect(usage.total).toBeGreaterThan(0)
      
      // Clean up manually for this test
      resourceManager.disposeResource(geometryId)
      resourceManager.disposeResource(materialId)
      resourceManager.disposeResource(textureId)
    })
  })

  describe('Memory Leak Detection', () => {
    test('should detect potential memory leaks', () => {
      // Create several old resources
      for (let i = 0; i < 5; i++) {
        const geometry = new MockBufferGeometry() as any
        const id = resourceManager.trackResource(geometry)
        
        // Make them appear old and unused
        const resources = (resourceManager as any).resources
        const entry = resources.get(id)
        if (entry) {
          entry.metadata.createdAt = Date.now() - 15 * 60 * 1000 // 15 minutes ago
          entry.metadata.lastUsed = Date.now() - 15 * 60 * 1000
        }
      }
      
      const leaks = resourceManager.checkMemoryLeaks()
      expect(leaks.length).toBeGreaterThan(0)
      expect(leaks[0].suspected).toBe(true)
    })
  })

  describe('Configuration', () => {
    test('should update cleanup configuration', () => {
      const newConfig = {
        maxAge: 60000,
        memoryThreshold: 1024,
        enableAutoCleanup: false
      }
      
      resourceManager.setCleanupConfig(newConfig)
      const config = resourceManager.getCleanupConfig()
      
      expect(config.maxAge).toBe(60000)
      expect(config.memoryThreshold).toBe(1024)
      expect(config.enableAutoCleanup).toBe(false)
    })
  })
})