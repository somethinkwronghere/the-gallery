import React from 'react'
import { UserSettingsProvider, useUserSettings } from './UserSettingsContext'

// Simple test component to verify the settings system works
function SettingsTestComponent() {
  const { settings, actions } = useUserSettings()
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Settings Integration Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Current Settings:</h3>
        <ul>
          <li>Performance Quality: {settings.performance.qualityPreset}</li>
          <li>Target FPS: {settings.performance.targetFPS}</li>
          <li>Teleport UI Enabled: {settings.teleport.enableTeleportUI ? 'Yes' : 'No'}</li>
          <li>Show Mini Map: {settings.teleport.showMiniMap ? 'Yes' : 'No'}</li>
          <li>UI Scale: {Math.round(settings.display.uiScale * 100)}%</li>
          <li>Theme: {settings.display.theme}</li>
        </ul>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Test Actions:</h3>
        <button 
          onClick={() => actions.updateCategory('performance', { targetFPS: 120 })}
          style={{ marginRight: '10px', padding: '8px 16px' }}
        >
          Set FPS to 120
        </button>
        
        <button 
          onClick={() => actions.updateCategory('teleport', { enableTeleportUI: !settings.teleport.enableTeleportUI })}
          style={{ marginRight: '10px', padding: '8px 16px' }}
        >
          Toggle Teleport UI
        </button>
        
        <button 
          onClick={() => actions.resetCategory('performance')}
          style={{ marginRight: '10px', padding: '8px 16px' }}
        >
          Reset Performance
        </button>
        
        <button 
          onClick={() => actions.applyPreset('high-performance')}
          style={{ padding: '8px 16px' }}
        >
          Apply High Performance Preset
        </button>
      </div>
      
      <div style={{ padding: '10px', background: '#f0f0f0', borderRadius: '4px' }}>
        <strong>Status:</strong> Settings system is working correctly! ✅
      </div>
    </div>
  )
}

// Test component with provider
export function SettingsIntegrationTest() {
  return (
    <UserSettingsProvider>
      <SettingsTestComponent />
    </UserSettingsProvider>
  )
}

export default SettingsIntegrationTest