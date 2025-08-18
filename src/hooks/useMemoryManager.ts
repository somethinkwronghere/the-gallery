import { useEffect, useState, useCallback, useRef } from 'react'
import { 
  resourceManager, 
  garbageCollector, 
  memoryLeakDetector,
  MemoryUsage,
  MemoryWarning,
  CleanupConfig,
  DisposableResource
} from '../systems/memory'

export interface UseMemoryManagerOptions {
  enableAutoCleanup?: boolean
  enableLeakDetection?: boolean
  monitoringInterval?: number
  memoryThreshold?: number
}

export interface MemoryManagerState {
  memoryUsage: MemoryUsage
  warnings: MemoryWarning[]
  isMonitoring: boolean
  leakAnalysis: {
    isLeaking: boolean
    memoryGrowthRate: number
    resourceGrowthRate: number
    recommendations: string[]
  }
}

export function useMemoryManager(options: UseMemoryManagerOptions = {}) {
  const [state, setState] = useState<MemoryManagerState>({
    memoryUsage: {
      geometries: 0,
      materials: 0,
      textures: 0,
      total: 0,
      jsHeap: 0,
      jsHeapLimit: 0
    },
    warnings: [],
    isMonitoring: false,
    leakAnalysis: {
      isLeaking: false,
      memoryGrowthRate: 0,
      resourceGrowthRate: 0,
      recommendations: []
    }
  })

  const updateIntervalRef = useRef<number | null>(null)
  const warningListenerRef = useRef<((event: CustomEvent) => void) | null>(null)

  // Update memory state
  const updateMemoryState = useCallback(() => {
    const memoryUsage = resourceManager.getMemoryUsage()
    const warnings = resourceManager.getMemoryWarnings()
    const leakAnalysis = memoryLeakDetector.getCurrentAnalysis()
    const isMonitoring = memoryLeakDetector.getStats().isMonitoring

    setState(prevState => ({
      ...prevState,
      memoryUsage,
      warnings,
      leakAnalysis,
      isMonitoring
    }))
  }, [])

  // Track a resource
  const trackResource = useCallback((resource: DisposableResource, metadata?: any) => {
    return resourceManager.trackResource(resource, metadata)
  }, [])

  // Untrack a resource
  const untrackResource = useCallback((resourceId: string) => {
    resourceManager.untrackResource(resourceId)
  }, [])

  // Dispose a resource
  const disposeResource = useCallback((resourceId: string) => {
    return resourceManager.disposeResource(resourceId)
  }, [])

  // Force cleanup of unused resources
  const cleanupUnusedResources = useCallback((maxAge?: number) => {
    return resourceManager.disposeUnusedResources(maxAge)
  }, [])

  // Emergency cleanup
  const emergencyCleanup = useCallback(() => {
    return resourceManager.emergencyCleanup()
  }, [])

  // Force garbage collection
  const forceGarbageCollection = useCallback(() => {
    return garbageCollector.forceGC()
  }, [])

  // Update resource usage timestamp
  const updateResourceUsage = useCallback((resourceId: string) => {
    resourceManager.updateResourceUsage(resourceId)
  }, [])

  // Configure cleanup settings
  const setCleanupConfig = useCallback((config: Partial<CleanupConfig>) => {
    resourceManager.setCleanupConfig(config)
  }, [])

  // Start/stop monitoring
  const startMonitoring = useCallback(() => {
    resourceManager.startMonitoring()
    if (options.enableLeakDetection !== false) {
      memoryLeakDetector.startMonitoring()
    }
  }, [options.enableLeakDetection])

  const stopMonitoring = useCallback(() => {
    resourceManager.stopMonitoring()
    memoryLeakDetector.stopMonitoring()
  }, [])

  // Get memory statistics
  const getMemoryStats = useCallback(() => {
    return {
      resourceManager: resourceManager.getResourceStats(),
      garbageCollector: garbageCollector.getMemoryStats(),
      leakDetector: memoryLeakDetector.getStats()
    }
  }, [])

  // Get cleanup suggestions
  const getCleanupSuggestions = useCallback(() => {
    return garbageCollector.getSuggestedCleanupActions()
  }, [])

  // Initialize memory management
  useEffect(() => {
    // Configure resource manager
    const config: Partial<CleanupConfig> = {
      enableAutoCleanup: options.enableAutoCleanup !== false,
      enableLeakDetection: options.enableLeakDetection !== false,
      checkInterval: options.monitoringInterval || 30000,
      memoryThreshold: options.memoryThreshold || 512
    }
    
    resourceManager.setCleanupConfig(config)

    // Start monitoring
    if (options.enableAutoCleanup !== false) {
      resourceManager.startMonitoring()
    }
    
    if (options.enableLeakDetection !== false) {
      memoryLeakDetector.startMonitoring()
    }

    // Set up memory warning listener
    const handleMemoryWarning = (event: CustomEvent) => {
      console.warn('[useMemoryManager] Memory warning received:', event.detail)
      updateMemoryState()
    }

    warningListenerRef.current = handleMemoryWarning
    window.addEventListener('memoryLeakDetected', handleMemoryWarning as EventListener)

    // Set up periodic state updates
    updateMemoryState() // Initial update
    updateIntervalRef.current = window.setInterval(updateMemoryState, 5000) // Update every 5 seconds

    return () => {
      // Cleanup
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
      
      if (warningListenerRef.current) {
        window.removeEventListener('memoryLeakDetected', warningListenerRef.current as EventListener)
      }
      
      resourceManager.stopMonitoring()
      memoryLeakDetector.stopMonitoring()
    }
  }, [options, updateMemoryState])

  return {
    // State
    ...state,
    
    // Actions
    trackResource,
    untrackResource,
    disposeResource,
    cleanupUnusedResources,
    emergencyCleanup,
    forceGarbageCollection,
    updateResourceUsage,
    setCleanupConfig,
    startMonitoring,
    stopMonitoring,
    
    // Utilities
    getMemoryStats,
    getCleanupSuggestions,
    updateMemoryState
  }
}

// Specialized hook for Three.js resources
export function useThreeMemoryManager(options: UseMemoryManagerOptions = {}) {
  const memoryManager = useMemoryManager(options)
  
  // Three.js specific resource tracking
  const trackGeometry = useCallback((geometry: any) => {
    return memoryManager.trackResource(geometry, { type: 'geometry' })
  }, [memoryManager])

  const trackMaterial = useCallback((material: any) => {
    return memoryManager.trackResource(material, { type: 'material' })
  }, [memoryManager])

  const trackTexture = useCallback((texture: any) => {
    return memoryManager.trackResource(texture, { type: 'texture' })
  }, [memoryManager])

  const trackObject3D = useCallback((object: any) => {
    return memoryManager.trackResource(object, { type: 'object3d' })
  }, [memoryManager])

  return {
    ...memoryManager,
    trackGeometry,
    trackMaterial,
    trackTexture,
    trackObject3D
  }
}