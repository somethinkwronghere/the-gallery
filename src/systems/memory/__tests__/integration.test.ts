/**
 * Integration test for memory management system
 * This test verifies that the system works with real Three.js objects
 */

import { resourceManager } from '../ResourceManager'
import { BoxGeometry, MeshBasicMaterial, TextureLoader, CanvasTexture } from 'three'

describe('Memory Management Integration', () => {
  beforeEach(() => {
    // Reset resource manager
    resourceManager.dispose()
  })

  afterEach(() => {
    resourceManager.dispose()
  })

  test('should track and dispose real Three.js geometry', () => {
    const geometry = new BoxGeometry(1, 1, 1)
    const resourceId = resourceManager.trackResource(geometry)
    
    expect(resourceId).toBeDefined()
    
    const stats = resourceManager.getResourceStats()
    expect(stats.total).toBe(1)
    expect(stats.byType.geometry).toBe(1)
    
    // Dispose the resource
    const disposed = resourceManager.disposeResource(resourceId)
    expect(disposed).toBe(true)
    
    const statsAfter = resourceManager.getResourceStats()
    expect(statsAfter.total).toBe(0)
  })

  test('should track and dispose real Three.js material', () => {
    const material = new MeshBasicMaterial({ color: 0xff0000 })
    const resourceId = resourceManager.trackResource(material)
    
    expect(resourceId).toBeDefined()
    
    const stats = resourceManager.getResourceStats()
    expect(stats.total).toBe(1)
    expect(stats.byType.material).toBe(1)
    
    // Dispose the resource
    const disposed = resourceManager.disposeResource(resourceId)
    expect(disposed).toBe(true)
  })

  test('should track and dispose real Three.js texture', () => {
    // Create a simple canvas texture
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ff0000'
    ctx.fillRect(0, 0, 64, 64)
    
    const texture = new CanvasTexture(canvas)
    const resourceId = resourceManager.trackResource(texture)
    
    expect(resourceId).toBeDefined()
    
    const stats = resourceManager.getResourceStats()
    expect(stats.total).toBe(1)
    expect(stats.byType.texture).toBe(1)
    
    // Dispose the resource
    const disposed = resourceManager.disposeResource(resourceId)
    expect(disposed).toBe(true)
  })

  test('should calculate memory usage with real objects', () => {
    const geometry = new BoxGeometry(2, 2, 2) // Larger geometry
    const material = new MeshBasicMaterial({ color: 0x00ff00 })
    
    // Create a larger canvas texture
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#00ff00'
    ctx.fillRect(0, 0, 256, 256)
    const texture = new CanvasTexture(canvas)
    
    const geometryId = resourceManager.trackResource(geometry)
    const materialId = resourceManager.trackResource(material)
    const textureId = resourceManager.trackResource(texture)
    
    const usage = resourceManager.getMemoryUsage()
    
    // With real objects, we should have some memory usage
    expect(usage.total).toBeGreaterThan(0)
    
    // Clean up
    resourceManager.disposeResource(geometryId)
    resourceManager.disposeResource(materialId)
    resourceManager.disposeResource(textureId)
  })

  test('should detect memory leaks with old resources', async () => {
    const geometry = new BoxGeometry(1, 1, 1)
    const resourceId = resourceManager.trackResource(geometry)
    
    // Manually set the resource as old and unused
    const resources = (resourceManager as any).resources
    const entry = resources.get(resourceId)
    if (entry) {
      entry.metadata.createdAt = Date.now() - 15 * 60 * 1000 // 15 minutes ago
      entry.metadata.lastUsed = Date.now() - 15 * 60 * 1000
    }
    
    const leaks = resourceManager.checkMemoryLeaks()
    expect(leaks.length).toBeGreaterThan(0)
    expect(leaks[0].suspected).toBe(true)
    expect(leaks[0].resourceId).toBe(resourceId)
    
    // Clean up
    resourceManager.disposeResource(resourceId)
  })

  test('should automatically clean up unused resources', () => {
    const geometry1 = new BoxGeometry(1, 1, 1)
    const geometry2 = new BoxGeometry(1, 1, 1)
    
    const id1 = resourceManager.trackResource(geometry1)
    const id2 = resourceManager.trackResource(geometry2)
    
    // Make one resource old
    const resources = (resourceManager as any).resources
    const entry1 = resources.get(id1)
    if (entry1) {
      entry1.metadata.lastUsed = Date.now() - 10000 // 10 seconds ago
    }
    
    const disposedCount = resourceManager.disposeUnusedResources(5000) // 5 second threshold
    expect(disposedCount).toBe(1)
    
    const stats = resourceManager.getResourceStats()
    expect(stats.total).toBe(1)
    
    // Clean up remaining
    resourceManager.disposeResource(id2)
  })

  test('should handle emergency cleanup', () => {
    // Create multiple resources
    const resources = []
    for (let i = 0; i < 10; i++) {
      const geometry = new BoxGeometry(1, 1, 1)
      resources.push(resourceManager.trackResource(geometry))
    }
    
    expect(resourceManager.getResourceStats().total).toBe(10)
    
    const disposedCount = resourceManager.emergencyCleanup()
    expect(disposedCount).toBeGreaterThan(0)
    
    const statsAfter = resourceManager.getResourceStats()
    expect(statsAfter.total).toBeLessThan(10)
  })
})