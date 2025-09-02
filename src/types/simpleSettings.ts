// Simplified settings types for basic optimization
export type QualityLevel = 'low' | 'medium' | 'high'

export interface SimpleUserPreferences {
  // Basic quality settings
  quality: QualityLevel
  
  // Essential display options
  showFPS: boolean
  showPerformanceStats: boolean
  
  // Basic audio
  masterVolume: number
  
  // Essential accessibility
  fontSize: 'small' | 'medium' | 'large'
  
  // Auto-save preferences
  lastUpdated: string
}

export const DEFAULT_SIMPLE_PREFERENCES: SimpleUserPreferences = {
  quality: 'medium',
  showFPS: false,
  showPerformanceStats: false,
  masterVolume: 0.8,
  fontSize: 'medium',
  lastUpdated: new Date().toISOString()
}

// Quality preset configurations
export const QUALITY_PRESETS: Record<QualityLevel, {
  name: string
  description: string
  settings: {
    targetFPS: number
    enableLOD: boolean
    enableCulling: boolean
    shadowQuality: 'off' | 'low' | 'medium' | 'high'
    antialiasing: boolean
    postProcessing: boolean
    maxMemoryUsage: number
  }
}> = {
  low: {
    name: 'Düşük Kalite',
    description: 'Eski cihazlar için optimize edilmiş',
    settings: {
      targetFPS: 30,
      enableLOD: true,
      enableCulling: true,
      shadowQuality: 'off',
      antialiasing: false,
      postProcessing: false,
      maxMemoryUsage: 256
    }
  },
  medium: {
    name: 'Orta Kalite',
    description: 'Çoğu cihaz için dengeli ayarlar',
    settings: {
      targetFPS: 60,
      enableLOD: true,
      enableCulling: true,
      shadowQuality: 'medium',
      antialiasing: true,
      postProcessing: true,
      maxMemoryUsage: 512
    }
  },
  high: {
    name: 'Yüksek Kalite',
    description: 'Güçlü cihazlar için maksimum kalite',
    settings: {
      targetFPS: 60,
      enableLOD: false,
      enableCulling: true,
      shadowQuality: 'high',
      antialiasing: true,
      postProcessing: true,
      maxMemoryUsage: 1024
    }
  }
}