import { 
  Camera, 
  Object3D, 
  BufferGeometry, 
  Material, 
  Vector3,
  Box3,
  Sphere
} from 'three'
import {
  RenderQueue as IRenderQueue,
  RenderableObject,
  RenderBatch,
  RenderQueueConfig,
  RenderStats,
  RenderPriority,
  VisibilityState
} from '../../types/rendering'

export class RenderQueue implements IRenderQueue {
  private config: RenderQueueConfig
  private objects: Map<string, RenderableObject> = new Map()
  private batches: RenderBatch[] = []
  private stats: RenderStats
  private frameCount = 0

  constructor(config?: Partial<RenderQueueConfig>) {
    this.config = {
      enableBatching: true,
      maxBatchSize: 100,
      sortByDistance: true,
      sortByMaterial: true,
      enableInstancing: true,
      maxInstanceCount: 1000,
      ...config
    }

    this.stats = this.createEmptyStats()
  }

  setConfig(config: Partial<RenderQueueConfig>): void {
    this.config = { ...this.config, ...config }
  }

  getConfig(): RenderQueueConfig {
    return { ...this.config }
  }

  addObject(object: RenderableObject): void {
    const objectId = this.generateObjectId(object.object)
    this.objects.set(objectId, object)
    this.updateObjectStats()
  }

  removeObject(objectId: string): void {
    this.objects.delete(objectId)
    this.updateObjectStats()
  }

  clear(): void {
    this.objects.clear()
    this.batches = []
    this.resetStats()
  }

  createBatches(): RenderBatch[] {
    if (!this.config.enableBatching) {
      // Create individual batches for each object
      return Array.from(this.objects.values()).map(obj => ({
        id: this.generateObjectId(obj.object),
        objects: [obj],
        material: Array.isArray(obj.material) ? obj.material[0] : obj.material,
        geometry: obj.geometry,
        instanceCount: 1,
        priority: obj.priority,
        drawCalls: 1
      }))
    }

    const batches: RenderBatch[] = []
    const materialGroups = new Map<string, RenderableObject[]>()

    // Group objects by material for batching
    for (const object of Array.from(this.objects.values())) {
      if (object.cullingState !== 'visible') continue

      const materialKey = this.getMaterialKey(object.material)
      if (!materialGroups.has(materialKey)) {
        materialGroups.set(materialKey, [])
      }
      materialGroups.get(materialKey)!.push(object)
    }

    // Create batches from material groups
    for (const [materialKey, objects] of Array.from(materialGroups.entries())) {
      if (objects.length === 0) continue

      // Sort objects within the group
      const sortedObjects = this.sortObjectsForBatching(objects)
      
      // Split into batches based on max batch size
      for (let i = 0; i < sortedObjects.length; i += this.config.maxBatchSize) {
        const batchObjects = sortedObjects.slice(i, i + this.config.maxBatchSize)
        
        if (batchObjects.length > 0) {
          const batch: RenderBatch = {
            id: `batch_${materialKey}_${Math.floor(i / this.config.maxBatchSize)}`,
            objects: batchObjects,
            material: Array.isArray(batchObjects[0].material) ? batchObjects[0].material[0] : batchObjects[0].material,
            geometry: batchObjects[0].geometry,
            instanceCount: batchObjects.length,
            priority: this.calculateBatchPriority(batchObjects),
            drawCalls: this.calculateDrawCalls(batchObjects)
          }
          batches.push(batch)
        }
      }
    }

    this.batches = batches
    this.updateBatchStats()
    
    return batches
  }

  optimizeBatches(batches: RenderBatch[]): RenderBatch[] {
    // Sort batches by priority and material
    const optimizedBatches = [...batches]

    // Sort by priority first (immediate > high > normal > low > deferred)
    optimizedBatches.sort((a, b) => {
      const priorityOrder = { immediate: 0, high: 1, normal: 2, low: 3, deferred: 4 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })

    // Group consecutive batches with same material
    const mergedBatches: RenderBatch[] = []
    let currentBatch: RenderBatch | null = null

    for (const batch of optimizedBatches) {
      if (currentBatch && this.canMergeBatches(currentBatch, batch)) {
        // Merge batches
        currentBatch.objects = currentBatch.objects.concat(batch.objects)
        currentBatch.instanceCount += batch.instanceCount
        currentBatch.drawCalls += batch.drawCalls
      } else {
        if (currentBatch) {
          mergedBatches.push(currentBatch)
        }
        currentBatch = { ...batch }
      }
    }

    if (currentBatch) {
      mergedBatches.push(currentBatch)
    }

    return mergedBatches
  }

  sortByDistance(camera: Camera): void {
    if (!this.config.sortByDistance) return

    const cameraPosition = camera.position
    const objectsArray = Array.from(this.objects.values())

    objectsArray.sort((a, b) => {
      // Calculate distance to camera
      const distanceA = this.calculateDistanceToCamera(a, cameraPosition)
      const distanceB = this.calculateDistanceToCamera(b, cameraPosition)

      // Update distance in object
      a.distanceToCamera = distanceA
      b.distanceToCamera = distanceB

      // Sort by distance (closest first for opaque, farthest first for transparent)
      const isTransparentA = this.isMaterialTransparent(a.material)
      const isTransparentB = this.isMaterialTransparent(b.material)

      if (isTransparentA && !isTransparentB) return 1
      if (!isTransparentA && isTransparentB) return -1

      return isTransparentA ? distanceB - distanceA : distanceA - distanceB
    })

    // Update objects map with sorted order
    this.objects.clear()
    objectsArray.forEach(obj => {
      const id = this.generateObjectId(obj.object)
      this.objects.set(id, obj)
    })
  }

  sortByMaterial(): void {
    if (!this.config.sortByMaterial) return

    const objectsArray = Array.from(this.objects.values())
    
    objectsArray.sort((a, b) => {
      const materialKeyA = this.getMaterialKey(a.material)
      const materialKeyB = this.getMaterialKey(b.material)
      return materialKeyA.localeCompare(materialKeyB)
    })

    // Update objects map with sorted order
    this.objects.clear()
    objectsArray.forEach(obj => {
      const id = this.generateObjectId(obj.object)
      this.objects.set(id, obj)
    })
  }

  sortByPriority(): void {
    const objectsArray = Array.from(this.objects.values())
    const priorityOrder = { immediate: 0, high: 1, normal: 2, low: 3, deferred: 4 }
    
    objectsArray.sort((a, b) => {
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })

    // Update objects map with sorted order
    this.objects.clear()
    objectsArray.forEach(obj => {
      const id = this.generateObjectId(obj.object)
      this.objects.set(id, obj)
    })
  }

  render(camera: Camera): void {
    const startTime = performance.now()
    this.frameCount++

    // Sort objects
    this.sortByPriority()
    this.sortByDistance(camera)
    if (this.config.sortByMaterial) {
      this.sortByMaterial()
    }

    // Create and optimize batches
    const batches = this.createBatches()
    const optimizedBatches = this.optimizeBatches(batches)

    // Update render stats
    this.stats.batches = optimizedBatches.length
    this.stats.drawCalls = optimizedBatches.reduce((sum, batch) => sum + batch.drawCalls, 0)
    this.stats.instances = optimizedBatches.reduce((sum, batch) => sum + batch.instanceCount, 0)
    
    // Calculate triangles (simplified estimation)
    this.stats.triangles = Array.from(this.objects.values())
      .filter(obj => obj.cullingState === 'visible')
      .reduce((sum, obj) => {
        const geometry = obj.geometry
        const positions = geometry.attributes.position
        return sum + (positions ? positions.count / 3 : 0)
      }, 0)

    const renderTime = performance.now() - startTime
    this.stats.renderTime = renderTime

    // Note: Actual rendering would happen here in a real implementation
    // This would involve WebGL calls, shader binding, etc.
    // For now, we just update statistics
  }

  getStats(): RenderStats {
    return { ...this.stats }
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

  private resetStats(): void {
    this.stats = this.createEmptyStats()
  }

  private generateObjectId(object: Object3D): string {
    return object.uuid || `obj_${Date.now()}_${Math.random()}`
  }

  private getMaterialKey(material: Material | Material[]): string {
    if (Array.isArray(material)) {
      return material.map(m => m.uuid).join('_')
    }
    return material.uuid
  }

  private calculateDistanceToCamera(object: RenderableObject, cameraPosition: Vector3): number {
    const objectCenter = object.bounds.getCenter(new Vector3())
    return cameraPosition.distanceTo(objectCenter)
  }

  private isMaterialTransparent(material: Material | Material[]): boolean {
    if (Array.isArray(material)) {
      return material.some(m => m.transparent || m.opacity < 1)
    }
    return material.transparent || material.opacity < 1
  }

  private sortObjectsForBatching(objects: RenderableObject[]): RenderableObject[] {
    return objects.sort((a, b) => {
      // Sort by priority first
      const priorityOrder = { immediate: 0, high: 1, normal: 2, low: 3, deferred: 4 }
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff

      // Then by distance
      return a.distanceToCamera - b.distanceToCamera
    })
  }

  private calculateBatchPriority(objects: RenderableObject[]): RenderPriority {
    // Use the highest priority in the batch
    const priorities = objects.map(obj => obj.priority)
    const priorityOrder = { immediate: 0, high: 1, normal: 2, low: 3, deferred: 4 }
    
    let highestPriority: RenderPriority = 'deferred'
    let highestPriorityValue = 4

    for (const priority of priorities) {
      const value = priorityOrder[priority]
      if (value < highestPriorityValue) {
        highestPriorityValue = value
        highestPriority = priority
      }
    }

    return highestPriority
  }

  private calculateDrawCalls(objects: RenderableObject[]): number {
    // In a real implementation, this would depend on instancing capabilities
    // For now, assume 1 draw call per batch if instancing is enabled
    if (this.config.enableInstancing && objects.length > 1) {
      return 1
    }
    return objects.length
  }

  private canMergeBatches(batchA: RenderBatch, batchB: RenderBatch): boolean {
    // Can merge if same material, priority, and total size doesn't exceed limit
    return (
      batchA.material.uuid === batchB.material.uuid &&
      batchA.priority === batchB.priority &&
      batchA.instanceCount + batchB.instanceCount <= this.config.maxInstanceCount
    )
  }

  private updateBatchStats(): void {
    this.stats.totalObjects = this.objects.size
    this.stats.visibleObjects = Array.from(this.objects.values())
      .filter(obj => obj.cullingState === 'visible').length
    this.stats.batches = this.batches.length
  }

  private updateObjectStats(): void {
    this.stats.totalObjects = this.objects.size
    this.stats.visibleObjects = Array.from(this.objects.values())
      .filter(obj => obj.cullingState === 'visible').length
  }
}