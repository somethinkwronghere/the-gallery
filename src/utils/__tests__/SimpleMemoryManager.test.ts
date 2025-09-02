import { SimpleMemoryManager, simpleMemoryManager } from '../SimpleMemoryManager'
import { BufferGeometry, Material, Texture } from 'three'

// Mock the memory system dependencies
const mockResourceManager = {
  startMonitoring: jest.fn(),
  trackResource: jest.fn(() => 'mock-resource-id'),
  disposeResource: jest.fn(() => true),
  disposeUnusedResources: jest.fn(() => 5),
  emergencyCleanup: jest.fn(() => 10),
  getMemoryUsage: jest.fn(() => ({
    total: 250,
    textures: 100,
    geometries: 50,
    jsHeap: 100,
    jsHeapLimit: 1000
  })),
  getMemoryWarnings: jest.fn(() => []),
  getResourceStats: jest.fn(() => ({ total: 25 })),
  setCleanupConfig: jest.fn(),
  stopMonitoring: jest.fn()
}

const mockGarbageCollector = {
  forceGC: jest.fn(() => true),
  isMemoryPressure: jest.fn(() => false),
  getSuggestedCleanupActions: jest.fn(() => ['Test suggestion'])
}

const mockMemoryLeakDetector = {
  startMonitoring: jest.fn(),
  stopMonitoring: jest.fn()
}

jest.mock('../../systems/memory/ResourceManager', () => ({
  resourceManager: mockResourceManager
}))

jest.mock('../../systems/memory/GarbageCollector', () => ({
  garbageCollector: mockGarbageCollector
}))

jest.mock('../../systems/memory/MemoryLeakDetector', () => ({
  memoryLeakDetector: mockMemoryLeakDetector
}))

describe('SimpleMemoryManager', () => {
  let manager: SimpleMemoryManager

  beforeEach(() => {
    manager = new SimpleMemoryManager()
    jest.clearAllMocks()
  })

  afterEach(() => {
    manager.dispose()
  })

  describe('Resource Tracking', () => {
    it('should track resources', () => {
      const geometry = new BufferGeometry()
      const resourceId = manager.trackResource(geometry)
      
      expect(resourceId).toBe('mock-resource-id')
    })

    it('should track resources with component ID', () => {
      const material = {} as Material
      const componentId = 'test-component'
      
      const resourceId = manager.trackResource(material, componentId)
      
      expect(resourceId).toBe('mock-resource-id')
    })
  })

  describe('Component Cleanup', () => {
    it('should register component cleanup', () => {
      const componentId = 'test-component'
      const cleanupFn = jest.fn()
      
      manager.registerComponentCleanup(componentId, cleanupFn)
      manager.cleanupComponent(componentId)
      
      expect(cleanupFn).toHaveBeenCalled()
    })

    it('should handle cleanup errors gracefully', () => {
      const componentId = 'test-component'
      const cleanupFn = jest.fn(() => {
        throw new Error('Cleanup error')
      })
      
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      manager.registerComponentCleanup(componentId, cleanupFn)
      manager.cleanupComponent(componentId)
      
      expect(cleanupFn).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in component cleanup'),
        expect.any(Error)
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('Memory Statistics', () => {
    it('should get memory statistics', () => {
      const stats = manager.getMemoryStats()
      
      expect(stats).toEqual({
        totalMemoryMB: 250,
        textureMemoryMB: 100,
        geometryMemoryMB: 50,
        jsHeapMB: 100,
        resourceCount: 25,
        isMemoryPressure: false
      })
    })

    it('should get memory warnings', () => {
      const warnings = manager.getMemoryWarnings()
      
      expect(warnings).toEqual([
        {
          level: 'low',
          message: 'Memory optimization suggestions available',
          recommendations: ['Test suggestion']
        }
      ])
    })
  })

  describe('Cleanup Operations', () => {
    it('should perform regular cleanup', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation()
      
      manager.performCleanup()
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Cleanup completed')
      )
      
      consoleSpy.mockRestore()
    })

    it('should perform emergency cleanup', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      
      manager.performEmergencyCleanup()
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Emergency cleanup')
      )
      
      consoleSpy.mockRestore()
    })
  })

  describe('Configuration', () => {
    it('should update configuration', () => {
      const newConfig = {
        autoCleanupEnabled: false,
        memoryThresholdMB: 500
      }
      
      manager.updateConfig(newConfig)
      
      const config = manager.getConfig()
      expect(config.autoCleanupEnabled).toBe(false)
      expect(config.memoryThresholdMB).toBe(500)
    })
  })

  describe('Singleton Instance', () => {
    it('should provide singleton instance', () => {
      expect(simpleMemoryManager).toBeInstanceOf(SimpleMemoryManager)
    })
  })
})