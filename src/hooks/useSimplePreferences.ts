import { useState, useEffect } from 'react'
import { SimpleUserPreferences, QualityLevel } from '../types/simpleSettings'
import { simplePreferencesManager } from '../utils/SimplePreferencesManager'

export function useSimplePreferences() {
  const [preferences, setPreferences] = useState<SimpleUserPreferences>(
    simplePreferencesManager.getPreferences()
  )
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Subscribe to preference changes
    const unsubscribe = simplePreferencesManager.addListener(setPreferences)
    return unsubscribe
  }, [])

  const updatePreferences = async (updates: Partial<SimpleUserPreferences>) => {
    setIsLoading(true)
    try {
      simplePreferencesManager.updatePreferences(updates)
    } finally {
      setIsLoading(false)
    }
  }

  const setQuality = async (quality: QualityLevel) => {
    setIsLoading(true)
    try {
      simplePreferencesManager.setQuality(quality)
    } finally {
      setIsLoading(false)
    }
  }

  const reset = async () => {
    setIsLoading(true)
    try {
      simplePreferencesManager.reset()
    } finally {
      setIsLoading(false)
    }
  }

  const exportPreferences = () => {
    return simplePreferencesManager.export()
  }

  const importPreferences = (data: string) => {
    return simplePreferencesManager.import(data)
  }

  const getQualitySettings = (quality?: QualityLevel) => {
    return simplePreferencesManager.getQualitySettings(quality)
  }

  return {
    preferences,
    isLoading,
    updatePreferences,
    setQuality,
    reset,
    exportPreferences,
    importPreferences,
    getQualitySettings
  }
}