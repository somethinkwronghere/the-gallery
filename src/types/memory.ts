import { BufferGeometry, Material, Texture, Object3D } from 'three'

// Memory usage tracking
export interface MemoryUsage {
  geometries: number
  materials: number
  textures: number
  total: number
  jsHeap: number
  jsHeapLimit: number
}

// Resource types that can be tracked and disposed
export type DisposableResource = BufferGeometry | Material | Texture | Object3D

// Resource metadata for tracking
export interface ResourceMetadata {
  id: string
  type: 'geometry' | 'material' | 'texture' | 'object3d'
  size: number
  createdAt: number
  lastUsed: number
  refCount: number
  disposed: boolean
}

// Memory leak detection result
export interface MemoryLeakInfo {
  resourceId: string
  type: string
  size: number
  age: number
  refCount: number
  suspected: boolean
}

// Memory warning levels
export type MemoryWarningLevel = 'low' | 'medium' | 'high' | 'critical'

// Memory warning information
export interface MemoryWarning {
  level: MemoryWarningLevel
  message: string
  currentUsage: number
  threshold: number
  recommendations: string[]
  timestamp: number
}

// Resource cleanup configuration
export interface CleanupConfig {
  maxAge: number // Maximum age in milliseconds before cleanup
  maxUnusedTime: number // Maximum time unused before cleanup
  memoryThreshold: number // Memory threshold in MB for emergency cleanup
  checkInterval: number // Interval for cleanup checks in milliseconds
  enableAutoCleanup: boolean
  enableLeakDetection: boolean
}

// Resource manager interface
export interface ResourceManager {
  // Resource tracking
  trackResource(resource: DisposableResource, metadata?: Partial<ResourceMetadata>): string
  untrackResource(resourceId: string): void
  
  // Resource disposal
  disposeResource(resourceId: string): boolean
  disposeUnusedResources(maxAge?: number): number
  emergencyCleanup(): number
  
  // Memory monitoring
  getMemoryUsage(): MemoryUsage
  checkMemoryLeaks(): MemoryLeakInfo[]
  getMemoryWarnings(): MemoryWarning[]
  
  // Configuration
  setCleanupConfig(config: Partial<CleanupConfig>): void
  getCleanupConfig(): CleanupConfig
  
  // Lifecycle
  startMonitoring(): void
  stopMonitoring(): void
  dispose(): void
}

// Garbage collection utilities
export interface GarbageCollector {
  // Force garbage collection if available
  forceGC(): boolean
  
  // Memory pressure detection
  isMemoryPressure(): boolean
  
  // Cleanup suggestions
  getSuggestedCleanupActions(): string[]
}

// Resource pool for reusing objects
export interface ResourcePool<T extends DisposableResource> {
  // Get resource from pool or create new
  acquire(): T
  
  // Return resource to pool
  release(resource: T): void
  
  // Clear pool
  clear(): void
  
  // Pool statistics
  getStats(): {
    total: number
    available: number
    inUse: number
  }
}