import { Vector3, Matrix4, Camera, Object3D, BufferGeometry, Material, Frustum, Box3, Sphere, InstancedMesh, Mesh } from 'three'

// Culling types
export type CullingType = 'frustum' | 'occlusion' | 'distance' | 'lod'

// Visibility state
export type VisibilityState = 'visible' | 'culled' | 'occluded' | 'distant'

// Render priority levels
export type RenderPriority = 'immediate' | 'high' | 'normal' | 'low' | 'deferred'

// Culling result interface
export interface CullingResult {
  visible: Object3D[]
  culled: Object3D[]
  occluded: Object3D[]
  totalObjects: number
  cullingTime: number
}

// Frustum culling configuration
export interface FrustumCullingConfig {
  enabled: boolean
  margin: number // Extra margin for frustum bounds
  useSphereBounds: boolean // Use sphere bounds for faster culling
  updateFrequency: number // How often to update culling (in frames)
}

// Occlusion culling configuration
export interface OcclusionCullingConfig {
  enabled: boolean
  maxDistance: number
  raycastSamples: number
  occlusionThreshold: number
  updateFrequency: number
}

// Distance culling configuration
export interface DistanceCullingConfig {
  enabled: boolean
  maxDistance: number
  fadeDistance: number
  useSquaredDistance: boolean
}

// Culling configuration
export interface CullingConfig {
  frustum: FrustumCullingConfig
  occlusion: OcclusionCullingConfig
  distance: DistanceCullingConfig
  enableBatching: boolean
  maxBatchSize: number
}

// Renderable object interface
export interface RenderableObject {
  object: Object3D
  geometry: BufferGeometry
  material: Material | Material[]
  bounds: Box3
  boundingSphere: Sphere
  priority: RenderPriority
  lastVisible: number
  cullingState: VisibilityState
  distanceToCamera: number
  screenSize: number
}

// Render batch interface
export interface RenderBatch {
  id: string
  objects: RenderableObject[]
  material: Material
  geometry: BufferGeometry
  instanceCount: number
  priority: RenderPriority
  drawCalls: number
}

// Render queue configuration
export interface RenderQueueConfig {
  enableBatching: boolean
  maxBatchSize: number
  sortByDistance: boolean
  sortByMaterial: boolean
  enableInstancing: boolean
  maxInstanceCount: number
}

// Render statistics
export interface RenderStats {
  totalObjects: number
  visibleObjects: number
  culledObjects: number
  occludedObjects: number
  drawCalls: number
  triangles: number
  batches: number
  instances: number
  cullingTime: number
  renderTime: number
}

// Culling manager interface
export interface CullingManager {
  // Configuration
  setConfig(config: Partial<CullingConfig>): void
  getConfig(): CullingConfig
  
  // Frustum culling
  performFrustumCulling(camera: Camera, objects: Object3D[]): CullingResult
  
  // Occlusion culling
  performOcclusionCulling(camera: Camera, objects: Object3D[]): CullingResult
  
  // Distance culling
  performDistanceCulling(camera: Camera, objects: Object3D[], maxDistance: number): CullingResult
  
  // Combined culling
  performCulling(camera: Camera, objects: Object3D[]): CullingResult
  
  // Visibility detection
  isObjectVisible(camera: Camera, object: Object3D): boolean
  
  // Statistics
  getStats(): RenderStats
  resetStats(): void
}

// Render queue interface
export interface RenderQueue {
  // Configuration
  setConfig(config: Partial<RenderQueueConfig>): void
  getConfig(): RenderQueueConfig
  
  // Queue management
  addObject(object: RenderableObject): void
  removeObject(objectId: string): void
  clear(): void
  
  // Batching
  createBatches(): RenderBatch[]
  optimizeBatches(batches: RenderBatch[]): RenderBatch[]
  
  // Sorting
  sortByDistance(camera: Camera): void
  sortByMaterial(): void
  sortByPriority(): void
  
  // Rendering
  render(camera: Camera): void
  
  // Statistics
  getStats(): RenderStats
}

// Visibility detector interface
export interface VisibilityDetector {
  // Frustum testing
  isInFrustum(frustum: Frustum, bounds: Box3 | Sphere): boolean
  
  // Occlusion testing
  isOccluded(camera: Camera, object: Object3D, occluders: Object3D[]): boolean
  
  // Distance testing
  isWithinDistance(camera: Camera, object: Object3D, maxDistance: number): boolean
  
  // Screen size calculation
  calculateScreenSize(camera: Camera, object: Object3D): number
}

// Render context interface
export interface RenderContext {
  camera: Camera
  scene: Object3D
  cullingManager: CullingManager
  renderQueue: RenderQueue
  visibilityDetector: VisibilityDetector
  stats: RenderStats
}

// Instance data interface
export interface InstanceData {
  id: string
  matrix: Matrix4
  visible: boolean
  userData?: any
}

// Instance group interface
export interface InstanceGroup {
  id: string
  originalMesh: Mesh
  instancedMesh: InstancedMesh
  instances: Map<string, InstanceData>
  maxInstances: number
  currentCount: number
  needsUpdate: boolean
}

// Instance pool interface
export interface InstancePool {
  geometry: BufferGeometry
  material: Material
  maxInstances: number
  availableInstances: string[]
  usedInstances: Set<string>
  instancedMesh: InstancedMesh
}

// Instance manager configuration
export interface InstanceManagerConfig {
  maxInstancesPerGroup: number
  enableObjectPooling: boolean
  autoUpdateMatrices: boolean
  frustumCulling: boolean
  updateFrequency: number
}

// Instance manager interface
export interface InstanceManager {
  // Configuration
  setConfig(config: Partial<InstanceManagerConfig>): void
  getConfig(): InstanceManagerConfig
  
  // Instance group management
  createInstanceGroup(originalMesh: Mesh, maxInstances?: number): string
  removeInstanceGroup(groupId: string): void
  getInstanceGroup(groupId: string): InstanceGroup | null
  
  // Instance management
  createInstance(groupId: string, matrix: Matrix4, userData?: any): string
  updateInstance(groupId: string, instanceId: string, matrix: Matrix4): void
  removeInstance(groupId: string, instanceId: string): void
  setInstanceVisibility(groupId: string, instanceId: string, visible: boolean): void
  
  // Object pooling
  createPool(geometry: BufferGeometry, material: Material, maxInstances: number): string
  getInstanceFromPool(poolId: string): string | null
  returnInstanceToPool(poolId: string, instanceId: string): void
  
  // Batch operations
  updateAllMatrices(): void
  performFrustumCulling(camera: Camera): void
  
  // Statistics
  getInstanceStats(): InstanceStats
  resetStats(): void
}

// Instance statistics
export interface InstanceStats {
  totalGroups: number
  totalInstances: number
  visibleInstances: number
  culledInstances: number
  drawCallsSaved: number
  memoryUsage: number
  poolsActive: number
  poolsAvailable: number
}

// Rendering context type (for React context)
export interface RenderingContextType {
  // Culling
  performCulling: (camera: Camera, objects: Object3D[]) => CullingResult
  isObjectVisible: (camera: Camera, object: Object3D) => boolean
  setCullingConfig: (config: Partial<CullingConfig>) => void
  
  // Render Queue
  addToRenderQueue: (object: RenderableObject) => void
  removeFromRenderQueue: (objectId: string) => void
  clearRenderQueue: () => void
  render: (camera: Camera) => void
  setRenderQueueConfig: (config: Partial<RenderQueueConfig>) => void
  
  // Instancing
  createInstanceGroup: (originalMesh: Mesh, maxInstances?: number) => string
  createInstance: (groupId: string, matrix: Matrix4, userData?: any) => string
  updateInstance: (groupId: string, instanceId: string, matrix: Matrix4) => void
  removeInstance: (groupId: string, instanceId: string) => void
  setInstanceManagerConfig: (config: Partial<InstanceManagerConfig>) => void
  
  // Statistics
  getCullingStats: () => RenderStats
  getRenderStats: () => RenderStats
  getInstanceStats: () => InstanceStats
  resetStats: () => void
  
  // Managers
  cullingManager: CullingManager
  renderQueue: RenderQueue
  instanceManager: InstanceManager
  
  // Context specific
  isEnabled: boolean
  setEnabled: (enabled: boolean) => void
}