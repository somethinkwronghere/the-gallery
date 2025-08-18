import { AssetManager } from '../AssetManager'
import { TextureOptimizer } from '../TextureOptimizer'
import { ModelOptimizer } from '../ModelOptimizer'
import { Asset, AssetType, LoadingOptions } from '../../../types/assets'
import test from 'node:test'
import test from 'node:test'
import test from 'node:test'
import { describe } from 'node:test'
import test from 'node:test'
import test from 'node:test'
import { describe } from 'node:test'
import test from 'node:test'
import test from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'
import test from 'node:test'
import test from 'node:test'
import test from 'node:test'
import test from 'node:test'
import { describe } from 'node:test'
import test from 'node:test'
import test from 'node:test'
import test from 'node:test'
import test from 'node:test'
import test from 'node:test'
import { describe } from 'node:test'
import { afterEach } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

// Mock Three.js dependencies
jest.mock('three/examples/jsm/loaders/GLTFLoader', () => ({
  GLTFLoader: jest.fn().mockImplementation(() => ({
    load: jest.fn()
  }))
}))

jest.mock('three', () => ({
  TextureLoader: jest.fn().mockImplementation(() => ({
    load: jest.fn()
  })),
  Object3D: jest.fn(),
  Texture: jest.fn(),
  BufferGeometry: jest.fn()
}))

// Mock optimizers
jest.mock('../TextureOptimizer')
jest.mock('../ModelOptimizer')

describe('AssetManager', () => {
  let assetManager: AssetManager
  let mockTextureOptimizer: jest.Mocked<TextureOptimizer>
  let mockModelOptimizer: jest.Mocked<ModelOptimizer>

  beforeEach(() => {
    assetManager = new AssetManager()
    mockTextureOptimizer = new TextureOptimizer() as jest.Mocked<TextureOptimizer>
    mockModelOptimizer = new ModelOptimizer() as jest.Mocked<ModelOptimizer>
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Cache Management', () => {
    test('should cache asset when cache option is enabled', () => {
      const mockAsset: Asset = {
        id: 'test-asset',
        type: 'model', // Use model instead of texture to avoid image property issues
        url: 'test.glb',
        size: 1024,
        format: 'gltf',
        loadedAt: new Date()
      }

      assetManager.cacheAsset(mockAsset)
      const cached = assetManager.getCachedAsset('test-asset')

      expect(cached).toEqual(mockAsset)
    })

    test('should return null for non-existent cached asset', () => {
      const cached = assetManager.getCachedAsset('non-existent')
      expect(cached).toBeNull()
    })

    test('should remove cached asset', () => {
      const mockAsset: Asset = {
        id: 'test-asset',
        type: 'model',
        url: 'test.glb',
        size: 1024,
        format: 'gltf',
        loadedAt: new Date()
      }

      assetManager.cacheAsset(mockAsset)
      const removed = assetManager.removeCachedAsset('test-asset')
      const cached = assetManager.getCachedAsset('test-asset')

      expect(removed).toBe(true)
      expect(cached).toBeNull()
    })

    test('should clear entire cache', () => {
      const mockAsset1: Asset = {
        id: 'test-asset-1',
        type: 'model',
        url: 'test1.glb',
        size: 1024,
        format: 'gltf',
        loadedAt: new Date()
      }

      const mockAsset2: Asset = {
        id: 'test-asset-2',
        type: 'model',
        url: 'test2.glb',
        size: 2048,
        format: 'gltf',
        loadedAt: new Date()
      }

      assetManager.cacheAsset(mockAsset1)
      assetManager.cacheAsset(mockAsset2)
      
      assetManager.clearCache()
      
      expect(assetManager.getCachedAsset('test-asset-1')).toBeNull()
      expect(assetManager.getCachedAsset('test-asset-2')).toBeNull()
    })

    test('should provide cache statistics', () => {
      const stats = assetManager.getCacheStats()
      
      expect(stats).toHaveProperty('totalAssets')
      expect(stats).toHaveProperty('totalMemoryUsage')
      expect(stats).toHaveProperty('hitRate')
      expect(stats).toHaveProperty('missRate')
      expect(stats).toHaveProperty('evictionCount')
    })
  })

  describe('Instance Management', () => {
    test('should create asset instance', () => {
      const instance = assetManager.createInstance('original-asset', {
        position: [1, 2, 3],
        scale: [2, 2, 2]
      })

      expect(instance.originalId).toBe('original-asset')
      expect(instance.transform.position).toEqual([1, 2, 3])
      expect(instance.transform.scale).toEqual([2, 2, 2])
      expect(instance.visible).toBe(true)
    })

    test('should update instance transform', () => {
      const instance = assetManager.createInstance('original-asset')
      
      assetManager.updateInstance(instance.instanceId, {
        position: [5, 6, 7],
        rotation: [0.1, 0.2, 0.3]
      })

      const instances = assetManager.getInstances('original-asset')
      expect(instances[0].transform.position).toEqual([5, 6, 7])
      expect(instances[0].transform.rotation).toEqual([0.1, 0.2, 0.3])
    })

    test('should dispose instance', () => {
      const instance = assetManager.createInstance('original-asset')
      
      assetManager.disposeInstance(instance.instanceId)
      
      const instances = assetManager.getInstances('original-asset')
      expect(instances).toHaveLength(0)
    })

    test('should get all instances of an asset', () => {
      const instance1 = assetManager.createInstance('original-asset')
      const instance2 = assetManager.createInstance('original-asset')
      const instance3 = assetManager.createInstance('other-asset')

      const instances = assetManager.getInstances('original-asset')
      
      expect(instances).toHaveLength(2)
      expect(instances.map(i => i.instanceId)).toContain(instance1.instanceId)
      expect(instances.map(i => i.instanceId)).toContain(instance2.instanceId)
      expect(instances.map(i => i.instanceId)).not.toContain(instance3.instanceId)
    })
  })

  describe('Asset Queries', () => {
    beforeEach(() => {
      const modelAsset1: Asset = {
        id: 'model-1',
        type: 'model',
        url: 'model1.glb',
        size: 1024,
        format: 'gltf',
        loadedAt: new Date()
      }

      const modelAsset2: Asset = {
        id: 'model-2',
        type: 'model',
        url: 'model2.glb',
        size: 2048,
        format: 'gltf',
        loadedAt: new Date()
      }

      assetManager.cacheAsset(modelAsset1)
      assetManager.cacheAsset(modelAsset2)
    })

    test('should get assets by type', () => {
      const models = assetManager.getAssetsByType('model')

      expect(models).toHaveLength(2)
      expect(models[0].type).toBe('model')
      expect(models[1].type).toBe('model')
    })

    test('should search assets by query', () => {
      const results = assetManager.searchAssets('model1')
      
      expect(results).toHaveLength(1)
      expect(results[0].id).toBe('model-1')
    })
  })

  describe('Asset Disposal', () => {
    test('should dispose asset and cleanup resources', () => {
      const mockAsset: Asset = {
        id: 'test-asset',
        type: 'model',
        url: 'test.glb',
        size: 1024,
        format: 'gltf',
        loadedAt: new Date()
      }

      assetManager.cacheAsset(mockAsset)
      const instance = assetManager.createInstance('test-asset')
      
      assetManager.disposeAsset('test-asset')
      
      expect(assetManager.getCachedAsset('test-asset')).toBeNull()
      expect(assetManager.getInstances('test-asset')).toHaveLength(0)
    })

    test('should dispose unused assets older than maxAge', () => {
      const oldAsset: Asset = {
        id: 'old-asset',
        type: 'model',
        url: 'old.glb',
        size: 1024,
        format: 'gltf',
        loadedAt: new Date(Date.now() - 60000) // 1 minute ago
      }

      const newAsset: Asset = {
        id: 'new-asset',
        type: 'model',
        url: 'new.glb',
        size: 1024,
        format: 'gltf',
        loadedAt: new Date()
      }

      assetManager.cacheAsset(oldAsset)
      assetManager.cacheAsset(newAsset)

      const disposedCount = assetManager.disposeUnusedAssets(30000) // 30 seconds

      expect(disposedCount).toBe(1)
      expect(assetManager.getCachedAsset('old-asset')).toBeNull()
      expect(assetManager.getCachedAsset('new-asset')).not.toBeNull()
    })
  })

  describe('Metadata Management', () => {
    test('should set and get asset metadata', () => {
      const metadata = {
        id: 'test-asset',
        type: 'texture' as AssetType,
        size: 1024,
        format: 'jpg' as const,
        compressionLevel: 'medium' as const,
        lodLevels: ['high', 'medium', 'low'],
        dependencies: [],
        loadPriority: 5,
        tags: ['environment', 'texture'],
        version: '1.0.0'
      }

      assetManager.setMetadata('test-asset', metadata)
      const retrieved = assetManager.getMetadata('test-asset')

      expect(retrieved).toEqual(metadata)
    })

    test('should return null for non-existent metadata', () => {
      const metadata = assetManager.getMetadata('non-existent')
      expect(metadata).toBeNull()
    })

    test('should get assets by tag', () => {
      const metadata1 = {
        id: 'asset-1',
        type: 'model' as AssetType,
        size: 1024,
        format: 'gltf' as const,
        compressionLevel: 'medium' as const,
        lodLevels: [],
        dependencies: [],
        loadPriority: 5,
        tags: ['environment', 'outdoor'],
        version: '1.0.0'
      }

      const metadata2 = {
        id: 'asset-2',
        type: 'model' as AssetType,
        size: 2048,
        format: 'gltf' as const,
        compressionLevel: 'low' as const,
        lodLevels: [],
        dependencies: [],
        loadPriority: 3,
        tags: ['character', 'animated'],
        version: '1.0.0'
      }

      const asset1: Asset = {
        id: 'asset-1',
        type: 'model',
        url: 'env.glb',
        size: 1024,
        format: 'gltf',
        loadedAt: new Date()
      }

      const asset2: Asset = {
        id: 'asset-2',
        type: 'model',
        url: 'character.glb',
        size: 2048,
        format: 'gltf',
        loadedAt: new Date()
      }

      assetManager.cacheAsset(asset1)
      assetManager.cacheAsset(asset2)
      assetManager.setMetadata('asset-1', metadata1)
      assetManager.setMetadata('asset-2', metadata2)

      const environmentAssets = assetManager.getAssetsByTag('environment')
      const characterAssets = assetManager.getAssetsByTag('character')

      expect(environmentAssets).toHaveLength(1)
      expect(environmentAssets[0].id).toBe('asset-1')
      expect(characterAssets).toHaveLength(1)
      expect(characterAssets[0].id).toBe('asset-2')
    })
  })
})