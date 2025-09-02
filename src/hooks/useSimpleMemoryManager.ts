import { useEffect, useRef, useCallback, useState } from 'react'
import { BufferGeometry, Material, Texture, Object3D } from 'three'
import { simpleMemoryManager, SimpleMemoryStats } from '../utils/SimpleMemoryManager'

export interface UseSimpleMemoryManagerOptions {
  componentId?: string
  enableAutoCleanup?: boolean
  trackMemoryStats?: boolean
  memoryStatsInterval?: number
}

export interface UseSimpleMemoryManagerReturn {
  // Resource tracking
  trackResource: (resource: BufferGeometry | Material | Texture | Object3D) => string
  
  // Manual cleanup
  performCleanup: () => void
  performEmergencyCleanup: () => void
  
  // Memory stats (if enabled)
  memoryStats: SimpleMemoryStats | null
  
  // Warnings
  warnings: Array<{
    level: 'low' | 'medium' | 'high' | 'critical'
    message: string
    recommendations: string[]
  }>
  
  // Configuration
  updateConfig: (config: { autoCleanupEnabled?: boolean; memoryThresholdMB?: number }) => void
}

/**
 * React hook for simplified memory management
 * Automatically handles component cleanup on unmount
 */
export function useSimpleMemoryManager(options: UseSimpleMemoryManagerOptions = {}): UseSimpleMemoryManagerReturn {
  const {
    componentId = `component_${Math.random().toString(36).substr(2, 9)}`,
    enableAutoCleanup = true,
    trackMemoryStats = false,
    memoryStatsInterval = 5000 // 5 seconds
  } = options

  const [memoryStats, setMemoryStats] = useState<SimpleMemoryStats | null>(null)
  const [warnings, setWarnings] = useState<Array<{
    level: 'low' | 'medium' | 'high' | 'critical'
    message: string
    recommendations: string[]
  }>>([])

  const cleanupFunctionsRef = useRef<Array<() => void>>([])
  const statsIntervalRef = useRef<number | null>(null)

  // Track a resource and associate it with this component
  const trackResource = useCallback((resource: BufferGeometry | Material | Texture | Object3D): string => {
    const resourceId = simpleMemoryManager.trackResource(resource, componentId)
    
    // Add cleanup function for this resource
    const cleanup = () => {
      // Resource cleanup is handled by the memory manager
      // This is just for additional component-specific cleanup if needed
    }
    cleanupFunctionsRef.current.push(cleanup)
    
    return resourceId
  }, [componentId])

  // Manual cleanup functions
  const performCleanup = useCallback(() => {
    simpleMemoryManager.performCleanup()
  }, [])

  const performEmergencyCleanup = useCallback(() => {
    simpleMemoryManager.performEmergencyCleanup()
  }, [])

  // Update configuration
  const updateConfig = useCallback((config: { autoCleanupEnabled?: boolean; memoryThresholdMB?: number }) => {
    const currentConfig = simpleMemoryManager.getConfig()
    simpleMemoryManager.updateConfig({
      ...currentConfig,
      ...config
    })
  }, [])

  // Set up memory stats tracking
  useEffect(() => {
    if (!trackMemoryStats) return

    const updateStats = () => {
      try {
        const stats = simpleMemoryManager.getMemoryStats()
        setMemoryStats(stats)
        
        const currentWarnings = simpleMemoryManager.getMemoryWarnings()
        setWarnings(currentWarnings)
      } catch (error) {
        console.warn('[useSimpleMemoryManager] Error updating memory stats:', error)
      }
    }

    // Initial update
    updateStats()

    // Set up interval
    statsIntervalRef.current = window.setInterval(updateStats, memoryStatsInterval)

    return () => {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current)
        statsIntervalRef.current = null
      }
    }
  }, [trackMemoryStats, memoryStatsInterval])

  // Register component cleanup
  useEffect(() => {
    if (!enableAutoCleanup) return

    const componentCleanup = () => {
      // Execute all cleanup functions
      cleanupFunctionsRef.current.forEach(cleanup => {
        try {
          cleanup()
        } catch (error) {
          console.warn('[useSimpleMemoryManager] Error in cleanup function:', error)
        }
      })
      cleanupFunctionsRef.current = []
    }

    // Register with memory manager
    simpleMemoryManager.registerComponentCleanup(componentId, componentCleanup)

    // Cleanup on unmount
    return () => {
      simpleMemoryManager.cleanupComponent(componentId)
      
      // Clear stats interval
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current)
        statsIntervalRef.current = null
      }
    }
  }, [componentId, enableAutoCleanup])

  return {
    trackResource,
    performCleanup,
    performEmergencyCleanup,
    memoryStats,
    warnings,
    updateConfig
  }
}

/**
 * Specialized hook for Three.js components with simplified memory management
 * Provides convenient methods for tracking common Three.js resources
 */
export function useSimpleThreeMemoryManager(options: UseSimpleMemoryManagerOptions = {}) {
  const memoryManager = useSimpleMemoryManager(options)

  const trackGeometry = useCallback((geometry: BufferGeometry) => {
    return memoryManager.trackResource(geometry)
  }, [memoryManager])

  const trackMaterial = useCallback((material: Material) => {
    return memoryManager.trackResource(material)
  }, [memoryManager])

  const trackTexture = useCallback((texture: Texture) => {
    return memoryManager.trackResource(texture)
  }, [memoryManager])

  const trackObject3D = useCallback((object: Object3D) => {
    return memoryManager.trackResource(object)
  }, [memoryManager])

  // Convenience method to track a mesh and all its resources
  const trackMesh = useCallback((mesh: any) => {
    const resourceIds: string[] = []
    
    if (mesh.geometry) {
      resourceIds.push(trackGeometry(mesh.geometry))
    }
    
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((material: Material) => {
          resourceIds.push(trackMaterial(material))
        })
      } else {
        resourceIds.push(trackMaterial(mesh.material))
      }
    }
    
    resourceIds.push(trackObject3D(mesh))
    
    return resourceIds
  }, [trackGeometry, trackMaterial, trackObject3D])

  return {
    ...memoryManager,
    trackGeometry,
    trackMaterial,
    trackTexture,
    trackObject3D,
    trackMesh
  }
}