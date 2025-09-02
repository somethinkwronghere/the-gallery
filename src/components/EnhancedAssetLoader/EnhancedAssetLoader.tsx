import React, { useState, useEffect } from 'react'
import { AssetType, Asset } from '../../types/assets'
import { useAssetLoading } from '../../hooks/useLoadingStates'
import AssetPlaceholder from '../AssetPlaceholder/AssetPlaceholder'
import './EnhancedAssetLoader.css'

interface EnhancedAssetLoaderProps {
  url: string
  type: AssetType
  fallbackUrl?: string
  children: (asset: Asset | null, loading: boolean, error: Error | null) => React.ReactNode
  placeholder?: React.ReactNode
  errorFallback?: React.ReactNode
  showProgress?: boolean
  showPlaceholder?: boolean
  retryCount?: number
  retryDelay?: number
  onLoad?: (asset: Asset) => void
  onError?: (error: Error) => void
  className?: string
}

export const EnhancedAssetLoader: React.FC<EnhancedAssetLoaderProps> = ({
  url,
  type,
  fallbackUrl,
  children,
  placeholder,
  errorFallback,
  showProgress = true,
  showPlaceholder = true,
  retryCount = 3,
  retryDelay = 1000,
  onLoad,
  onError,
  className = ''
}) => {
  const [currentUrl, setCurrentUrl] = useState(url)
  const [retryAttempts, setRetryAttempts] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)

  const { asset, error, loading, progress, reload } = useAssetLoading(currentUrl, type, true)

  // Handle successful load
  useEffect(() => {
    if (asset && !loading && !error) {
      onLoad?.(asset)
      setRetryAttempts(0) // Reset retry count on success
    }
  }, [asset, loading, error, onLoad])

  // Handle errors with retry logic
  useEffect(() => {
    if (error && !loading) {
      onError?.(error)

      // Try fallback URL first
      if (fallbackUrl && currentUrl !== fallbackUrl) {
        console.warn(`Failed to load ${currentUrl}, trying fallback: ${fallbackUrl}`)
        setCurrentUrl(fallbackUrl)
        setRetryAttempts(0)
        return
      }

      // Retry logic
      if (retryAttempts < retryCount) {
        setIsRetrying(true)
        const timeout = setTimeout(() => {
          setRetryAttempts(prev => prev + 1)
          setIsRetrying(false)
          reload()
        }, retryDelay * (retryAttempts + 1)) // Exponential backoff

        return () => clearTimeout(timeout)
      }
    }
  }, [error, loading, currentUrl, fallbackUrl, retryAttempts, retryCount, retryDelay, reload, onError])

  // Reset when URL changes
  useEffect(() => {
    if (url !== currentUrl && url !== fallbackUrl) {
      setCurrentUrl(url)
      setRetryAttempts(0)
      setIsRetrying(false)
    }
  }, [url, currentUrl, fallbackUrl])

  const renderContent = () => {
    // Show retry indicator
    if (isRetrying) {
      return (
        <div className="enhanced-asset-loader__retry">
          <div style={{ padding: '20px', textAlign: 'center' }}>
            Yeniden deneniyor... ({retryAttempts + 1}/{retryCount})
          </div>
        </div>
      )
    }

    // Show error state
    if (error && retryAttempts >= retryCount) {
      return (
        <div className="enhanced-asset-loader__error">
          {errorFallback || (
            <AssetPlaceholder
              type={type}
              message={`Yükleme hatası: ${error.message}`}
              color="#ffebee"
              onClick={() => {
                setRetryAttempts(0)
                reload()
              }}
            />
          )}
        </div>
      )
    }

    // Show loading state
    if (loading) {
      return (
        <div className="enhanced-asset-loader__loading">
          {showPlaceholder && (
            placeholder || (
              <AssetPlaceholder
                type={type}
                message={progress ? `${Math.round(progress.percentage)}% yüklendi` : undefined}
              />
            )
          )}
          {showProgress && progress && (
            <div className="enhanced-asset-loader__progress">
              <div style={{ padding: '10px', textAlign: 'center' }}>
                {Math.round(progress.percentage)}% - {progress.stage}
              </div>
            </div>
          )}
        </div>
      )
    }

    // Show loaded content
    return children(asset, loading, error)
  }

  return (
    <div className={`enhanced-asset-loader ${className}`}>
      {renderContent()}
    </div>
  )
}

// Specialized loaders for different asset types
export const ModelLoader: React.FC<Omit<EnhancedAssetLoaderProps, 'type'>> = (props) => (
  <EnhancedAssetLoader {...props} type="model" />
)

export const TextureLoader: React.FC<Omit<EnhancedAssetLoaderProps, 'type'>> = (props) => (
  <EnhancedAssetLoader {...props} type="texture" />
)

export const AudioLoader: React.FC<Omit<EnhancedAssetLoaderProps, 'type'>> = (props) => (
  <EnhancedAssetLoader {...props} type="audio" />
)

// Batch loader component
interface BatchAssetLoaderProps {
  assets: Array<{ url: string; type: AssetType; id: string }>
  children: (assets: Map<string, Asset>, loading: boolean, errors: Map<string, Error>) => React.ReactNode
  showGlobalProgress?: boolean
  onBatchComplete?: (assets: Map<string, Asset>) => void
  onBatchError?: (errors: Map<string, Error>) => void
  className?: string
}

export const BatchAssetLoader: React.FC<BatchAssetLoaderProps> = ({
  assets,
  children,
  showGlobalProgress = true,
  onBatchComplete,
  onBatchError,
  className = ''
}) => {
  const [loadedAssets, setLoadedAssets] = useState<Map<string, Asset>>(new Map())
  const [errors, setErrors] = useState<Map<string, Error>>(new Map())
  const [loadingCount, setLoadingCount] = useState(0)

  const totalAssets = assets.length
  const isLoading = loadingCount > 0
  const globalProgress = totalAssets > 0 ? ((totalAssets - loadingCount) / totalAssets) * 100 : 100

  // Handle individual asset completion
  const handleAssetLoad = (id: string, asset: Asset) => {
    setLoadedAssets(prev => new Map(prev).set(id, asset))
    setLoadingCount(prev => prev - 1)
  }

  const handleAssetError = (id: string, error: Error) => {
    setErrors(prev => new Map(prev).set(id, error))
    setLoadingCount(prev => prev - 1)
  }

  // Check if batch is complete
  useEffect(() => {
    if (!isLoading && totalAssets > 0) {
      if (errors.size > 0) {
        onBatchError?.(errors)
      } else {
        onBatchComplete?.(loadedAssets)
      }
    }
  }, [isLoading, totalAssets, loadedAssets, errors, onBatchComplete, onBatchError])

  // Reset when assets change
  useEffect(() => {
    setLoadedAssets(new Map())
    setErrors(new Map())
    setLoadingCount(totalAssets)
  }, [assets, totalAssets])

  return (
    <div className={`batch-asset-loader ${className}`}>
      {showGlobalProgress && isLoading && (
        <div className="batch-asset-loader__progress">
          <div style={{ padding: '10px', textAlign: 'center' }}>
            {Math.round(globalProgress)}% - {totalAssets - loadingCount}/{totalAssets} asset yüklendi
          </div>
        </div>
      )}

      {assets.map(({ url, type, id }) => (
        <EnhancedAssetLoader
          key={id}
          url={url}
          type={type}
          showProgress={false}
          showPlaceholder={false}
          onLoad={(asset) => handleAssetLoad(id, asset)}
          onError={(error) => handleAssetError(id, error)}
          className="batch-asset-loader__item"
          children={() => null} // Don't render individual items
        />
      ))}

      {children(loadedAssets, isLoading, errors)}
    </div>
  )
}

export default EnhancedAssetLoader