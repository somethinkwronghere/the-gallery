import { Matrix4, Mesh, BoxGeometry, MeshBasicMaterial, PerspectiveCamera } from 'three'
import { InstanceManager } from '../InstanceManager'

// Mock Three.js classes
jest.mock('three', () => ({
  ...jest.requireActual('three'),
  InstancedMesh: jest.fn().mockImplementation((geometry, material, count) => ({
    geometry,
    material,
    count,
    position: { 
      copy: jest.fn(),
      x: 0, y: 0, z: 0
    },
    rotation: { 
      copy: jest.fn(),
      x: 0, y: 0, z: 0
    },
    scale: { 
      copy: jest.fn(),
      x: 1, y: 1, z: 1
    },
    castShadow: false,
    receiveShadow: false,
    frustumCulled: true,
    dispose: jest.fn(),
    setMatrixAt: jest.fn(),
    getMatrixAt: jest.fn((index, matrix) => {
      // Mock implementation that sets a default matrix
      matrix.identity()
    }),
    instanceMatrix: { needsUpdate: false }
  }))
}))

describe('InstanceManager', () => {
  let instanceManager: InstanceManager
  let testMesh: Mesh
  let testMatrix: Matrix4

  beforeEach(() => {
    instanceManager = new InstanceManager()
    
    const geometry = new BoxGeometry(1, 1, 1)
    const material = new MeshBasicMaterial({ color: 0xff0000 })
    
    // Create a mock mesh with all required properties
    testMesh = {
      geometry,
      material,
      position: { x: 0, y: 0, z: 0, copy: jest.fn() },
      rotation: { x: 0, y: 0, z: 0, copy: jest.fn() },
      scale: { x: 1, y: 1, z: 1, copy: jest.fn() },
      castShadow: false,
      receiveShadow: false,
      uuid: 'test-mesh-uuid'
    } as any
    
    testMatrix = new Matrix4().makeTranslation(1, 2, 3)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Configuration', () => {
    it('should initialize with default configuration', () => {
      const config = instanceManager.getConfig()
      
      expect(config.maxInstancesPerGroup).toBe(1000)
      expect(config.enableObjectPooling).toBe(true)
      expect(config.autoUpdateMatrices).toBe(true)
      expect(config.frustumCulling).toBe(true)
      expect(config.updateFrequency).toBe(1)
    })

    it('should allow configuration updates', () => {
      const newConfig = {
        maxInstancesPerGroup: 500,
        enableObjectPooling: false
      }

      instanceManager.setConfig(newConfig)
      const config = instanceManager.getConfig()

      expect(config.maxInstancesPerGroup).toBe(500)
      expect(config.enableObjectPooling).toBe(false)
      expect(config.autoUpdateMatrices).toBe(true) // Should keep existing values
    })
  })

  describe('Instance Group Management', () => {
    it('should create instance group successfully', () => {
      const groupId = instanceManager.createInstanceGroup(testMesh, 100)
      
      expect(groupId).toBeDefined()
      expect(typeof groupId).toBe('string')
      
      const group = instanceManager.getInstanceGroup(groupId)
      expect(group).toBeDefined()
      expect(group?.maxInstances).toBe(100)
      expect(group?.currentCount).toBe(0)
    })

    it('should use default max instances when not specified', () => {
      const groupId = instanceManager.createInstanceGroup(testMesh)
      const group = instanceManager.getInstanceGroup(groupId)
      
      expect(group?.maxInstances).toBe(1000) // Default value
    })

    it('should remove instance group successfully', () => {
      const groupId = instanceManager.createInstanceGroup(testMesh)
      
      expect(instanceManager.getInstanceGroup(groupId)).toBeDefined()
      
      instanceManager.removeInstanceGroup(groupId)
      
      expect(instanceManager.getInstanceGroup(groupId)).toBeNull()
    })

    it('should return null for non-existent group', () => {
      const group = instanceManager.getInstanceGroup('non-existent')
      expect(group).toBeNull()
    })
  })

  describe('Instance Management', () => {
    let groupId: string

    beforeEach(() => {
      groupId = instanceManager.createInstanceGroup(testMesh, 10)
    })

    it('should create instance successfully', () => {
      const instanceId = instanceManager.createInstance(groupId, testMatrix)
      
      expect(instanceId).toBeDefined()
      expect(typeof instanceId).toBe('string')
      
      const group = instanceManager.getInstanceGroup(groupId)
      expect(group?.currentCount).toBe(1)
      expect(group?.instances.has(instanceId)).toBe(true)
    })

    it('should create instance with user data', () => {
      const userData = { name: 'test', value: 42 }
      const instanceId = instanceManager.createInstance(groupId, testMatrix, userData)
      
      const group = instanceManager.getInstanceGroup(groupId)
      const instance = group?.instances.get(instanceId)
      
      expect(instance?.userData).toEqual(userData)
    })

    it('should throw error when creating instance in non-existent group', () => {
      expect(() => {
        instanceManager.createInstance('non-existent', testMatrix)
      }).toThrow('Instance group non-existent not found')
    })

    it('should throw error when exceeding max instances', () => {
      const smallGroupId = instanceManager.createInstanceGroup(testMesh, 1)
      
      // First instance should succeed
      instanceManager.createInstance(smallGroupId, testMatrix)
      
      // Second instance should fail
      expect(() => {
        instanceManager.createInstance(smallGroupId, testMatrix)
      }).toThrow('Maximum instances reached')
    })

    it('should update instance matrix', () => {
      const instanceId = instanceManager.createInstance(groupId, testMatrix)
      const newMatrix = new Matrix4().makeTranslation(5, 6, 7)
      
      instanceManager.updateInstance(groupId, instanceId, newMatrix)
      
      const group = instanceManager.getInstanceGroup(groupId)
      const instance = group?.instances.get(instanceId)
      
      expect(instance?.matrix.equals(newMatrix)).toBe(true)
    })

    it('should remove instance successfully', () => {
      const instanceId = instanceManager.createInstance(groupId, testMatrix)
      
      expect(instanceManager.getInstanceGroup(groupId)?.currentCount).toBe(1)
      
      instanceManager.removeInstance(groupId, instanceId)
      
      const group = instanceManager.getInstanceGroup(groupId)
      expect(group?.currentCount).toBe(0)
      expect(group?.instances.has(instanceId)).toBe(false)
    })

    it('should handle visibility changes', () => {
      const instanceId = instanceManager.createInstance(groupId, testMatrix)
      
      instanceManager.setInstanceVisibility(groupId, instanceId, false)
      
      const group = instanceManager.getInstanceGroup(groupId)
      const instance = group?.instances.get(instanceId)
      
      expect(instance?.visible).toBe(false)
    })
  })

  describe('Object Pooling', () => {
    it('should create object pool successfully', () => {
      const geometry = new BoxGeometry(1, 1, 1)
      const material = new MeshBasicMaterial()
      
      const poolId = instanceManager.createPool(geometry, material, 50)
      
      expect(poolId).toBeDefined()
      expect(typeof poolId).toBe('string')
    })

    it('should get instance from pool', () => {
      const geometry = new BoxGeometry(1, 1, 1)
      const material = new MeshBasicMaterial()
      const poolId = instanceManager.createPool(geometry, material, 50)
      
      const instanceId = instanceManager.getInstanceFromPool(poolId)
      
      expect(instanceId).toBeDefined()
      expect(typeof instanceId).toBe('string')
    })

    it('should return null when pool is empty', () => {
      const geometry = new BoxGeometry(1, 1, 1)
      const material = new MeshBasicMaterial()
      const poolId = instanceManager.createPool(geometry, material, 1)
      
      // Get the only available instance
      const instanceId1 = instanceManager.getInstanceFromPool(poolId)
      expect(instanceId1).toBeDefined()
      
      // Try to get another instance (should be null)
      const instanceId2 = instanceManager.getInstanceFromPool(poolId)
      expect(instanceId2).toBeNull()
    })

    it('should return instance to pool', () => {
      const geometry = new BoxGeometry(1, 1, 1)
      const material = new MeshBasicMaterial()
      const poolId = instanceManager.createPool(geometry, material, 1)
      
      const instanceId = instanceManager.getInstanceFromPool(poolId)!
      expect(instanceId).toBeDefined()
      
      // Pool should be empty now
      expect(instanceManager.getInstanceFromPool(poolId)).toBeNull()
      
      // Return instance to pool
      instanceManager.returnInstanceToPool(poolId, instanceId)
      
      // Should be able to get instance again
      const newInstanceId = instanceManager.getInstanceFromPool(poolId)
      expect(newInstanceId).toBeDefined()
    })

    it('should respect pooling configuration', () => {
      instanceManager.setConfig({ enableObjectPooling: false })
      
      const geometry = new BoxGeometry(1, 1, 1)
      const material = new MeshBasicMaterial()
      const poolId = instanceManager.createPool(geometry, material, 50)
      
      const instanceId = instanceManager.getInstanceFromPool(poolId)
      expect(instanceId).toBeNull()
    })
  })

  describe('Statistics', () => {
    it('should provide accurate statistics', () => {
      const groupId1 = instanceManager.createInstanceGroup(testMesh, 10)
      const groupId2 = instanceManager.createInstanceGroup(testMesh, 10)
      
      instanceManager.createInstance(groupId1, testMatrix)
      instanceManager.createInstance(groupId1, testMatrix)
      instanceManager.createInstance(groupId2, testMatrix)
      
      const stats = instanceManager.getInstanceStats()
      
      expect(stats.totalGroups).toBe(2)
      expect(stats.totalInstances).toBe(3)
      expect(stats.visibleInstances).toBe(3)
      expect(stats.drawCallsSaved).toBe(1) // 3 instances - 2 groups
    })

    it('should reset statistics', () => {
      const groupId = instanceManager.createInstanceGroup(testMesh)
      instanceManager.createInstance(groupId, testMatrix)
      
      let stats = instanceManager.getInstanceStats()
      expect(stats.totalInstances).toBe(1)
      
      instanceManager.resetStats()
      stats = instanceManager.getInstanceStats()
      
      expect(stats.totalInstances).toBe(0)
      expect(stats.totalGroups).toBe(0)
    })
  })

  describe('Matrix Updates', () => {
    it('should update all matrices when configured', () => {
      const groupId = instanceManager.createInstanceGroup(testMesh)
      instanceManager.createInstance(groupId, testMatrix)
      
      instanceManager.updateAllMatrices()
      
      const group = instanceManager.getInstanceGroup(groupId)
      expect(group?.needsUpdate).toBe(false)
    })

    it('should respect update frequency', () => {
      instanceManager.setConfig({ updateFrequency: 2 })
      
      const groupId = instanceManager.createInstanceGroup(testMesh)
      instanceManager.createInstance(groupId, testMatrix)
      
      const group = instanceManager.getInstanceGroup(groupId)!
      group.needsUpdate = true
      
      // First call (frame 1) - should not update
      instanceManager.updateAllMatrices()
      expect(group.needsUpdate).toBe(true)
      
      // Second call (frame 2) - should update
      instanceManager.updateAllMatrices()
      expect(group.needsUpdate).toBe(false)
    })
  })

  describe('Frustum Culling', () => {
    it('should perform frustum culling when enabled', () => {
      const camera = new PerspectiveCamera(75, 1, 0.1, 1000)
      camera.position.set(0, 0, 5)
      camera.lookAt(0, 0, 0)
      camera.updateMatrixWorld()
      
      const groupId = instanceManager.createInstanceGroup(testMesh)
      instanceManager.createInstance(groupId, testMatrix)
      
      instanceManager.performFrustumCulling(camera)
      
      // Should complete without errors
      const stats = instanceManager.getInstanceStats()
      expect(stats.culledInstances).toBeGreaterThanOrEqual(0)
    })

    it('should skip frustum culling when disabled', () => {
      instanceManager.setConfig({ frustumCulling: false })
      
      const camera = new PerspectiveCamera(75, 1, 0.1, 1000)
      const groupId = instanceManager.createInstanceGroup(testMesh)
      instanceManager.createInstance(groupId, testMatrix)
      
      instanceManager.performFrustumCulling(camera)
      
      const stats = instanceManager.getInstanceStats()
      expect(stats.culledInstances).toBe(0)
    })
  })

  describe('Public Access Methods', () => {
    it('should provide access to all instance groups', () => {
      const groupId1 = instanceManager.createInstanceGroup(testMesh)
      const groupId2 = instanceManager.createInstanceGroup(testMesh)
      
      const groups = instanceManager.getAllInstanceGroups()
      
      expect(groups).toHaveLength(2)
      expect(groups.map(g => g.id)).toContain(groupId1)
      expect(groups.map(g => g.id)).toContain(groupId2)
    })

    it('should provide access to all pools', () => {
      const geometry = new BoxGeometry(1, 1, 1)
      const material = new MeshBasicMaterial()
      
      instanceManager.createPool(geometry, material, 50)
      instanceManager.createPool(geometry, material, 100)
      
      const pools = instanceManager.getAllPools()
      
      expect(pools).toHaveLength(2)
      expect(pools[0].maxInstances).toBe(50)
      expect(pools[1].maxInstances).toBe(100)
    })
  })
})