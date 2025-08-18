import { LODManager } from '../LODManager'
import { LODLevel, PerformanceLevel } from '../../../types/performance'
import { BufferGeometry, Material } from 'three'

// Mock Three.js objects
jest.mock('three', () => ({
  BufferGeometry: jest.fn().mockImplementation(() => ({
    clone: jest.fn().mockReturnThis(),
    setAttribute: jest.fn(),
    computeVertexNormals: jest.fn(),
    setIndex: jest.fn(),
    getAttribute: jest.fn().mockReturnValue({
      count: 100,
      getX: jest.fn().mockReturnValue(1),
      getY: jest.fn().mockReturnValue(2),
      getZ: jest.fn().mockReturnValue(3)
    }),
    index: { count: 300 }
  })),
  Material: jest.fn().mockImplementation(() => ({
    clone: jest.fn().mockReturnThis()
  })),
  BufferAttribute: jest.fn()
}))

describe('LODManager', () => {
  let lodManager: LODManager
  let mockLODLevels: LODLevel[]

  beforeEach(() => {
    lodManager = new LODManager()
    
    // Mock LOD levels
    mockLODLevels = [
      {
        distance: 10,
        geometry: new BufferGeometry(),
        material: new Material(),
        triangleCount: 1000,
        quality: 1.0
      },
      {
        distance: 25,
        geometry: new BufferGeometry(),
        material: new Material(),
        triangleCount: 500,
        quality: 0.75
      },
      {
        distance: 50,
        geometry: new BufferGeometry(),
        material: new Material(),
        triangleCount: 250,
        quality: 0.5
      },
      {
        distance: 100,
        geometry: new BufferGeometry(),
        material: new Material(),
        triangleCount: 100,
        quality: 0.25
      }
    ]
  })

  afterEach(() => {
    lodManager.clearLODConfigurations()
  })

  describe('defineLODLevels', () => {
    it('should define LOD levels for an asset', () => {
      const assetId = 'test-asset'
      
      lodManager.defineLODLevels(assetId, mockLODLevels)
      
      const config = lodManager.getAssetLODConfig(assetId)
      expect(config).toBeDefined()
      expect(config!.levels).toHaveLength(4)
      expect(config!.levels[0].distance).toBe(10)
      expect(config!.levels[3].distance).toBe(100)
    })

    it('should sort LOD levels by distance', () => {
      const assetId = 'test-asset'
      const unsortedLevels = [...mockLODLevels].reverse()
      
      lodManager.defineLODLevels(assetId, unsortedLevels)
      
      const config = lodManager.getAssetLODConfig(assetId)
      expect(config!.levels[0].distance).toBe(10)
      expect(config!.levels[1].distance).toBe(25)
      expect(config!.levels[2].distance).toBe(50)
      expect(config!.levels[3].distance).toBe(100)
    })

    it('should set the first LOD level as active', () => {
      const assetId = 'test-asset'
      
      lodManager.defineLODLevels(assetId, mockLODLevels)
      
      const activeLOD = lodManager.getActiveLOD(assetId)
      expect(activeLOD).toBeDefined()
      expect(activeLOD!.distance).toBe(10)
      expect(activeLOD!.quality).toBe(1.0)
    })
  })

  describe('selectLODForAsset', () => {
    beforeEach(() => {
      lodManager.defineLODLevels('test-asset', mockLODLevels)
    })

    it('should select highest quality LOD for close distance', () => {
      const selectedLOD = lodManager.selectLODForAsset('test-asset', 5, 'high')
      
      expect(selectedLOD).toBeDefined()
      expect(selectedLOD!.distance).toBe(10)
      expect(selectedLOD!.quality).toBe(1.0)
    })

    it('should select appropriate LOD for medium distance', () => {
      const selectedLOD = lodManager.selectLODForAsset('test-asset', 30, 'high')
      
      expect(selectedLOD).toBeDefined()
      expect(selectedLOD!.distance).toBe(50)
      expect(selectedLOD!.quality).toBe(0.5)
    })

    it('should select lowest quality LOD for far distance', () => {
      const selectedLOD = lodManager.selectLODForAsset('test-asset', 150, 'high')
      
      expect(selectedLOD).toBeDefined()
      expect(selectedLOD!.distance).toBe(100)
      expect(selectedLOD!.quality).toBe(0.25)
    })

    it('should adjust distance based on performance level', () => {
      // Low performance should select lower quality LOD earlier
      const lowPerfLOD = lodManager.selectLODForAsset('test-asset', 20, 'low')
      const highPerfLOD = lodManager.selectLODForAsset('test-asset', 20, 'high')
      
      expect(lowPerfLOD!.quality).toBeLessThan(highPerfLOD!.quality)
    })

    it('should return null for non-existent asset', () => {
      const selectedLOD = lodManager.selectLODForAsset('non-existent', 10, 'high')
      
      expect(selectedLOD).toBeNull()
    })
  })

  describe('transitionAssetLOD', () => {
    beforeEach(() => {
      lodManager.defineLODLevels('test-asset', mockLODLevels)
    })

    it('should transition to new LOD level', async () => {
      const targetLOD = mockLODLevels[2] // 50 distance, 0.5 quality
      
      await lodManager.transitionAssetLOD('test-asset', targetLOD)
      
      const activeLOD = lodManager.getActiveLOD('test-asset')
      expect(activeLOD).toBeDefined()
      expect(activeLOD!.distance).toBe(50)
      expect(activeLOD!.quality).toBe(0.5)
    })

    it('should not transition if already at target LOD', async () => {
      const currentLOD = lodManager.getActiveLOD('test-asset')
      const targetLOD = mockLODLevels[0] // Same as current
      
      await lodManager.transitionAssetLOD('test-asset', targetLOD)
      
      const activeLOD = lodManager.getActiveLOD('test-asset')
      expect(activeLOD).toEqual(currentLOD)
    })
  })

  describe('LOD configuration', () => {
    it('should set and get LOD configuration', () => {
      const config = {
        levels: mockLODLevels,
        transitionDistance: 10.0,
        hysteresis: 5.0
      }
      
      lodManager.setLODConfig(config)
      
      const retrievedConfig = lodManager.getLODConfig()
      expect(retrievedConfig.transitionDistance).toBe(10.0)
      expect(retrievedConfig.hysteresis).toBe(5.0)
    })
  })

  describe('LOD statistics', () => {
    it('should return correct statistics', () => {
      lodManager.defineLODLevels('asset1', mockLODLevels)
      lodManager.defineLODLevels('asset2', mockLODLevels.slice(0, 2))
      
      const stats = lodManager.getLODStats()
      
      expect(stats.totalAssets).toBe(2)
      expect(stats.activeLODs).toBe(2)
      expect(stats.activeTransitions).toBe(0)
      expect(stats.averageTriangles).toBeGreaterThan(0)
    })

    it('should calculate average triangles correctly', () => {
      lodManager.defineLODLevels('asset1', [mockLODLevels[0]]) // 1000 triangles
      lodManager.defineLODLevels('asset2', [mockLODLevels[1]]) // 500 triangles
      
      const stats = lodManager.getLODStats()
      
      expect(stats.averageTriangles).toBe(750) // (1000 + 500) / 2
    })
  })

  describe('clearLODConfigurations', () => {
    it('should clear all LOD configurations', () => {
      lodManager.defineLODLevels('asset1', mockLODLevels)
      lodManager.defineLODLevels('asset2', mockLODLevels)
      
      lodManager.clearLODConfigurations()
      
      const stats = lodManager.getLODStats()
      expect(stats.totalAssets).toBe(0)
      expect(stats.activeLODs).toBe(0)
    })
  })

  describe('performance multiplier', () => {
    beforeEach(() => {
      lodManager.defineLODLevels('test-asset', mockLODLevels)
    })

    it('should apply correct multiplier for low performance', () => {
      const lowPerfLOD = lodManager.selectLODForAsset('test-asset', 20, 'low')
      const highPerfLOD = lodManager.selectLODForAsset('test-asset', 20, 'high')
      
      // Low performance should select lower quality earlier
      expect(lowPerfLOD!.quality).toBeLessThanOrEqual(highPerfLOD!.quality)
    })

    it('should apply correct multiplier for medium performance', () => {
      const mediumPerfLOD = lodManager.selectLODForAsset('test-asset', 20, 'medium')
      const highPerfLOD = lodManager.selectLODForAsset('test-asset', 20, 'high')
      
      // Medium performance should be between low and high
      expect(mediumPerfLOD!.quality).toBeLessThanOrEqual(highPerfLOD!.quality)
    })
  })
})