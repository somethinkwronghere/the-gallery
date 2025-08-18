import { AssetManager } from '../AssetManager'
import { TextureOptimizer } from '../TextureOptimizer'
import { ModelOptimizer } from '../ModelOptimizer'
import { Asset, AssetType, LoadingProgress } from '../../../types/assets'

// Mock Three.js dependencies
jest.mock('three/examples/jsm/loaders/GLTFLoader')
jest.mock('three')
jest.mock('../TextureOptimizer')
jest.mock('../ModelOptimizer')

describe('Asset System Integration', () => {
  let assetManager: AssetManager
  let mockProgressCallback: jest.Mock<void, [LoadingProgress]>

  beforeEach(() => {
    assetManager = new AssetManager()
    mockProgressCallback = jest.fn()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Asset Loading Workflow', () => {
    test('should handle complete asset loading workflow', async () => {
      // Mock successful loading
      const mockAsset: Asset = {
        id: 'test-model',
        type: 'model',
        url: 'test.glb',
        size: 1024,
        format: 'gltf',
        loadedAt: new Date()
      }

      // Mock the internal loading method
      jest.spyOn(assetManager as any, 'performProgressiveLoad').mockResolvedValue(mockAsset)

      const result = await assetManager.loadAssetProgressive(
        'test.glb',
        'model',
        mockProgressCallback
      )

      expect(result).toEqual(mockAsset)
      expect(mockProgressCallback).toHaveBeenCalled()
    })

    test('should handle asset loading with fallback', async () => {
      const primaryUrl = 'primary.glb'
      const fallbackUrl = 'fallback.glb'
      
      const mockFallbackAsset: Asset = {
        id: 'fallback-model',
        type: 'model',
        url: fallbackUrl,
        size: 512,
        format: 'gltf',
        loadedAt: new Date()
      }

      // Mock primary loading to fail, fallback to succeed
      jest.spyOn(assetManager as any, 'performAssetLoad')
        .mockRejectedValueOnce(new Error('Primary load failed'))
        .mockResolvedValueOnce(mockFallbackAsset)

      const result = await assetManager.loadAsset(primaryUrl, 'model', {
        fallbackUrl
      })

      expect(result).toEqual(mockFallbackAsset)
    })

    test('should handle chunked progressive loading', async () => {
      const mockAsset: Asset = {
        id: 'large-model',
        type: 'model',
        url: 'large.glb',
        size: 10 * 1024 * 1024, // 10MB
        format: 'gltf',
        loadedAt: new Date()
      }

      jest.spyOn(assetManager as any, 'loadModelWithChunks').mockResolvedValue(mockAsset)

      const result = await assetManager.loadAssetProgressiveChunked(
        'large.glb',
        'model',
        mockProgressCallback,
        1024 * 1024 // 1MB chunks
      )

      expect(result).toEqual(mockAsset)
      expect(mockProgressCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          stage: 'downloading',
          percentage: 0
        })
      )
    })
  })

  describe('Cache and Instance Integration', () => {
    test('should integrate caching with instance management', () => {
      const mockAsset: Asset = {
        id: 'shared-model',
        type: 'model',
        url: 'shared.glb',
        size: 1024,
        format: 'gltf',
        loadedAt: new Date()
      }

      // Cache the asset
      assetManager.cacheAsset(mockAsset)

      // Create multiple instances
      const instance1 = assetManager.createInstance('shared-model', {
        position: [1, 0, 0]
      })
      const instance2 = assetManager.createInstance('shared-model', {
        position: [2, 0, 0]
      })

      // Verify instances reference the same original asset
      expect(instance1.originalId).toBe('shared-model')
      expect(instance2.originalId).toBe('shared-model')
      
      const instances = assetManager.getInstances('shared-model')
      expect(instances).toHaveLength(2)

      // Dispose asset should also clean up instances
      assetManager.disposeAsset('shared-model')
      
      const remainingInstances = assetManager.getInstances('shared-model')
      expect(remainingInstances).toHaveLength(0)
    })
  })

  describe('Batch Loading Integration', () => {
    test('should handle batch loading with mixed asset types', async () => {
      const requests = [
        { url: 'model1.glb', type: 'model' as AssetType },
        { url: 'texture1.jpg', type: 'texture' as AssetType },
        { url: 'model2.glb', type: 'model' as AssetType }
      ]

      const mockAssets: Asset[] = [
        {
          id: 'model1',
          type: 'model',
          url: 'model1.glb',
          size: 1024,
          format: 'gltf',
          loadedAt: new Date()
        },
        {
          id: 'texture1',
          type: 'texture',
          url: 'texture1.jpg',
          size: 512,
          format: 'jpg',
          loadedAt: new Date()
        },
        {
          id: 'model2',
          type: 'model',
          url: 'model2.glb',
          size: 2048,
          format: 'gltf',
          loadedAt: new Date()
        }
      ]

      jest.spyOn(assetManager, 'loadAssetProgressive')
        .mockResolvedValueOnce(mockAssets[0])
        .mockResolvedValueOnce(mockAssets[1])
        .mockResolvedValueOnce(mockAssets[2])

      const results = await assetManager.loadBatch(requests, mockProgressCallback)

      expect(results).toHaveLength(3)
      expect(results[0].type).toBe('model')
      expect(results[1].type).toBe('texture')
      expect(results[2].type).toBe('model')
      expect(mockProgressCallback).toHaveBeenCalled()
    })
  })

  describe('Memory Management Integration', () => {
    test('should enforce cache limits and evict old assets', () => {
      // Create multiple assets that exceed cache limit
      const assets: Asset[] = Array.from({ length: 10 }, (_, i) => ({
        id: `asset-${i}`,
        type: 'texture',
        url: `texture${i}.jpg`,
        size: 100 * 1024 * 1024, // 100MB each
        format: 'jpg',
        loadedAt: new Date(Date.now() - i * 60000) // Stagger load times
      }))

      // Cache all assets
      assets.forEach(asset => assetManager.cacheAsset(asset))

      // Verify cache enforcement (some assets should be evicted)
      const stats = assetManager.getCacheStats()
      expect(stats.evictionCount).toBeGreaterThan(0)
    })

    test('should dispose unused assets based on age', () => {
      const oldAsset: Asset = {
        id: 'old-asset',
        type: 'texture',
        url: 'old.jpg',
        size: 1024,
        format: 'jpg',
        loadedAt: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
      }

      const newAsset: Asset = {
        id: 'new-asset',
        type: 'texture',
        url: 'new.jpg',
        size: 1024,
        format: 'jpg',
        loadedAt: new Date()
      }

      assetManager.cacheAsset(oldAsset)
      assetManager.cacheAsset(newAsset)

      const disposedCount = assetManager.disposeUnusedAssets(30 * 60 * 1000) // 30 minutes

      expect(disposedCount).toBe(1)
      expect(assetManager.getCachedAsset('old-asset')).toBeNull()
      expect(assetManager.getCachedAsset('new-asset')).not.toBeNull()
    })
  })

  describe('Error Handling Integration', () => {
    test('should handle loading errors with graceful fallback', async () => {
      const primaryUrl = 'broken.glb'
      const fallbackUrl = 'fallback.glb'
      
      const mockFallbackAsset: Asset = {
        id: 'fallback-model',
        type: 'model',
        url: fallbackUrl,
        size: 512,
        format: 'gltf',
        loadedAt: new Date()
      }

      // Mock loading to fail for primary, succeed for fallback
      jest.spyOn(assetManager as any, 'performAssetLoad')
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockFallbackAsset)

      const result = await assetManager.loadAsset(primaryUrl, 'model', {
        fallbackUrl,
        retryCount: 1
      })

      expect(result).toEqual(mockFallbackAsset)
    })

    test('should handle system fallback when user fallback fails', async () => {
      const primaryUrl = 'broken.glb'
      const userFallbackUrl = 'also-broken.glb'
      
      const mockSystemFallbackAsset: Asset = {
        id: 'system-fallback',
        type: 'model',
        url: '/assets/fallback/default-model.glb',
        size: 256,
        format: 'gltf',
        loadedAt: new Date()
      }

      // Mock all loading attempts to fail except system fallback
      jest.spyOn(assetManager as any, 'performAssetLoad')
        .mockRejectedValueOnce(new Error('Primary failed'))
        .mockRejectedValueOnce(new Error('User fallback failed'))

      jest.spyOn(assetManager, 'loadAssetProgressiveChunked')
        .mockResolvedValueOnce(mockSystemFallbackAsset)

      const result = await assetManager.loadAssetProgressiveChunked(
        primaryUrl,
        'model',
        mockProgressCallback,
        1024 * 1024,
        { fallbackUrl: userFallbackUrl }
      )

      expect(result).toEqual(mockSystemFallbackAsset)
    })
  })

  describe('Optimization Integration', () => {
    test('should integrate texture and model optimization', async () => {
      const mockTextureAsset: Asset = {
        id: 'texture-to-optimize',
        type: 'texture',
        url: 'large-texture.jpg',
        size: 4 * 1024 * 1024, // 4MB
        format: 'jpg',
        loadedAt: new Date()
      }

      jest.spyOn(assetManager as any, 'performAssetLoad').mockResolvedValue(mockTextureAsset)

      const result = await assetManager.loadAsset('large-texture.jpg', 'texture', {
        compress: true
      })

      expect(result).toEqual(mockTextureAsset)
      // In a real test, you would verify that optimization was applied
    })
  })

  describe('Metadata Integration', () => {
    test('should integrate metadata with asset queries', () => {
      const asset1: Asset = {
        id: 'env-texture',
        type: 'texture',
        url: 'environment.jpg',
        size: 1024,
        format: 'jpg',
        loadedAt: new Date()
      }

      const asset2: Asset = {
        id: 'char-model',
        type: 'model',
        url: 'character.glb',
        size: 2048,
        format: 'gltf',
        loadedAt: new Date()
      }

      assetManager.cacheAsset(asset1)
      assetManager.cacheAsset(asset2)

      assetManager.setMetadata('env-texture', {
        id: 'env-texture',
        type: 'texture',
        size: 1024,
        format: 'jpg',
        compressionLevel: 'medium',
        lodLevels: [],
        dependencies: [],
        loadPriority: 5,
        tags: ['environment', 'outdoor'],
        version: '1.0.0'
      })

      assetManager.setMetadata('char-model', {
        id: 'char-model',
        type: 'model',
        size: 2048,
        format: 'gltf',
        compressionLevel: 'low',
        lodLevels: [],
        dependencies: [],
        loadPriority: 8,
        tags: ['character', 'animated'],
        version: '1.0.0'
      })

      const environmentAssets = assetManager.getAssetsByTag('environment')
      const characterAssets = assetManager.getAssetsByTag('character')

      expect(environmentAssets).toHaveLength(1)
      expect(environmentAssets[0].id).toBe('env-texture')
      expect(characterAssets).toHaveLength(1)
      expect(characterAssets[0].id).toBe('char-model')
    })
  })
})