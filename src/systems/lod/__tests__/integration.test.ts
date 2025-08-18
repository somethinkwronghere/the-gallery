import { LODManager } from '../LODManager'
import { LODHelper } from '../LODHelper'
import { LODLevel, PerformanceLevel } from '../../../types/performance'
import { Mesh, BufferGeometry, Material, Vector3 } from 'three'

// Mock Three.js
jest.mock('three', () => ({
  Mesh: jest.fn().mockImplementation((geometry, material) => ({
    geometry,
    material,
    getWorldPosition: jest.fn().mockImplementation((target) => {
      target.set(0, 0, 0)
      return target
    }),
    dispose: jest.fn()
  })),
  BufferGeometry: jest.fn().mockImplementation(() => ({
    clone: jest.fn().mockReturnThis(),
    setAttribute: jest.fn(),
    computeVertexNormals: jest.fn(),
    setIndex: jest.fn(),
    getAttribute: jest.fn().mockReturnValue({
      count: 300,
      getX: jest.fn().mockReturnValue(1),
      getY: jest.fn().mockReturnValue(2),
      getZ: jest.fn().mockReturnValue(3)
    }),
    index: { count: 900 },
    dispose: jest.fn()
  })),
  Material: jest.fn().mockImplementation(() => ({
    clone: jest.fn().mockReturnThis(),
    dispose: jest.fn()
  })),
  Vector3: jest.fn().mockImplementation((x = 0, y = 0, z = 0) => ({
    x, y, z,
    set: jest.fn().mockReturnThis(),
    distanceTo: jest.fn().mockReturnValue(10)
  })),
  Object3D: jest.fn().mockImplementation(() => ({
    getWorldPosition: jest.fn().mockImplementation((target) => {
      target.set(0, 0, 0)
      return target
    })
  })),
  LOD: jest.fn().mockImplementation(() => ({
    addLevel: jest.fn()
  })),
  BufferAttribute: jest.fn()
}))

describe('LOD System Integration', () => {
  let lodManager: LODManager
  let testMesh: Mesh

  beforeEach(() => {
    lodManager = new LODManager()
    testMesh = new Mesh(new BufferGeometry(), new Material())
  })

  afterEach(() => {
    lodManager.clearLODConfigurations()
  })

  describe('Complete LOD workflow', () => {
    it('should handle complete LOD lifecycle', async () => {
      const assetId = 'test-model'
      
      // 1. Generate LOD levels using helper
      const lodLevels = LODHelper.generateLODLevels(testMesh, [10, 25, 50, 100])
      expect(lodLevels).toHaveLength(4)
      
      // 2. Define LOD levels in manager
      lodManager.defineLODLevels(assetId, lodLevels)
      
      // 3. Verify configuration
      const config = lodManager.getAssetLODConfig(assetId)
      expect(config).toBeDefined()
      expect(config!.levels).toHaveLength(4)
      
      // 4. Select appropriate LOD for different distances
      const closeLOD = lodManager.selectLODForAsset(assetId, 5, 'high')
      const farLOD = lodManager.selectLODForAsset(assetId, 150, 'high')
      
      expect(closeLOD!.quality).toBeGreaterThan(farLOD!.quality)
      
      // 5. Transition between LOD levels
      await lodManager.transitionAssetLOD(assetId, farLOD!)
      
      const activeLOD = lodManager.getActiveLOD(assetId)
      expect(activeLOD).toEqual(farLOD)
    })

    it('should handle multiple assets with different LOD configurations', () => {
      const asset1 = 'high-detail-model'
      const asset2 = 'simple-model'
      
      // Different LOD configurations for different asset types
      const highDetailLevels = LODHelper.generateLODLevels(testMesh, [5, 15, 30, 60])
      const simpleLevels = LODHelper.generateLODLevels(testMesh, [20, 50, 100])
      
      lodManager.defineLODLevels(asset1, highDetailLevels)
      lodManager.defineLODLevels(asset2, simpleLevels)
      
      // Verify different configurations
      const config1 = lodManager.getAssetLODConfig(asset1)
      const config2 = lodManager.getAssetLODConfig(asset2)
      
      expect(config1!.levels).toHaveLength(4)
      expect(config2!.levels).toHaveLength(3)
      expect(config1!.levels[0].distance).toBe(5)
      expect(config2!.levels[0].distance).toBe(20)
    })

    it('should handle performance-based LOD selection', () => {
      const assetId = 'performance-test-model'
      const lodLevels = LODHelper.generateLODLevels(testMesh, [10, 25, 50, 100])
      
      lodManager.defineLODLevels(assetId, lodLevels)
      
      const distance = 20
      const lowPerfLOD = lodManager.selectLODForAsset(assetId, distance, 'low')
      const mediumPerfLOD = lodManager.selectLODForAsset(assetId, distance, 'medium')
      const highPerfLOD = lodManager.selectLODForAsset(assetId, distance, 'high')
      
      // Lower performance should select lower quality LOD
      expect(lowPerfLOD!.quality).toBeLessThanOrEqual(mediumPerfLOD!.quality)
      expect(mediumPerfLOD!.quality).toBeLessThanOrEqual(highPerfLOD!.quality)
    })
  })

  describe('LOD Helper and Manager integration', () => {
    it('should create Three.js LOD object and integrate with manager', () => {
      const assetId = 'three-lod-test'
      const lodLevels = LODHelper.generateLODLevels(testMesh)
      
      // Create Three.js LOD object
      const threeLOD = LODHelper.createThreeLOD(lodLevels)
      expect(threeLOD.addLevel).toHaveBeenCalledTimes(4)
      
      // Define in manager
      lodManager.defineLODLevels(assetId, lodLevels)
      
      // Verify integration
      const selectedLOD = lodManager.selectLODForAsset(assetId, 30, 'high')
      expect(selectedLOD).toBeDefined()
      expect(selectedLOD!.distance).toBe(50)
    })

    it('should handle mesh updates with LOD transitions', async () => {
      const assetId = 'mesh-update-test'
      const lodLevels = LODHelper.generateLODLevels(testMesh)
      
      lodManager.defineLODLevels(assetId, lodLevels)
      
      // Get different LOD levels
      const highQualityLOD = lodLevels[0]
      const lowQualityLOD = lodLevels[3]
      
      // Update mesh to high quality
      LODHelper.updateMeshLOD(testMesh, highQualityLOD)
      expect(testMesh.geometry).toBe(highQualityLOD.geometry)
      expect(testMesh.material).toBe(highQualityLOD.material)
      
      // Transition to low quality
      await lodManager.transitionAssetLOD(assetId, lowQualityLOD)
      LODHelper.updateMeshLOD(testMesh, lowQualityLOD)
      
      expect(testMesh.geometry).toBe(lowQualityLOD.geometry)
      expect(testMesh.material).toBe(lowQualityLOD.material)
    })
  })

  describe('Distance calculation and LOD selection', () => {
    it('should select appropriate LOD based on calculated distance', () => {
      const assetId = 'distance-test'
      const lodLevels = LODHelper.generateLODLevels(testMesh, [10, 25, 50, 100])
      
      lodManager.defineLODLevels(assetId, lodLevels)
      
      // Mock different camera positions
      const cameraPositions = [
        new Vector3(5, 0, 0),   // Close - should select high quality
        new Vector3(30, 0, 0),  // Medium - should select medium quality
        new Vector3(80, 0, 0),  // Far - should select low quality
        new Vector3(150, 0, 0)  // Very far - should select lowest quality
      ]
      
      const expectedQualities = [1.0, 0.5, 0.25, 0.25]
      
      cameraPositions.forEach((cameraPos, index) => {
        // Mock distance calculation
        const mockDistance = cameraPos.x
        const selectedLOD = lodManager.selectLODForAsset(assetId, mockDistance, 'high')
        
        expect(selectedLOD!.quality).toBe(expectedQualities[index])
      })
    })
  })

  describe('Error handling and edge cases', () => {
    it('should handle empty LOD levels gracefully', () => {
      const assetId = 'empty-lod-test'
      
      lodManager.defineLODLevels(assetId, [])
      
      const selectedLOD = lodManager.selectLODForAsset(assetId, 10, 'high')
      expect(selectedLOD).toBeNull()
    })

    it('should handle non-existent assets gracefully', () => {
      const selectedLOD = lodManager.selectLODForAsset('non-existent', 10, 'high')
      expect(selectedLOD).toBeNull()
      
      const config = lodManager.getAssetLODConfig('non-existent')
      expect(config).toBeNull()
      
      const activeLOD = lodManager.getActiveLOD('non-existent')
      expect(activeLOD).toBeNull()
    })

    it('should handle concurrent transitions gracefully', async () => {
      const assetId = 'concurrent-test'
      const lodLevels = LODHelper.generateLODLevels(testMesh)
      
      lodManager.defineLODLevels(assetId, lodLevels)
      
      const targetLOD1 = lodLevels[1]
      const targetLOD2 = lodLevels[2]
      
      // Start concurrent transitions
      const transition1 = lodManager.transitionAssetLOD(assetId, targetLOD1)
      const transition2 = lodManager.transitionAssetLOD(assetId, targetLOD2)
      
      // Both should complete without error
      await Promise.all([transition1, transition2])
      
      // Final state should be consistent
      const activeLOD = lodManager.getActiveLOD(assetId)
      expect(activeLOD).toBeDefined()
    })
  })

  describe('Performance and memory management', () => {
    it('should provide accurate statistics', () => {
      const assets = ['asset1', 'asset2', 'asset3']
      
      assets.forEach(assetId => {
        const lodLevels = LODHelper.generateLODLevels(testMesh)
        lodManager.defineLODLevels(assetId, lodLevels)
      })
      
      const stats = lodManager.getLODStats()
      
      expect(stats.totalAssets).toBe(3)
      expect(stats.activeLODs).toBe(3)
      expect(stats.activeTransitions).toBe(0)
      expect(stats.averageTriangles).toBeGreaterThan(0)
    })

    it('should clear all configurations properly', () => {
      // Setup multiple assets
      for (let i = 0; i < 5; i++) {
        const assetId = `asset-${i}`
        const lodLevels = LODHelper.generateLODLevels(testMesh)
        lodManager.defineLODLevels(assetId, lodLevels)
      }
      
      // Verify setup
      let stats = lodManager.getLODStats()
      expect(stats.totalAssets).toBe(5)
      
      // Clear all
      lodManager.clearLODConfigurations()
      
      // Verify cleanup
      stats = lodManager.getLODStats()
      expect(stats.totalAssets).toBe(0)
      expect(stats.activeLODs).toBe(0)
    })
  })
})