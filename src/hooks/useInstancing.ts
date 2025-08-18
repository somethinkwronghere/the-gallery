import { useCallback, useMemo } from 'react'
import { Matrix4, Mesh, Vector3, Euler } from 'three'
import { useRenderingContext } from '../systems/rendering/RenderingContext'
import { InstanceManagerConfig, InstanceStats } from '../types/rendering'

export interface UseInstancingOptions {
  config?: Partial<InstanceManagerConfig>
}

export interface UseInstancingReturn {
  // Direct access to instance manager
  instanceManager: any
  
  // Instance group management
  createInstanceGroup: (originalMesh: Mesh, maxInstances?: number) => string
  removeInstanceGroup: (groupId: string) => void
  getInstanceGroup: (groupId: string) => any | null
  
  // Instance management
  createInstance: (groupId: string, position?: Vector3, rotation?: Euler, scale?: Vector3, userData?: any) => string
  createInstanceFromMatrix: (groupId: string, matrix: Matrix4, userData?: any) => string
  updateInstance: (groupId: string, instanceId: string, position?: Vector3, rotation?: Euler, scale?: Vector3) => void
  updateInstanceMatrix: (groupId: string, instanceId: string, matrix: Matrix4) => void
  removeInstance: (groupId: string, instanceId: string) => void
  setInstanceVisibility: (groupId: string, instanceId: string, visible: boolean) => void
  
  // Batch operations
  createMultipleInstances: (groupId: string, transforms: Array<{
    position?: Vector3
    rotation?: Euler
    scale?: Vector3
    userData?: any
  }>) => string[]
  
  // Configuration
  setConfig: (config: Partial<InstanceManagerConfig>) => void
  getConfig: () => InstanceManagerConfig
  
  // Statistics
  getStats: () => InstanceStats
  resetStats: () => void
  
  // Utility functions
  createTransformMatrix: (position?: Vector3, rotation?: Euler, scale?: Vector3) => Matrix4
}

export const useInstancing = (options: UseInstancingOptions = {}): UseInstancingReturn => {
  const renderingContext = useRenderingContext()
  const { instanceManager } = renderingContext

  // Apply configuration if provided
  if (options.config) {
    instanceManager.setConfig(options.config)
  }

  // Instance group management
  const createInstanceGroup = useCallback((originalMesh: Mesh, maxInstances?: number): string => {
    return instanceManager.createInstanceGroup(originalMesh, maxInstances)
  }, [instanceManager])

  const removeInstanceGroup = useCallback((groupId: string) => {
    instanceManager.removeInstanceGroup(groupId)
  }, [instanceManager])

  const getInstanceGroup = useCallback((groupId: string) => {
    return instanceManager.getInstanceGroup(groupId)
  }, [instanceManager])

  // Instance management with convenience functions
  const createInstance = useCallback((
    groupId: string, 
    position?: Vector3, 
    rotation?: Euler, 
    scale?: Vector3, 
    userData?: any
  ): string => {
    const matrix = createTransformMatrix(position, rotation, scale)
    return instanceManager.createInstance(groupId, matrix, userData)
  }, [instanceManager])

  const createInstanceFromMatrix = useCallback((
    groupId: string, 
    matrix: Matrix4, 
    userData?: any
  ): string => {
    return instanceManager.createInstance(groupId, matrix, userData)
  }, [instanceManager])

  const updateInstance = useCallback((
    groupId: string, 
    instanceId: string, 
    position?: Vector3, 
    rotation?: Euler, 
    scale?: Vector3
  ) => {
    const matrix = createTransformMatrix(position, rotation, scale)
    instanceManager.updateInstance(groupId, instanceId, matrix)
  }, [instanceManager])

  const updateInstanceMatrix = useCallback((
    groupId: string, 
    instanceId: string, 
    matrix: Matrix4
  ) => {
    instanceManager.updateInstance(groupId, instanceId, matrix)
  }, [instanceManager])

  const removeInstance = useCallback((groupId: string, instanceId: string) => {
    instanceManager.removeInstance(groupId, instanceId)
  }, [instanceManager])

  const setInstanceVisibility = useCallback((groupId: string, instanceId: string, visible: boolean) => {
    instanceManager.setInstanceVisibility(groupId, instanceId, visible)
  }, [instanceManager])

  // Batch operations
  const createMultipleInstances = useCallback((
    groupId: string, 
    transforms: Array<{
      position?: Vector3
      rotation?: Euler
      scale?: Vector3
      userData?: any
    }>
  ): string[] => {
    return transforms.map(transform => {
      const matrix = createTransformMatrix(transform.position, transform.rotation, transform.scale)
      return instanceManager.createInstance(groupId, matrix, transform.userData)
    })
  }, [instanceManager])

  // Configuration
  const setConfig = useCallback((config: Partial<InstanceManagerConfig>) => {
    instanceManager.setConfig(config)
  }, [instanceManager])

  const getConfig = useCallback((): InstanceManagerConfig => {
    return instanceManager.getConfig()
  }, [instanceManager])

  // Statistics
  const getStats = useCallback((): InstanceStats => {
    return instanceManager.getInstanceStats()
  }, [instanceManager])

  const resetStats = useCallback(() => {
    instanceManager.resetStats()
  }, [instanceManager])

  // Utility function to create transform matrix
  const createTransformMatrix = useCallback((
    position?: Vector3, 
    rotation?: Euler, 
    scale?: Vector3
  ): Matrix4 => {
    const matrix = new Matrix4()
    
    if (position || rotation || scale) {
      const pos = position || new Vector3(0, 0, 0)
      const rot = rotation || new Euler(0, 0, 0)
      const scl = scale || new Vector3(1, 1, 1)
      
      matrix.makeRotationFromEuler(rot)
      matrix.scale(scl)
      matrix.setPosition(pos)
    }
    
    return matrix
  }, [])

  return useMemo(() => ({
    // Direct access to instance manager
    instanceManager,
    
    // Instance group management
    createInstanceGroup,
    removeInstanceGroup,
    getInstanceGroup,
    
    // Instance management
    createInstance,
    createInstanceFromMatrix,
    updateInstance,
    updateInstanceMatrix,
    removeInstance,
    setInstanceVisibility,
    
    // Batch operations
    createMultipleInstances,
    
    // Configuration
    setConfig,
    getConfig,
    
    // Statistics
    getStats,
    resetStats,
    
    // Utility functions
    createTransformMatrix
  }), [
    instanceManager,
    createInstanceGroup,
    removeInstanceGroup,
    getInstanceGroup,
    createInstance,
    createInstanceFromMatrix,
    updateInstance,
    updateInstanceMatrix,
    removeInstance,
    setInstanceVisibility,
    createMultipleInstances,
    setConfig,
    getConfig,
    getStats,
    resetStats,
    createTransformMatrix
  ])
}

export default useInstancing