import { useEffect } from 'react'
import { useSimplePreferences } from './useSimplePreferences'
import { usePerformanceSettings } from '../systems/settings/UserSettingsContext'

/**
 * Hook to integrate simple preferences with the existing performance system
 * This ensures that quality changes in the simple settings affect the actual performance
 */
export function useSimpleSettingsIntegration() {
  const { preferences, getQualitySettings } = useSimplePreferences()
  const { updateSettings: updatePerformanceSettings } = usePerformanceSettings()

  useEffect(() => {
    // Apply quality settings to the performance system
    const qualitySettings = getQualitySettings(preferences.quality)
    
    updatePerformanceSettings({
      qualityPreset: preferences.quality === 'low' ? 'low' : 
                    preferences.quality === 'high' ? 'high' : 'medium',
      targetFPS: qualitySettings.targetFPS,
      enableLOD: qualitySettings.enableLOD,
      enableCulling: qualitySettings.enableCulling,
      shadowQuality: qualitySettings.shadowQuality,
      antialiasing: qualitySettings.antialiasing,
      postProcessing: qualitySettings.postProcessing,
      maxMemoryUsage: qualitySettings.maxMemoryUsage
    })
  }, [preferences.quality, getQualitySettings, updatePerformanceSettings])

  return {
    preferences,
    qualitySettings: getQualitySettings()
  }
}