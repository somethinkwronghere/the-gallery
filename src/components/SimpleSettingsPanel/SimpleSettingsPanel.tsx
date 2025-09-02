import React, { useState } from 'react'
import { useSimplePreferences } from '../../hooks/useSimplePreferences'
import { QualityLevel, QUALITY_PRESETS } from '../../types/simpleSettings'
import { useSimpleErrorHandler } from '../../hooks/useSimpleErrorHandler'
import './SimpleSettingsPanel.css'

interface SimpleSettingsPanelProps {
  visible: boolean
  onClose: () => void
}

export function SimpleSettingsPanel({ visible, onClose }: SimpleSettingsPanelProps) {
  const {
    preferences,
    isLoading,
    updatePreferences,
    setQuality,
    reset,
    exportPreferences,
    importPreferences
  } = useSimplePreferences()

  const { safeExecute, showMessage } = useSimpleErrorHandler()
  const [showExportImport, setShowExportImport] = useState(false)
  const [importData, setImportData] = useState('')

  const handleQualityChange = async (quality: QualityLevel) => {
    await safeExecute(async () => {
      await setQuality(quality)
      showMessage(`Kalite ${QUALITY_PRESETS[quality].name} olarak ayarlandı`, 'info', 2000)
    }, undefined, 'unknown')
  }

  const handleVolumeChange = async (volume: number) => {
    await safeExecute(async () => {
      await updatePreferences({ masterVolume: volume })
    }, undefined, 'unknown')
  }

  const handleToggleFPS = async () => {
    await safeExecute(async () => {
      await updatePreferences({ showFPS: !preferences.showFPS })
    }, undefined, 'unknown')
  }

  const handleTogglePerformanceStats = async () => {
    await safeExecute(async () => {
      await updatePreferences({ showPerformanceStats: !preferences.showPerformanceStats })
    }, undefined, 'unknown')
  }

  const handleFontSizeChange = async (fontSize: 'small' | 'medium' | 'large') => {
    await safeExecute(async () => {
      await updatePreferences({ fontSize })
    }, undefined, 'unknown')
  }

  const handleReset = async () => {
    if (confirm('Tüm ayarları varsayılana sıfırlamak istiyor musunuz?')) {
      await safeExecute(async () => {
        await reset()
        showMessage('Ayarlar sıfırlandı', 'info', 2000)
      }, undefined, 'unknown')
    }
  }

  const handleExport = () => {
    try {
      const data = exportPreferences()
      navigator.clipboard.writeText(data)
      showMessage('Ayarlar panoya kopyalandı', 'info', 2000)
    } catch (error) {
      showMessage('Ayarlar kopyalanamadı', 'error')
    }
  }

  const handleImport = () => {
    if (!importData.trim()) {
      showMessage('Lütfen ayar verisini girin', 'error')
      return
    }

    const success = importPreferences(importData)
    if (success) {
      showMessage('Ayarlar başarıyla içe aktarıldı', 'info', 2000)
      setImportData('')
      setShowExportImport(false)
    } else {
      showMessage('Geçersiz ayar verisi', 'error')
    }
  }

  if (!visible) return null

  return (
    <div className="simple-settings-overlay">
      <div className="simple-settings-panel">
        <div className="simple-settings-header">
          <h2>Ayarlar</h2>
          <div className="simple-settings-header-controls">
            <button
              onClick={() => setShowExportImport(!showExportImport)}
              className="simple-settings-btn"
              title="Ayarları yedekle/geri yükle"
            >
              💾
            </button>
            <button
              onClick={onClose}
              className="simple-settings-btn close"
              title="Kapat"
            >
              ✕
            </button>
          </div>
        </div>

        {showExportImport && (
          <div className="simple-export-import-panel">
            <div className="export-section">
              <h4>Ayarları Yedekle</h4>
              <button onClick={handleExport} className="simple-settings-btn primary">
                Panoya Kopyala
              </button>
            </div>
            <div className="import-section">
              <h4>Ayarları Geri Yükle</h4>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                placeholder="Yedeklenen ayar verisini buraya yapıştırın..."
                rows={4}
                className="simple-import-textarea"
              />
              <button
                onClick={handleImport}
                disabled={!importData.trim()}
                className="simple-settings-btn primary"
              >
                Geri Yükle
              </button>
            </div>
          </div>
        )}

        <div className="simple-settings-content">
          {/* Quality Settings */}
          <div className="simple-settings-section">
            <h3>🎮 Kalite Ayarları</h3>
            <div className="quality-options">
              {Object.entries(QUALITY_PRESETS).map(([level, preset]) => (
                <label key={level} className="quality-option">
                  <input
                    type="radio"
                    name="quality"
                    value={level}
                    checked={preferences.quality === level}
                    onChange={() => handleQualityChange(level as QualityLevel)}
                    disabled={isLoading}
                  />
                  <div className="quality-info">
                    <div className="quality-name">{preset.name}</div>
                    <div className="quality-description">{preset.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Display Settings */}
          <div className="simple-settings-section">
            <h3>🖥️ Görüntü</h3>
            <div className="simple-setting-item">
              <label className="simple-checkbox">
                <input
                  type="checkbox"
                  checked={preferences.showFPS}
                  onChange={handleToggleFPS}
                  disabled={isLoading}
                />
                FPS Göstergesi
              </label>
            </div>
            <div className="simple-setting-item">
              <label className="simple-checkbox">
                <input
                  type="checkbox"
                  checked={preferences.showPerformanceStats}
                  onChange={handleTogglePerformanceStats}
                  disabled={isLoading}
                />
                Performans İstatistikleri
              </label>
            </div>
          </div>

          {/* Audio Settings */}
          <div className="simple-settings-section">
            <h3>🔊 Ses</h3>
            <div className="simple-setting-item">
              <label className="simple-slider">
                Ana Ses Seviyesi
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={preferences.masterVolume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  disabled={isLoading}
                />
                <span className="slider-value">{Math.round(preferences.masterVolume * 100)}%</span>
              </label>
            </div>
          </div>

          {/* Accessibility Settings */}
          <div className="simple-settings-section">
            <h3>♿ Erişilebilirlik</h3>
            <div className="simple-setting-item">
              <label className="simple-select">
                Yazı Boyutu
                <select
                  value={preferences.fontSize}
                  onChange={(e) => handleFontSizeChange(e.target.value as 'small' | 'medium' | 'large')}
                  disabled={isLoading}
                >
                  <option value="small">Küçük</option>
                  <option value="medium">Orta</option>
                  <option value="large">Büyük</option>
                </select>
              </label>
            </div>
          </div>
        </div>

        <div className="simple-settings-footer">
          <div className="simple-settings-info">
            Son güncelleme: {new Date(preferences.lastUpdated).toLocaleString('tr-TR')}
          </div>
          <div className="simple-settings-actions">
            <button
              onClick={handleReset}
              className="simple-settings-btn danger"
              disabled={isLoading}
            >
              Sıfırla
            </button>
            <button
              onClick={onClose}
              className="simple-settings-btn secondary"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}