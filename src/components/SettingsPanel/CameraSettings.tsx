import React from 'react'
import { useCameraSettings } from '../../systems/settings/UserSettingsContext'

export function CameraSettings() {
  const { settings, updateSettings, resetSettings } = useCameraSettings()

  return (
    <div className="settings-section">
      <div className="settings-group">
        <h4>Mouse Controls</h4>
        
        <div className="setting-item">
          <label className="setting-label">
            Mouse Sensitivity
          </label>
          <div className="setting-control">
            <input
              type="range"
              min="0.1"
              max="5.0"
              step="0.1"
              value={settings.mouseSensitivity}
              onChange={(e) => updateSettings({ mouseSensitivity: parseFloat(e.target.value) })}
              className="setting-slider"
            />
            <span className="setting-value">{settings.mouseSensitivity.toFixed(1)}x</span>
          </div>
          <div className="setting-description">
            Sensitivity of mouse camera movement
          </div>
        </div>

        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={settings.invertY}
              onChange={(e) => updateSettings({ invertY: e.target.checked })}
              className="setting-checkbox"
            />
            Invert Y-Axis
          </label>
          <div className="setting-description">
            Invert vertical mouse movement
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h4>Keyboard Controls</h4>
        
        <div className="setting-item">
          <label className="setting-label">
            Keyboard Sensitivity
          </label>
          <div className="setting-control">
            <input
              type="range"
              min="0.1"
              max="5.0"
              step="0.1"
              value={settings.keyboardSensitivity}
              onChange={(e) => updateSettings({ keyboardSensitivity: parseFloat(e.target.value) })}
              className="setting-slider"
            />
            <span className="setting-value">{settings.keyboardSensitivity.toFixed(1)}x</span>
          </div>
          <div className="setting-description">
            Sensitivity of keyboard camera movement
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h4>Camera Transitions</h4>
        
        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={settings.smoothTransitions}
              onChange={(e) => updateSettings({ smoothTransitions: e.target.checked })}
              className="setting-checkbox"
            />
            Smooth Transitions
          </label>
          <div className="setting-description">
            Enable smooth camera movement transitions
          </div>
        </div>

        <div className="setting-item">
          <label className="setting-label">
            Default Transition Duration
          </label>
          <div className="setting-control">
            <input
              type="range"
              min="100"
              max="5000"
              step="100"
              value={settings.defaultTransitionDuration}
              onChange={(e) => updateSettings({ defaultTransitionDuration: parseInt(e.target.value) })}
              className="setting-slider"
              disabled={!settings.smoothTransitions}
            />
            <span className="setting-value">{settings.defaultTransitionDuration}ms</span>
          </div>
          <div className="setting-description">
            Duration of camera transition animations
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h4>Camera Effects</h4>
        
        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={settings.enableShake}
              onChange={(e) => updateSettings({ enableShake: e.target.checked })}
              className="setting-checkbox"
            />
            Enable Camera Shake
          </label>
          <div className="setting-description">
            Allow camera shake effects during interactions
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h4>Control Scheme</h4>
        <div className="control-scheme">
          <div className="control-item">
            <span className="control-key">WASD</span>
            <span className="control-description">Move camera</span>
          </div>
          <div className="control-item">
            <span className="control-key">Mouse</span>
            <span className="control-description">Look around</span>
          </div>
          <div className="control-item">
            <span className="control-key">Shift</span>
            <span className="control-description">Move faster</span>
          </div>
          <div className="control-item">
            <span className="control-key">Ctrl</span>
            <span className="control-description">Move slower</span>
          </div>
          <div className="control-item">
            <span className="control-key">Space</span>
            <span className="control-description">Move up</span>
          </div>
          <div className="control-item">
            <span className="control-key">C</span>
            <span className="control-description">Move down</span>
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h4>Test Camera Settings</h4>
        <div className="camera-test">
          <div className="test-description">
            Move your mouse in the area below to test sensitivity settings
          </div>
          <div 
            className="camera-test-area"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2
              const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2
              
              const adjustedY = settings.invertY ? -y : y
              const sensitivityX = x * settings.mouseSensitivity
              const sensitivityY = adjustedY * settings.mouseSensitivity
              
              const indicator = e.currentTarget.querySelector('.test-indicator') as HTMLElement
              if (indicator) {
                indicator.style.transform = `translate(${sensitivityX * 20}px, ${sensitivityY * 20}px)`
              }
            }}
          >
            <div className="test-indicator">📷</div>
            <div className="test-instructions">
              Mouse sensitivity: {settings.mouseSensitivity.toFixed(1)}x
              {settings.invertY && ' (Y inverted)'}
            </div>
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button
          onClick={resetSettings}
          className="settings-btn secondary"
        >
          Reset Camera Settings
        </button>
      </div>
    </div>
  )
}