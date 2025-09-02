import React, { useState, useEffect, useCallback } from 'react'
import { AssetType, Asset } from '../../types/assets'
import { useAssetManager } from '../../hooks/useAssetManager'
import { useSimpleErrorHandler } from '../../hooks/useSimpleErrorHandler'
import './SimpleAssetLoader.css'

interface SimpleAssetLoaderProps {
  url: string
  type: AssetType
  children: (asset: Asset | null, loading: boolean, error: Error | null) => React.ReactNode
  fallbackUrl?: string
  onLoad?: (asset: Asset) => void
  onError?: (error: Error) => void
  className?: string
}

interface SimpleProgress {
  percentage: number
  message: string
}

export const SimpleAssetLoader: React.FC<SimpleAssetLoaderProps> = ({
  url,
  type,
  children,
  fallbackUrl,
  onLoad,
  onError,
  className = ''
}) => {
  const [asset, setAsset] = useState<Asset | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [progress, setProgress] = useState<SimpleProgress>({ percentage: 0, message: 'Başlatılıyor...' })
  const [currentUrl, setCurrentUrl] = useState(url)

  const { loadAsset } = useAssetManager()
  const { handleError } = useSimpleErrorHandler()

  const load = useCallback(async (assetUrl: string) => {
    if (!assetUrl) return

    try {
      setLoading(true)
      setError(null)
      setAsset(null)
      setProgress({ percentage: 0, message: 'Yükleniyor...' })

      const loadedAsset = await loadAsset(assetUrl, type, {
        cache: true,
        onProgress: (progressData) => {
          const percentage = Math.round(progressData.percentage)
          let message = 'Yükleniyor...'
          
          if (progressData.stage === 'downloading') {
            message = 'İndiriliyor...'
          } else if (progressData.stage === 'parsing') {
            message = 'İşleniyor...'
          } else if (progressData.stage === 'complete') {
            message = 'Tamamlandı!'
          }

          setProgress({ percentage, message })
        }
      })

      setAsset(loadedAsset)
      setProgress({ percentage: 100, message: 'Tamamlandı!' })
      onLoad?.(loadedAsset)
    } catch (err) {
      const loadError = err as Error
      
      // Try fallback URL if available and not already tried
      if (fallbackUrl && assetUrl !== fallbackUrl) {
        console.warn(`Asset yüklenemedi: ${assetUrl}, fallback deneniyor: ${fallbackUrl}`)
        setCurrentUrl(fallbackUrl)
        return
      }

      // Handle error
      setError(loadError)
      handleError(loadError)
      onError?.(loadError)
    } finally {
      setLoading(false)
    }
  }, [loadAsset, type, fallbackUrl, url, handleError, onLoad, onError])

  // Load when URL changes
  useEffect(() => {
    if (currentUrl) {
      load(currentUrl)
    }
  }, [currentUrl, load])

  // Reset when original URL changes
  useEffect(() => {
    if (url !== currentUrl) {
      setCurrentUrl(url)
    }
  }, [url, currentUrl])

  const renderContent = () => {
    // Show error state with retry option
    if (error) {
      return (
        <div className="simple-asset-loader__error">
          <SimpleAssetPlaceholder
            type={type}
            message={`Hata: ${error.message}`}
            showRetry={true}
            onRetry={() => {
              setCurrentUrl(url)
              load(url)
            }}
          />
        </div>
      )
    }

    // Show loading state
    if (loading) {
      return (
        <div className="simple-asset-loader__loading">
          <SimpleAssetPlaceholder
            type={type}
            message={`${progress.percentage}% - ${progress.message}`}
            progress={progress.percentage}
          />
        </div>
      )
    }

    // Show loaded content
    return children(asset, loading, error)
  }

  return (
    <div className={`simple-asset-loader ${className}`}>
      {renderContent()}
    </div>
  )
}

// Simplified placeholder component
interface SimpleAssetPlaceholderProps {
  type: AssetType
  message: string
  progress?: number
  showRetry?: boolean
  onRetry?: () => void
}

const SimpleAssetPlaceholder: React.FC<SimpleAssetPlaceholderProps> = ({
  type,
  message,
  progress,
  showRetry = false,
  onRetry
}) => {
  const getIcon = (assetType: AssetType) => {
    const iconMap: Record<AssetType, string> = {
      model: '🎯',
      texture: '🖼️',
      audio: '🔊',
      material: '🎨',
      geometry: '📐'
    }
    return iconMap[assetType] || '📄'
  }

  return (
    <div className="simple-asset-placeholder">
      <div className="simple-asset-placeholder__icon">
        {getIcon(type)}
      </div>
      
      <div className="simple-asset-placeholder__message">
        {message}
      </div>

      {progress !== undefined && (
        <div className="simple-asset-placeholder__progress">
          <div 
            className="simple-asset-placeholder__progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {showRetry && onRetry && (
        <button 
          className="simple-asset-placeholder__retry"
          onClick={onRetry}
        >
          Tekrar Dene
        </button>
      )}

      {!showRetry && (
        <div className="simple-asset-placeholder__spinner">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  )
}

// Specialized loaders for convenience
export const SimpleModelLoader: React.FC<Omit<SimpleAssetLoaderProps, 'type'>> = (props) => (
  <SimpleAssetLoader {...props} type="model" />
)

export const SimpleTextureLoader: React.FC<Omit<SimpleAssetLoaderProps, 'type'>> = (props) => (
  <SimpleAssetLoader {...props} type="texture" />
)

export const SimpleAudioLoader: React.FC<Omit<SimpleAssetLoaderProps, 'type'>> = (props) => (
  <SimpleAssetLoader {...props} type="audio" />
)

export default SimpleAssetLoader