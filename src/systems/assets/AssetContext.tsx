import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react'
import { 
  AssetState, 
  AssetActions, 
  AssetContextType, 
  Asset, 
  AssetType, 
  LoadingOptions, 
  LoadingProgress,
  CacheEntry,
  InstancedAsset,
  CacheStats
} from '../../types/assets'
import { AssetManager } from './AssetManager'

// Initial state
const initialState: AssetState = {
  loadedAssets: new Map(),
  loadingAssets: new Map(),
  cachedAssets: new Map(),
  instances: new Map(),
  metadata: new Map(),
  cacheStats: {
    totalAssets: 0,
    totalMemoryUsage: 0,
    hitRate: 0,
    missRate: 0,
    evictionCount: 0
  }
}

// Action types
type AssetAction = 
  | { type: 'ASSET_LOADING_START'; payload: { id: string; progress: LoadingProgress } }
  | { type: 'ASSET_LOADING_PROGRESS'; payload: { id: string; progress: LoadingProgress } }
  | { type: 'ASSET_LOADED'; payload: { asset: Asset } }
  | { type: 'ASSET_CACHED'; payload: { asset: Asset; entry: CacheEntry } }
  | { type: 'ASSET_DISPOSED'; payload: { id: string } }
  | { type: 'INSTANCE_CREATED'; payload: { instance: InstancedAsset } }
  | { type: 'INSTANCE_UPDATED'; payload: { instanceId: string; transform: Partial<InstancedAsset['transform']> } }
  | { type: 'INSTANCE_DISPOSED'; payload: { instanceId: string } }
  | { type: 'CACHE_CLEARED' }
  | { type: 'STATS_UPDATED'; payload: { stats: CacheStats } }

// Reducer
function assetReducer(state: AssetState, action: AssetAction): AssetState {
  switch (action.type) {
    case 'ASSET_LOADING_START':
      return {
        ...state,
        loadingAssets: new Map(state.loadingAssets).set(action.payload.id, action.payload.progress)
      }
    
    case 'ASSET_LOADING_PROGRESS':
      return {
        ...state,
        loadingAssets: new Map(state.loadingAssets).set(action.payload.id, action.payload.progress)
      }
    
    case 'ASSET_LOADED':
      const newLoadingAssets = new Map(state.loadingAssets)
      newLoadingAssets.delete(action.payload.asset.id)
      
      return {
        ...state,
        loadedAssets: new Map(state.loadedAssets).set(action.payload.asset.id, action.payload.asset),
        loadingAssets: newLoadingAssets
      }
    
    case 'ASSET_CACHED':
      return {
        ...state,
        cachedAssets: new Map(state.cachedAssets).set(action.payload.asset.id, action.payload.entry)
      }
    
    case 'ASSET_DISPOSED':
      const newLoadedAssets = new Map(state.loadedAssets)
      const newCachedAssets = new Map(state.cachedAssets)
      newLoadedAssets.delete(action.payload.id)
      newCachedAssets.delete(action.payload.id)
      
      return {
        ...state,
        loadedAssets: newLoadedAssets,
        cachedAssets: newCachedAssets
      }
    
    case 'INSTANCE_CREATED':
      return {
        ...state,
        instances: new Map(state.instances).set(action.payload.instance.instanceId, action.payload.instance)
      }
    
    case 'INSTANCE_UPDATED':
      const updatedInstances = new Map(state.instances)
      const instance = updatedInstances.get(action.payload.instanceId)
      if (instance) {
        instance.transform = { ...instance.transform, ...action.payload.transform }
        updatedInstances.set(action.payload.instanceId, instance)
      }
      
      return {
        ...state,
        instances: updatedInstances
      }
    
    case 'INSTANCE_DISPOSED':
      const newInstances = new Map(state.instances)
      newInstances.delete(action.payload.instanceId)
      
      return {
        ...state,
        instances: newInstances
      }
    
    case 'CACHE_CLEARED':
      return {
        ...state,
        cachedAssets: new Map(),
        loadedAssets: new Map()
      }
    
    case 'STATS_UPDATED':
      return {
        ...state,
        cacheStats: action.payload.stats
      }
    
    default:
      return state
  }
}

// Context
const AssetContext = createContext<AssetContextType | null>(null)

// Provider component
interface AssetProviderProps {
  children: ReactNode
}

export function AssetProvider({ children }: AssetProviderProps) {
  const [state, dispatch] = useReducer(assetReducer, initialState)
  const assetManager = React.useMemo(() => new AssetManager(), [])

  // Actions
  const loadAsset = useCallback(async (
    url: string, 
    type: AssetType, 
    options?: LoadingOptions
  ): Promise<Asset> => {
    const assetId = `${type}_${btoa(url).replace(/[^a-zA-Z0-9]/g, '')}`
    
    // Start loading
    dispatch({
      type: 'ASSET_LOADING_START',
      payload: {
        id: assetId,
        progress: {
          assetId,
          loaded: 0,
          total: 1,
          percentage: 0,
          stage: 'downloading'
        }
      }
    })

    try {
      const asset = await assetManager.loadAssetProgressive(
        url,
        type,
        (progress) => {
          dispatch({
            type: 'ASSET_LOADING_PROGRESS',
            payload: { id: assetId, progress }
          })
        },
        options
      )

      dispatch({
        type: 'ASSET_LOADED',
        payload: { asset }
      })

      // Update stats
      const stats = assetManager.getCacheStats()
      dispatch({
        type: 'STATS_UPDATED',
        payload: { stats }
      })

      return asset
    } catch (error) {
      // Remove from loading state on error
      dispatch({
        type: 'ASSET_LOADING_PROGRESS',
        payload: {
          id: assetId,
          progress: {
            assetId,
            loaded: 0,
            total: 1,
            percentage: 0,
            stage: 'complete'
          }
        }
      })
      throw error
    }
  }, [assetManager])

  const cacheAsset = useCallback((asset: Asset) => {
    assetManager.cacheAsset(asset)
    
    const entry: CacheEntry = {
      asset,
      lastAccessed: new Date(),
      accessCount: 1,
      memorySize: 0, // Will be calculated by AssetManager
      persistent: false
    }
    
    dispatch({
      type: 'ASSET_CACHED',
      payload: { asset, entry }
    })

    // Update stats
    const stats = assetManager.getCacheStats()
    dispatch({
      type: 'STATS_UPDATED',
      payload: { stats }
    })
  }, [assetManager])

  const disposeAsset = useCallback((id: string) => {
    assetManager.disposeAsset(id)
    
    dispatch({
      type: 'ASSET_DISPOSED',
      payload: { id }
    })

    // Update stats
    const stats = assetManager.getCacheStats()
    dispatch({
      type: 'STATS_UPDATED',
      payload: { stats }
    })
  }, [assetManager])

  const createInstance = useCallback((
    originalId: string, 
    transform?: Partial<InstancedAsset['transform']>
  ): InstancedAsset => {
    const instance = assetManager.createInstance(originalId, transform)
    
    dispatch({
      type: 'INSTANCE_CREATED',
      payload: { instance }
    })
    
    return instance
  }, [assetManager])

  const clearCache = useCallback(() => {
    assetManager.clearCache()
    
    dispatch({
      type: 'CACHE_CLEARED'
    })

    // Update stats
    const stats = assetManager.getCacheStats()
    dispatch({
      type: 'STATS_UPDATED',
      payload: { stats }
    })
  }, [assetManager])

  const actions: AssetActions = {
    loadAsset,
    cacheAsset,
    disposeAsset,
    createInstance,
    clearCache
  }

  const contextValue: AssetContextType = {
    ...state,
    actions
  }

  return (
    <AssetContext.Provider value={contextValue}>
      {children}
    </AssetContext.Provider>
  )
}

// Hook to use asset context
export function useAssets(): AssetContextType {
  const context = useContext(AssetContext)
  if (!context) {
    throw new Error('useAssets must be used within an AssetProvider')
  }
  return context
}

// Hook for loading assets
export function useAssetLoader() {
  const { actions, loadingAssets } = useAssets()
  
  const loadAsset = useCallback(async (
    url: string,
    type: AssetType,
    options?: LoadingOptions
  ) => {
    return actions.loadAsset(url, type, options)
  }, [actions])

  const loadBatch = useCallback(async (
    requests: Array<{url: string, type: AssetType, options?: LoadingOptions}>
  ) => {
    const promises = requests.map(req => loadAsset(req.url, req.type, req.options))
    return Promise.all(promises)
  }, [loadAsset])

  return {
    loadAsset,
    loadBatch,
    loadingAssets: Array.from(loadingAssets.values())
  }
}

// Hook for asset instances
export function useAssetInstances() {
  const { instances, actions } = useAssets()
  
  const createInstance = useCallback((
    originalId: string,
    transform?: Partial<InstancedAsset['transform']>
  ) => {
    return actions.createInstance(originalId, transform)
  }, [actions])

  const getInstances = useCallback((originalId: string) => {
    return Array.from(instances.values()).filter(
      instance => instance.originalId === originalId
    )
  }, [instances])

  return {
    instances: Array.from(instances.values()),
    createInstance,
    getInstances
  }
}

// Hook for cache management
export function useAssetCache() {
  const { cachedAssets, cacheStats, actions } = useAssets()
  
  return {
    cachedAssets: Array.from(cachedAssets.values()),
    cacheStats,
    clearCache: actions.clearCache,
    disposeAsset: actions.disposeAsset
  }
}