import React from 'react'
import { useTeleportSettings } from '../../systems/settings/UserSettingsContext'
import { TeleportCategory } from '../../types/camera'

export function TeleportSettings() {
  const { settings, updateSettings, resetSettings } = useTeleportSettings()

  const teleportCategories: { id: TeleportCategory; name: string; icon: string }[] = [
    { id: 'gallery', name: 'Gallery', icon: '🏛️' },
    { id: 'artwork', name: 'Artwork', icon: '🎨' },
    { id: 'entrance', name: 'Entrance', icon: '🚪' },
    { id: 'viewpoint', name: 'Viewpoint', icon: '👁️' },
    { id: 'debug', name: 'Debug', icon: '🔧' },
    { id: 'custom', name: 'Custom', icon: '📍' }
  ]

  const handleCategoryToggle = (category: TeleportCategory) => {
    const currentFavorites = settings.favoriteCategories
    const isCurrentlyFavorite = currentFavorites.includes(category)
    
    const newFavorites = isCurrentlyFavorite
      ? currentFavorites.filter(c => c !== category)
      : [...currentFavorites, category]
    
    updateSettings({ favoriteCategories: newFavorites })
  }

  return (
    <div className="settings-section">
      <div className="settings-group">
        <h4>Teleport UI</h4>
        
        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={settings.enableTeleportUI}
              onChange={(e) => updateSettings({ enableTeleportUI: e.target.checked })}
              className="setting-checkbox"
            />
            Enable Teleport UI
          </label>
          <div className="setting-description">
            Show the teleport interface for quick navigation
          </div>
        </div>

        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={settings.showMiniMap}
              onChange={(e) => updateSettings({ showMiniMap: e.target.checked })}
              className="setting-checkbox"
              disabled={!settings.enableTeleportUI}
            />
            Show Mini Map
          </label>
          <div className="setting-description">
            Display mini map in teleport UI for visual navigation
          </div>
        </div>

        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={settings.enableQuickTeleport}
              onChange={(e) => updateSettings({ enableQuickTeleport: e.target.checked })}
              className="setting-checkbox"
            />
            Enable Quick Teleport
          </label>
          <div className="setting-description">
            Allow instant teleportation without animation
          </div>
        </div>

        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={settings.enableMapTeleport}
              onChange={(e) => updateSettings({ enableMapTeleport: e.target.checked })}
              className="setting-checkbox"
              disabled={!settings.enableTeleportUI || !settings.showMiniMap}
            />
            Enable Map Teleport
          </label>
          <div className="setting-description">
            Allow teleporting by clicking on the mini map
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h4>Teleport Animation</h4>
        
        <div className="setting-item">
          <label className="setting-label">
            Default Teleport Duration
          </label>
          <div className="setting-control">
            <input
              type="range"
              min="500"
              max="5000"
              step="100"
              value={settings.defaultTeleportDuration}
              onChange={(e) => updateSettings({ defaultTeleportDuration: parseInt(e.target.value) })}
              className="setting-slider"
            />
            <span className="setting-value">{settings.defaultTeleportDuration}ms</span>
          </div>
          <div className="setting-description">
            Duration of smooth teleport animations
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h4>Favorite Categories</h4>
        <div className="setting-description">
          Select your favorite teleport categories to show them first in the UI
        </div>
        
        <div className="category-grid">
          {teleportCategories.map(category => (
            <div key={category.id} className="category-item">
              <label className="category-label">
                <input
                  type="checkbox"
                  checked={settings.favoriteCategories.includes(category.id)}
                  onChange={() => handleCategoryToggle(category.id)}
                  className="setting-checkbox"
                />
                <span className="category-icon">{category.icon}</span>
                <span className="category-name">{category.name}</span>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-group">
        <h4>Keyboard Shortcuts</h4>
        <div className="shortcut-list">
          <div className="shortcut-item">
            <span className="shortcut-key">T</span>
            <span className="shortcut-description">Toggle Teleport UI</span>
          </div>
          <div className="shortcut-item">
            <span className="shortcut-key">Ctrl + 1/2/3</span>
            <span className="shortcut-description">Quick development teleports</span>
          </div>
          <div className="shortcut-item">
            <span className="shortcut-key">M</span>
            <span className="shortcut-description">Toggle Mini Map</span>
          </div>
          <div className="shortcut-item">
            <span className="shortcut-key">Shift + T</span>
            <span className="shortcut-description">Quick teleport to last position</span>
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button
          onClick={resetSettings}
          className="settings-btn secondary"
        >
          Reset Teleport Settings
        </button>
      </div>
    </div>
  )
}