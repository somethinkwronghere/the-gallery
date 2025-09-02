import { 
  UserSettings, 
  SettingsCategory, 
  SettingsManager as ISettingsManager,
  SettingsPreset,
  SettingsValidationResult,
  SettingsValidationError,
  SettingsValidationWarning,
  DEFAULT_SETTINGS,
  BUILT_IN_PRESETS
} from '../../types/settings'

class SettingsManagerImpl implements ISettingsManager {
  private settings: UserSettings = { ...DEFAULT_SETTINGS }
  private presets: SettingsPreset[] = [...BUILT_IN_PRESETS]
  private changeCallbacks: ((settings: UserSettings) => void)[] = []
  private categoryCallbacks: Map<SettingsCategory, ((settings: any) => void)[]> = new Map()
  private storageKey = 'dijital-muze-settings'
  private presetsStorageKey = 'dijital-muze-presets'

  constructor() {
    this.initializeCategoryCallbacks()
  }

  private initializeCategoryCallbacks() {
    const categories: SettingsCategory[] = [
      'performance', 'display', 'camera', 'teleport', 
      'audio', 'accessibility', 'developer'
    ]
    
    categories.forEach(category => {
      this.categoryCallbacks.set(category, [])
    })
  }

  // Settings management
  getSettings(): UserSettings {
    return { ...this.settings }
  }

  updateSettings(updates: Partial<UserSettings>): void {
    const validation = this.validateSettings(updates)
    
    if (!validation.isValid) {
      console.warn('Settings validation failed:', validation.errors)
      return
    }

    this.settings = this.mergeSettings(this.settings, updates)
    
    // Notify change callbacks
    this.changeCallbacks.forEach(callback => {
      try {
        callback(this.settings)
      } catch (error) {
        console.error('Settings change callback error:', error)
      }
    })

    // Notify category-specific callbacks
    Object.keys(updates).forEach(key => {
      const category = key as SettingsCategory
      const callbacks = this.categoryCallbacks.get(category)
      if (callbacks) {
        callbacks.forEach(callback => {
          try {
            callback(this.settings[category])
          } catch (error) {
            console.error(`Settings category callback error for ${category}:`, error)
          }
        })
      }
    })
  }

  resetSettings(): void {
    this.settings = { ...DEFAULT_SETTINGS }
    this.notifyAllCallbacks()
  }

  resetCategory(category: SettingsCategory): void {
    (this.settings as any)[category] = { ...DEFAULT_SETTINGS[category] }
    
    // Notify callbacks
    this.changeCallbacks.forEach(callback => callback(this.settings))
    
    const callbacks = this.categoryCallbacks.get(category)
    if (callbacks) {
      callbacks.forEach(callback => callback(this.settings[category]))
    }
  }

  // Validation
  validateSettings(settings: Partial<UserSettings>): SettingsValidationResult {
    const errors: SettingsValidationError[] = []
    const warnings: SettingsValidationWarning[] = []

    // Validate performance settings
    if (settings.performance) {
      const perf = settings.performance
      
      if (perf.targetFPS !== undefined && (perf.targetFPS < 15 || perf.targetFPS > 144)) {
        errors.push({
          category: 'performance',
          field: 'targetFPS',
          message: 'Target FPS must be between 15 and 144',
          value: perf.targetFPS
        })
      }
      
      if (perf.maxMemoryUsage !== undefined && (perf.maxMemoryUsage < 128 || perf.maxMemoryUsage > 4096)) {
        errors.push({
          category: 'performance',
          field: 'maxMemoryUsage',
          message: 'Max memory usage must be between 128MB and 4GB',
          value: perf.maxMemoryUsage
        })
      }

      if (perf.qualityPreset === 'high' && perf.targetFPS !== undefined && perf.targetFPS < 30) {
        warnings.push({
          category: 'performance',
          field: 'targetFPS',
          message: 'High quality preset with low target FPS may cause performance issues',
          value: perf.targetFPS
        })
      }
    }

    // Validate display settings
    if (settings.display) {
      const display = settings.display
      
      if (display.uiScale !== undefined && (display.uiScale < 0.5 || display.uiScale > 2.0)) {
        errors.push({
          category: 'display',
          field: 'uiScale',
          message: 'UI scale must be between 0.5 and 2.0',
          value: display.uiScale
        })
      }
    }

    // Validate camera settings
    if (settings.camera) {
      const camera = settings.camera
      
      if (camera.mouseSensitivity !== undefined && (camera.mouseSensitivity < 0.1 || camera.mouseSensitivity > 5.0)) {
        errors.push({
          category: 'camera',
          field: 'mouseSensitivity',
          message: 'Mouse sensitivity must be between 0.1 and 5.0',
          value: camera.mouseSensitivity
        })
      }
      
      if (camera.defaultTransitionDuration !== undefined && (camera.defaultTransitionDuration < 100 || camera.defaultTransitionDuration > 10000)) {
        errors.push({
          category: 'camera',
          field: 'defaultTransitionDuration',
          message: 'Transition duration must be between 100ms and 10s',
          value: camera.defaultTransitionDuration
        })
      }
    }

    // Validate audio settings
    if (settings.audio) {
      const audio = settings.audio
      
      const volumeFields = ['masterVolume', 'sfxVolume', 'ambientVolume'] as const
      volumeFields.forEach(field => {
        const value = audio[field]
        if (value !== undefined && (value < 0 || value > 1)) {
          errors.push({
            category: 'audio',
            field,
            message: 'Volume must be between 0 and 1',
            value
          })
        }
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  // Storage
  async saveSettings(): Promise<void> {
    try {
      const settingsData = JSON.stringify(this.settings, null, 2)
      localStorage.setItem(this.storageKey, settingsData)
      
      // Save custom presets
      const customPresets = this.presets.filter(p => !p.isBuiltIn)
      const presetsData = JSON.stringify(customPresets, null, 2)
      localStorage.setItem(this.presetsStorageKey, presetsData)
    } catch (error) {
      console.error('Failed to save settings:', error)
      throw new Error('Failed to save settings to localStorage')
    }
  }

  async loadSettings(): Promise<void> {
    try {
      // Load settings
      const settingsData = localStorage.getItem(this.storageKey)
      if (settingsData) {
        const loadedSettings = JSON.parse(settingsData)
        this.settings = this.mergeSettings(DEFAULT_SETTINGS, loadedSettings)
      }
      
      // Load custom presets
      const presetsData = localStorage.getItem(this.presetsStorageKey)
      if (presetsData) {
        const customPresets = JSON.parse(presetsData)
        this.presets = [...BUILT_IN_PRESETS, ...customPresets]
      }
    } catch (error) {
      console.error('Failed to load settings:', error)
      this.settings = { ...DEFAULT_SETTINGS }
      this.presets = [...BUILT_IN_PRESETS]
    }
  }

  // Import/Export
  async exportSettings(): Promise<string> {
    const exportData = {
      settings: this.settings,
      customPresets: this.presets.filter(p => !p.isBuiltIn),
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }
    
    return JSON.stringify(exportData, null, 2)
  }

  async importSettings(data: string): Promise<void> {
    try {
      const importData = JSON.parse(data)
      
      if (!importData.settings) {
        throw new Error('Invalid settings data: missing settings')
      }
      
      // Validate imported settings
      const validation = this.validateSettings(importData.settings)
      if (!validation.isValid) {
        throw new Error(`Invalid settings data: ${validation.errors.map(e => e.message).join(', ')}`)
      }
      
      // Apply settings
      this.settings = this.mergeSettings(DEFAULT_SETTINGS, importData.settings)
      
      // Import custom presets if available
      if (importData.customPresets && Array.isArray(importData.customPresets)) {
        const validPresets = importData.customPresets.filter((preset: any) => 
          preset.id && preset.name && preset.settings
        )
        this.presets = [...BUILT_IN_PRESETS, ...validPresets]
      }
      
      this.notifyAllCallbacks()
    } catch (error) {
      console.error('Failed to import settings:', error)
      throw new Error('Failed to import settings: invalid data format')
    }
  }

  // Presets
  applyPreset(preset: SettingsPreset): void {
    const validation = this.validateSettings(preset.settings)
    
    if (!validation.isValid) {
      console.warn('Preset validation failed:', validation.errors)
      return
    }
    
    this.settings = this.mergeSettings(this.settings, preset.settings)
    this.notifyAllCallbacks()
  }

  getPresets(): SettingsPreset[] {
    return [...this.presets]
  }

  createPreset(name: string, description?: string): SettingsPreset {
    const preset: SettingsPreset = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      settings: { ...this.settings },
      createdAt: new Date(),
      isBuiltIn: false
    }
    
    this.presets.push(preset)
    return preset
  }

  deletePreset(id: string): boolean {
    const index = this.presets.findIndex(p => p.id === id && !p.isBuiltIn)
    if (index >= 0) {
      this.presets.splice(index, 1)
      return true
    }
    return false
  }

  // Events
  onSettingsChange(callback: (settings: UserSettings) => void): () => void {
    this.changeCallbacks.push(callback)
    
    // Return unsubscribe function
    return () => {
      const index = this.changeCallbacks.indexOf(callback)
      if (index >= 0) {
        this.changeCallbacks.splice(index, 1)
      }
    }
  }

  onCategoryChange(category: SettingsCategory, callback: (settings: any) => void): () => void {
    const callbacks = this.categoryCallbacks.get(category)
    if (callbacks) {
      callbacks.push(callback)
      
      // Return unsubscribe function
      return () => {
        const index = callbacks.indexOf(callback)
        if (index >= 0) {
          callbacks.splice(index, 1)
        }
      }
    }
    
    return () => {} // No-op if category not found
  }

  // Private helper methods
  private mergeSettings(base: UserSettings, updates: Partial<UserSettings>): UserSettings {
    const result = { ...base }
    
    Object.keys(updates).forEach(key => {
      const category = key as SettingsCategory
      if (updates[category] && typeof updates[category] === 'object') {
        (result as any)[category] = { ...base[category], ...updates[category] }
      }
    })
    
    return result
  }

  private notifyAllCallbacks(): void {
    this.changeCallbacks.forEach(callback => {
      try {
        callback(this.settings)
      } catch (error) {
        console.error('Settings change callback error:', error)
      }
    })
    
    // Notify all category callbacks
    this.categoryCallbacks.forEach((callbacks, category) => {
      callbacks.forEach(callback => {
        try {
          callback(this.settings[category])
        } catch (error) {
          console.error(`Settings category callback error for ${category}:`, error)
        }
      })
    })
  }
}

// Export singleton instance
export const settingsManager = new SettingsManagerImpl()