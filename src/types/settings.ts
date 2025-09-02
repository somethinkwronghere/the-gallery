import { QualityPreset, ShadowQuality } from './performance'
import { TeleportCategory } from './camera'

// User settings interface
export interface UserSettings {
  // Performance settings
  performance: {
    qualityPreset: QualityPreset
    targetFPS: number
    enableAutoQuality: boolean
    maxMemoryUsage: number
    enableLOD: boolean
    enableCulling: boolean
    enableInstancing: boolean
    shadowQuality: ShadowQuality
    antialiasing: boolean
    postProcessing: boolean
  }
  
  // Display settings
  display: {
    showPerformanceStats: boolean
    showDebugInfo: boolean
    showFPS: boolean
    showMemoryUsage: boolean
    uiScale: number
    theme: 'light' | 'dark' | 'auto'
  }
  
  // Camera settings
  camera: {
    mouseSensitivity: number
    keyboardSensitivity: number
    invertY: boolean
    smoothTransitions: boolean
    defaultTransitionDuration: number
    enableShake: boolean
  }
  
  // Teleport settings
  teleport: {
    enableTeleportUI: boolean
    showMiniMap: boolean
    defaultTeleportDuration: number
    enableQuickTeleport: boolean
    favoriteCategories: TeleportCategory[]
    enableMapTeleport: boolean
  }
  
  // Audio settings
  audio: {
    masterVolume: number
    sfxVolume: number
    ambientVolume: number
    enableSpatialAudio: boolean
    muteOnFocusLoss: boolean
  }
  
  // Accessibility settings
  accessibility: {
    enableHighContrast: boolean
    enableReducedMotion: boolean
    fontSize: 'small' | 'medium' | 'large'
    enableScreenReader: boolean
    enableKeyboardNavigation: boolean
  }
  
  // Developer settings
  developer: {
    enableDebugMode: boolean
    enableHotReload: boolean
    showBoundingBoxes: boolean
    enableWireframe: boolean
    logLevel: 'error' | 'warn' | 'info' | 'debug'
  }
  
  // Mobile settings
  mobile: {
    enableTouchControls: boolean
    enableGestures: boolean
    touchSensitivity: number
    enableMobileOptimizations: boolean
    enableBatteryOptimization: boolean
    enableThermalThrottling: boolean
    mobileQualityReduction: number
    enableAdaptiveFrameRate: boolean
  }
}

// Settings categories for UI organization
export type SettingsCategory = 
  | 'performance' 
  | 'display' 
  | 'camera' 
  | 'teleport' 
  | 'audio' 
  | 'accessibility' 
  | 'developer'

// Settings validation interface
export interface SettingsValidator {
  validate(settings: Partial<UserSettings>): SettingsValidationResult
  validateCategory(category: SettingsCategory, settings: any): SettingsValidationResult
}

export interface SettingsValidationResult {
  isValid: boolean
  errors: SettingsValidationError[]
  warnings: SettingsValidationWarning[]
}

export interface SettingsValidationError {
  category: SettingsCategory
  field: string
  message: string
  value: any
}

export interface SettingsValidationWarning {
  category: SettingsCategory
  field: string
  message: string
  value: any
}

// Settings storage interface
export interface SettingsStorage {
  save(settings: UserSettings): Promise<void>
  load(): Promise<UserSettings | null>
  reset(): Promise<void>
  export(): Promise<string>
  import(data: string): Promise<UserSettings>
}

// Settings manager interface
export interface SettingsManager {
  // Settings management
  getSettings(): UserSettings
  updateSettings(updates: Partial<UserSettings>): void
  resetSettings(): void
  resetCategory(category: SettingsCategory): void
  
  // Validation
  validateSettings(settings: Partial<UserSettings>): SettingsValidationResult
  
  // Storage
  saveSettings(): Promise<void>
  loadSettings(): Promise<void>
  
  // Import/Export
  exportSettings(): Promise<string>
  importSettings(data: string): Promise<void>
  
  // Presets
  applyPreset(preset: SettingsPreset): void
  getPresets(): SettingsPreset[]
  createPreset(name: string, description?: string): SettingsPreset
  deletePreset(id: string): boolean
  
  // Events
  onSettingsChange(callback: (settings: UserSettings) => void): () => void
  onCategoryChange(category: SettingsCategory, callback: (settings: any) => void): () => void
}

// Settings preset interface
export interface SettingsPreset {
  id: string
  name: string
  description?: string
  settings: Partial<UserSettings>
  createdAt: Date
  isBuiltIn: boolean
}

// Default settings
export const DEFAULT_SETTINGS: UserSettings = {
  performance: {
    qualityPreset: 'auto',
    targetFPS: 60,
    enableAutoQuality: true,
    maxMemoryUsage: 512,
    enableLOD: true,
    enableCulling: true,
    enableInstancing: true,
    shadowQuality: 'medium',
    antialiasing: true,
    postProcessing: true
  },
  
  display: {
    showPerformanceStats: false,
    showDebugInfo: false,
    showFPS: false,
    showMemoryUsage: false,
    uiScale: 1.0,
    theme: 'auto'
  },
  
  camera: {
    mouseSensitivity: 1.0,
    keyboardSensitivity: 1.0,
    invertY: false,
    smoothTransitions: true,
    defaultTransitionDuration: 1500,
    enableShake: true
  },
  
  teleport: {
    enableTeleportUI: true,
    showMiniMap: true,
    defaultTeleportDuration: 1500,
    enableQuickTeleport: true,
    favoriteCategories: ['gallery', 'artwork'],
    enableMapTeleport: true
  },
  
  audio: {
    masterVolume: 0.8,
    sfxVolume: 0.7,
    ambientVolume: 0.5,
    enableSpatialAudio: true,
    muteOnFocusLoss: false
  },
  
  accessibility: {
    enableHighContrast: false,
    enableReducedMotion: false,
    fontSize: 'medium',
    enableScreenReader: false,
    enableKeyboardNavigation: true
  },
  
  developer: {
    enableDebugMode: false,
    enableHotReload: true,
    showBoundingBoxes: false,
    enableWireframe: false,
    logLevel: 'warn'
  },
  
  mobile: {
    enableTouchControls: true,
    enableGestures: true,
    touchSensitivity: 0.8,
    enableMobileOptimizations: true,
    enableBatteryOptimization: true,
    enableThermalThrottling: true,
    mobileQualityReduction: 0.7,
    enableAdaptiveFrameRate: true
  }
}

// Built-in presets
export const BUILT_IN_PRESETS: SettingsPreset[] = [
  {
    id: 'high-performance',
    name: 'High Performance',
    description: 'Maximum performance settings for high-end devices',
    settings: {
      performance: {
        qualityPreset: 'high',
        targetFPS: 60,
        enableAutoQuality: false,
        maxMemoryUsage: 1024,
        enableLOD: true,
        enableCulling: true,
        enableInstancing: true,
        shadowQuality: 'high',
        antialiasing: true,
        postProcessing: true
      }
    },
    createdAt: new Date(),
    isBuiltIn: true
  },
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Balanced settings for most devices',
    settings: {
      performance: {
        qualityPreset: 'medium',
        targetFPS: 60,
        enableAutoQuality: true,
        maxMemoryUsage: 512,
        enableLOD: true,
        enableCulling: true,
        enableInstancing: true,
        shadowQuality: 'medium',
        antialiasing: true,
        postProcessing: true
      }
    },
    createdAt: new Date(),
    isBuiltIn: true
  },
  {
    id: 'low-end',
    name: 'Low-End Device',
    description: 'Optimized settings for low-end devices',
    settings: {
      performance: {
        qualityPreset: 'low',
        targetFPS: 30,
        enableAutoQuality: true,
        maxMemoryUsage: 256,
        enableLOD: true,
        enableCulling: true,
        enableInstancing: false,
        shadowQuality: 'off',
        antialiasing: false,
        postProcessing: false
      }
    },
    createdAt: new Date(),
    isBuiltIn: true
  },
  {
    id: 'accessibility',
    name: 'Accessibility',
    description: 'Settings optimized for accessibility',
    settings: {
      accessibility: {
        enableHighContrast: true,
        enableReducedMotion: true,
        fontSize: 'large',
        enableScreenReader: true,
        enableKeyboardNavigation: true
      },
      display: {
        showPerformanceStats: false,
        showDebugInfo: false,
        showFPS: false,
        showMemoryUsage: false,
        uiScale: 1.2,
        theme: 'auto'
      }
    },
    createdAt: new Date(),
    isBuiltIn: true
  }
]