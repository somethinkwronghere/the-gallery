import { 
  Camera, 
  Object3D, 
  Frustum, 
  Matrix4, 
  Box3, 
  Sphere, 
  Vector3,
  Raycaster
} from 'three'
import {
  CullingConfig,
  CullingResult,
  RenderStats,
  VisibilityState,
  RenderableObject,
  CullingManager as ICullingManager,
  VisibilityDetector
} from '../../types/rendering'

export class VisibilityDetectorImpl implements VisibilityDetector {
  private raycaster = new Raycaster()
  private tempVector = new Vector3()

  isInFrustum(frustum: Frustum, bounds: Box3 | Sphere): boolean {
    if (bounds instanceof Box3) {
      return frustum.intersectsBox(bounds)
    } else {
      return frustum.intersectsSphere(bounds)
    }
  }

  isOccluded(camera: Camera, object: Object3D, occluders: Object3D[]): boolean {
    if (occluders.length === 0) return false

    // Get object center
    const objectBounds = new Box3().setFromObject(object)
    const objectCenter = objectBounds.getCenter(this.tempVector)

    // Cast ray from camera to object
    const direction = objectCenter.clone().sub(camera.position).normalize()
    this.raycaster.set(camera.position, direction)

    // Check for intersections with occluders
    const intersections = this.raycaster.intersectObjects(occluders, true)
    
    if (intersections.length === 0) return false

    // Check if any intersection is closer than the object
    const objectDistance = camera.position.distanceTo(objectCenter)
    
    for (const intersection of intersections) {
      if (intersection.distance < objectDistance - 0.1) { // Small epsilon for floating point errors
        return true
      }
    }

    return false
  }

  isWithinDistance(camera: Camera, object: Object3D, maxDistance: number): boolean {
    const objectBounds = new Box3().setFromObject(object)
    const objectCenter = objectBounds.getCenter(this.tempVector)
    const distance = camera.position.distanceTo(objectCenter)
    return distance <= maxDistance
  }

  calculateScreenSize(camera: Camera, object: Object3D): number {
    const objectBounds = new Box3().setFromObject(object)
    const objectCenter = objectBounds.getCenter(this.tempVector)
    const distance = camera.position.distanceTo(objectCenter)
    
    if (distance === 0) return 1

    // Approximate screen size based on bounding sphere radius and distance
    const boundingSphere = objectBounds.getBoundingSphere(new Sphere())
    const angularSize = (boundingSphere.radius / distance) * 2
    
    // Convert to approximate screen space (0-1 range)
    return Math.min(angularSize, 1)
  }
}

export class CullingManager implements ICullingManager {
  private config: CullingConfig
  private stats: RenderStats
  private visibilityDetector: VisibilityDetector
  private frustum = new Frustum()
  private cameraMatrix = new Matrix4()
  private frameCount = 0

  constructor(config?: Partial<CullingConfig>) {
    this.config = {
      frustum: {
        enabled: true,
        margin: 0.1,
        useSphereBounds: false,
        updateFrequency: 1
      },
      occlusion: {
        enabled: false, // Expensive, disabled by default
        maxDistance: 100,
        raycastSamples: 5,
        occlusionThreshold: 0.8,
        updateFrequency: 5
      },
      distance: {
        enabled: true,
        maxDistance: 200,
        fadeDistance: 180,
        useSquaredDistance: true
      },
      enableBatching: true,
      maxBatchSize: 100,
      ...config
    }

    this.stats = this.createEmptyStats()
    this.visibilityDetector = new VisibilityDetectorImpl()
  }

  setConfig(config: Partial<CullingConfig>): void {
    this.config = { ...this.config, ...config }
  }

  getConfig(): CullingConfig {
    return { ...this.config }
  }

  performFrustumCulling(camera: Camera, objects: Object3D[]): CullingResult {
    const startTime = performance.now()
    
    if (!this.config.frustum.enabled) {
      return {
        visible: objects,
        culled: [],
        occluded: [],
        totalObjects: objects.length,
        cullingTime: 0
      }
    }

    // Update frustum only if needed
    if (this.frameCount % this.config.frustum.updateFrequency === 0) {
      this.cameraMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
      this.frustum.setFromProjectionMatrix(this.cameraMatrix)
    }

    const visible: Object3D[] = []
    const culled: Object3D[] = []

    for (const object of objects) {
      if (!object.visible) {
        culled.push(object)
        continue
      }

      // Get object bounds
      const bounds = this.config.frustum.useSphereBounds 
        ? new Box3().setFromObject(object).getBoundingSphere(new Sphere())
        : new Box3().setFromObject(object)

      // Apply margin to frustum bounds
      if (this.config.frustum.margin > 0 && bounds instanceof Box3) {
        bounds.expandByScalar(this.config.frustum.margin)
      }

      if (this.visibilityDetector.isInFrustum(this.frustum, bounds)) {
        visible.push(object)
      } else {
        culled.push(object)
      }
    }

    const cullingTime = performance.now() - startTime
    
    // Update stats
    this.stats.visibleObjects = visible.length
    this.stats.culledObjects = culled.length
    this.stats.cullingTime += cullingTime

    return {
      visible,
      culled,
      occluded: [],
      totalObjects: objects.length,
      cullingTime
    }
  }

  performOcclusionCulling(camera: Camera, objects: Object3D[]): CullingResult {
    const startTime = performance.now()
    
    if (!this.config.occlusion.enabled || this.frameCount % this.config.occlusion.updateFrequency !== 0) {
      return {
        visible: objects,
        culled: [],
        occluded: [],
        totalObjects: objects.length,
        cullingTime: 0
      }
    }

    const visible: Object3D[] = []
    const occluded: Object3D[] = []
    
    // Separate potential occluders (large objects close to camera)
    const occluders = objects.filter(obj => {
      const bounds = new Box3().setFromObject(obj)
      const size = bounds.getSize(new Vector3()).length()
      const distance = camera.position.distanceTo(bounds.getCenter(new Vector3()))
      return size > 5 && distance < this.config.occlusion.maxDistance / 2
    })

    for (const object of objects) {
      if (!object.visible) {
        occluded.push(object)
        continue
      }

      // Skip if object is too far for occlusion testing
      const objectBounds = new Box3().setFromObject(object)
      const objectCenter = objectBounds.getCenter(new Vector3())
      const distance = camera.position.distanceTo(objectCenter)
      
      if (distance > this.config.occlusion.maxDistance) {
        visible.push(object)
        continue
      }

      // Test occlusion
      if (this.visibilityDetector.isOccluded(camera, object, occluders)) {
        occluded.push(object)
      } else {
        visible.push(object)
      }
    }

    const cullingTime = performance.now() - startTime
    
    // Update stats
    this.stats.occludedObjects = occluded.length
    this.stats.cullingTime += cullingTime

    return {
      visible,
      culled: [],
      occluded,
      totalObjects: objects.length,
      cullingTime
    }
  }

  performDistanceCulling(camera: Camera, objects: Object3D[], maxDistance?: number): CullingResult {
    const startTime = performance.now()
    
    if (!this.config.distance.enabled) {
      return {
        visible: objects,
        culled: [],
        occluded: [],
        totalObjects: objects.length,
        cullingTime: 0
      }
    }

    const cullDistance = maxDistance || this.config.distance.maxDistance
    const visible: Object3D[] = []
    const culled: Object3D[] = []

    for (const object of objects) {
      if (!object.visible) {
        culled.push(object)
        continue
      }

      if (this.visibilityDetector.isWithinDistance(camera, object, cullDistance)) {
        visible.push(object)
      } else {
        culled.push(object)
      }
    }

    const cullingTime = performance.now() - startTime
    this.stats.cullingTime += cullingTime

    return {
      visible,
      culled,
      occluded: [],
      totalObjects: objects.length,
      cullingTime
    }
  }

  performCulling(camera: Camera, objects: Object3D[]): CullingResult {
    this.frameCount++
    const startTime = performance.now()
    
    let currentObjects = objects
    let totalCulled: Object3D[] = []
    let totalOccluded: Object3D[] = []

    // 1. Frustum culling (fastest, do first)
    if (this.config.frustum.enabled) {
      const frustumResult = this.performFrustumCulling(camera, currentObjects)
      currentObjects = frustumResult.visible
      totalCulled = totalCulled.concat(frustumResult.culled)
    }

    // 2. Distance culling
    if (this.config.distance.enabled) {
      const distanceResult = this.performDistanceCulling(camera, currentObjects)
      currentObjects = distanceResult.visible
      totalCulled = totalCulled.concat(distanceResult.culled)
    }

    // 3. Occlusion culling (most expensive, do last)
    if (this.config.occlusion.enabled) {
      const occlusionResult = this.performOcclusionCulling(camera, currentObjects)
      currentObjects = occlusionResult.visible
      totalOccluded = totalOccluded.concat(occlusionResult.occluded)
    }

    const totalCullingTime = performance.now() - startTime

    // Update comprehensive stats
    this.stats.totalObjects = objects.length
    this.stats.visibleObjects = currentObjects.length
    this.stats.culledObjects = totalCulled.length
    this.stats.occludedObjects = totalOccluded.length
    this.stats.cullingTime = totalCullingTime

    return {
      visible: currentObjects,
      culled: totalCulled,
      occluded: totalOccluded,
      totalObjects: objects.length,
      cullingTime: totalCullingTime
    }
  }

  isObjectVisible(camera: Camera, object: Object3D): boolean {
    if (!object.visible) return false

    // Quick frustum check
    if (this.config.frustum.enabled) {
      this.cameraMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
      this.frustum.setFromProjectionMatrix(this.cameraMatrix)
      
      const bounds = new Box3().setFromObject(object)
      if (!this.visibilityDetector.isInFrustum(this.frustum, bounds)) {
        return false
      }
    }

    // Distance check
    if (this.config.distance.enabled) {
      if (!this.visibilityDetector.isWithinDistance(camera, object, this.config.distance.maxDistance)) {
        return false
      }
    }

    return true
  }

  getStats(): RenderStats {
    return { ...this.stats }
  }

  resetStats(): void {
    this.stats = this.createEmptyStats()
  }

  private createEmptyStats(): RenderStats {
    return {
      totalObjects: 0,
      visibleObjects: 0,
      culledObjects: 0,
      occludedObjects: 0,
      drawCalls: 0,
      triangles: 0,
      batches: 0,
      instances: 0,
      cullingTime: 0,
      renderTime: 0
    }
  }
}