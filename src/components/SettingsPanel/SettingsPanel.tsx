import React, { useState, useEffect } from 'react'
import { useUserSettings } from '../../systems/settings/UserSettingsContext'
import { SettingsCategory, SettingsPreset } from '../../types/settings'
import { PerformanceSettings } from './PerformanceSettings'
import { DisplaySettings } from './DisplaySettings'
import { CameraSettings } from './CameraSettings'
import { TeleportSettings } from './TeleportSettings'
import { AudioSettings } from './AudioSettings'
import { AccessibilitySettings } from './AccessibilitySettings'
import { DeveloperSettings } from './DeveloperSettings'
import { useSimpleErrorHandler } from '../../hooks/useSimpleErrorHandler'
import './SettingsPanel.css'

interface SettingsPanelProps {
  visible: boolean
  onClose: () => void
  initialCategory?: SettingsCategory
}

export function SettingsPanel({ visible, onClose, initialCategory = 'performance' }: SettingsPanelProps) {
  const {
    settings,
    isLoading,
    isDirty,
    lastSaved,
    validationResult,
    availablePresets,
    actions
  } = useUserSettings()
  
  const { safeExecute, showMessage } = useSimpleErrorHandler()

  const [activeCategory, setActiveCategory] = useState<SettingsCategory>(initialCategory)
  const [searchQuery, setSearchQuery] = useState('')
  const [showPresets, setShowPresets] = useState(false)
  const [showImportExport, setShowImportExport] = useState(false)
  const [importData, setImportData] = useState('')
  const [exportData, setExportData] = useState('')

  const categories: { id: SettingsCategory; name: string; icon: string }[] = [
    { id: 'performance', name: 'Performans', icon: '⚡' },
    { id: 'display', name: 'Görüntü', icon: '🖥️' },
    { id: 'camera', name: 'Kamera', icon: '📷' },
    { id: 'teleport', name: 'Teleport', icon: '🎯' },
    { id: 'audio', name: 'Ses', icon: '🔊' },
    { id: 'accessibility', name: 'Erişilebilirlik', icon: '♿' },
    { id: 'developer', name: 'Geliştirici', icon: '🔧' }
  ]

  // Auto-save indicator
  useEffect(() => {
    if (isDirty) {
      const timeout = setTimeout(() => {
        // Auto-save will be handled by the context
      }, 2000)
      return () => clearTimeout(timeout)
    }
  }, [isDirty])

  const handleSaveSettings = async () => {
    const result = await safeExecute(async () => {
      await actions.saveSettings()
      showMessage('Ayarlar kaydedildi!', 'info', 2000)
    }, undefined, 'unknown')

    if (!result) {
      showMessage('Ayarlar kaydedilemedi', 'error')
    }
  }

  const handleResetCategory = () => {
    if (confirm(`${activeCategory} ayarlarını varsayılana sıfırlamak istiyor musunuz?`)) {
      actions.resetCategory(activeCategory)
    }
  }

  const handleResetAll = () => {
    if (confirm('Tüm ayarları varsayılana sıfırlamak istiyor musunuz? Bu işlem geri alınamaz.')) {
      actions.resetSettings()
    }
  }

  const handleApplyPreset = (presetId: string) => {
    const preset = availablePresets.find(p => p.id === presetId)
    if (preset && confirm(`"${preset.name}" ön ayarını uygulamak istiyor musunuz? Mevcut ayarların üzerine yazılacaktır.`)) {
      actions.applyPreset(presetId)
      setShowPresets(false)
    }
  }

  const handleCreatePreset = () => {
    const name = prompt('Ön ayar adı girin:')
    if (name?.trim()) {
      const description = prompt('Ön ayar açıklaması (opsiyonel):')
      actions.createPreset(name.trim(), description?.trim())
    }
  }

  const handleDeletePreset = (presetId: string) => {
    const preset = availablePresets.find(p => p.id === presetId)
    if (preset && !preset.isBuiltIn && confirm(`"${preset.name}" ön ayarını silmek istiyor musunuz?`)) {
      actions.deletePreset(presetId)
    }
  }

  const handleExportSettings = async () => {
    const result = await safeExecute(async () => {
      const data = await actions.exportSettings()
      setExportData(data)
      setShowImportExport(true)
      showMessage('Ayarlar dışa aktarıldı!', 'info', 2000)
    }, undefined, 'unknown')

    if (!result) {
      showMessage('Ayarlar dışa aktarılamadı', 'error')
    }
  }

  const handleImportSettings = async () => {
    if (!importData.trim()) return
    
    const result = await safeExecute(async () => {
      await actions.importSettings(importData)
      setImportData('')
      setShowImportExport(false)
      showMessage('Ayarlar başarıyla içe aktarıldı!', 'info', 3000)
    }, undefined, 'unknown')

    if (!result) {
      showMessage('Ayarlar içe aktarılamadı. Lütfen veri biçimini kontrol edin.', 'error')
    }
  }

  const renderCategoryContent = () => {
    switch (activeCategory) {
      case 'performance':
        return <PerformanceSettings />
      case 'display':
        return <DisplaySettings />
      case 'camera':
        return <CameraSettings />
      case 'teleport':
        return <TeleportSettings />
      case 'audio':
        return <AudioSettings />
      case 'accessibility':
        return <AccessibilitySettings />
      case 'developer':
        return <DeveloperSettings />
      default:
        return <div>Kategori bulunamadı</div>
    }
  }

  const filteredCategories = categories.filter(category =>
    !searchQuery || 
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!visible) return null

  return (
    <div className="settings-panel-overlay">
      <div className="settings-panel">
        <div className="settings-header">
          <h2>Ayarlar</h2>
          <div className="settings-header-controls">
            <div className="settings-status">
              {isLoading && <span className="status-loading">💾 Kaydediliyor...</span>}
              {isDirty && !isLoading && <span className="status-dirty">● Kaydedilmemiş değişiklikler</span>}
              {lastSaved && !isDirty && !isLoading && (
                <span className="status-saved">
                  ✓ Kaydedildi {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="settings-btn"
              title="Ön ayarları yönet"
            >
              📋
            </button>
            <button
              onClick={() => setShowImportExport(!showImportExport)}
              className="settings-btn"
              title="Ayarları içe/dışa aktar"
            >
              📤
            </button>
            <button
              onClick={onClose}
              className="settings-btn close"
              title="Ayarları kapat"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Validation errors */}
        {validationResult && !validationResult.isValid && (
          <div className="settings-validation-errors">
            <h4>⚠️ Ayar Doğrulama Hataları:</h4>
            {validationResult.errors.map((error, index) => (
              <div key={index} className="validation-error">
                <strong>{error.category}.{error.field}:</strong> {error.message}
              </div>
            ))}
          </div>
        )}

        {/* Validation warnings */}
        {validationResult && validationResult.warnings.length > 0 && (
          <div className="settings-validation-warnings">
            <h4>⚠️ Ayar Uyarıları:</h4>
            {validationResult.warnings.map((warning, index) => (
              <div key={index} className="validation-warning">
                <strong>{warning.category}.{warning.field}:</strong> {warning.message}
              </div>
            ))}
          </div>
        )}

        {/* Presets panel */}
        {showPresets && (
          <div className="settings-presets-panel">
            <div className="presets-header">
              <h3>Ayar Ön Ayarları</h3>
              <button
                onClick={handleCreatePreset}
                className="settings-btn primary"
              >
                Ön Ayar Oluştur
              </button>
            </div>
            <div className="presets-list">
              {availablePresets.map(preset => (
                <div key={preset.id} className="preset-item">
                  <div className="preset-info">
                    <div className="preset-name">{preset.name}</div>
                    {preset.description && (
                      <div className="preset-description">{preset.description}</div>
                    )}
                    <div className="preset-meta">
                      {preset.isBuiltIn ? 'Yerleşik' : 'Özel'} • 
                      Oluşturulma {preset.createdAt.toLocaleDateString()}
                    </div>
                  </div>
                  <div className="preset-actions">
                    <button
                      onClick={() => handleApplyPreset(preset.id)}
                      className="settings-btn primary"
                    >
                      Uygula
                    </button>
                    {!preset.isBuiltIn && (
                      <button
                        onClick={() => handleDeletePreset(preset.id)}
                        className="settings-btn danger"
                      >
                        Sil
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Import/Export panel */}
        {showImportExport && (
          <div className="settings-import-export-panel">
            <div className="import-export-header">
              <h3>Ayarları İçe/Dışa Aktar</h3>
            </div>
            
            <div className="export-section">
              <h4>Ayarları Dışa Aktar</h4>
              <button
                onClick={handleExportSettings}
                className="settings-btn primary"
              >
                Mevcut Ayarları Dışa Aktar
              </button>
              {exportData && (
                <div className="export-data">
                  <textarea
                    value={exportData}
                    readOnly
                    rows={10}
                    className="settings-textarea"
                    placeholder="Dışa aktarılan ayarlar burada görünecek..."
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(exportData)}
                    className="settings-btn secondary"
                  >
                    Panoya Kopyala
                  </button>
                </div>
              )}
            </div>
            
            <div className="import-section">
              <h4>Ayarları İçe Aktar</h4>
              <textarea
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                rows={10}
                className="settings-textarea"
                placeholder="Dışa aktarılan ayar verisini buraya yapıştırın..."
              />
              <button
                onClick={handleImportSettings}
                disabled={!importData.trim()}
                className="settings-btn primary"
              >
                Ayarları İçe Aktar
              </button>
            </div>
          </div>
        )}

        <div className="settings-content">
          <div className="settings-sidebar">
            <div className="settings-search">
              <input
                type="text"
                placeholder="Ayarlar içinde ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="settings-search-input"
              />
            </div>
            
            <div className="settings-categories">
              {filteredCategories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
                >
                  <span className="category-icon">{category.icon}</span>
                  <span className="category-name">{category.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="settings-main">
            <div className="settings-category-header">
              <h3>
                {categories.find(c => c.id === activeCategory)?.icon} {' '}
                {categories.find(c => c.id === activeCategory)?.name} Ayarları
              </h3>
              <div className="category-actions">
                <button
                  onClick={handleResetCategory}
                  className="settings-btn secondary"
                  title="Kategoriyi varsayılana sıfırla"
                >
                  Kategoriyi Sıfırla
                </button>
              </div>
            </div>
            
            <div className="settings-category-content">
              {renderCategoryContent()}
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <div className="settings-footer-left">
            <button
              onClick={handleResetAll}
              className="settings-btn danger"
            >
              Tüm Ayarları Sıfırla
            </button>
          </div>
          
          <div className="settings-footer-right">
            <button
              onClick={handleSaveSettings}
              disabled={!isDirty || isLoading}
              className="settings-btn primary"
            >
              {isLoading ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
            </button>
            <button
              onClick={onClose}
              className="settings-btn secondary"
            >
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}