import { 
  Matrix4, 
  InstancedMesh, 
  Mesh, 
  BufferGeometry, 
  Material, 
  Camera,
  Frustum,
  Vector3,
  Box3
} from 'three'
import {
  InstanceManager as IInstanceManager,
  InstanceGroup,
  InstanceData,
  InstancePool,
  InstanceManagerConfig,
  InstanceStats
} from '../../types/rendering'

export class InstanceManager implements IInstanceManager {
  private config: InstanceManagerConfig
  private instanceGroups: Map<string, InstanceGroup> = new Map()
  private objectPools: Map<string, InstancePool> = new Map()
  private stats: InstanceStats
  private frameCount = 0
  private tempMatrix = new Matrix4()
  private tempVector = new Vector3()
  private tempBox = new Box3()

  constructor(config?: Partial<InstanceManagerConfig>) {
    this.config = {
      maxInstancesPerGroup: 1000,
      enableObjectPooling: true,
      autoUpdateMatrices: true,
      frustumCulling: true,
      updateFrequency: 1, // Update every frame
      ...config
    }

    this.stats = this.createEmptyStats()
  }

  setConfig(config: Partial<InstanceManagerConfig>): void {
    this.config = { ...this.config, ...config }
  }

  getConfig(): InstanceManagerConfig {
    return { ...this.config }
  }

  createInstanceGroup(originalMesh: Mesh, maxInstances?: number): string {
    const groupId = this.generateGroupId()
    const instanceCount = maxInstances || this.config.maxInstancesPerGroup

    // Create instanced mesh from original
    const instancedMesh = new InstancedMesh(
      originalMesh.geometry,
      originalMesh.material,
      instanceCount
    )

    // Copy properties from original mesh
    instancedMesh.position.copy(originalMesh.position)
    instancedMesh.rotation.copy(originalMesh.rotation)
    instancedMesh.scale.copy(originalMesh.scale)
    instancedMesh.castShadow = originalMesh.castShadow
    instancedMesh.receiveShadow = originalMesh.receiveShadow
    instancedMesh.frustumCulled = this.config.frustumCulling

    const instanceGroup: InstanceGroup = {
      id: groupId,
      originalMesh,
      instancedMesh,
      instances: new Map(),
      maxInstances: instanceCount,
      currentCount: 0,
      needsUpdate: false
    }

    this.instanceGroups.set(groupId, instanceGroup)
    this.updateStats()

    return groupId
  }

  removeInstanceGroup(groupId: string): void {
    const group = this.instanceGroups.get(groupId)
    if (!group) return

    // Dispose of the instanced mesh
    group.instancedMesh.dispose()
    
    // Clear instances
    group.instances.clear()
    
    // Remove from groups
    this.instanceGroups.delete(groupId)
    this.updateStats()
  }

  getInstanceGroup(groupId: string): InstanceGroup | null {
    return this.instanceGroups.get(groupId) || null
  }

  createInstance(groupId: string, matrix: Matrix4, userData?: any): string {
    const group = this.instanceGroups.get(groupId)
    if (!group) {
      throw new Error(`Instance group ${groupId} not found`)
    }

    if (group.currentCount >= group.maxInstances) {
      throw new Error(`Maximum instances reached for group ${groupId}`)
    }

    const instanceId = this.generateInstanceId()
    const instanceData: InstanceData = {
      id: instanceId,
      matrix: matrix.clone(),
      visible: true,
      userData
    }

    group.instances.set(instanceId, instanceData)
    group.currentCount++
    group.needsUpdate = true

    // Set the matrix for this instance
    group.instancedMesh.setMatrixAt(group.currentCount - 1, matrix)
    
    this.updateStats()
    return instanceId
  }

  updateInstance(groupId: string, instanceId: string, matrix: Matrix4): void {
    const group = this.instanceGroups.get(groupId)
    if (!group) return

    const instance = group.instances.get(instanceId)
    if (!instance) return

    instance.matrix.copy(matrix)
    group.needsUpdate = true

    // Find the index of this instance and update the matrix
    const instanceIndex = this.getInstanceIndex(group, instanceId)
    if (instanceIndex !== -1) {
      group.instancedMesh.setMatrixAt(instanceIndex, matrix)
    }
  }

  removeInstance(groupId: string, instanceId: string): void {
    const group = this.instanceGroups.get(groupId)
    if (!group) return

    const instance = group.instances.get(instanceId)
    if (!instance) return

    const instanceIndex = this.getInstanceIndex(group, instanceId)
    if (instanceIndex !== -1) {
      // Move the last instance to this position to avoid gaps
      const lastIndex = group.currentCount - 1
      if (instanceIndex !== lastIndex) {
        group.instancedMesh.getMatrixAt(lastIndex, this.tempMatrix)
        group.instancedMesh.setMatrixAt(instanceIndex, this.tempMatrix)
      }
    }

    group.instances.delete(instanceId)
    group.currentCount--
    group.needsUpdate = true
    
    // Update the instance count on the mesh
    group.instancedMesh.count = group.currentCount
    
    this.updateStats()
  }

  setInstanceVisibility(groupId: string, instanceId: string, visible: boolean): void {
    const group = this.instanceGroups.get(groupId)
    if (!group) return

    const instance = group.instances.get(instanceId)
    if (!instance) return

    instance.visible = visible
    group.needsUpdate = true

    // If making invisible, move to a position far away (simple culling)
    if (!visible) {
      const instanceIndex = this.getInstanceIndex(group, instanceId)
      if (instanceIndex !== -1) {
        this.tempMatrix.makeTranslation(10000, 10000, 10000)
        group.instancedMesh.setMatrixAt(instanceIndex, this.tempMatrix)
      }
    } else {
      // Restore original matrix
      const instanceIndex = this.getInstanceIndex(group, instanceId)
      if (instanceIndex !== -1) {
        group.instancedMesh.setMatrixAt(instanceIndex, instance.matrix)
      }
    }
  }

  createPool(geometry: BufferGeometry, material: Material, maxInstances: number): string {
    const poolId = this.generatePoolId()
    
    const instancedMesh = new InstancedMesh(geometry, material, maxInstances)
    instancedMesh.frustumCulled = this.config.frustumCulling

    const pool: InstancePool = {
      geometry,
      material,
      maxInstances,
      availableInstances: Array.from({ length: maxInstances }, (_, i) => `pool_${poolId}_${i}`),
      usedInstances: new Set(),
      instancedMesh
    }

    this.objectPools.set(poolId, pool)
    this.updateStats()

    return poolId
  }

  getInstanceFromPool(poolId: string): string | null {
    if (!this.config.enableObjectPooling) return null

    const pool = this.objectPools.get(poolId)
    if (!pool || pool.availableInstances.length === 0) return null

    const instanceId = pool.availableInstances.pop()!
    pool.usedInstances.add(instanceId)

    return instanceId
  }

  returnInstanceToPool(poolId: string, instanceId: string): void {
    if (!this.config.enableObjectPooling) return

    const pool = this.objectPools.get(poolId)
    if (!pool || !pool.usedInstances.has(instanceId)) return

    pool.usedInstances.delete(instanceId)
    pool.availableInstances.push(instanceId)

    // Reset the instance matrix to hide it
    const instanceIndex = parseInt(instanceId.split('_').pop() || '0')
    this.tempMatrix.makeTranslation(10000, 10000, 10000)
    pool.instancedMesh.setMatrixAt(instanceIndex, this.tempMatrix)
    pool.instancedMesh.instanceMatrix.needsUpdate = true
  }

  updateAllMatrices(): void {
    if (!this.config.autoUpdateMatrices) return

    this.frameCount++
    
    // Only update if frequency allows
    if (this.frameCount % this.config.updateFrequency !== 0) return

    Array.from(this.instanceGroups.values()).forEach(group => {
      if (group.needsUpdate) {
        group.instancedMesh.instanceMatrix.needsUpdate = true
        group.needsUpdate = false
      }
    })

    Array.from(this.objectPools.values()).forEach(pool => {
      pool.instancedMesh.instanceMatrix.needsUpdate = true
    })
  }

  performFrustumCulling(camera: Camera): void {
    if (!this.config.frustumCulling) return

    const frustum = new Frustum()
    frustum.setFromProjectionMatrix(
      this.tempMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
    )

    let culledCount = 0

    Array.from(this.instanceGroups.values()).forEach(group => {
      const entries = Array.from(group.instances.entries()) as Array<[string, InstanceData]>
      entries.forEach(entry => {
        const [instanceId, instance] = entry
        // Extract position from matrix
        this.tempVector.setFromMatrixPosition(instance.matrix)
        
        // Create a bounding box around the instance
        this.tempBox.setFromCenterAndSize(
          this.tempVector,
          new Vector3(1, 1, 1) // Simplified bounding size
        )

        const wasVisible = instance.visible
        const isVisible = frustum.intersectsBox(this.tempBox)
        
        if (wasVisible !== isVisible) {
          this.setInstanceVisibility(group.id, instanceId, isVisible)
          if (!isVisible) culledCount++
        }
      })
    })

    this.stats.culledInstances = culledCount
  }

  getInstanceStats(): InstanceStats {
    return { ...this.stats }
  }

  resetStats(): void {
    this.stats = this.createEmptyStats()
  }

  // Helper methods
  private createEmptyStats(): InstanceStats {
    return {
      totalGroups: 0,
      totalInstances: 0,
      visibleInstances: 0,
      culledInstances: 0,
      drawCallsSaved: 0,
      memoryUsage: 0,
      poolsActive: 0,
      poolsAvailable: 0
    }
  }

  private updateStats(): void {
    this.stats.totalGroups = this.instanceGroups.size
    this.stats.totalInstances = Array.from(this.instanceGroups.values())
      .reduce((sum, group) => sum + group.currentCount, 0)
    
    this.stats.visibleInstances = Array.from(this.instanceGroups.values())
      .reduce((sum, group) => {
        return sum + Array.from(group.instances.values())
          .filter(instance => instance.visible).length
      }, 0)

    // Calculate draw calls saved (instances - groups)
    this.stats.drawCallsSaved = Math.max(0, this.stats.totalInstances - this.stats.totalGroups)

    // Pool statistics
    this.stats.poolsActive = this.objectPools.size
    this.stats.poolsAvailable = Array.from(this.objectPools.values())
      .reduce((sum, pool) => sum + pool.availableInstances.length, 0)

    // Simplified memory usage calculation
    this.stats.memoryUsage = this.stats.totalInstances * 64 // 64 bytes per matrix
  }

  private generateGroupId(): string {
    return `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateInstanceId(): string {
    return `instance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generatePoolId(): string {
    return `pool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getInstanceIndex(group: InstanceGroup, instanceId: string): number {
    const instanceIds = Array.from(group.instances.keys())
    return instanceIds.indexOf(instanceId)
  }

  // Public method to get all instance groups (for integration with render queue)
  public getAllInstanceGroups(): InstanceGroup[] {
    return Array.from(this.instanceGroups.values())
  }

  // Public method to get all pools (for integration with render queue)
  public getAllPools(): InstancePool[] {
    return Array.from(this.objectPools.values())
  }
}