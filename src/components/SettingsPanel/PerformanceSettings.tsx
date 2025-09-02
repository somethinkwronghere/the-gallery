import React from 'react'
import { usePerformanceSettings } from '../../systems/settings/UserSettingsContext'
import { QualityPreset, ShadowQuality } from '../../types/performance'

export function PerformanceSettings() {
  const { settings, updateSettings, resetSettings } = usePerformanceSettings()

  const qualityPresets: { id: QualityPreset; name: string; description: string }[] = [
    { id: 'auto', name: 'Auto', description: 'Automatically adjust based on device performance' },
    { id: 'low', name: 'Low', description: 'Optimized for low-end devices' },
    { id: 'medium', name: 'Medium', description: 'Balanced quality and performance' },
    { id: 'high', name: 'High', description: 'Maximum quality for high-end devices' }
  ]

  const shadowQualities: { id: ShadowQuality; name: string }[] = [
    { id: 'off', name: 'Off' },
    { id: 'low', name: 'Low' },
    { id: 'medium', name: 'Medium' },
    { id: 'high', name: 'High' }
  ]

  const getQualityColor = (preset: QualityPreset) => {
    switch (preset) {
      case 'low': return '#ff9800'
      case 'medium': return '#2196f3'
      case 'high': return '#4caf50'
      case 'auto': return '#9c27b0'
      default: return '#666'
    }
  }

  return (
    <div className="settings-section">
      <div className="settings-group">
        <h4>Quality Preset</h4>
        
        <div className="preset-grid">
          {qualityPresets.map(preset => (
            <div key={preset.id} className="preset-item">
              <label className="preset-label">
                <input
                  type="radio"
                  name="qualityPreset"
                  value={preset.id}
                  checked={settings.qualityPreset === preset.id}
                  onChange={(e) => updateSettings({ qualityPreset: e.target.value as QualityPreset })}
                  className="setting-radio"
                />
                <div 
                  className="preset-card"
                  style={{ borderColor: settings.qualityPreset === preset.id ? getQualityColor(preset.id) : '#333' }}
                >
                  <div className="preset-name">{preset.name}</div>
                  <div className="preset-description">{preset.description}</div>
                </div>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-group">
        <h4>Performance Targets</h4>
        
        <div className="setting-item">
          <label className="setting-label">
            Target FPS
          </label>
          <div className="setting-control">
            <input
              type="range"
              min="15"
              max="144"
              step="15"
              value={settings.targetFPS}
              onChange={(e) => updateSettings({ targetFPS: parseInt(e.target.value) })}
              className="setting-slider"
            />
            <span className="setting-value">{settings.targetFPS} FPS</span>
          </div>
          <div className="setting-description">
            Target frame rate for the application
          </div>
        </div>

        <div className="setting-item">
          <label className="setting-label">
            Max Memory Usage
          </label>
          <div className="setting-control">
            <input
              type="range"
              min="128"
              max="2048"
              step="128"
              value={settings.maxMemoryUsage}
              onChange={(e) => updateSettings({ maxMemoryUsage: parseInt(e.target.value) })}
              className="setting-slider"
            />
            <span className="setting-value">{settings.maxMemoryUsage} MB</span>
          </div>
          <div className="setting-description">
            Maximum memory usage before optimization kicks in
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h4>Automatic Optimization</h4>
        
        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={settings.enableAutoQuality}
              onChange={(e) => updateSettings({ enableAutoQuality: e.target.checked })}
              className="setting-checkbox"
            />
            Enable Auto Quality
          </label>
          <div className="setting-description">
            Automatically adjust quality based on performance
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h4>Rendering Features</h4>
        
        <div className="setting-item">
          <label className="setting-label">
            Shadow Quality
          </label>
          <div className="setting-control">
            <select
              value={settings.shadowQuality}
              onChange={(e) => updateSettings({ shadowQuality: e.target.value as ShadowQuality })}
              className="setting-select"
            >
              {shadowQualities.map(quality => (
                <option key={quality.id} value={quality.id}>
                  {quality.name}
                </option>
              ))}
            </select>
          </div>
          <div className="setting-description">
            Quality of shadow rendering
          </div>
        </div>

        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={settings.antialiasing}
              onChange={(e) => updateSettings({ antialiasing: e.target.checked })}
              className="setting-checkbox"
            />
            Antialiasing
          </label>
          <div className="setting-description">
            Smooth jagged edges (may impact performance)
          </div>
        </div>

        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={settings.postProcessing}
              onChange={(e) => updateSettings({ postProcessing: e.target.checked })}
              className="setting-checkbox"
            />
            Post Processing
          </label>
          <div className="setting-description">
            Enable visual effects like bloom and tone mapping
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h4>Optimization Features</h4>
        
        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={settings.enableLOD}
              onChange={(e) => updateSettings({ enableLOD: e.target.checked })}
              className="setting-checkbox"
            />
            Level of Detail (LOD)
          </label>
          <div className="setting-description">
            Use simpler models when objects are far away
          </div>
        </div>

        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={settings.enableCulling}
              onChange={(e) => updateSettings({ enableCulling: e.target.checked })}
              className="setting-checkbox"
            />
            Frustum Culling
          </label>
          <div className="setting-description">
            Don't render objects outside the camera view
          </div>
        </div>

        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={settings.enableInstancing}
              onChange={(e) => updateSettings({ enableInstancing: e.target.checked })}
              className="setting-checkbox"
            />
            Instancing
          </label>
          <div className="setting-description">
            Optimize rendering of multiple identical objects
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h4>Performance Tips</h4>
        <div className="performance-tips">
          <div className="tip-item">
            <span className="tip-icon">💡</span>
            <span className="tip-text">
              Use "Auto" quality preset for best experience across different devices
            </span>
          </div>
          <div className="tip-item">
            <span className="tip-icon">⚡</span>
            <span className="tip-text">
              Lower target FPS if you experience stuttering on older devices
            </span>
          </div>
          <div className="tip-item">
            <span className="tip-icon">🎯</span>
            <span className="tip-text">
              Enable all optimization features for maximum performance
            </span>
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button
          onClick={resetSettings}
          className="settings-btn secondary"
        >
          Reset Performance Settings
        </button>
      </div>
    </div>
  )
}