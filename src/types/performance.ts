import { Vector3, Euler, BufferGeometry, Material, Texture } from 'three'

// Performance level types
export type PerformanceLevel = 'low' | 'medium' | 'high'
export type QualityPreset = 'auto' | 'low' | 'medium' | 'high'
export type ShadowQuality = 'off' | 'low' | 'medium' | 'high'

// Performance metrics interface
export interface PerformanceMetrics {
  fps: number
  memoryUsage: number
  drawCalls: number
  triangleCount: number
  textureMemory: number
  renderTime: number
  frameTime: number
}

// Resource metrics interface
export interface ResourceMetrics {
  memoryUsage: number
  drawCalls: number
  triangleCount: number
  textureMemory: number
  fps: number
  activeObjects: number
  culledObjects: number
}

// Performance configuration interface
export interface PerformanceConfig {
  quality: PerformanceLevel
  targetFPS: number
  maxDrawCalls: number
  maxTriangles: number
  textureQuality: number
  shadowQuality: ShadowQuality
  antialiasing: boolean
  postProcessing: boolean
  enableLOD: boolean
  enableCulling: boolean
  enableInstancing: boolean
}

// LOD (Level of Detail) interfaces
export interface LODLevel {
  distance: number
  geometry: BufferGeometry
  material: Material
  triangleCount: number
  quality: number
}

export interface LODConfiguration {
  levels: LODLevel[]
  transitionDistance: number
  hysteresis: number
}

// Performance manager interface
export interface PerformanceManager {
  // Performance level detection
  detectPerformanceLevel(): PerformanceLevel
  
  // Dynamic quality adjustment
  adjustQuality(targetFPS: number): void
  
  // Resource monitoring
  monitorResources(): ResourceMetrics
  
  // Auto optimization
  enableAutoOptimization(enabled: boolean): void
  
  // Configuration management
  setConfig(config: Partial<PerformanceConfig>): void
  getConfig(): PerformanceConfig
  
  // Metrics
  getMetrics(): PerformanceMetrics
  resetMetrics(): void
}

// LOD manager interface
export interface LODManager {
  // LOD level definition
  defineLODLevels(assetId: string, levels: LODLevel[]): void
  
  // Distance-based LOD selection
  selectLOD(distance: number, performanceLevel: PerformanceLevel): LODLevel
  
  // Smooth transitions
  transitionToLOD(currentLOD: LODLevel, targetLOD: LODLevel): Promise<void>
  
  // LOD configuration
  setLODConfig(config: LODConfiguration): void
  getLODConfig(): LODConfiguration
}

// Camera state for bookmarks
export interface CameraState {
  position: Vector3
  rotation: Euler
  target?: Vector3
  zoom?: number
}

// User preferences interface
export interface UserPreferences {
  qualityPreset: QualityPreset
  targetFPS: number
  enableDebugMode: boolean
  showPerformanceStats: boolean
  enableAutoQuality: boolean
  maxMemoryUsage: number
}

// Performance context state
export interface PerformanceState {
  level: PerformanceLevel
  config: PerformanceConfig
  metrics: PerformanceMetrics
  isOptimizing: boolean
  userPreferences: UserPreferences
}

// Performance context actions
export interface PerformanceActions {
  adjustQuality: (targetFPS: number) => void
  setPerformanceLevel: (level: PerformanceLevel) => void
  updateConfig: (config: Partial<PerformanceConfig>) => void
  updatePreferences: (preferences: Partial<UserPreferences>) => void
  resetMetrics: () => void
}

// Combined performance context
export interface PerformanceContextType extends PerformanceState {
  actions: PerformanceActions
}