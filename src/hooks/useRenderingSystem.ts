import { useRef, useCallback, useMemo } from 'react'
import { Camera, Object3D, Matrix4, Mesh } from 'three'
import { 
  CullingManager, 
  RenderQueue,
  InstanceManager,
  CullingConfig,
  RenderQueueConfig,
  InstanceManagerConfig,
  CullingResult,
  RenderStats,
  InstanceStats,
  RenderableObject
} from '../systems/rendering'

export interface UseRenderingSystemOptions {
  cullingConfig?: Partial<CullingConfig>
  renderQueueConfig?: Partial<RenderQueueConfig>
  instanceManagerConfig?: Partial<InstanceManagerConfig>
  enableAutoOptimization?: boolean
}

export interface UseRenderingSystemReturn {
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
}

export const useRenderingSystem = (options: UseRenderingSystemOptions = {}): UseRenderingSystemReturn => {
  const {
    cullingConfig = {},
    renderQueueConfig = {},
    instanceManagerConfig = {},
    enableAutoOptimization = true
  } = options

  // Create managers with refs to persist across renders
  const cullingManagerRef = useRef<CullingManager | null>(null)
  const renderQueueRef = useRef<RenderQueue | null>(null)
  const instanceManagerRef = useRef<InstanceManager | null>(null)

  // Initialize managers
  if (!cullingManagerRef.current) {
    cullingManagerRef.current = new CullingManager(cullingConfig)
  }

  if (!renderQueueRef.current) {
    renderQueueRef.current = new RenderQueue(renderQueueConfig)
  }

  if (!instanceManagerRef.current) {
    instanceManagerRef.current = new InstanceManager(instanceManagerConfig)
  }

  const cullingManager = cullingManagerRef.current!
  const renderQueue = renderQueueRef.current!
  const instanceManager = instanceManagerRef.current!

  // Culling functions
  const performCulling = useCallback((camera: Camera, objects: Object3D[]): CullingResult => {
    return cullingManager.performCulling(camera, objects)
  }, [cullingManager])

  const isObjectVisible = useCallback((camera: Camera, object: Object3D): boolean => {
    return cullingManager.isObjectVisible(camera, object)
  }, [cullingManager])

  const setCullingConfig = useCallback((config: Partial<CullingConfig>) => {
    cullingManager.setConfig(config)
  }, [cullingManager])

  // Render queue functions
  const addToRenderQueue = useCallback((object: RenderableObject) => {
    renderQueue.addObject(object)
  }, [renderQueue])

  const removeFromRenderQueue = useCallback((objectId: string) => {
    renderQueue.removeObject(objectId)
  }, [renderQueue])

  const clearRenderQueue = useCallback(() => {
    renderQueue.clear()
  }, [renderQueue])

  const render = useCallback((camera: Camera) => {
    renderQueue.render(camera)
  }, [renderQueue])

  const setRenderQueueConfig = useCallback((config: Partial<RenderQueueConfig>) => {
    renderQueue.setConfig(config)
  }, [renderQueue])

  // Instancing functions
  const createInstanceGroup = useCallback((originalMesh: Mesh, maxInstances?: number): string => {
    return instanceManager.createInstanceGroup(originalMesh, maxInstances)
  }, [instanceManager])

  const createInstance = useCallback((groupId: string, matrix: Matrix4, userData?: any): string => {
    return instanceManager.createInstance(groupId, matrix, userData)
  }, [instanceManager])

  const updateInstance = useCallback((groupId: string, instanceId: string, matrix: Matrix4) => {
    instanceManager.updateInstance(groupId, instanceId, matrix)
  }, [instanceManager])

  const removeInstance = useCallback((groupId: string, instanceId: string) => {
    instanceManager.removeInstance(groupId, instanceId)
  }, [instanceManager])

  const setInstanceManagerConfig = useCallback((config: Partial<InstanceManagerConfig>) => {
    instanceManager.setConfig(config)
  }, [instanceManager])

  // Statistics functions
  const getCullingStats = useCallback((): RenderStats => {
    return cullingManager.getStats()
  }, [cullingManager])

  const getRenderStats = useCallback((): RenderStats => {
    return renderQueue.getStats()
  }, [renderQueue])

  const getInstanceStats = useCallback((): InstanceStats => {
    return instanceManager.getInstanceStats()
  }, [instanceManager])

  const resetStats = useCallback(() => {
    cullingManager.resetStats()
    instanceManager.resetStats()
    renderQueue.getStats() // RenderQueue doesn't have resetStats, but we get fresh stats each frame
  }, [cullingManager, instanceManager, renderQueue])

  // Auto-optimization effect would go here in a real implementation
  // This would monitor performance and adjust settings automatically

  return useMemo(() => ({
    // Culling
    performCulling,
    isObjectVisible,
    setCullingConfig,
    
    // Render Queue
    addToRenderQueue,
    removeFromRenderQueue,
    clearRenderQueue,
    render,
    setRenderQueueConfig,
    
    // Instancing
    createInstanceGroup,
    createInstance,
    updateInstance,
    removeInstance,
    setInstanceManagerConfig,
    
    // Statistics
    getCullingStats,
    getRenderStats,
    getInstanceStats,
    resetStats,
    
    // Managers
    cullingManager,
    renderQueue,
    instanceManager
  }), [
    performCulling,
    isObjectVisible,
    setCullingConfig,
    addToRenderQueue,
    removeFromRenderQueue,
    clearRenderQueue,
    render,
    setRenderQueueConfig,
    createInstanceGroup,
    createInstance,
    updateInstance,
    removeInstance,
    setInstanceManagerConfig,
    getCullingStats,
    getRenderStats,
    getInstanceStats,
    resetStats,
    cullingManager,
    renderQueue,
    instanceManager
  ])
}

export default useRenderingSystem