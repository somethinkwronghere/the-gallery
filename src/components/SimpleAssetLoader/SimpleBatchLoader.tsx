import React, { useState, useEffect, useCallback } from 'react'
import { AssetType, Asset } from '../../types/assets'
import SimpleAssetLoader from './SimpleAssetLoader'
import './SimpleBatchLoader.css'

interface BatchAsset {
  id: string
  url: string
  type: AssetType
  fallbackUrl?: string
}

interface SimpleBatchLoaderProps {
  assets: BatchAsset[]
  children: (assets: Map<string, Asset>, loading: boolean, errors: Map<string, Error>) => React.ReactNode
  onBatchComplete?: (assets: Map<string, Asset>) => void
  onBatchError?: (errors: Map<string, Error>) => void
  showProgress?: boolean
  className?: string
}

interface BatchProgress {
  loaded: number
  total: number
  percentage: number
  currentAsset?: string
}

export const SimpleBatchLoader: React.FC<SimpleBatchLoaderProps> = ({
  assets,
  children,
  onBatchComplete,
  onBatchError,
  showProgress = true,
  className = ''
}) => {
  const [loadedAssets, setLoadedAssets] = useState<Map<string, Asset>>(new Map())
  const [errors, setErrors] = useState<Map<string, Error>>(new Map())
  const [loadingAssets, setLoadingAssets] = useState<Set<string>>(new Set())
  const [progress, setProgress] = useState<BatchProgress>({ loaded: 0, total: 0, percentage: 0 })

  const totalAssets = assets.length
  const isLoading = loadingAssets.size > 0

  // Update progress when loading state changes
  useEffect(() => {
    const loaded = totalAssets - loadingAssets.size
    const percentage = totalAssets > 0 ? Math.round((loaded / totalAssets) * 100) : 100
    
    setProgress({
      loaded,
      total: totalAssets,
      percentage,
      currentAsset: Array.from(loadingAssets)[0] // Show first loading asset
    })
  }, [loadingAssets.size, totalAssets])

  // Handle individual asset load
  const handleAssetLoad = useCallback((id: string, asset: Asset) => {
    setLoadedAssets(prev => new Map(prev).set(id, asset))
    setLoadingAssets(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
  }, [])

  // Handle individual asset error
  const handleAssetError = useCallback((id: string, error: Error) => {
    setErrors(prev => new Map(prev).set(id, error))
    setLoadingAssets(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
  }, [])

  // Check if batch is complete
  useEffect(() => {
    if (!isLoading && totalAssets > 0) {
      if (errors.size > 0) {
        onBatchError?.(errors)
      }
      if (loadedAssets.size > 0) {
        onBatchComplete?.(loadedAssets)
      }
    }
  }, [isLoading, totalAssets, loadedAssets, errors, onBatchComplete, onBatchError])

  // Reset state when assets change
  useEffect(() => {
    setLoadedAssets(new Map())
    setErrors(new Map())
    setLoadingAssets(new Set(assets.map(asset => asset.id)))
  }, [assets])

  return (
    <div className={`simple-batch-loader ${className}`}>
      {showProgress && isLoading && (
        <div className="simple-batch-loader__progress">
          <div className="simple-batch-loader__progress-text">
            {progress.loaded}/{progress.total} asset yüklendi ({progress.percentage}%)
          </div>
          <div className="simple-batch-loader__progress-bar">
            <div 
              className="simple-batch-loader__progress-fill"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          {progress.currentAsset && (
            <div className="simple-batch-loader__current">
              Yükleniyor: {progress.currentAsset}
            </div>
          )}
        </div>
      )}

      {/* Hidden asset loaders */}
      <div style={{ display: 'none' }}>
        {assets.map(({ id, url, type, fallbackUrl }) => (
          <SimpleAssetLoader
            key={id}
            url={url}
            type={type}
            fallbackUrl={fallbackUrl}
            onLoad={(asset) => handleAssetLoad(id, asset)}
            onError={(error) => handleAssetError(id, error)}
            children={() => null}
          />
        ))}
      </div>

      {children(loadedAssets, isLoading, errors)}
    </div>
  )
}

export default SimpleBatchLoader