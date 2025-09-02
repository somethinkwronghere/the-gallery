import { BufferGeometry, Material, Texture, Object3D } from 'three'
import { resourceManager } from '../systems/memory/ResourceManager'
import { garbageCollector } from '../systems/memory/GarbageCollector'
import { memoryLeakDetector } from '../systems/memory/MemoryLeakDetector'

export interface SimpleMemoryStats {
  totalMemoryMB: number
  textureMemoryMB: number
  geometryMemoryMB: number
  jsHeapMB: number
  resourceCount: number
  isMemoryPressure: boolean
}

export interface SimpleCleanupConfig {
  autoCleanupEnabled: boolean
  memoryThresholdMB: number
  cleanupIntervalMs: number
  aggressiveMode: boolean
}

/**
 * Simplified memory manager that consolidates the existing memory system
 * into an easy-to-use interface with automatic cleanup
 */
export class SimpleMemoryManager {
  private config: SimpleCleanupConfig = {
    autoCleanupEnabled: true,
    memoryThresholdMB: 400,
    cleanupIntervalMs: 30000, // 30 seconds
    aggressiveMode: false
  }

  private cleanupInterval: number | null = null
  private componentCleanupMap = new Map<string, () => void>()
  private isInitialized = false

  constructor() {
    this.initialize()
  }

  private initialize(): void {
    if (this.isInitialized) return

    // Start the existing resource manager monitoring
    resourceManager.startMonitoring()
    
    // Start memory leak detection
    memoryLeakDetector.startMonitoring()
    
    // Set up automatic cleanup
    this.startAutoCleanup()
    
    // Listen for memory warnings
    this.setupMemoryWarningListener()
    
    this.isInitialized = true
    console.info('[SimpleMemoryManager] Initialized with automatic cleanup')
  }

  private setupMemoryWarningListener(): void {
    window.addEventListener('memoryLeakDetected', ((event: CustomEvent) => {
      console.warn('[SimpleMemoryManager] Memory leak detected, performing cleanup')
      this.performEmergencyCleanup()
    }) as EventListener)
  }

  private startAutoCleanup(): void {
    if (this.cleanupInterval) return

    this.cleanupInterval = window.setInterval(() => {
      if (!this.config.autoCleanupEnabled) return

      const stats = this.getMemoryStats()
      
      if (stats.isMemoryPressure || stats.totalMemoryMB > this.config.memoryThresholdMB) {
        console.info('[SimpleMemoryManager] Memory threshold exceeded, performing cleanup')
        this.performCleanup()
      }
    }, this.config.cleanupIntervalMs)
  }

  /**
   * Track a resource for automatic disposal
   */
  trackResource(resource: BufferGeometry | Material | Texture | Object3D, componentId?: string): string {
    const resourceId = resourceManager.trackResource(resource)
    
    // If component ID provided, associate cleanup with component
    if (componentId) {
      const existingCleanup = this.componentCleanupMap.get(componentId)
      const newCleanup = () => {
        resourceManager.disposeResource(resourceId)
        if (existingCleanup) existingCleanup()
      }
      this.componentCleanupMap.set(componentId, newCleanup)
    }
    
    return resourceId
  }

  /**
   * Register cleanup function for a component
   * This ensures resources are cleaned up when component unmounts
   */
  registerComponentCleanup(componentId: string, cleanupFn: () => void): void {
    const existingCleanup = this.componentCleanupMap.get(componentId)
    
    const combinedCleanup = () => {
      try {
        cleanupFn()
      } catch (error) {
        console.warn(`[SimpleMemoryManager] Error in component cleanup for ${componentId}:`, error)
      }
      
      if (existingCleanup) {
        try {
          existingCleanup()
        } catch (error) {
          console.warn(`[SimpleMemoryManager] Error in existing cleanup for ${componentId}:`, error)
        }
      }
    }
    
    this.componentCleanupMap.set(componentId, combinedCleanup)
  }

  /**
   * Clean up resources for a specific component
   * Call this in component unmount
   */
  cleanupComponent(componentId: string): void {
    const cleanup = this.componentCleanupMap.get(componentId)
    if (cleanup) {
      cleanup()
      this.componentCleanupMap.delete(componentId)
      console.debug(`[SimpleMemoryManager] Cleaned up component: ${componentId}`)
    }
  }

  /**
   * Perform regular cleanup of unused resources
   */
  performCleanup(): void {
    const beforeStats = this.getMemoryStats()
    
    // Clean up unused resources (older than 2 minutes)
    const disposedCount = resourceManager.disposeUnusedResources(2 * 60 * 1000)
    
    // Force garbage collection if available
    garbageCollector.forceGC()
    
    const afterStats = this.getMemoryStats()
    const savedMB = beforeStats.totalMemoryMB - afterStats.totalMemoryMB
    
    console.info(`[SimpleMemoryManager] Cleanup completed: disposed ${disposedCount} resources, saved ${savedMB.toFixed(1)}MB`)
  }

  /**
   * Perform emergency cleanup when memory pressure is critical
   */
  performEmergencyCleanup(): void {
    console.warn('[SimpleMemoryManager] Emergency cleanup initiated!')
    
    // Enable aggressive mode temporarily
    const wasAggressive = this.config.aggressiveMode
    this.config.aggressiveMode = true
    
    // Emergency cleanup through resource manager
    const disposedCount = resourceManager.emergencyCleanup()
    
    // Force multiple GC cycles
    for (let i = 0; i < 3; i++) {
      setTimeout(() => garbageCollector.forceGC(), i * 100)
    }
    
    // Restore aggressive mode setting
    this.config.aggressiveMode = wasAggressive
    
    console.warn(`[SimpleMemoryManager] Emergency cleanup disposed ${disposedCount} resources`)
  }

  /**
   * Get simplified memory statistics
   */
  getMemoryStats(): SimpleMemoryStats {
    const memoryUsage = resourceManager.getMemoryUsage()
    const isMemoryPressure = garbageCollector.isMemoryPressure()
    const resourceStats = resourceManager.getResourceStats()
    
    return {
      totalMemoryMB: memoryUsage.total,
      textureMemoryMB: memoryUsage.textures,
      geometryMemoryMB: memoryUsage.geometries,
      jsHeapMB: memoryUsage.jsHeap,
      resourceCount: resourceStats.total,
      isMemoryPressure
    }
  }

  /**
   * Get memory warnings and recommendations
   */
  getMemoryWarnings(): Array<{
    level: 'low' | 'medium' | 'high' | 'critical'
    message: string
    recommendations: string[]
  }> {
    const warnings = resourceManager.getMemoryWarnings()
    const gcSuggestions = garbageCollector.getSuggestedCleanupActions()
    
    const result = warnings.map(warning => ({
      level: warning.level,
      message: warning.message,
      recommendations: [...warning.recommendations, ...gcSuggestions]
    }))
    
    // Add general recommendations if no specific warnings
    if (result.length === 0 && gcSuggestions.length > 0) {
      result.push({
        level: 'low' as const,
        message: 'Memory optimization suggestions available',
        recommendations: gcSuggestions
      })
    }
    
    return result
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SimpleCleanupConfig>): void {
    this.config = { ...this.config, ...config }
    
    // Update underlying systems
    resourceManager.setCleanupConfig({
      enableAutoCleanup: this.config.autoCleanupEnabled,
      memoryThreshold: this.config.memoryThresholdMB,
      checkInterval: this.config.cleanupIntervalMs,
      maxUnusedTime: this.config.aggressiveMode ? 60000 : 120000, // 1-2 minutes
      enableLeakDetection: true
    })
    
    // Restart auto cleanup with new interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
      this.startAutoCleanup()
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): SimpleCleanupConfig {
    return { ...this.config }
  }

  /**
   * Dispose of the memory manager
   */
  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    
    // Clean up all tracked components
    const componentIds = Array.from(this.componentCleanupMap.keys())
    componentIds.forEach(componentId => {
      this.cleanupComponent(componentId)
    })
    
    // Stop underlying systems
    resourceManager.stopMonitoring()
    memoryLeakDetector.stopMonitoring()
    
    this.isInitialized = false
    console.info('[SimpleMemoryManager] Disposed')
  }
}

// Singleton instance
export const simpleMemoryManager = new SimpleMemoryManager()