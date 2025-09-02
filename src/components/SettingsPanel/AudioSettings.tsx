import React from 'react'
import { useUserSettings } from '../../systems/settings/UserSettingsContext'

export function AudioSettings() {
  const { settings, actions } = useUserSettings()
  const audioSettings = settings.audio

  const updateAudioSettings = (updates: Partial<typeof audioSettings>) => {
    actions.updateCategory('audio', updates)
  }

  const resetAudioSettings = () => {
    actions.resetCategory('audio')
  }

  const formatVolume = (volume: number) => {
    return Math.round(volume * 100)
  }

  return (
    <div className="settings-section">
      <div className="settings-group">
        <h4>Volume Controls</h4>
        
        <div className="setting-item">
          <label className="setting-label">
            Master Volume
          </label>
          <div className="setting-control">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={audioSettings.masterVolume}
              onChange={(e) => updateAudioSettings({ masterVolume: parseFloat(e.target.value) })}
              className="setting-slider"
            />
            <span className="setting-value">{formatVolume(audioSettings.masterVolume)}%</span>
          </div>
          <div className="setting-description">
            Overall volume level for all audio
          </div>
        </div>

        <div className="setting-item">
          <label className="setting-label">
            Sound Effects Volume
          </label>
          <div className="setting-control">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={audioSettings.sfxVolume}
              onChange={(e) => updateAudioSettings({ sfxVolume: parseFloat(e.target.value) })}
              className="setting-slider"
            />
            <span className="setting-value">{formatVolume(audioSettings.sfxVolume)}%</span>
          </div>
          <div className="setting-description">
            Volume for interaction sounds and effects
          </div>
        </div>

        <div className="setting-item">
          <label className="setting-label">
            Ambient Volume
          </label>
          <div className="setting-control">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={audioSettings.ambientVolume}
              onChange={(e) => updateAudioSettings({ ambientVolume: parseFloat(e.target.value) })}
              className="setting-slider"
            />
            <span className="setting-value">{formatVolume(audioSettings.ambientVolume)}%</span>
          </div>
          <div className="setting-description">
            Volume for background ambient sounds
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h4>Audio Features</h4>
        
        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={audioSettings.enableSpatialAudio}
              onChange={(e) => updateAudioSettings({ enableSpatialAudio: e.target.checked })}
              className="setting-checkbox"
            />
            Spatial Audio
          </label>
          <div className="setting-description">
            Enable 3D positional audio effects
          </div>
        </div>

        <div className="setting-item">
          <label className="setting-label">
            <input
              type="checkbox"
              checked={audioSettings.muteOnFocusLoss}
              onChange={(e) => updateAudioSettings({ muteOnFocusLoss: e.target.checked })}
              className="setting-checkbox"
            />
            Mute When Window Loses Focus
          </label>
          <div className="setting-description">
            Automatically mute audio when switching to another application
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h4>Volume Test</h4>
        <div className="volume-test">
          <div className="test-description">
            Test your volume settings with sample sounds
          </div>
          <div className="test-buttons">
            <button 
              className="settings-btn secondary"
              onClick={() => {
                // This would play a test sound effect
                console.log('Playing SFX test sound at volume:', audioSettings.sfxVolume)
              }}
            >
              🔊 Test SFX
            </button>
            <button 
              className="settings-btn secondary"
              onClick={() => {
                // This would play a test ambient sound
                console.log('Playing ambient test sound at volume:', audioSettings.ambientVolume)
              }}
            >
              🎵 Test Ambient
            </button>
          </div>
        </div>
      </div>

      <div className="settings-group">
        <h4>Audio Information</h4>
        <div className="audio-info">
          <div className="info-item">
            <span className="info-label">Audio Context State:</span>
            <span className="info-value">Running</span>
          </div>
          <div className="info-item">
            <span className="info-label">Sample Rate:</span>
            <span className="info-value">44.1 kHz</span>
          </div>
          <div className="info-item">
            <span className="info-label">Spatial Audio Support:</span>
            <span className="info-value">
              {audioSettings.enableSpatialAudio ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>

      <div className="settings-actions">
        <button
          onClick={resetAudioSettings}
          className="settings-btn secondary"
        >
          Reset Audio Settings
        </button>
      </div>
    </div>
  )
}