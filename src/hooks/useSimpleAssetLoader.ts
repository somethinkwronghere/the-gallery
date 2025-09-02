import { useState, useEffect, useCallback } from 'react'
import { AssetType, Asset } from '../types/assets'
import { useAssetManager } from './useAssetManager'
import { useSimpleErrorHandler } from './useSimpleErrorHandler'

export interface SimpleLoadingProgress {
  percentage: number
  stage: 'loading' | 'parsing' | 'complete'
  message: string
}

export interface UseSimpleAssetLoaderResult {
  asset: Asset | null
  loading: boolean
  error: Error | null
  progress: SimpleLoadingProgress | null
  reload: () => void
}

export interface UseSimpleAssetLoaderOptions {
  autoLoad?: boolean
  fallbackUrl?: string
  onLoad?: (asset: Asset) => void
  onError?: (error: Error) => void
}

export function useSimpleAssetLoader(
  url: string,
  type: AssetType,
  options: UseSimpleAssetLoaderOptions = {}
): UseSimpleAssetLoaderResult {
  const {
    autoLoad = true,
    fallbackUrl,
    onLoad,
    onError
  } = options

  const [asset, setAsset] = useState<Asset | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [progress, setProgress] = useState<SimpleLoadingProgress | null>(null)

  const { loadAsset } = useAssetManager()
  const { handleError } = useSimpleErrorHandler()

  const load = useCallback(async (assetUrl: string = url) => {
    if (!assetUrl) return

    try {
      setLoading(true)
      setError(null)
      setAsset(null)
      setProgress({
        percentage: 0,
        stage: 'loading',
        message: 'Başlatılıyor...'
      })

      const loadedAsset = await loadAsset(assetUrl, type, {
        cache: true,
        onProgress: (progressData) => {
          const percentage = Math.round(progressData.percentage)
          let stage: 'loading' | 'parsing' | 'complete' = 'loading'
          let message = 'Yükleniyor...'

          if (progressData.stage === 'downloading') {
            stage = 'loading'
            message = 'İndiriliyor...'
          } else if (progressData.stage === 'parsing') {
            stage = 'parsing'
            message = 'İşleniyor...'
          } else if (progressData.stage === 'complete') {
            stage = 'complete'
            message = 'Tamamlandı!'
          }

          setProgress({ percentage, stage, message })
        }
      })

      setAsset(loadedAsset)
      setProgress({
        percentage: 100,
        stage: 'complete',
        message: 'Tamamlandı!'
      })
      onLoad?.(loadedAsset)
    } catch (err) {
      const loadError = err as Error

      // Try fallback URL if available and not already tried
      if (fallbackUrl && assetUrl !== fallbackUrl) {
        console.warn(`Asset yüklenemedi: ${assetUrl}, fallback deneniyor: ${fallbackUrl}`)
        return load(fallbackUrl)
      }

      // Handle error
      setError(loadError)
      handleError(loadError)
      onError?.(loadError)
    } finally {
      setLoading(false)
    }
  }, [url, type, fallbackUrl, loadAsset, handleError, onLoad, onError])

  const reload = useCallback(() => {
    load(url)
  }, [load, url])

  // Auto-load when URL changes
  useEffect(() => {
    if (autoLoad && url) {
      load()
    }
  }, [autoLoad, url, load])

  return {
    asset,
    loading,
    error,
    progress,
    reload
  }
}

// Specialized hooks for different asset types
export function useSimpleModelLoader(url: string, options?: UseSimpleAssetLoaderOptions) {
  return useSimpleAssetLoader(url, 'model', options)
}

export function useSimpleTextureLoader(url: string, options?: UseSimpleAssetLoaderOptions) {
  return useSimpleAssetLoader(url, 'texture', options)
}

export function useSimpleAudioLoader(url: string, options?: UseSimpleAssetLoaderOptions) {
  return useSimpleAssetLoader(url, 'audio', options)
}

// Batch loading hook
export interface BatchAssetItem {
  id: string
  url: string
  type: AssetType
  fallbackUrl?: string
}

export interface UseSimpleBatchLoaderResult {
  assets: Map<string, Asset>
  loading: boolean
  errors: Map<string, Error>
  progress: {
    loaded: number
    total: number
    percentage: number
  }
  reload: () => void
}

export function useSimpleBatchLoader(
  assetList: BatchAssetItem[],
  options: {
    autoLoad?: boolean
    onBatchComplete?: (assets: Map<string, Asset>) => void
    onBatchError?: (errors: Map<string, Error>) => void
  } = {}
): UseSimpleBatchLoaderResult {
  const { autoLoad = true, onBatchComplete, onBatchError } = options

  const [assets, setAssets] = useState<Map<string, Asset>>(new Map())
  const [errors, setErrors] = useState<Map<string, Error>>(new Map())
  const [loadingCount, setLoadingCount] = useState(0)

  const totalAssets = assetList.length
  const isLoading = loadingCount > 0
  const loadedCount = totalAssets - loadingCount
  const progress = {
    loaded: loadedCount,
    total: totalAssets,
    percentage: totalAssets > 0 ? Math.round((loadedCount / totalAssets) * 100) : 100
  }

  const { loadAsset } = useAssetManager()

  const loadBatch = useCallback(async () => {
    if (assetList.length === 0) return

    setAssets(new Map())
    setErrors(new Map())
    setLoadingCount(assetList.length)

    const loadPromises = assetList.map(async ({ id, url, type, fallbackUrl }) => {
      try {
        let assetUrl = url
        let asset: Asset

        try {
          asset = await loadAsset(assetUrl, type, { cache: true })
        } catch (err) {
          // Try fallback if available
          if (fallbackUrl) {
            console.warn(`Asset yüklenemedi: ${url}, fallback deneniyor: ${fallbackUrl}`)
            asset = await loadAsset(fallbackUrl, type, { cache: true })
          } else {
            throw err
          }
        }

        setAssets(prev => new Map(prev).set(id, asset))
      } catch (err) {
        const error = err as Error
        setErrors(prev => new Map(prev).set(id, error))
      } finally {
        setLoadingCount(prev => prev - 1)
      }
    })

    await Promise.allSettled(loadPromises)
  }, [assetList, loadAsset])

  // Check if batch is complete
  useEffect(() => {
    if (!isLoading && totalAssets > 0) {
      if (errors.size > 0) {
        onBatchError?.(errors)
      }
      if (assets.size > 0) {
        onBatchComplete?.(assets)
      }
    }
  }, [isLoading, totalAssets, assets, errors, onBatchComplete, onBatchError])

  // Auto-load when asset list changes
  useEffect(() => {
    if (autoLoad && assetList.length > 0) {
      loadBatch()
    }
  }, [autoLoad, assetList, loadBatch])

  return {
    assets,
    loading: isLoading,
    errors,
    progress,
    reload: loadBatch
  }
}

export default useSimpleAssetLoader