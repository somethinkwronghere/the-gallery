import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { LoadingProgress, AssetType, Asset } from '../types/assets'
import { useAssetManager } from './useAssetManager'

interface LoadingState {
  id: string
  type: AssetType
  url: string
  progress: LoadingProgress
  error?: Error
  startTime: number
}

interface UseLoadingStatesOptions {
  showGlobalProgress?: boolean
  autoHideDelay?: number
  onLoadingStart?: (id: string) => void
  onLoadingComplete?: (id: string, asset: Asset) => void
  onLoadingError?: (id: string, error: Error) => void
  onAllComplete?: () => void
}

interface LoadingStatesResult {
  // State
  loadingStates: Map<string, LoadingState>
  globalProgress: number
  isLoading: boolean
  hasErrors: boolean
  
  // Actions
  startLoading: (id: string, type: AssetType, url: string) => void
  updateProgress: (id: string, progress: LoadingProgress) => void
  completeLoading: (id: string, asset?: Asset) => void
  errorLoading: (id: string, error: Error) => void
  clearLoading: (id: string) => void
  clearAllLoading: () => void
  
  // Queries
  getLoadingState: (id: string) => LoadingState | null
  getLoadingByType: (type: AssetType) => LoadingState[]
  getErrors: () => Array<{ id: string; error: Error }>
  
  // Statistics
  totalLoading: number
  completedCount: number
  errorCount: number
  averageLoadTime: number
}

export function useLoadingStates(options: UseLoadingStatesOptions = {}): LoadingStatesResult {
  const {
    showGlobalProgress = true,
    autoHideDelay = 1000,
    onLoadingStart,
    onLoadingComplete,
    onLoadingError,
    onAllComplete
  } = options

  const [loadingStates, setLoadingStates] = useState<Map<string, LoadingState>>(new Map())
  const [completedAssets, setCompletedAssets] = useState<Map<string, { asset?: Asset; completedAt: number }>>(new Map())
  const hideTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Calculate global progress
  const globalProgress = useMemo(() => {
    const states = Array.from(loadingStates.values())
    if (states.length === 0) return 100
    
    const totalProgress = states.reduce((sum, state) => sum + state.progress.percentage, 0)
    return Math.round(totalProgress / states.length)
  }, [loadingStates])

  // Derived state
  const isLoading = loadingStates.size > 0
  const hasErrors = Array.from(loadingStates.values()).some(state => state.error)
  const totalLoading = loadingStates.size
  const errorCount = Array.from(loadingStates.values()).filter(state => state.error).length
  const completedCount = completedAssets.size

  // Calculate average load time
  const averageLoadTime = useMemo(() => {
    const completed = Array.from(completedAssets.values())
    if (completed.length === 0) return 0
    
    const totalTime = completed.reduce((sum, { completedAt }) => {
      // Find the original start time (this is simplified)
      return sum + 1000 // Placeholder calculation
    }, 0)
    
    return totalTime / completed.length
  }, [completedAssets])

  // Start loading
  const startLoading = useCallback((id: string, type: AssetType, url: string) => {
    // Clear any existing hide timeout
    const existingTimeout = hideTimeouts.current.get(id)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
      hideTimeouts.current.delete(id)
    }

    const loadingState: LoadingState = {
      id,
      type,
      url,
      progress: {
        assetId: id,
        loaded: 0,
        total: 1,
        percentage: 0,
        stage: 'downloading'
      },
      startTime: Date.now()
    }

    setLoadingStates(prev => new Map(prev).set(id, loadingState))
    onLoadingStart?.(id)
  }, [onLoadingStart])

  // Update progress
  const updateProgress = useCallback((id: string, progress: LoadingProgress) => {
    setLoadingStates(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(id)
      if (existing) {
        newMap.set(id, {
          ...existing,
          progress: {
            ...progress,
            assetId: id
          }
        })
      }
      return newMap
    })
  }, [])

  // Complete loading
  const completeLoading = useCallback((id: string, asset?: Asset) => {
    const state = loadingStates.get(id)
    if (state) {
      // Update final progress
      updateProgress(id, {
        assetId: id,
        loaded: 1,
        total: 1,
        percentage: 100,
        stage: 'complete'
      })

      // Mark as completed
      setCompletedAssets(prev => new Map(prev).set(id, {
        asset,
        completedAt: Date.now()
      }))

      // Schedule removal
      const timeout = setTimeout(() => {
        setLoadingStates(prev => {
          const newMap = new Map(prev)
          newMap.delete(id)
          return newMap
        })
        hideTimeouts.current.delete(id)
      }, autoHideDelay)

      hideTimeouts.current.set(id, timeout)
      onLoadingComplete?.(id, asset!)
    }
  }, [loadingStates, updateProgress, autoHideDelay, onLoadingComplete])

  // Error loading
  const errorLoading = useCallback((id: string, error: Error) => {
    setLoadingStates(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(id)
      if (existing) {
        newMap.set(id, {
          ...existing,
          error,
          progress: {
            ...existing.progress,
            stage: 'complete'
          }
        })
      }
      return newMap
    })
    
    onLoadingError?.(id, error)
  }, [onLoadingError])

  // Clear specific loading
  const clearLoading = useCallback((id: string) => {
    const timeout = hideTimeouts.current.get(id)
    if (timeout) {
      clearTimeout(timeout)
      hideTimeouts.current.delete(id)
    }

    setLoadingStates(prev => {
      const newMap = new Map(prev)
      newMap.delete(id)
      return newMap
    })
  }, [])

  // Clear all loading
  const clearAllLoading = useCallback(() => {
    // Clear all timeouts
    Array.from(hideTimeouts.current.values()).forEach(clearTimeout)
    hideTimeouts.current.clear()

    setLoadingStates(new Map())
    setCompletedAssets(new Map())
  }, [])

  // Get loading state
  const getLoadingState = useCallback((id: string): LoadingState | null => {
    return loadingStates.get(id) || null
  }, [loadingStates])

  // Get loading by type
  const getLoadingByType = useCallback((type: AssetType): LoadingState[] => {
    return Array.from(loadingStates.values()).filter(state => state.type === type)
  }, [loadingStates])

  // Get errors
  const getErrors = useCallback(() => {
    return Array.from(loadingStates.values())
      .filter(state => state.error)
      .map(state => ({ id: state.id, error: state.error! }))
  }, [loadingStates])

  // Check if all loading is complete
  useEffect(() => {
    if (loadingStates.size === 0 && completedAssets.size > 0) {
      const timeout = setTimeout(() => {
        onAllComplete?.()
      }, 100) // Small delay to ensure all state updates are complete

      return () => clearTimeout(timeout)
    }
  }, [loadingStates.size, completedAssets.size, onAllComplete])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Array.from(hideTimeouts.current.values()).forEach(clearTimeout)
      hideTimeouts.current.clear()
    }
  }, [])

  return {
    // State
    loadingStates,
    globalProgress,
    isLoading,
    hasErrors,
    
    // Actions
    startLoading,
    updateProgress,
    completeLoading,
    errorLoading,
    clearLoading,
    clearAllLoading,
    
    // Queries
    getLoadingState,
    getLoadingByType,
    getErrors,
    
    // Statistics
    totalLoading,
    completedCount,
    errorCount,
    averageLoadTime
  }
}

// Specialized hook for asset loading with automatic state management
export function useAssetLoading(url: string, type: AssetType, autoLoad = true) {
  const { loadAsset } = useAssetManager()
  const {
    startLoading,
    updateProgress,
    completeLoading,
    errorLoading,
    getLoadingState
  } = useLoadingStates()

  const [asset, setAsset] = useState<Asset | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const assetId = `${type}_${btoa(url).replace(/[^a-zA-Z0-9]/g, '')}`
  const loadingState = getLoadingState(assetId)

  const load = useCallback(async () => {
    if (!url) return

    try {
      setError(null)
      startLoading(assetId, type, url)

      const loadedAsset = await loadAsset(url, type, {
        cache: true,
        onProgress: (progress) => {
          updateProgress(assetId, progress)
        }
      })

      setAsset(loadedAsset)
      completeLoading(assetId, loadedAsset)
    } catch (err) {
      const error = err as Error
      setError(error)
      errorLoading(assetId, error)
    }
  }, [url, type, assetId, loadAsset, startLoading, updateProgress, completeLoading, errorLoading])

  useEffect(() => {
    if (autoLoad && url) {
      load()
    }
  }, [autoLoad, url, load])

  return {
    asset,
    error,
    loading: !!loadingState && !loadingState.error,
    progress: loadingState?.progress || null,
    reload: load
  }
}

export default useLoadingStates