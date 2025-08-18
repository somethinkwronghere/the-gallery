import { describe, it, expect, beforeEach } from '@jest/globals'
import { 
  PerspectiveCamera, 
  BoxGeometry, 
  MeshBasicMaterial, 
  Mesh, 
  Scene,
  Vector3
} from 'three'
import { CullingManager } from '../CullingManager'
import { RenderQueue } from '../RenderQueue'
import { 
  createRenderableObject, 
  getAllRenderableObjects,
  updateCullingStates,
  calculateRenderStatistics
} from '../RenderingUtils'

describe('Rendering System Integration', () => {
  let cullingManager: CullingManager
  let renderQueue: RenderQueue
  let camera: PerspectiveCamera
  let scene: Scene
  let testObjects: Mesh[]

  beforeEach(() => {
    cullingManager = new CullingManager({
      frustum: { enabled: true, margin: 0.1, useSphereBounds: false, updateFrequency: 1 },
      distance: { enabled: true, maxDistance: 50, fadeDistance: 45, useSquaredDistance: false },
      occlusion: { enabled: false, maxDistance: 100, raycastSamples: 5, occlusionThreshold: 0.8, updateFrequency: 5 }
    })

    renderQueue = new RenderQueue({
      enableBatching: true,
      maxBatchSize: 10,
      sortByDistance: true,
      sortByMaterial: true
    })

    camera = new PerspectiveCamera(75, 1, 0.1, 1000)
    camera.position.set(0, 0, 10)
    camera.lookAt(0, 0, 0)
    camera.updateMatrixWorld()
    camera.updateProjectionMatrix()

    scene = new Scene()
    testObjects = []

    // Create a grid of test objects
    const geometry = new BoxGeometry(1, 1, 1)
    const material = new MeshBasicMaterial({ color: 0xff0000 })

    for (let x = -5; x <= 5; x += 2) {
      for (let y = -5; y <= 5; y += 2) {
        const mesh = new Mesh(geometry, material)
        mesh.position.set(x, y, 0)
        mesh.name = `test_object_${x}_${y}`
        testObjects.push(mesh)
        scene.add(mesh)
      }
    }
  })

  describe('Full Rendering Pipeline', () => {
    it('should process objects through complete culling and rendering pipeline', () => {
      // Step 1: Convert Three.js objects to renderable objects
      const renderableObjects = getAllRenderableObjects(scene)
      expect(renderableObjects.length).toBeGreaterThan(0)

      // Step 2: Perform culling
      const cullingResult = cullingManager.performCulling(camera, testObjects)
      expect(cullingResult.totalObjects).toBe(testObjects.length)

      // Step 3: Update culling states
      updateCullingStates(
        renderableObjects,
        cullingResult.visible,
        cullingResult.culled,
        cullingResult.occluded
      )

      // Step 4: Add visible objects to render queue
      const visibleRenderables = renderableObjects.filter(obj => obj.cullingState === 'visible')
      visibleRenderables.forEach(obj => renderQueue.addObject(obj))

      // Step 5: Render
      renderQueue.render(camera)

      // Verify results
      const cullingStats = cullingManager.getStats()
      const renderStats = renderQueue.getStats()

      expect(cullingStats.totalObjects).toBeGreaterThan(0)
      expect(cullingStats.cullingTime).toBeGreaterThanOrEqual(0)
      expect(renderStats.renderTime).toBeGreaterThanOrEqual(0)
    })

    it('should handle empty scene gracefully', () => {
      const emptyScene = new Scene()
      const renderableObjects = getAllRenderableObjects(emptyScene)
      
      expect(renderableObjects.length).toBe(0)
      
      const cullingResult = cullingManager.performCulling(camera, [])
      expect(cullingResult.totalObjects).toBe(0)
      expect(cullingResult.visible.length).toBe(0)
    })

    it('should maintain performance with large object counts', () => {
      // Create many objects
      const manyObjects: Mesh[] = []
      const geometry = new BoxGeometry(0.1, 0.1, 0.1)
      const material = new MeshBasicMaterial({ color: 0x00ff00 })

      for (let i = 0; i < 100; i++) {
        const mesh = new Mesh(geometry, material)
        mesh.position.set(
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20,
          (Math.random() - 0.5) * 20
        )
        manyObjects.push(mesh)
        scene.add(mesh)
      }

      const startTime = performance.now()
      
      // Process through pipeline
      const renderableObjects = getAllRenderableObjects(scene)
      const cullingResult = cullingManager.performCulling(camera, manyObjects)
      updateCullingStates(renderableObjects, cullingResult.visible, cullingResult.culled, cullingResult.occluded)
      
      const visibleRenderables = renderableObjects.filter(obj => obj.cullingState === 'visible')
      visibleRenderables.forEach(obj => renderQueue.addObject(obj))
      renderQueue.render(camera)

      const endTime = performance.now()
      const processingTime = endTime - startTime

      // Should complete within reasonable time (adjust threshold as needed)
      expect(processingTime).toBeLessThan(100) // 100ms threshold
      expect(renderableObjects.length).toBeGreaterThan(0)
    })
  })

  describe('Culling and Rendering Coordination', () => {
    it('should coordinate culling results with render queue', () => {
      const renderableObjects = getAllRenderableObjects(scene)
      const cullingResult = cullingManager.performCulling(camera, testObjects)

      // Update states based on culling
      updateCullingStates(renderableObjects, cullingResult.visible, cullingResult.culled, cullingResult.occluded)

      // Count objects by state
      const visibleCount = renderableObjects.filter(obj => obj.cullingState === 'visible').length
      const culledCount = renderableObjects.filter(obj => obj.cullingState === 'culled').length

      expect(visibleCount + culledCount).toBe(renderableObjects.length)
      expect(visibleCount).toBe(cullingResult.visible.length)
    })

    it('should batch similar objects efficiently', () => {
      // Create objects with same material
      const sharedMaterial = new MeshBasicMaterial({ color: 0x0000ff })
      const sharedGeometry = new BoxGeometry(1, 1, 1)
      
      const similarObjects: Mesh[] = []
      for (let i = 0; i < 5; i++) {
        const mesh = new Mesh(sharedGeometry, sharedMaterial)
        mesh.position.set(i, 0, 0)
        similarObjects.push(mesh)
        scene.add(mesh)
      }

      const renderableObjects = similarObjects.map(obj => createRenderableObject(obj, 'normal')).filter(Boolean) as any[]
      
      renderableObjects.forEach(obj => renderQueue.addObject(obj))
      const batches = renderQueue.createBatches()

      // Should create fewer batches than objects due to batching
      expect(batches.length).toBeLessThanOrEqual(renderableObjects.length)
      
      // At least one batch should have multiple objects
      const batchWithMultipleObjects = batches.find(batch => batch.objects.length > 1)
      expect(batchWithMultipleObjects).toBeDefined()
    })
  })

  describe('Statistics Integration', () => {
    it('should provide comprehensive statistics across systems', () => {
      const renderableObjects = getAllRenderableObjects(scene)
      const cullingResult = cullingManager.performCulling(camera, testObjects)
      
      updateCullingStates(renderableObjects, cullingResult.visible, cullingResult.culled, cullingResult.occluded)
      
      const visibleRenderables = renderableObjects.filter(obj => obj.cullingState === 'visible')
      visibleRenderables.forEach(obj => renderQueue.addObject(obj))
      renderQueue.render(camera)

      // Get statistics from all systems
      const cullingStats = cullingManager.getStats()
      const renderStats = renderQueue.getStats()
      const calculatedStats = calculateRenderStatistics(renderableObjects)

      // Verify consistency
      expect(cullingStats.totalObjects).toBe(testObjects.length)
      expect(calculatedStats.totalObjects).toBe(renderableObjects.length)
      expect(calculatedStats.visibleObjects).toBe(visibleRenderables.length)
      
      // Verify timing information is available
      expect(cullingStats.cullingTime).toBeGreaterThanOrEqual(0)
      expect(renderStats.renderTime).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Configuration Integration', () => {
    it('should respect configuration changes across systems', () => {
      // Disable frustum culling
      cullingManager.setConfig({
        frustum: { enabled: false, margin: 0, useSphereBounds: false, updateFrequency: 1 }
      })

      // Disable batching
      renderQueue.setConfig({
        enableBatching: false
      })

      const cullingResult = cullingManager.performCulling(camera, testObjects)
      
      // With frustum culling disabled, all objects should be visible
      expect(cullingResult.visible.length).toBe(testObjects.length)
      expect(cullingResult.culled.length).toBe(0)

      const renderableObjects = getAllRenderableObjects(scene)
      renderableObjects.forEach(obj => renderQueue.addObject(obj))
      
      const batches = renderQueue.createBatches()
      
      // With batching disabled, should have one batch per object
      expect(batches.length).toBe(renderableObjects.length)
    })
  })
})