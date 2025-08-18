// Performance types
export * from './performance'

// Asset types  
export * from './assets'

// Debug types
export * from './debug'

// Rendering types
export * from './rendering'

// Three.js JSX extensions
import './three-jsx'

// Common utility types
export interface Point3D {
  x: number
  y: number
  z: number
}

export interface Transform {
  position: Point3D
  rotation: Point3D
  scale: Point3D
}

export interface Bounds {
  min: Point3D
  max: Point3D
}

// Event types
export interface SystemEvent {
  type: string
  timestamp: Date
  data?: any
}

export interface PerformanceEvent extends SystemEvent {
  type: 'performance'
  data: {
    fps: number
    memoryUsage: number
    performanceLevel: string
  }
}

export interface AssetEvent extends SystemEvent {
  type: 'asset'
  data: {
    assetId: string
    action: 'loaded' | 'cached' | 'disposed' | 'error'
    progress?: number
  }
}

export interface DebugEvent extends SystemEvent {
  type: 'debug'
  data: {
    level: string
    category: string
    message: string
  }
}

// Configuration types
export interface SystemConfig {
  performance: {
    targetFPS: number
    autoOptimization: boolean
    enableLOD: boolean
    enableCulling: boolean
  }
  assets: {
    cacheSize: number
    preloadDistance: number
    compressionLevel: string
  }
  debug: {
    enabled: boolean
    logLevel: string
    showStats: boolean
  }
}

// Hook return types
export interface UsePerformanceReturn {
  performanceLevel: string
  metrics: any
  adjustQuality: (targetFPS: number) => void
  isOptimizing: boolean
}

export interface UseAssetLoaderReturn {
  loadAsset: (url: string, type: string) => Promise<any>
  isLoading: boolean
  progress: number
  error: string | null
}

export interface UseDebugReturn {
  isEnabled: boolean
  toggleDebugPanel: () => void
  log: (level: string, message: string) => void
  takeScreenshot: () => Promise<string>
}