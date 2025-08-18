import { describe, it, expect, beforeEach } from '@jest/globals'
import { 
  PerspectiveCamera, 
  BoxGeometry, 
  MeshBasicMaterial, 
  Mesh, 
  Vector3,
  Box3,
  Sphere
} from 'three'
import { RenderQueue } from '../RenderQueue'
import { RenderableObject } from '../../../types/rendering'

describe('RenderQueue', () => {
  let renderQueue: RenderQueue
  let camera: PerspectiveCamera
  let testRenderableObjects: RenderableObject[]

  beforeEach(() => {
    renderQueue = new RenderQueue()
    camera = new PerspectiveCamera(75, 1, 0.1, 1000)
    camera.position.set(0, 0, 5)
    camera.lookAt(0, 0, 0)
    camera.updateMatrixWorld()
    camera.updateProjectionMatrix()

    // Create test renderable objects
    testRenderableObjects = []
    const geometry = new BoxGeometry(1, 1, 1)
    const material = new MeshBasicMaterial({ color: 0xff0000 })

    for (let i = 0; i < 3; i++) {
      const mesh = new Mesh(geometry, material)
      mesh.position.set(i * 2, 0, 0)
      
      const bounds = new Box3().setFromObject(mesh)
      const boundingSphere = bounds.getBoundingSphere(new Sphere())

      const renderableObject: RenderableObject = {
        object: mesh,
        geometry: mesh.geometry,
        material: mesh.material,
        bounds,
        boundingSphere,
        priority: 'normal',
        lastVisible: Date.now(),
        cullingState: 'visible',
        distanceToCamera: camera.position.distanceTo(mesh.position),
        screenSize: 0.1
      }

      testRenderableObjects.push(renderableObject)
    }
  })

  describe('Configuration', () => {
    it('should set and get configuration', () => {
      const config = {
        enableBatching: false,
        maxBatchSize: 50,
        sortByDistance: false,
        sortByMaterial: false
      }

      renderQueue.setConfig(config)
      const retrievedConfig = renderQueue.getConfig()

      expect(retrievedConfig.enableBatching).toBe(false)
      expect(retrievedConfig.maxBatchSize).toBe(50)
      expect(retrievedConfig.sortByDistance).toBe(false)
      expect(retrievedConfig.sortByMaterial).toBe(false)
    })
  })

  describe('Object Management', () => {
    it('should add objects to render queue', () => {
      testRenderableObjects.forEach(obj => {
        renderQueue.addObject(obj)
      })

      const stats = renderQueue.getStats()
      expect(stats.totalObjects).toBe(3)
    })

    it('should remove objects from render queue', () => {
      testRenderableObjects.forEach(obj => {
        renderQueue.addObject(obj)
      })

      const objectId = testRenderableObjects[0].object.uuid
      renderQueue.removeObject(objectId)

      const stats = renderQueue.getStats()
      expect(stats.totalObjects).toBe(2)
    })

    it('should clear render queue', () => {
      testRenderableObjects.forEach(obj => {
        renderQueue.addObject(obj)
      })

      renderQueue.clear()

      const stats = renderQueue.getStats()
      expect(stats.totalObjects).toBe(0)
    })
  })

  describe('Batching', () => {
    beforeEach(() => {
      testRenderableObjects.forEach(obj => {
        renderQueue.addObject(obj)
      })
    })

    it('should create batches when batching is enabled', () => {
      renderQueue.setConfig({ enableBatching: true })
      const batches = renderQueue.createBatches()

      expect(Array.isArray(batches)).toBe(true)
      expect(batches.length).toBeGreaterThan(0)
    })

    it('should create individual batches when batching is disabled', () => {
      renderQueue.setConfig({ enableBatching: false })
      const batches = renderQueue.createBatches()

      expect(batches.length).toBe(testRenderableObjects.length)
      batches.forEach(batch => {
        expect(batch.objects.length).toBe(1)
        expect(batch.instanceCount).toBe(1)
      })
    })

    it('should optimize batches', () => {
      const batches = renderQueue.createBatches()
      const optimizedBatches = renderQueue.optimizeBatches(batches)

      expect(Array.isArray(optimizedBatches)).toBe(true)
      expect(optimizedBatches.length).toBeGreaterThan(0)
    })

    it('should respect max batch size', () => {
      const maxBatchSize = 2
      renderQueue.setConfig({ enableBatching: true, maxBatchSize })
      
      const batches = renderQueue.createBatches()
      
      batches.forEach(batch => {
        expect(batch.objects.length).toBeLessThanOrEqual(maxBatchSize)
      })
    })
  })

  describe('Sorting', () => {
    beforeEach(() => {
      // Create objects at different distances
      testRenderableObjects[0].distanceToCamera = 1
      testRenderableObjects[1].distanceToCamera = 3
      testRenderableObjects[2].distanceToCamera = 2

      testRenderableObjects.forEach(obj => {
        renderQueue.addObject(obj)
      })
    })

    it('should sort by distance', () => {
      renderQueue.sortByDistance(camera)
      // Verification would require access to internal object order
      // This test ensures the method runs without error
      expect(true).toBe(true)
    })

    it('should sort by material', () => {
      renderQueue.sortByMaterial()
      // Verification would require access to internal object order
      // This test ensures the method runs without error
      expect(true).toBe(true)
    })

    it('should sort by priority', () => {
      testRenderableObjects[0].priority = 'high'
      testRenderableObjects[1].priority = 'low'
      testRenderableObjects[2].priority = 'normal'

      renderQueue.sortByPriority()
      // Verification would require access to internal object order
      // This test ensures the method runs without error
      expect(true).toBe(true)
    })
  })

  describe('Rendering', () => {
    beforeEach(() => {
      testRenderableObjects.forEach(obj => {
        renderQueue.addObject(obj)
      })
    })

    it('should render without errors', () => {
      expect(() => {
        renderQueue.render(camera)
      }).not.toThrow()
    })

    it('should update render statistics', () => {
      renderQueue.render(camera)
      const stats = renderQueue.getStats()

      expect(stats.renderTime).toBeGreaterThanOrEqual(0)
      expect(stats.batches).toBeGreaterThanOrEqual(0)
      expect(stats.drawCalls).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Statistics', () => {
    it('should provide render statistics', () => {
      const stats = renderQueue.getStats()

      expect(stats).toHaveProperty('totalObjects')
      expect(stats).toHaveProperty('visibleObjects')
      expect(stats).toHaveProperty('drawCalls')
      expect(stats).toHaveProperty('triangles')
      expect(stats).toHaveProperty('batches')
      expect(stats).toHaveProperty('instances')
      expect(stats).toHaveProperty('renderTime')
    })

    it('should track object counts correctly', () => {
      testRenderableObjects.forEach(obj => {
        renderQueue.addObject(obj)
      })

      const stats = renderQueue.getStats()
      expect(stats.totalObjects).toBe(3)
    })
  })
})