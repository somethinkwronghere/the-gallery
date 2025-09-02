import React from 'react'
import { useDisplaySettings } from '../../systems/settings/UserSettingsContext'

export function DisplaySettings() {
  const { settings, updateSettings, resetSettings } = useDisplaySettings()

  const themes = [
    { id: 'auto', name: 'Auto', description: 'Follow system preference' },
    { id: 'light', name: 'Light', description: 'Light theme' },
    { id: 'dark', name: 'Dark', description: 'Dark theme' }
  ] as const

  const fontSizes = [
    { id: 'small', name: 'Small', scale: 0.875 },
    { id: 'medium', name: 'Medium', scale: 1.0 },
    { id: 'large', name: 'Large', scale: 1.125 }
  ] as const

  return (
    <div className="settings-section">
      <div className="settings-group">
        <h4>Theme</h4>
        
        <div className="theme-grid">
          {themes.map(theme => (
            <div key={theme.id} className="theme-item">
              <label className="theme-label">
                <input
                  type="radio"
                  name="theme"
                  value={theme.id}
                  checked={settings.theme === theme.id}
                  onChange={(e) => updateSettings({ theme: e.target.value as any })}
                  className="setting-radio"
                />
                <div className={`theme-card ${settings.theme === theme.id ? 'active' : ''}`}>
                  <div className="theme-name">{theme.name}</div>
                  <div className="theme-description">{theme.description}</div>
                </div>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-group">
        <h4>UI Scale</h4>
        
        <div className="setting-item">
          <label className="setting-label">
            Interface Scale
          </label>
          <div className="setting-control">
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.uiScale}
              onChange={(e) => updateSettings({ uiScale: parseFloat(e.target.value) })}
              className="setting-slider"
            />
            <span className="setting-value">{Math.round(settings.uiScale * 100)}%</span>
          </div>
          <div className="setting-description">
            Scale of the user interface elements
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h4>Performance Indicators</h4>
        
        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={settings.showPerformanceStats}
              onChange={(e) => updateSettings({ showPerformanceStats: e.target.checked })}
              className="setting-checkbox"
            />
            Show Performance Stats
          </label>
          <div className="setting-description">
            Display overall performance statistics
          </div>
        </div>

        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={settings.showFPS}
              onChange={(e) => updateSettings({ showFPS: e.target.checked })}
              className="setting-checkbox"
            />
            Show FPS Counter
          </label>
          <div className="setting-description">
            Display frames per second counter
          </div>
        </div>

        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={settings.showMemoryUsage}
              onChange={(e) => updateSettings({ showMemoryUsage: e.target.checked })}
              className="setting-checkbox"
            />
            Show Memory Usage
          </label>
          <div className="setting-description">
            Display current memory usage
          </div>
        </div>

        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={settings.showDebugInfo}
              onChange={(e) => updateSettings({ showDebugInfo: e.target.checked })}
              className="setting-checkbox"
            />
            Show Debug Information
          </label>
          <div className="setting-description">
            Display technical debug information
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h4>Preview</h4>
        <div className="ui-preview" style={{ transform: `scale(${settings.uiScale})` }}>
          <div className="preview-panel">
            <div className="preview-header">Sample UI Panel</div>
            <div className="preview-content">
              <div className="preview-text">This is how text will appear</div>
              <div className="preview-button">Sample Button</div>
              {settings.showFPS && (
                <div className="preview-fps">FPS: 60</div>
              )}
              {settings.showMemoryUsage && (
                <div className="preview-memory">Memory: 256MB</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button
          onClick={resetSettings}
          className="settings-btn secondary"
        >
          Reset Display Settings
        </button>
      </div>
    </div>
  )
}