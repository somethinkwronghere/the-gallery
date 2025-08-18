import { useCallback, useEffect, useState } from 'react'
import { useAssets, useAssetLoader, useAssetCache } from '../systems/assets/AssetContext'
import { Asset, AssetType, LoadingOptions, LoadingProgress } from '../types/assets'

interface UseAssetManagerOptions {
  preloadEssential?: string[]
  autoCache?: boolean
  maxCacheAge?: number
}

interface AssetLoadResult {
  asset: Asset | null
  loading: boolean
  error: Error | null
  progress: LoadingProgress | null
}

export function useAssetManager(options: UseAssetManagerOptions = {}) {
  const { loadedAssets, cacheStats } = useAssets()
  const { loadAsset, loadBatch } = useAssetLoader()
  const { clearCache, disposeAsset } = useAssetCache()
  
  const [loadingStates, setLoadingStates] = useState<Map<string, AssetLoadResult>>(new Map())

  // Preload essential assets on mount
  useEffect(() => {
    if (options.preloadEssential && options.preloadEssential.length > 0) {
      const preloadRequests = options.preloadEssential.map(url => ({
        url,
        type: 'model' as AssetType, // Default to model, could be made configurable
        options: { cache: true, priority: 10 }
      }))
      
      loadBatch(preloadRequests).catch(console.error)
    }
  }, [options.preloadEssential, loadBatch])

  // Auto cleanup old cache entries
  useEffect(() => {
    if (options.maxCacheAge) {
      const interval = setInterval(() => {
        // This would need to be implemented in AssetManager
        // assetManager.disposeUnusedAssets(options.maxCacheAge)
      }, 60000) // Check every minute
      
      return () => clearInterval(interval)
    }
  }, [options.maxCacheAge])

  const loadAssetWithState = useCallback(async (
    url: string,
    type: AssetType,
    loadOptions?: LoadingOptions
  ): Promise<Asset> => {
    const key = `${type}_${url}`
    
    // Set initial loading state
    setLoadingStates(prev => new Map(prev).set(key, {
      asset: null,
      loading: true,
      error: null,
      progress: null
    }))

    try {
      const asset = await loadAsset(url, type, {
        cache: options.autoCache ?? true,
        ...loadOptions
      })

      // Update success state
      setLoadingStates(prev => new Map(prev).set(key, {
        asset,
        loading: false,
        error: null,
        progress: null
      }))

      return asset
    } catch (error) {
      // Update error state
      setLoadingStates(prev => new Map(prev).set(key, {
        asset: null,
        loading: false,
        error: error as Error,
        progress: null
      }))
      
      throw error
    }
  }, [loadAsset, options.autoCache])

  const getAssetLoadState = useCallback((url: string, type: AssetType): AssetLoadResult => {
    const key = `${type}_${url}`
    return loadingStates.get(key) || {
      asset: null,
      loading: false,
      error: null,
      progress: null
    }
  }, [loadingStates])

  const preloadAssets = useCallback(async (
    urls: Array<{ url: string; type: AssetType; options?: LoadingOptions }>
  ) => {
    const requests = urls.map(({ url, type, options }) => ({
      url,
      type,
      options: {
        cache: true,
        priority: 5,
        ...options
      }
    }))

    return loadBatch(requests)
  }, [loadBatch])

  const getAssetById = useCallback((id: string): Asset | null => {
    return loadedAssets.get(id) || null
  }, [loadedAssets])

  const getAssetsByType = useCallback((type: AssetType): Asset[] => {
    return Array.from(loadedAssets.values()).filter(asset => asset.type === type)
  }, [loadedAssets])

  const getCacheInfo = useCallback(() => {
    return {
      stats: cacheStats,
      totalAssets: loadedAssets.size,
      assetTypes: Array.from(new Set(Array.from(loadedAssets.values()).map(a => a.type)))
    }
  }, [cacheStats, loadedAssets])

  const optimizeCache = useCallback(() => {
    // Clear assets that haven't been used recently
    const now = Date.now()
    const maxAge = options.maxCacheAge || 30 * 60 * 1000 // 30 minutes default
    
    Array.from(loadedAssets.values()).forEach(asset => {
      if (asset.lastUsed && (now - asset.lastUsed.getTime()) > maxAge) {
        disposeAsset(asset.id)
      }
    })
  }, [loadedAssets, disposeAsset, options.maxCacheAge])

  return {
    // Loading functions
    loadAsset: loadAssetWithState,
    preloadAssets,
    loadBatch,
    
    // State queries
    getAssetLoadState,
    getAssetById,
    getAssetsByType,
    getCacheInfo,
    
    // Cache management
    clearCache,
    disposeAsset,
    optimizeCache,
    
    // Statistics
    cacheStats,
    totalLoadedAssets: loadedAssets.size,
    loadingStates: Array.from(loadingStates.values())
  }
}

// Hook for specific asset types
export function useModelAsset(url: string, options?: LoadingOptions) {
  const { loadAsset, getAssetLoadState } = useAssetManager()
  const [asset, setAsset] = useState<Asset | null>(null)
  
  useEffect(() => {
    if (url) {
      loadAsset(url, 'model', options)
        .then(setAsset)
        .catch(console.error)
    }
  }, [url, loadAsset, options])
  
  const loadState = getAssetLoadState(url, 'model')
  
  return {
    asset: asset || loadState.asset,
    loading: loadState.loading,
    error: loadState.error,
    progress: loadState.progress
  }
}

export function useTextureAsset(url: string, options?: LoadingOptions) {
  const { loadAsset, getAssetLoadState } = useAssetManager()
  const [asset, setAsset] = useState<Asset | null>(null)
  
  useEffect(() => {
    if (url) {
      loadAsset(url, 'texture', options)
        .then(setAsset)
        .catch(console.error)
    }
  }, [url, loadAsset, options])
  
  const loadState = getAssetLoadState(url, 'texture')
  
  return {
    asset: asset || loadState.asset,
    loading: loadState.loading,
    error: loadState.error,
    progress: loadState.progress
  }
}

// Hook for batch loading with progress
export function useBatchAssetLoader() {
  const { loadBatch } = useAssetLoader()
  const [batchState, setBatchState] = useState<{
    loading: boolean
    progress: number
    completed: Asset[]
    errors: Error[]
  }>({
    loading: false,
    progress: 0,
    completed: [],
    errors: []
  })

  const loadAssetBatch = useCallback(async (
    requests: Array<{ url: string; type: AssetType; options?: LoadingOptions }>
  ) => {
    setBatchState({
      loading: true,
      progress: 0,
      completed: [],
      errors: []
    })

    try {
      const assets = await loadBatch(requests)
      
      setBatchState({
        loading: false,
        progress: 100,
        completed: assets,
        errors: []
      })
      
      return assets
    } catch (error) {
      setBatchState(prev => ({
        ...prev,
        loading: false,
        errors: [...prev.errors, error as Error]
      }))
      
      throw error
    }
  }, [loadBatch])

  return {
    loadBatch: loadAssetBatch,
    ...batchState
  }
}