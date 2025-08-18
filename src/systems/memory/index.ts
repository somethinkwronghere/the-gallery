// Memory management system exports
export { ResourceManager, resourceManager } from './ResourceManager'
export { GarbageCollector, garbageCollector } from './GarbageCollector'
export { 
  ResourcePool, 
  createGeometryPool, 
  createMaterialPool, 
  createTexturePool 
} from './ResourcePool'
export { MemoryLeakDetector, memoryLeakDetector } from './MemoryLeakDetector'

// Re-export types
export type {
  MemoryUsage,
  DisposableResource,
  ResourceMetadata,
  MemoryLeakInfo,
  MemoryWarning,
  MemoryWarningLevel,
  CleanupConfig,
  ResourceManager as IResourceManager,
  GarbageCollector as IGarbageCollector,
  ResourcePool as IResourcePool
} from '../../types/memory'