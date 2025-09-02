import React, { useState } from 'react'
import { SimpleSettingsPanel } from './SimpleSettingsPanel'
import { useSimplePreferences } from '../../hooks/useSimplePreferences'
import { useSimpleSettingsIntegration } from '../../hooks/useSimpleSettingsIntegration'

/**
 * Example component showing how to use the simplified settings system
 */
export function SimpleSettingsExample() {
  const [showSettings, setShowSettings] = useState(false)
  const { preferences } = useSimplePreferences()
  
  // This hook integrates simple settings with the existing performance system
  useSimpleSettingsIntegration()

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Simple Settings Example</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Current Settings:</h3>
        <ul>
          <li>Quality: {preferences.quality}</li>
          <li>Show FPS: {preferences.showFPS ? 'Yes' : 'No'}</li>
          <li>Show Performance Stats: {preferences.showPerformanceStats ? 'Yes' : 'No'}</li>
          <li>Master Volume: {Math.round(preferences.masterVolume * 100)}%</li>
          <li>Font Size: {preferences.fontSize}</li>
        </ul>
      </div>

      <button
        onClick={() => setShowSettings(true)}
        style={{
          padding: '10px 20px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Open Settings
      </button>

      <SimpleSettingsPanel
        visible={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  )
}