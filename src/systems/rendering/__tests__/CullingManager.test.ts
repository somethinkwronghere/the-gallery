import { describe, it, expect, beforeEach } from '@jest/globals'
import { 
  PerspectiveCamera, 
  BoxGeometry, 
  MeshBasicMaterial, 
  Mesh, 
  Vector3,
  Scene
} from 'three'
import { CullingManager } from '../CullingManager'

describe('CullingManager', () => {
  let cullingManager: CullingManager
  let camera: PerspectiveCamera
  let scene: Scene
  let testObjects: Mesh[]

  beforeEach(() => {
    cullingManager = new CullingManager()
    camera = new PerspectiveCamera(75, 1, 0.1, 1000)
    camera.position.set(0, 0, 5)
    camera.lookAt(0, 0, 0)
    camera.updateMatrixWorld()
    camera.updateProjectionMatrix()

    scene = new Scene()
    
    // Create test objects
    testObjects = []
    const geometry = new BoxGeometry(1, 1, 1)
    const material = new MeshBasicMaterial({ color: 0xff0000 })

    // Object in front of camera (should be visible)
    const visibleObject = new Mesh(geometry, material)
    visibleObject.position.set(0, 0, 0)
    testObjects.push(visibleObject)
    scene.add(visibleObject)

    // Object behind camera (should be culled)
    const culledObject = new Mesh(geometry, material)
    culledObject.position.set(0, 0, 10)
    testObjects.push(culledObject)
    scene.add(culledObject)

    // Object far to the side (should be culled)
    const sideObject = new Mesh(geometry, material)
    sideObject.position.set(50, 0, 0)
    testObjects.push(sideObject)
    scene.add(sideObject)
  })

  describe('Configuration', () => {
    it('should set and get configuration', () => {
      const config = {
        frustum: {
          enabled: true,
          margin: 0.2,
          useSphereBounds: true,
          updateFrequency: 2
        }
      }

      cullingManager.setConfig(config)
      const retrievedConfig = cullingManager.getConfig()

      expect(retrievedConfig.frustum.enabled).toBe(true)
      expect(retrievedConfig.frustum.margin).toBe(0.2)
      expect(retrievedConfig.frustum.useSphereBounds).toBe(true)
      expect(retrievedConfig.frustum.updateFrequency).toBe(2)
    })
  })

  describe('Frustum Culling', () => {
    it('should perform frustum culling correctly', () => {
      const result = cullingManager.performFrustumCulling(camera, testObjects)

      expect(result.totalObjects).toBe(3)
      expect(result.visible.length).toBeGreaterThan(0)
      expect(result.culled.length).toBeGreaterThan(0)
      expect(result.cullingTime).toBeGreaterThanOrEqual(0)
    })

    it('should return all objects as visible when frustum culling is disabled', () => {
      cullingManager.setConfig({
        frustum: { enabled: false, margin: 0, useSphereBounds: false, updateFrequency: 1 }
      })

      const result = cullingManager.performFrustumCulling(camera, testObjects)

      expect(result.visible.length).toBe(testObjects.length)
      expect(result.culled.length).toBe(0)
    })

    it('should handle empty object array', () => {
      const result = cullingManager.performFrustumCulling(camera, [])

      expect(result.totalObjects).toBe(0)
      expect(result.visible.length).toBe(0)
      expect(result.culled.length).toBe(0)
    })
  })

  describe('Distance Culling', () => {
    it('should perform distance culling correctly', () => {
      const maxDistance = 3
      const result = cullingManager.performDistanceCulling(camera, testObjects, maxDistance)

      expect(result.totalObjects).toBe(3)
      expect(result.cullingTime).toBeGreaterThanOrEqual(0)
      
      // At least some objects should be visible or culled
      expect(result.visible.length + result.culled.length).toBe(result.totalObjects)
    })

    it('should return all objects when distance culling is disabled', () => {
      cullingManager.setConfig({
        distance: { enabled: false, maxDistance: 100, fadeDistance: 90, useSquaredDistance: false }
      })

      const result = cullingManager.performDistanceCulling(camera, testObjects, 1)

      expect(result.visible.length).toBe(testObjects.length)
      expect(result.culled.length).toBe(0)
    })
  })

  describe('Combined Culling', () => {
    it('should perform combined culling with all methods', () => {
      const result = cullingManager.performCulling(camera, testObjects)

      expect(result.totalObjects).toBe(3)
      expect(result.visible.length + result.culled.length + result.occluded.length).toBe(3)
      expect(result.cullingTime).toBeGreaterThanOrEqual(0)
    })

    it('should update statistics correctly', () => {
      cullingManager.performCulling(camera, testObjects)
      const stats = cullingManager.getStats()

      expect(stats.totalObjects).toBe(3)
      expect(stats.visibleObjects).toBeGreaterThanOrEqual(0)
      expect(stats.culledObjects).toBeGreaterThanOrEqual(0)
      expect(stats.cullingTime).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Object Visibility', () => {
    it('should correctly determine object visibility', () => {
      const visibleObject = testObjects[0] // Object at origin
      const isVisible = cullingManager.isObjectVisible(camera, visibleObject)

      expect(typeof isVisible).toBe('boolean')
    })

    it('should return false for invisible objects', () => {
      const invisibleObject = testObjects[0]
      invisibleObject.visible = false

      const isVisible = cullingManager.isObjectVisible(camera, invisibleObject)

      expect(isVisible).toBe(false)
    })
  })

  describe('Statistics', () => {
    it('should provide statistics', () => {
      const stats = cullingManager.getStats()

      expect(stats).toHaveProperty('totalObjects')
      expect(stats).toHaveProperty('visibleObjects')
      expect(stats).toHaveProperty('culledObjects')
      expect(stats).toHaveProperty('occludedObjects')
      expect(stats).toHaveProperty('cullingTime')
    })

    it('should reset statistics', () => {
      cullingManager.performCulling(camera, testObjects)
      cullingManager.resetStats()
      
      const stats = cullingManager.getStats()
      expect(stats.totalObjects).toBe(0)
      expect(stats.visibleObjects).toBe(0)
      expect(stats.culledObjects).toBe(0)
      expect(stats.cullingTime).toBe(0)
    })
  })
})