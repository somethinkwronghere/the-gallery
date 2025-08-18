import { Vector3, Euler, Box3, Object3D } from 'three'
import { PerformanceMetrics, ResourceMetrics } from './performance'

// Debug modes
export type DebugMode = 'off' | 'basic' | 'advanced' | 'full'
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
export type VisualizationType = 'boundingBoxes' | 'wireframes' | 'normals' | 'colliders' | 'lightHelpers' | 'cameraHelpers' | 'gridHelper' | 'axesHelper' | 'frustumHelper'

// Debug panel sections
export interface DebugPanelSection {
  id: string
  title: string
  visible: boolean
  collapsible: boolean
  order: number
}

// Performance debug info
export interface PerformanceDebugInfo extends PerformanceMetrics {
  gpuMemory: number
  cpuUsage: number
  renderCalls: number
  shaderCompilations: number
  textureUploads: number
  bufferUploads: number
}

// Memory debug info
export interface MemoryDebugInfo {
  heapUsed: number
  heapTotal: number
  external: number
  arrayBuffers: number
  geometries: number
  textures: number
  materials: number
  objects: number
}

// Render debug info
export interface RenderDebugInfo {
  drawCalls: number
  triangles: number
  points: number
  lines: number
  programs: number
  geometries: number
  textures: number
  framebufferBindings: number
  textureBindings: number
}

// Camera bookmark interface
export interface CameraBookmark {
  id: string
  name: string
  position: Vector3
  rotation: Euler
  target?: Vector3
  zoom?: number
  createdAt: Date
  description?: string
  tags: string[]
}

// Debug visualization options
export interface VisualizationOptions {
  boundingBoxes: boolean
  wireframes: boolean
  normals: boolean
  colliders: boolean
  lightHelpers: boolean
  cameraHelpers: boolean
  gridHelper: boolean
  axesHelper: boolean
  frustumHelper: boolean
}

// Debug stats interface
export interface DebugStats {
  performance: PerformanceDebugInfo
  memory: MemoryDebugInfo
  render: RenderDebugInfo
  timestamp: Date
}

// Debug log entry
export interface DebugLogEntry {
  id: string
  timestamp: Date
  level: LogLevel
  category: string
  message: string
  data?: any
  stack?: string
}

// Debug manager interface
export interface DebugManager {
  // Debug panel control
  showDebugPanel(visible: boolean): void
  isDebugPanelVisible(): boolean
  
  // Performance metrics
  getPerformanceMetrics(): PerformanceDebugInfo
  getMemoryInfo(): MemoryDebugInfo
  getRenderInfo(): RenderDebugInfo
  
  // Visualization controls
  showBoundingBoxes(enabled: boolean): void
  showWireframes(enabled: boolean): void
  showNormals(enabled: boolean): void
  showColliders(enabled: boolean): void
  setVisualizationOptions(options: Partial<VisualizationOptions>): void
  
  // Camera bookmarks
  saveBookmark(name: string, position: Vector3, rotation: Euler, description?: string): CameraBookmark
  loadBookmark(id: string): CameraBookmark | null
  deleteBookmark(id: string): boolean
  getBookmarks(): CameraBookmark[]
  
  // Logging
  log(level: LogLevel, category: string, message: string, data?: any): void
  getLogs(level?: LogLevel, category?: string): DebugLogEntry[]
  clearLogs(): void
  
  // Object inspection
  inspectObject(object: Object3D): ObjectInspectionData
  highlightObject(object: Object3D, highlight: boolean): void
  
  // Performance profiling
  startProfiling(name: string): void
  endProfiling(name: string): number
  getProfilingResults(): ProfilingResult[]
  
  // Screenshot and recording
  takeScreenshot(filename?: string): Promise<string>
  startRecording(): void
  stopRecording(): Promise<string>
}

// Object inspection data
export interface ObjectInspectionData {
  name: string
  type: string
  position: Vector3
  rotation: Euler
  scale: Vector3
  visible: boolean
  boundingBox: Box3
  triangleCount: number
  materialCount: number
  childCount: number
  memoryUsage: number
  properties: Record<string, any>
}

// Profiling result
export interface ProfilingResult {
  name: string
  duration: number
  startTime: Date
  endTime: Date
  callCount: number
  averageDuration: number
}

// Debug configuration
export interface DebugConfig {
  mode: DebugMode
  logLevel: LogLevel
  maxLogEntries: number
  showFPS: boolean
  showMemory: boolean
  showRenderStats: boolean
  enableProfiling: boolean
  autoSaveBookmarks: boolean
  screenshotFormat: 'png' | 'jpg' | 'webp'
  screenshotQuality: number
}

// Debug state for context
export interface DebugState {
  isEnabled: boolean
  mode: DebugMode
  config: DebugConfig
  panelVisible: boolean
  visualizations: VisualizationOptions
  bookmarks: CameraBookmark[]
  logs: DebugLogEntry[]
  stats: DebugStats
  profilingResults: ProfilingResult[]
}

// Debug context actions
export interface DebugActions {
  toggleDebugPanel: () => void
  setDebugMode: (mode: DebugMode) => void
  updateConfig: (config: Partial<DebugConfig>) => void
  saveBookmark: (name: string, position: Vector3, rotation: Euler, description?: string) => CameraBookmark
  loadBookmark: (id: string) => void
  deleteBookmark: (id: string) => void
  log: (level: LogLevel, category: string, message: string, data?: any) => void
  clearLogs: () => void
  takeScreenshot: (filename?: string) => Promise<string>
  toggleVisualization: (type: VisualizationType) => void
}

// Combined debug context
export interface DebugContextType extends DebugState {
  actions: DebugActions
}

// Teleport system types
export interface TeleportPoint {
  id: string
  name: string
  position: Vector3
  rotation?: Euler
  description?: string
  thumbnail?: string
  category: string
  enabled: boolean
}

export interface TeleportManager {
  // Teleport points management
  addTeleportPoint(point: Omit<TeleportPoint, 'id'>): TeleportPoint
  removeTeleportPoint(id: string): boolean
  getTeleportPoints(): TeleportPoint[]
  getTeleportPoint(id: string): TeleportPoint | null
  
  // Teleportation
  teleportTo(pointId: string): Promise<void>
  teleportToPosition(position: Vector3, rotation?: Euler): Promise<void>
  
  // UI integration
  showTeleportUI(visible: boolean): void
  isTeleportUIVisible(): boolean
}

// Development tools interface
export interface DevelopmentTools {
  // Hot reload
  enableHotReload(enabled: boolean): void
  reloadAsset(assetId: string): Promise<void>
  reloadComponent(componentName: string): void
  
  // State management
  saveState(name: string): void
  loadState(name: string): void
  getSavedStates(): string[]
  
  // Testing utilities
  simulatePerformanceLevel(level: 'low' | 'medium' | 'high'): void
  simulateNetworkCondition(condition: 'fast' | 'slow' | 'offline'): void
  injectTestData(data: any): void
}