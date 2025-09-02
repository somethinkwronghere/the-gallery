import { useState, useCallback, useEffect } from 'react'
import { useUserSettings } from '../systems/settings/UserSettingsContext'
import { SettingsCategory } from '../types/settings'

interface UseSettingsPanelOptions {
  defaultCategory?: SettingsCategory
  autoSave?: boolean
  autoSaveDelay?: number
}

export function useSettingsPanel(options: UseSettingsPanelOptions = {}) {
  const {
    defaultCategory = 'performance',
    autoSave = true,
    autoSaveDelay = 2000
  } = options

  const {
    settings,
    isLoading,
    isDirty,
    lastSaved,
    validationResult,
    availablePresets,
    actions
  } = useUserSettings()

  const [isVisible, setIsVisible] = useState(false)
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>(defaultCategory)
  const [searchQuery, setSearchQuery] = useState('')
  const [showPresets, setShowPresets] = useState(false)
  const [showImportExport, setShowImportExport] = useState(false)

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !isDirty) return

    const autoSaveTimeout = setTimeout(async () => {
      try {
        await actions.saveSettings()
      } catch (error) {
        console.error('Auto-save failed:', error)
      }
    }, autoSaveDelay)

    return () => clearTimeout(autoSaveTimeout)
  }, [isDirty, autoSave, autoSaveDelay, actions])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + , to open settings
      if ((event.ctrlKey || event.metaKey) && event.key === ',') {
        event.preventDefault()
        setIsVisible(true)
      }
      
      // Escape to close settings
      if (event.key === 'Escape' && isVisible) {
        event.preventDefault()
        setIsVisible(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isVisible])

  const openSettings = useCallback((category?: SettingsCategory) => {
    if (category) {
      setActiveCategory(category)
    }
    setIsVisible(true)
  }, [])

  const closeSettings = useCallback(() => {
    setIsVisible(false)
    setShowPresets(false)
    setShowImportExport(false)
    setSearchQuery('')
  }, [])

  const switchCategory = useCallback((category: SettingsCategory) => {
    setActiveCategory(category)
  }, [])

  const togglePresets = useCallback(() => {
    setShowPresets(prev => !prev)
    setShowImportExport(false)
  }, [])

  const toggleImportExport = useCallback(() => {
    setShowImportExport(prev => !prev)
    setShowPresets(false)
  }, [])

  const saveSettings = useCallback(async () => {
    try {
      await actions.saveSettings()
      return true
    } catch (error) {
      console.error('Failed to save settings:', error)
      return false
    }
  }, [actions])

  const resetCategory = useCallback((category?: SettingsCategory) => {
    const targetCategory = category || activeCategory
    if (confirm(`Reset ${targetCategory} settings to default?`)) {
      actions.resetCategory(targetCategory)
      return true
    }
    return false
  }, [activeCategory, actions])

  const resetAllSettings = useCallback(() => {
    if (confirm('Reset all settings to default? This cannot be undone.')) {
      actions.resetSettings()
      return true
    }
    return false
  }, [actions])

  const applyPreset = useCallback((presetId: string) => {
    const preset = availablePresets.find(p => p.id === presetId)
    if (preset && confirm(`Apply preset "${preset.name}"? This will override current settings.`)) {
      actions.applyPreset(presetId)
      return true
    }
    return false
  }, [availablePresets, actions])

  const createPreset = useCallback((name: string, description?: string) => {
    try {
      const preset = actions.createPreset(name, description)
      return preset
    } catch (error) {
      console.error('Failed to create preset:', error)
      return null
    }
  }, [actions])

  const deletePreset = useCallback((presetId: string) => {
    const preset = availablePresets.find(p => p.id === presetId)
    if (preset && !preset.isBuiltIn && confirm(`Delete preset "${preset.name}"?`)) {
      return actions.deletePreset(presetId)
    }
    return false
  }, [availablePresets, actions])

  const exportSettings = useCallback(async () => {
    try {
      return await actions.exportSettings()
    } catch (error) {
      console.error('Failed to export settings:', error)
      return null
    }
  }, [actions])

  const importSettings = useCallback(async (data: string) => {
    try {
      await actions.importSettings(data)
      return true
    } catch (error) {
      console.error('Failed to import settings:', error)
      return false
    }
  }, [actions])

  const validateSettings = useCallback((settingsToValidate?: any) => {
    return actions.validateSettings(settingsToValidate)
  }, [actions])

  // Filter categories based on search
  const filteredCategories = useCallback((categories: { id: SettingsCategory; name: string; icon: string }[]) => {
    if (!searchQuery) return categories
    
    return categories.filter(category =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.id.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery])

  return {
    // State
    isVisible,
    activeCategory,
    searchQuery,
    showPresets,
    showImportExport,
    settings,
    isLoading,
    isDirty,
    lastSaved,
    validationResult,
    availablePresets,
    
    // Actions
    openSettings,
    closeSettings,
    switchCategory,
    setSearchQuery,
    togglePresets,
    toggleImportExport,
    saveSettings,
    resetCategory,
    resetAllSettings,
    applyPreset,
    createPreset,
    deletePreset,
    exportSettings,
    importSettings,
    validateSettings,
    filteredCategories,
    
    // Settings actions (pass-through)
    updateSettings: actions.updateSettings,
    updateCategory: actions.updateCategory
  }
}