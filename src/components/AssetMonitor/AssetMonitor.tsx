import React, { useState } from 'react'
import { useAssetManager } from '../../hooks/useAssetManager'
import { useAssets } from '../../systems/assets/AssetContext'
import './AssetMonitor.css'

interface AssetMonitorProps {
  visible?: boolean
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

export function AssetMonitor({ 
  visible = false, 
  position = 'top-right' 
}: AssetMonitorProps) {
  const { cacheStats, totalLoadedAssets, loadingStates } = useAssetManager()
  const { loadingAssets } = useAssets()
  const [expanded, setExpanded] = useState(false)

  if (!visible) return null

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`
  }

  return (
    <div className={`asset-monitor asset-monitor--${position}`}>
      <div className="asset-monitor__header" onClick={() => setExpanded(!expanded)}>
        <h3>Varlık İzleyici</h3>
        <span className="asset-monitor__toggle">
          {expanded ? '−' : '+'}
        </span>
      </div>

      {expanded && (
        <div className="asset-monitor__content">
          {/* Cache Statistics */}
          <div className="asset-monitor__section">
            <h4>Önbellek İstatistikleri</h4>
            <div className="asset-monitor__stats">
              <div className="stat">
                <span className="stat__label">Toplam Varlık:</span>
                <span className="stat__value">{cacheStats.totalAssets}</span>
              </div>
              <div className="stat">
                <span className="stat__label">Bellek Kullanımı:</span>
                <span className="stat__value">{formatBytes(cacheStats.totalMemoryUsage)}</span>
              </div>
              <div className="stat">
                <span className="stat__label">İsabet Oranı:</span>
                <span className="stat__value">{formatPercentage(cacheStats.hitRate / (cacheStats.hitRate + cacheStats.missRate) || 0)}</span>
              </div>
              <div className="stat">
                <span className="stat__label">Tahliyeler:</span>
                <span className="stat__value">{cacheStats.evictionCount}</span>
              </div>
            </div>
          </div>

          {/* Currently Loading Assets */}
          {Array.from(loadingAssets.values()).length > 0 && (
            <div className="asset-monitor__section">
              <h4>Yüklenen Varlıklar</h4>
              <div className="asset-monitor__loading">
                {Array.from(loadingAssets.values()).map((progress) => (
                  <div key={progress.assetId} className="loading-item">
                    <div className="loading-item__info">
                      <span className="loading-item__id">{progress.assetId}</span>
                      <span className="loading-item__stage">{progress.stage}</span>
                    </div>
                    <div className="loading-item__progress">
                      <div 
                        className="loading-item__progress-bar"
                        style={{ width: `${progress.percentage}%` }}
                      />
                      <span className="loading-item__percentage">
                        {progress.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading States */}
          {loadingStates.length > 0 && (
            <div className="asset-monitor__section">
              <h4>Varlık Durumları</h4>
              <div className="asset-monitor__states">
                {loadingStates.map((state, index) => (
                  <div key={index} className={`state-item state-item--${state.loading ? 'loading' : state.error ? 'error' : 'loaded'}`}>
                    <div className="state-item__status">
                      {state.loading && <span className="status-indicator status-indicator--loading">⏳</span>}
                      {state.error && <span className="status-indicator status-indicator--error">❌</span>}
                      {state.asset && <span className="status-indicator status-indicator--loaded">✅</span>}
                    </div>
                    <div className="state-item__info">
                      {state.asset && (
                        <>
                          <span className="state-item__type">{state.asset.type}</span>
                          <span className="state-item__size">{formatBytes(state.asset.size)}</span>
                        </>
                      )}
                      {state.error && (
                        <span className="state-item__error">{state.error.message}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Asset Types Breakdown */}
          <div className="asset-monitor__section">
            <h4>Varlık Türleri</h4>
            <div className="asset-monitor__types">
              {['model', 'texture', 'audio'].map(type => {
                const typeAssets = Array.from(loadingAssets.values()).filter(
                  progress => progress.assetId.startsWith(type)
                )
                return (
                  <div key={type} className="type-stat">
                    <span className="type-stat__label">{type === 'model' ? 'model' : type === 'texture' ? 'doku' : 'ses'}:</span>
                    <span className="type-stat__count">{typeAssets.length}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Performance Impact */}
          <div className="asset-monitor__section">
            <h4>Performans Etkisi</h4>
            <div className="asset-monitor__performance">
              <div className="perf-indicator">
                <span className="perf-indicator__label">Önbellek Verimliliği:</span>
                <span className={`perf-indicator__value ${
                  cacheStats.hitRate / (cacheStats.hitRate + cacheStats.missRate) > 0.8 
                    ? 'perf-indicator__value--good' 
                    : 'perf-indicator__value--warning'
                }`}>
                  {formatPercentage(cacheStats.hitRate / (cacheStats.hitRate + cacheStats.missRate) || 0)}
                </span>
              </div>
              <div className="perf-indicator">
                <span className="perf-indicator__label">Bellek Baskısı:</span>
                <span className={`perf-indicator__value ${
                  cacheStats.totalMemoryUsage < 100 * 1024 * 1024 
                    ? 'perf-indicator__value--good' 
                    : 'perf-indicator__value--warning'
                }`}>
                  {cacheStats.totalMemoryUsage < 100 * 1024 * 1024 ? 'Düşük' : 'Yüksek'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="asset-monitor__section">
            <h4>İşlemler</h4>
            <div className="asset-monitor__actions">
              <button 
                className="action-button action-button--danger"
                onClick={() => {
                  if (window.confirm('Tüm önbelleği temizlemek istediğinize emin misiniz?')) {
                    // This would call clearCache from useAssetManager
                    console.log('Clear cache clicked')
                  }
                }}
              >
                Önbelleği Temizle
              </button>
              <button 
                className="action-button action-button--warning"
                onClick={() => {
                  // This would call optimizeCache from useAssetManager
                  console.log('Optimize cache clicked')
                }}
              >
                Önbelleği Optimize Et
              </button>
              <button 
                className="action-button action-button--info"
                onClick={() => {
                  // Export cache statistics
                  const data = {
                    timestamp: new Date().toISOString(),
                    stats: cacheStats,
                    loadingStates: loadingStates.length
                  }
                  console.log('Cache stats:', data)
                }}
              >
                İstatistikleri Dışa Aktar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}