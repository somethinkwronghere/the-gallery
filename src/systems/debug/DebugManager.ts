import { Vector3, Euler, Box3, Object3D, WebGLRenderer } from 'three'
import {
  DebugManager as IDebugManager,
  DebugStats,
  PerformanceDebugInfo,
  MemoryDebugInfo,
  RenderDebugInfo,
  CameraBookmark,
  DebugLogEntry,
  LogLevel,
  VisualizationOptions,
  ObjectInspectionData,
  ProfilingResult,
  DebugConfig,
  DebugMode
} from '../../types/debug'
import { performanceManager } from '../performance/PerformanceManager'
import { resourceManager } from '../memory/ResourceManager'

export class DebugManager implements IDebugManager {
  private config: DebugConfig
  private panelVisible: boolean = false
  private visualizations: VisualizationOptions
  private bookmarks: CameraBookmark[] = []
  private logs: DebugLogEntry[] = []
  private profilingResults: ProfilingResult[] = []
  private profilingTimers: Map<string, { startTime: Date; callCount: number }> = new Map()
  private logIdCounter = 0
  private bookmarkIdCounter = 0
  private renderer: WebGLRenderer | null = null
  private updateInterval: number | null = null

  constructor() {
    this.config = this.getDefaultConfig()
    this.visualizations = this.getDefaultVisualizations()
    this.loadBookmarksFromStorage()
    this.startStatsCollection()
  }

  private getDefaultConfig(): DebugConfig {
    return {
      mode: 'basic',
      logLevel: 'info',
      maxLogEntries: 1000,
      showFPS: true,
      showMemory: true,
      showRenderStats: true,
      enableProfiling: false,
      autoSaveBookmarks: true,
      screenshotFormat: 'png',
      screenshotQuality: 0.8
    }
  }

  private getDefaultVisualizations(): VisualizationOptions {
    return {
      boundingBoxes: false,
      wireframes: false,
      normals: false,
      colliders: false,
      lightHelpers: false,
      cameraHelpers: false,
      gridHelper: false,
      axesHelper: false,
      frustumHelper: false
    }
  }

  // Debug panel control
  showDebugPanel(visible: boolean): void {
    this.panelVisible = visible
    this.log('info', 'debug', `Debug panel ${visible ? 'shown' : 'hidden'}`)
  }

  isDebugPanelVisible(): boolean {
    return this.panelVisible
  }

  // Performance metrics
  getPerformanceMetrics(): PerformanceDebugInfo {
    const baseMetrics = performanceManager.getMetrics()
    const memoryInfo = (performance as any).memory
    
    return {
      ...baseMetrics,
      gpuMemory: this.getGPUMemoryUsage(),
      cpuUsage: this.getCPUUsage(),
      renderCalls: this.renderer?.info.render.calls || 0,
      shaderCompilations: this.renderer?.info.programs?.length || 0,
      textureUploads: this.renderer?.info.memory.textures || 0,
      bufferUploads: this.renderer?.info.memory.geometries || 0
    }
  }

  getMemoryInfo(): MemoryDebugInfo {
    const memoryUsage = resourceManager.getMemoryUsage()
    const memoryInfo = (performance as any).memory
    
    return {
      heapUsed: memoryInfo ? Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024) : 0,
      heapTotal: memoryInfo ? Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024) : 0,
      external: 0, // Not available in browser
      arrayBuffers: 0, // Not directly available
      geometries: memoryUsage.geometries,
      textures: memoryUsage.textures,
      materials: memoryUsage.materials,
      objects: resourceManager.getResourceStats().total
    }
  }

  getRenderInfo(): RenderDebugInfo {
    if (!this.renderer) {
      return {
        drawCalls: 0,
        triangles: 0,
        points: 0,
        lines: 0,
        programs: 0,
        geometries: 0,
        textures: 0,
        framebufferBindings: 0,
        textureBindings: 0
      }
    }

    const info = this.renderer.info
    return {
      drawCalls: info.render.calls,
      triangles: info.render.triangles,
      points: info.render.points,
      lines: info.render.lines,
      programs: info.programs?.length || 0,
      geometries: info.memory.geometries,
      textures: info.memory.textures,
      framebufferBindings: 0, // Not exposed by Three.js
      textureBindings: 0 // Not exposed by Three.js
    }
  }

  private getGPUMemoryUsage(): number {
    // Estimate GPU memory usage based on renderer info
    if (!this.renderer) return 0
    
    const info = this.renderer.info
    const textureMemory = info.memory.textures * 1024 * 1024 // Rough estimate
    const geometryMemory = info.memory.geometries * 512 * 1024 // Rough estimate
    
    return Math.round((textureMemory + geometryMemory) / 1024 / 1024) // MB
  }

  private getCPUUsage(): number {
    // Browser doesn't provide direct CPU usage, return estimated based on frame time
    const frameTime = performanceManager.getMetrics().frameTime
    return Math.min(100, Math.round((frameTime / 16.67) * 100)) // Percentage based on 60fps target
  }

  // Visualization controls
  showBoundingBoxes(enabled: boolean): void {
    this.visualizations.boundingBoxes = enabled
    this.log('info', 'debug', `Bounding boxes ${enabled ? 'enabled' : 'disabled'}`)
  }

  showWireframes(enabled: boolean): void {
    this.visualizations.wireframes = enabled
    this.log('info', 'debug', `Wireframes ${enabled ? 'enabled' : 'disabled'}`)
  }

  showNormals(enabled: boolean): void {
    this.visualizations.normals = enabled
    this.log('info', 'debug', `Normals ${enabled ? 'enabled' : 'disabled'}`)
  }

  showColliders(enabled: boolean): void {
    this.visualizations.colliders = enabled
    this.log('info', 'debug', `Colliders ${enabled ? 'enabled' : 'disabled'}`)
  }

  setVisualizationOptions(options: Partial<VisualizationOptions>): void {
    this.visualizations = { ...this.visualizations, ...options }
    this.log('info', 'debug', 'Visualization options updated', options)
  }

  getVisualizationOptions(): VisualizationOptions {
    return { ...this.visualizations }
  }

  // Camera bookmarks
  saveBookmark(name: string, position: Vector3, rotation: Euler, description?: string): CameraBookmark {
    const bookmark: CameraBookmark = {
      id: `bookmark_${++this.bookmarkIdCounter}_${Date.now()}`,
      name,
      position: position.clone(),
      rotation: rotation.clone(),
      createdAt: new Date(),
      description,
      tags: []
    }

    this.bookmarks.push(bookmark)
    
    if (this.config.autoSaveBookmarks) {
      this.saveBookmarksToStorage()
    }

    this.log('info', 'debug', `Bookmark saved: ${name}`, { position, rotation })
    return bookmark
  }

  loadBookmark(id: string): CameraBookmark | null {
    const bookmark = this.bookmarks.find(b => b.id === id)
    if (bookmark) {
      this.log('info', 'debug', `Bookmark loaded: ${bookmark.name}`)
    }
    return bookmark || null
  }

  deleteBookmark(id: string): boolean {
    const index = this.bookmarks.findIndex(b => b.id === id)
    if (index !== -1) {
      const bookmark = this.bookmarks[index]
      this.bookmarks.splice(index, 1)
      
      if (this.config.autoSaveBookmarks) {
        this.saveBookmarksToStorage()
      }

      this.log('info', 'debug', `Bookmark deleted: ${bookmark.name}`)
      return true
    }
    return false
  }

  getBookmarks(): CameraBookmark[] {
    return [...this.bookmarks]
  }

  private saveBookmarksToStorage(): void {
    try {
      localStorage.setItem('debug_bookmarks', JSON.stringify(this.bookmarks))
    } catch (error) {
      this.log('error', 'debug', 'Failed to save bookmarks to storage', error)
    }
  }

  private loadBookmarksFromStorage(): void {
    try {
      const stored = localStorage.getItem('debug_bookmarks')
      if (stored) {
        const bookmarks = JSON.parse(stored)
        this.bookmarks = bookmarks.map((b: any) => ({
          ...b,
          position: new Vector3().copy(b.position),
          rotation: new Euler().copy(b.rotation),
          createdAt: new Date(b.createdAt)
        }))
      }
    } catch (error) {
      this.log('error', 'debug', 'Failed to load bookmarks from storage', error)
    }
  }

  // Logging
  log(level: LogLevel, category: string, message: string, data?: any): void {
    if (!this.shouldLog(level)) return

    const entry: DebugLogEntry = {
      id: `log_${++this.logIdCounter}_${Date.now()}`,
      timestamp: new Date(),
      level,
      category,
      message,
      data,
      stack: level === 'error' ? new Error().stack : undefined
    }

    this.logs.push(entry)

    // Limit log entries
    if (this.logs.length > this.config.maxLogEntries) {
      this.logs.shift()
    }

    // Console output
    const consoleMethod = level === 'error' ? 'error' : 
                         level === 'warn' ? 'warn' : 
                         level === 'debug' ? 'debug' : 'log'
    
    console[consoleMethod](`[${category.toUpperCase()}] ${message}`, data || '')
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = ['debug', 'info', 'warn', 'error']
    const currentLevelIndex = levels.indexOf(this.config.logLevel)
    const messageLevelIndex = levels.indexOf(level)
    return messageLevelIndex >= currentLevelIndex
  }

  getLogs(level?: LogLevel, category?: string): DebugLogEntry[] {
    let filteredLogs = [...this.logs]

    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level)
    }

    if (category) {
      filteredLogs = filteredLogs.filter(log => log.category === category)
    }

    return filteredLogs
  }

  clearLogs(): void {
    this.logs = []
    this.log('info', 'debug', 'Logs cleared')
  }

  // Object inspection
  inspectObject(object: Object3D): ObjectInspectionData {
    const boundingBox = new Box3().setFromObject(object)
    
    let triangleCount = 0
    let materialCount = 0
    let memoryUsage = 0

    object.traverse((child) => {
      const mesh = child as any
      if (mesh.geometry) {
        const geometry = mesh.geometry
        if (geometry.index) {
          triangleCount += geometry.index.count / 3
        } else if (geometry.attributes.position) {
          triangleCount += geometry.attributes.position.count / 3
        }
        memoryUsage += resourceManager.getResourceStats().totalSize
      }
      if (mesh.material) {
        materialCount += Array.isArray(mesh.material) ? mesh.material.length : 1
      }
    })

    return {
      name: object.name || 'Unnamed Object',
      type: object.type,
      position: object.position.clone(),
      rotation: object.rotation.clone(),
      scale: object.scale.clone(),
      visible: object.visible,
      boundingBox,
      triangleCount: Math.round(triangleCount),
      materialCount,
      childCount: object.children.length,
      memoryUsage: Math.round(memoryUsage / 1024), // KB
      properties: {
        uuid: object.uuid,
        layers: object.layers.mask,
        castShadow: (object as any).castShadow,
        receiveShadow: (object as any).receiveShadow,
        frustumCulled: object.frustumCulled
      }
    }
  }

  highlightObject(object: Object3D, highlight: boolean): void {
    // This would typically add/remove highlight materials or wireframes
    // Implementation depends on the specific highlighting system
    this.log('info', 'debug', `Object ${highlight ? 'highlighted' : 'unhighlighted'}: ${object.name}`)
  }

  // Performance profiling
  startProfiling(name: string): void {
    if (!this.config.enableProfiling) return

    const existing = this.profilingTimers.get(name)
    if (existing) {
      existing.callCount++
    } else {
      this.profilingTimers.set(name, {
        startTime: new Date(),
        callCount: 1
      })
    }
  }

  endProfiling(name: string): number {
    if (!this.config.enableProfiling) return 0

    const timer = this.profilingTimers.get(name)
    if (!timer) return 0

    const endTime = new Date()
    const duration = endTime.getTime() - timer.startTime.getTime()

    // Update or create profiling result
    const existingResult = this.profilingResults.find(r => r.name === name)
    if (existingResult) {
      existingResult.endTime = endTime
      existingResult.callCount = timer.callCount
      existingResult.averageDuration = (existingResult.averageDuration * (existingResult.callCount - 1) + duration) / existingResult.callCount
    } else {
      this.profilingResults.push({
        name,
        duration,
        startTime: timer.startTime,
        endTime,
        callCount: timer.callCount,
        averageDuration: duration
      })
    }

    this.profilingTimers.delete(name)
    return duration
  }

  getProfilingResults(): ProfilingResult[] {
    return [...this.profilingResults]
  }

  clearProfilingResults(): void {
    this.profilingResults = []
    this.profilingTimers.clear()
  }

  // Screenshot and recording
  async takeScreenshot(filename?: string): Promise<string> {
    if (!this.renderer) {
      throw new Error('Renderer not available for screenshot')
    }

    return new Promise((resolve, reject) => {
      try {
        const canvas = this.renderer!.domElement
        const dataURL = canvas.toDataURL(`image/${this.config.screenshotFormat}`, this.config.screenshotQuality)
        
        if (filename) {
          // Create download link
          const link = document.createElement('a')
          link.download = filename
          link.href = dataURL
          link.click()
        }

        this.log('info', 'debug', `Screenshot taken: ${filename || 'unnamed'}`)
        resolve(dataURL)
      } catch (error) {
        this.log('error', 'debug', 'Screenshot failed', error)
        reject(error)
      }
    })
  }

  startRecording(): void {
    // Recording implementation would depend on MediaRecorder API
    this.log('info', 'debug', 'Recording started (not implemented)')
  }

  async stopRecording(): Promise<string> {
    // Recording implementation would depend on MediaRecorder API
    this.log('info', 'debug', 'Recording stopped (not implemented)')
    return ''
  }

  // Configuration
  setConfig(config: Partial<DebugConfig>): void {
    this.config = { ...this.config, ...config }
    this.log('info', 'debug', 'Debug config updated', config)
  }

  getConfig(): DebugConfig {
    return { ...this.config }
  }

  setRenderer(renderer: WebGLRenderer): void {
    this.renderer = renderer
    this.log('info', 'debug', 'Renderer set for debug manager')
  }

  // Stats collection
  private startStatsCollection(): void {
    this.updateInterval = window.setInterval(() => {
      // Update stats periodically for smooth UI updates
    }, 100) // 10 FPS for debug stats
  }

  getDebugStats(): DebugStats {
    return {
      performance: this.getPerformanceMetrics(),
      memory: this.getMemoryInfo(),
      render: this.getRenderInfo(),
      timestamp: new Date()
    }
  }

  // Cleanup
  dispose(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
    }
    
    this.profilingTimers.clear()
    this.profilingResults = []
    this.logs = []
    
    if (this.config.autoSaveBookmarks) {
      this.saveBookmarksToStorage()
    }

    this.log('info', 'debug', 'Debug manager disposed')
  }
}

// Singleton instance
export const debugManager = new DebugManager()