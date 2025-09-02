import React, { useState } from 'react'
import { Vector3 } from 'three'
import { useCameraSystem } from '../../hooks/useCameraSystem'
import { useTeleportSettings } from '../../systems/settings/UserSettingsContext'
import { TeleportCategory } from '../../types/camera'
import { useSimpleErrorHandler } from '../../hooks/useSimpleErrorHandler'
import './TeleportUI.css'

interface TeleportUIProps {
  visible: boolean
  onClose: () => void
}

export function TeleportUI({ visible, onClose }: TeleportUIProps) {
  const {
    teleportPoints,
    teleportTo,
    quickTeleportTo,
    addTeleportPoint,
    removeTeleportPoint,
    isTransitioning,
    getCurrentState,
    teleportFromMap
  } = useCameraSystem()

  const { settings: teleportSettings } = useTeleportSettings()
  const { handleError, safeExecute, showMessage } = useSimpleErrorHandler()

  const [selectedCategory, setSelectedCategory] = useState<TeleportCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newPointName, setNewPointName] = useState('')
  const [newPointDescription, setNewPointDescription] = useState('')
  const [newPointCategory, setNewPointCategory] = useState<TeleportCategory>('custom')
  const [showMiniMap, setShowMiniMap] = useState(teleportSettings.showMiniMap)

  const categories: (TeleportCategory | 'all')[] = ['all', 'gallery', 'artwork', 'entrance', 'viewpoint', 'debug', 'custom']

  const filteredPoints = teleportPoints.filter(point => {
    const matchesCategory = selectedCategory === 'all' || point.category === selectedCategory
    const matchesSearch = !searchQuery || 
      point.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      point.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      point.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    
    return matchesCategory && matchesSearch
  })

  const handleTeleport = async (pointId: string, instant: boolean = false) => {
    const result = await safeExecute(async () => {
      if (instant && teleportSettings.enableQuickTeleport) {
        quickTeleportTo(pointId)
        showMessage('Teleport tamamlandı!', 'info', 2000)
      } else {
        await teleportTo(pointId, {
          duration: teleportSettings.defaultTeleportDuration,
          easing: 'easeInOut'
        })
        showMessage('Teleport tamamlandı!', 'info', 2000)
      }
    }, undefined, 'unknown')

    if (!result) {
      showMessage('Teleport başarısız oldu', 'error')
    }
  }

  const handleAddTeleportPoint = () => {
    if (!newPointName.trim()) return

    const currentState = getCurrentState()
    
    addTeleportPoint({
      name: newPointName.trim(),
      position: currentState.position,
      rotation: currentState.rotation,
      description: newPointDescription.trim() || undefined,
      category: newPointCategory,
      enabled: true,
      tags: ['user-created']
    })

    // Reset form
    setNewPointName('')
    setNewPointDescription('')
    setNewPointCategory('custom')
    setShowAddForm(false)
  }

  const handleMapClick = async (event: React.MouseEvent<HTMLDivElement>) => {
    if (!showMiniMap || !teleportSettings.enableMapTeleport) return

    const rect = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - rect.left) / rect.width
    const y = (event.clientY - rect.top) / rect.height

    const result = await safeExecute(async () => {
      await teleportFromMap({ x, y })
      showMessage('Harita teleportu tamamlandı!', 'info', 2000)
    }, undefined, 'unknown')

    if (!result) {
      showMessage('Harita teleportu başarısız oldu', 'error')
    }
  }

  const formatPosition = (position: Vector3) => {
    return `(${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)})`
  }

  const getCategoryIcon = (category: TeleportCategory | string) => {
    const icons: Record<string, string> = {
      gallery: '🏛️',
      artwork: '🎨',
      entrance: '🚪',
      viewpoint: '👁️',
      debug: '🔧',
      custom: '📍'
    }
    return icons[category] || '📍'
  }

  if (!visible) return null

  return (
    <div className="teleport-ui-overlay">
      <div className="teleport-ui-panel">
        <div className="teleport-ui-header">
          <h2>Teleport Sistemi</h2>
          <div className="teleport-ui-controls">
            <button
              onClick={() => setShowMiniMap(!showMiniMap)}
              className={`teleport-btn ${showMiniMap ? 'active' : ''}`}
              title="Mini haritayı aç/kapat"
            >
              🗺️
            </button>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`teleport-btn ${showAddForm ? 'active' : ''}`}
              title="Teleport noktası ekle"
            >
              ➕
            </button>
            <button
              onClick={onClose}
              className="teleport-btn close"
              title="Teleport arayüzünü kapat"
            >
              ✕
            </button>
          </div>
        </div>

        {showMiniMap && (
          <div className="mini-map-container">
            <div className="mini-map" onClick={handleMapClick}>
              <div className="map-grid">
                {/* Simple grid background */}
                {Array.from({ length: 10 }, (_, i) => (
                  <div key={`h-${i}`} className="grid-line horizontal" style={{ top: `${i * 10}%` }} />
                ))}
                {Array.from({ length: 10 }, (_, i) => (
                  <div key={`v-${i}`} className="grid-line vertical" style={{ left: `${i * 10}%` }} />
                ))}
              </div>
              
              {/* Teleport points on map */}
              {filteredPoints.map(point => {
                const mapPos = { x: 0.5, y: 0.5 } // Simplified - would use actual conversion
                return (
                  <div
                    key={point.id}
                    className="map-point"
                    style={{
                      left: `${mapPos.x * 100}%`,
                      top: `${mapPos.y * 100}%`
                    }}
                    title={point.name}
                  >
                    {getCategoryIcon(point.category)}
                  </div>
                )
              })}
              
              <div className="map-instructions">
                Teleport için herhangi bir yere tıklayın
              </div>
            </div>
          </div>
        )}

        {showAddForm && (
          <div className="add-teleport-form">
            <h3>Teleport Noktası Ekle</h3>
            <div className="form-group">
              <input
                type="text"
                placeholder="Nokta adı"
                value={newPointName}
                onChange={(e) => setNewPointName(e.target.value)}
                className="teleport-input"
                maxLength={50}
              />
            </div>
            <div className="form-group">
              <textarea
                placeholder="Açıklama (isteğe bağlı)"
                value={newPointDescription}
                onChange={(e) => setNewPointDescription(e.target.value)}
                className="teleport-textarea"
                rows={2}
                maxLength={200}
              />
            </div>
            <div className="form-group">
              <select
                value={newPointCategory}
                onChange={(e) => setNewPointCategory(e.target.value as TeleportCategory)}
                className="teleport-select"
              >
                <option value="custom">Özel</option>
                <option value="gallery">Galeri</option>
                <option value="artwork">Eser</option>
                <option value="viewpoint">Bakış Açısı</option>
                <option value="debug">Hata Ayıklama</option>
              </select>
            </div>
            <div className="form-actions">
              <button
                onClick={handleAddTeleportPoint}
                disabled={!newPointName.trim()}
                className="teleport-btn primary"
              >
                Nokta Ekle
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="teleport-btn secondary"
              >
                İptal
              </button>
            </div>
          </div>
        )}

        <div className="teleport-ui-filters">
          <div className="category-filter">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              >
                {category === 'all' ? '🌐' : getCategoryIcon(category as TeleportCategory)} {category === 'all' ? 'Hepsi' : category}
              </button>
            ))}
          </div>
          
          <div className="search-filter">
            <input
              type="text"
              placeholder="Teleport noktalarında ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="teleport-search"
            />
          </div>
        </div>

        <div className="teleport-points-list">
          {filteredPoints.length === 0 ? (
            <div className="empty-state">
              <p>Teleport noktası bulunamadı.</p>
              {selectedCategory !== 'all' && (
                <p>Farklı bir kategori seçmeyi veya aramayı temizlemeyi deneyin.</p>
              )}
            </div>
          ) : (
            filteredPoints.map(point => (
              <div key={point.id} className="teleport-point-item">
                <div className="point-header">
                  <div className="point-info">
                    <span className="point-icon">{getCategoryIcon(point.category)}</span>
                    <div className="point-details">
                      <div className="point-name">{point.name}</div>
                      <div className="point-category">{point.category}</div>
                    </div>
                  </div>
                  <div className="point-actions">
                    <button
                      onClick={() => handleTeleport(point.id, true)}
                      disabled={isTransitioning}
                      className="teleport-btn instant"
                      title="Anında teleport"
                    >
                      ⚡
                    </button>
                    <button
                      onClick={() => handleTeleport(point.id, false)}
                      disabled={isTransitioning}
                      className="teleport-btn smooth"
                      title="Yumuşak geçişle teleport"
                    >
                      🎯
                    </button>
                    <button
                      onClick={() => removeTeleportPoint(point.id)}
                      className="teleport-btn danger"
                      title="Noktayı kaldır"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                {point.description && (
                  <div className="point-description">
                    {point.description}
                  </div>
                )}
                
                <div className="point-metadata">
                  <div className="point-position">
                    Konum: {formatPosition(point.position)}
                  </div>
                  {point.tags.length > 0 && (
                    <div className="point-tags">
                      {point.tags.map(tag => (
                        <span key={tag} className="tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {isTransitioning && (
          <div className="teleport-loading">
            <div className="loading-spinner"></div>
            <div>Teleport ediliyor...</div>
          </div>
        )}

        <div className="teleport-ui-footer">
          <div className="teleport-stats">
            {teleportPoints.length} noktadan {filteredPoints.length} tanesi
          </div>
          <div className="teleport-help">
            💡 İpucu: Hızlı geliştirme teleportları için Ctrl+1/2/3 kullanın
          </div>
        </div>
      </div>
    </div>
  )
}