import React from 'react'
import { useUserSettings } from '../../systems/settings/UserSettingsContext'

export function AccessibilitySettings() {
  const { settings, actions } = useUserSettings()
  const accessibilitySettings = settings.accessibility

  const updateAccessibilitySettings = (updates: Partial<typeof accessibilitySettings>) => {
    actions.updateCategory('accessibility', updates)
  }

  const resetAccessibilitySettings = () => {
    actions.resetCategory('accessibility')
  }

  const fontSizes = [
    { id: 'small', name: 'Small', description: 'Compact text size' },
    { id: 'medium', name: 'Medium', description: 'Standard text size' },
    { id: 'large', name: 'Large', description: 'Larger text for better readability' }
  ] as const

  return (
    <div className="settings-section">
      <div className="settings-group">
        <h4>Visual Accessibility</h4>
        
        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={accessibilitySettings.enableHighContrast}
              onChange={(e) => updateAccessibilitySettings({ enableHighContrast: e.target.checked })}
              className="setting-checkbox"
            />
            High Contrast Mode
          </label>
          <div className="setting-description">
            Increase contrast for better visibility
          </div>
        </div>

        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={accessibilitySettings.enableReducedMotion}
              onChange={(e) => updateAccessibilitySettings({ enableReducedMotion: e.target.checked })}
              className="setting-checkbox"
            />
            Reduce Motion
          </label>
          <div className="setting-description">
            Minimize animations and transitions
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h4>Text Settings</h4>
        
        <div className="setting-item">
          <label className="setting-label">
            Font Size
          </label>
          <div className="font-size-options">
            {fontSizes.map(size => (
              <div key={size.id} className="font-size-option">
                <label className="font-size-label">
                  <input
                    type="radio"
                    name="fontSize"
                    value={size.id}
                    checked={accessibilitySettings.fontSize === size.id}
                    onChange={(e) => updateAccessibilitySettings({ fontSize: e.target.value as any })}
                    className="setting-radio"
                  />
                  <div className={`font-size-preview ${accessibilitySettings.fontSize === size.id ? 'active' : ''}`}>
                    <div className="font-size-name">{size.name}</div>
                    <div 
                      className="font-size-sample"
                      style={{ 
                        fontSize: size.id === 'small' ? '14px' : 
                                 size.id === 'medium' ? '16px' : '18px' 
                      }}
                    >
                      Sample text
                    </div>
                    <div className="font-size-description">{size.description}</div>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h4>Navigation</h4>
        
        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={accessibilitySettings.enableKeyboardNavigation}
              onChange={(e) => updateAccessibilitySettings({ enableKeyboardNavigation: e.target.checked })}
              className="setting-checkbox"
            />
            Keyboard Navigation
          </label>
          <div className="setting-description">
            Enable full keyboard navigation support
          </div>
        </div>

        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={accessibilitySettings.enableScreenReader}
              onChange={(e) => updateAccessibilitySettings({ enableScreenReader: e.target.checked })}
              className="setting-checkbox"
            />
            Screen Reader Support
          </label>
          <div className="setting-description">
            Optimize interface for screen readers
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h4>Keyboard Shortcuts</h4>
        <div className="keyboard-shortcuts">
          <div className="shortcut-category">
            <h5>Navigation</h5>
            <div className="shortcut-list">
              <div className="shortcut-item">
                <span className="shortcut-key">Tab</span>
                <span className="shortcut-description">Navigate between elements</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-key">Enter / Space</span>
                <span className="shortcut-description">Activate buttons and links</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-key">Esc</span>
                <span className="shortcut-description">Close dialogs and menus</span>
              </div>
            </div>
          </div>
          
          <div className="shortcut-category">
            <h5>Application</h5>
            <div className="shortcut-list">
              <div className="shortcut-item">
                <span className="shortcut-key">Ctrl + ,</span>
                <span className="shortcut-description">Open settings</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-key">F1</span>
                <span className="shortcut-description">Show help</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-key">Alt + T</span>
                <span className="shortcut-description">Toggle teleport UI</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h4>Accessibility Preview</h4>
        <div 
          className={`accessibility-preview ${accessibilitySettings.enableHighContrast ? 'high-contrast' : ''}`}
          style={{
            fontSize: accessibilitySettings.fontSize === 'small' ? '14px' : 
                     accessibilitySettings.fontSize === 'medium' ? '16px' : '18px'
          }}
        >
          <div className="preview-panel">
            <div className="preview-header">Sample Interface</div>
            <div className="preview-content">
              <p>This is how text will appear with your current accessibility settings.</p>
              <button className="preview-button">Sample Button</button>
              <div className="preview-link">Sample Link</div>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h4>Accessibility Tips</h4>
        <div className="accessibility-tips">
          <div className="tip-item">
            <span className="tip-icon">♿</span>
            <span className="tip-text">
              Enable high contrast mode if you have difficulty distinguishing colors
            </span>
          </div>
          <div className="tip-item">
            <span className="tip-icon">⌨️</span>
            <span className="tip-text">
              Use keyboard navigation if mouse interaction is difficult
            </span>
          </div>
          <div className="tip-item">
            <span className="tip-icon">👁️</span>
            <span className="tip-text">
              Increase font size for better text readability
            </span>
          </div>
          <div className="tip-item">
            <span className="tip-icon">🎭</span>
            <span className="tip-text">
              Reduce motion if animations cause discomfort
            </span>
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button
          onClick={resetAccessibilitySettings}
          className="settings-btn secondary"
        >
          Reset Accessibility Settings
        </button>
      </div>
    </div>
  )
}