import { SimpleUserPreferences, DEFAULT_SIMPLE_PREFERENCES, QualityLevel, QUALITY_PRESETS } from '../types/simpleSettings'

const STORAGE_KEY = 'museum-simple-preferences'

export class SimplePreferencesManager {
  private preferences: SimpleUserPreferences = DEFAULT_SIMPLE_PREFERENCES
  private listeners: Set<(preferences: SimpleUserPreferences) => void> = new Set()

  constructor() {
    this.loadFromStorage()
  }

  // Get current preferences
  getPreferences(): SimpleUserPreferences {
    return { ...this.preferences }
  }

  // Update preferences
  updatePreferences(updates: Partial<SimpleUserPreferences>): void {
    this.preferences = {
      ...this.preferences,
      ...updates,
      lastUpdated: new Date().toISOString()
    }
    
    this.saveToStorage()
    this.notifyListeners()
  }

  // Set quality level and apply corresponding settings
  setQuality(quality: QualityLevel): void {
    this.updatePreferences({ quality })
  }

  // Get quality preset settings
  getQualitySettings(quality?: QualityLevel) {
    const currentQuality = quality || this.preferences.quality
    return QUALITY_PRESETS[currentQuality].settings
  }

  // Reset to defaults
  reset(): void {
    this.preferences = { ...DEFAULT_SIMPLE_PREFERENCES }
    this.saveToStorage()
    this.notifyListeners()
  }

  // Storage operations
  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.preferences))
    } catch (error) {
      console.warn('Failed to save preferences to localStorage:', error)
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Merge with defaults to handle missing properties
        this.preferences = {
          ...DEFAULT_SIMPLE_PREFERENCES,
          ...parsed,
          lastUpdated: parsed.lastUpdated || new Date().toISOString()
        }
      }
    } catch (error) {
      console.warn('Failed to load preferences from localStorage:', error)
      this.preferences = { ...DEFAULT_SIMPLE_PREFERENCES }
    }
  }

  // Event listeners
  addListener(callback: (preferences: SimpleUserPreferences) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.getPreferences())
      } catch (error) {
        console.error('Error in preferences listener:', error)
      }
    })
  }

  // Export/Import for backup
  export(): string {
    return JSON.stringify(this.preferences, null, 2)
  }

  import(data: string): boolean {
    try {
      const parsed = JSON.parse(data)
      // Validate basic structure
      if (typeof parsed === 'object' && parsed.quality) {
        this.preferences = {
          ...DEFAULT_SIMPLE_PREFERENCES,
          ...parsed,
          lastUpdated: new Date().toISOString()
        }
        this.saveToStorage()
        this.notifyListeners()
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to import preferences:', error)
      return false
    }
  }
}

// Singleton instance
export const simplePreferencesManager = new SimplePreferencesManager()