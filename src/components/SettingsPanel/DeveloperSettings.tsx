import React from 'react'
import { useUserSettings } from '../../systems/settings/UserSettingsContext'

export function DeveloperSettings() {
  const { settings, actions } = useUserSettings()
  const developerSettings = settings.developer

  const updateDeveloperSettings = (updates: Partial<typeof developerSettings>) => {
    actions.updateCategory('developer', updates)
  }

  const resetDeveloperSettings = () => {
    actions.resetCategory('developer')
  }

  const logLevels = [
    { id: 'error', name: 'Error', description: 'Only show errors' },
    { id: 'warn', name: 'Warning', description: 'Show errors and warnings' },
    { id: 'info', name: 'Info', description: 'Show errors, warnings, and info' },
    { id: 'debug', name: 'Debug', description: 'Show all log messages' }
  ] as const

  const clearConsole = () => {
    console.clear()
  }

  const exportLogs = () => {
    // This would export console logs
    console.log('Exporting logs...')
  }

  return (
    <div className="settings-section">
      <div className="settings-group">
        <h4>Debug Mode</h4>
        
        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={developerSettings.enableDebugMode}
              onChange={(e) => updateDeveloperSettings({ enableDebugMode: e.target.checked })}
              className="setting-checkbox"
            />
            Enable Debug Mode
          </label>
          <div className="setting-description">
            Enable developer debugging features
          </div>
        </div>

        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={developerSettings.enableHotReload}
              onChange={(e) => updateDeveloperSettings({ enableHotReload: e.target.checked })}
              className="setting-checkbox"
            />
            Enable Hot Reload
          </label>
          <div className="setting-description">
            Automatically reload assets when they change
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h4>Visual Debug Tools</h4>
        
        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={developerSettings.showBoundingBoxes}
              onChange={(e) => updateDeveloperSettings({ showBoundingBoxes: e.target.checked })}
              className="setting-checkbox"
              disabled={!developerSettings.enableDebugMode}
            />
            Show Bounding Boxes
          </label>
          <div className="setting-description">
            Display collision and interaction boundaries
          </div>
        </div>

        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={developerSettings.enableWireframe}
              onChange={(e) => updateDeveloperSettings({ enableWireframe: e.target.checked })}
              className="setting-checkbox"
              disabled={!developerSettings.enableDebugMode}
            />
            Wireframe Mode
          </label>
          <div className="setting-description">
            Render 3D models as wireframes
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h4>Logging</h4>
        
        <div className="setting-item">
          <label className="setting-label">
            Log Level
          </label>
          <div className="log-level-options">
            {logLevels.map(level => (
              <div key={level.id} className="log-level-option">
                <label className="log-level-label">
                  <input
                    type="radio"
                    name="logLevel"
                    value={level.id}
                    checked={developerSettings.logLevel === level.id}
                    onChange={(e) => updateDeveloperSettings({ logLevel: e.target.value as any })}
                    className="setting-radio"
                  />
                  <div className={`log-level-card ${developerSettings.logLevel === level.id ? 'active' : ''}`}>
                    <div className="log-level-name">{level.name}</div>
                    <div className="log-level-description">{level.description}</div>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="setting-item">
          <div className="log-controls">
            <button
              onClick={clearConsole}
              className="settings-btn secondary"
            >
              Clear Console
            </button>
            <button
              onClick={exportLogs}
              className="settings-btn secondary"
            >
              Export Logs
            </button>
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h4>Development Tools</h4>
        
        <div className="dev-tools">
          <div className="tool-item">
            <div className="tool-info">
              <div className="tool-name">Performance Profiler</div>
              <div className="tool-description">Profile rendering performance</div>
            </div>
            <button className="settings-btn secondary">
              Open Profiler
            </button>
          </div>
          
          <div className="tool-item">
            <div className="tool-info">
              <div className="tool-name">Asset Inspector</div>
              <div className="tool-description">Inspect loaded assets and their properties</div>
            </div>
            <button className="settings-btn secondary">
              Open Inspector
            </button>
          </div>
          
          <div className="tool-item">
            <div className="tool-info">
              <div className="tool-name">Scene Graph</div>
              <div className="tool-description">View 3D scene hierarchy</div>
            </div>
            <button className="settings-btn secondary">
              Open Scene Graph
            </button>
          </div>
          
          <div className="tool-item">
            <div className="tool-info">
              <div className="tool-name">Memory Analyzer</div>
              <div className="tool-description">Analyze memory usage patterns</div>
            </div>
            <button className="settings-btn secondary">
              Open Analyzer
            </button>
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h4>System Information</h4>
        <div className="system-info">
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">WebGL Version:</span>
              <span className="info-value">WebGL 2.0</span>
            </div>
            <div className="info-item">
              <span className="info-label">GPU:</span>
              <span className="info-value">Integrated Graphics</span>
            </div>
            <div className="info-item">
              <span className="info-label">Max Texture Size:</span>
              <span className="info-value">4096x4096</span>
            </div>
            <div className="info-item">
              <span className="info-label">Max Vertex Attributes:</span>
              <span className="info-value">16</span>
            </div>
            <div className="info-item">
              <span className="info-label">Extensions:</span>
              <span className="info-value">45 supported</span>
            </div>
            <div className="info-item">
              <span className="info-label">Memory:</span>
              <span className="info-value">~8GB available</span>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h4>Debug Shortcuts</h4>
        <div className="debug-shortcuts">
          <div className="shortcut-list">
            <div className="shortcut-item">
              <span className="shortcut-key">F12</span>
              <span className="shortcut-description">Open browser dev tools</span>
            </div>
            <div className="shortcut-item">
              <span className="shortcut-key">Ctrl + Shift + I</span>
              <span className="shortcut-description">Toggle debug panel</span>
            </div>
            <div className="shortcut-item">
              <span className="shortcut-key">Ctrl + Shift + P</span>
              <span className="shortcut-description">Open performance profiler</span>
            </div>
            <div className="shortcut-item">
              <span className="shortcut-key">Ctrl + Shift + M</span>
              <span className="shortcut-description">Toggle memory monitor</span>
            </div>
            <div className="shortcut-item">
              <span className="shortcut-key">Ctrl + R</span>
              <span className="shortcut-description">Reload application</span>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h4>Warning</h4>
        <div className="developer-warning">
          <div className="warning-icon">⚠️</div>
          <div className="warning-text">
            <strong>Developer Mode Warning:</strong> These settings are intended for development and debugging purposes. 
            Enabling debug features may impact performance and should not be used in production environments.
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button
          onClick={resetDeveloperSettings}
          className="settings-btn secondary"
        >
          Reset Developer Settings
        </button>
      </div>
    </div>
  )
}