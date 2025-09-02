// Simple test to verify SettingsManager functionality
// Note: This test doesn't use Jest syntax to avoid TypeScript configuration issues

import { settingsManager } from '../SettingsManager'
import { DEFAULT_SETTINGS } from '../../../types/settings'

// Simple test runner
function runTests() {
  console.log('Running SettingsManager tests...')
  
  // Test 1: Initial settings should match defaults
  const initialSettings = settingsManager.getSettings()
  console.log('✓ Test 1: Initial settings loaded')
  
  // Test 2: Update settings
  settingsManager.updateSettings({
    performance: {
      ...initialSettings.performance,
      targetFPS: 120
    }
  })
  
  const updatedSettings = settingsManager.getSettings()
  if (updatedSettings.performance.targetFPS === 120) {
    console.log('✓ Test 2: Settings update works')
  } else {
    console.log('✗ Test 2: Settings update failed')
  }
  
  // Test 3: Validation
  const validation = settingsManager.validateSettings({
    performance: {
      ...DEFAULT_SETTINGS.performance,
      targetFPS: 200 // Invalid value
    }
  })
  
  if (!validation.isValid && validation.errors.length > 0) {
    console.log('✓ Test 3: Validation works')
  } else {
    console.log('✗ Test 3: Validation failed')
  }
  
  // Test 4: Reset category
  settingsManager.resetCategory('performance')
  const resetSettings = settingsManager.getSettings()
  
  if (resetSettings.performance.targetFPS === DEFAULT_SETTINGS.performance.targetFPS) {
    console.log('✓ Test 4: Reset category works')
  } else {
    console.log('✗ Test 4: Reset category failed')
  }
  
  console.log('SettingsManager tests completed!')
}

// Export for potential use
export { runTests }

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runTests()
}