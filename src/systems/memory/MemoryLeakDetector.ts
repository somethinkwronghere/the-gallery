import { MemoryLeakInfo, MemoryWarning, MemoryWarningLevel } from '../../types/memory'

interface MemorySnapshot {
  timestamp: number
  jsHeapSize: number
  resourceCount: number
  textureMemory: number
  geometryMemory: number
}

export class MemoryLeakDetector {
  private snapshots: MemorySnapshot[] = []
  private maxSnapshots = 100
  private snapshotInterval = 30000 // 30 seconds
  private intervalId: number | null = null
  private isMonitoring = false

  // Thresholds for leak detection
  private readonly MEMORY_GROWTH_THRESHOLD = 5 // MB per minute
  private readonly RESOURCE_GROWTH_THRESHOLD = 50 // resources per minute
  private readonly SNAPSHOT_WINDOW = 10 // Number of snapshots to analyze

  startMonitoring(): void {
    if (this.isMonitoring) return

    this.isMonitoring = true
    this.takeSnapshot() // Initial snapshot

    this.intervalId = window.setInterval(() => {
      this.takeSnapshot()
      this.analyzeLeaks()
    }, this.snapshotInterval)

    console.info('[MemoryLeakDetector] Started monitoring')
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) return

    this.isMonitoring = false
    
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    console.info('[MemoryLeakDetector] Stopped monitoring')
  }

  private takeSnapshot(): void {
    const memoryInfo = (performance as any).memory
    const timestamp = Date.now()

    // Get resource counts from resource manager if available
    let resourceCount = 0
    let textureMemory = 0
    let geometryMemory = 0

    try {
      // Try to get resource manager instance
      const resourceManager = (window as any).__resourceManager
      if (resourceManager && typeof resourceManager.getResourceStats === 'function') {
        const stats = resourceManager.getResourceStats()
        resourceCount = stats.total
      }

      // Try to get memory usage from resource manager
      if (resourceManager && typeof resourceManager.getMemoryUsage === 'function') {
        const usage = resourceManager.getMemoryUsage()
        textureMemory = usage.textures
        geometryMemory = usage.geometries
      }
    } catch (error) {
      // Ignore errors, use defaults
    }

    const snapshot: MemorySnapshot = {
      timestamp,
      jsHeapSize: memoryInfo ? memoryInfo.usedJSHeapSize / (1024 * 1024) : 0, // MB
      resourceCount,
      textureMemory,
      geometryMemory
    }

    this.snapshots.push(snapshot)

    // Keep only the last maxSnapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift()
    }

    console.debug('[MemoryLeakDetector] Snapshot taken:', snapshot)
  }

  private analyzeLeaks(): void {
    if (this.snapshots.length < this.SNAPSHOT_WINDOW) {
      return // Not enough data
    }

    const recentSnapshots = this.snapshots.slice(-this.SNAPSHOT_WINDOW)
    const oldestSnapshot = recentSnapshots[0]
    const newestSnapshot = recentSnapshots[recentSnapshots.length - 1]

    const timeDiffMinutes = (newestSnapshot.timestamp - oldestSnapshot.timestamp) / (1000 * 60)
    
    if (timeDiffMinutes === 0) return

    // Calculate growth rates
    const memoryGrowthRate = (newestSnapshot.jsHeapSize - oldestSnapshot.jsHeapSize) / timeDiffMinutes
    const resourceGrowthRate = (newestSnapshot.resourceCount - oldestSnapshot.resourceCount) / timeDiffMinutes

    // Check for potential leaks
    const memoryLeak = memoryGrowthRate > this.MEMORY_GROWTH_THRESHOLD
    const resourceLeak = resourceGrowthRate > this.RESOURCE_GROWTH_THRESHOLD

    if (memoryLeak || resourceLeak) {
      const warning = this.createLeakWarning(memoryGrowthRate, resourceGrowthRate, recentSnapshots)
      console.warn('[MemoryLeakDetector] Potential memory leak detected:', warning)
      
      // Emit warning event
      this.emitLeakWarning(warning)
    }
  }

  private createLeakWarning(
    memoryGrowthRate: number, 
    resourceGrowthRate: number, 
    snapshots: MemorySnapshot[]
  ): MemoryWarning {
    const level: MemoryWarningLevel = 
      memoryGrowthRate > this.MEMORY_GROWTH_THRESHOLD * 2 ? 'critical' :
      memoryGrowthRate > this.MEMORY_GROWTH_THRESHOLD * 1.5 ? 'high' : 'medium'

    const recommendations: string[] = []

    if (memoryGrowthRate > this.MEMORY_GROWTH_THRESHOLD) {
      recommendations.push(`Memory growing at ${memoryGrowthRate.toFixed(2)} MB/min`)
      recommendations.push('Check for undisposed resources')
      recommendations.push('Review event listener cleanup')
    }

    if (resourceGrowthRate > this.RESOURCE_GROWTH_THRESHOLD) {
      recommendations.push(`Resources growing at ${resourceGrowthRate.toFixed(0)} items/min`)
      recommendations.push('Check resource disposal in cleanup methods')
      recommendations.push('Review object lifecycle management')
    }

    // Analyze texture and geometry growth
    const textureGrowth = (snapshots[snapshots.length - 1].textureMemory - snapshots[0].textureMemory) / 
                         ((snapshots[snapshots.length - 1].timestamp - snapshots[0].timestamp) / (1000 * 60))
    const geometryGrowth = (snapshots[snapshots.length - 1].geometryMemory - snapshots[0].geometryMemory) / 
                          ((snapshots[snapshots.length - 1].timestamp - snapshots[0].timestamp) / (1000 * 60))

    if (textureGrowth > 2) { // 2MB/min texture growth
      recommendations.push('Texture memory growing rapidly - check texture disposal')
    }

    if (geometryGrowth > 1) { // 1MB/min geometry growth
      recommendations.push('Geometry memory growing rapidly - check geometry disposal')
    }

    return {
      level,
      message: `Potential memory leak detected (${level} severity)`,
      currentUsage: snapshots[snapshots.length - 1].jsHeapSize,
      threshold: this.MEMORY_GROWTH_THRESHOLD,
      recommendations,
      timestamp: Date.now()
    }
  }

  private emitLeakWarning(warning: MemoryWarning): void {
    // Emit custom event for the application to handle
    const event = new CustomEvent('memoryLeakDetected', {
      detail: warning
    })
    window.dispatchEvent(event)
  }

  // Get current leak analysis
  getCurrentAnalysis(): {
    isLeaking: boolean
    memoryGrowthRate: number
    resourceGrowthRate: number
    recommendations: string[]
  } {
    if (this.snapshots.length < 2) {
      return {
        isLeaking: false,
        memoryGrowthRate: 0,
        resourceGrowthRate: 0,
        recommendations: ['Not enough data for analysis']
      }
    }

    const recentSnapshots = this.snapshots.slice(-Math.min(this.SNAPSHOT_WINDOW, this.snapshots.length))
    const oldestSnapshot = recentSnapshots[0]
    const newestSnapshot = recentSnapshots[recentSnapshots.length - 1]

    const timeDiffMinutes = (newestSnapshot.timestamp - oldestSnapshot.timestamp) / (1000 * 60)
    
    if (timeDiffMinutes === 0) {
      return {
        isLeaking: false,
        memoryGrowthRate: 0,
        resourceGrowthRate: 0,
        recommendations: ['Insufficient time data']
      }
    }

    const memoryGrowthRate = (newestSnapshot.jsHeapSize - oldestSnapshot.jsHeapSize) / timeDiffMinutes
    const resourceGrowthRate = (newestSnapshot.resourceCount - oldestSnapshot.resourceCount) / timeDiffMinutes

    const isLeaking = memoryGrowthRate > this.MEMORY_GROWTH_THRESHOLD || 
                     resourceGrowthRate > this.RESOURCE_GROWTH_THRESHOLD

    const recommendations: string[] = []
    
    if (isLeaking) {
      if (memoryGrowthRate > this.MEMORY_GROWTH_THRESHOLD) {
        recommendations.push('Memory usage is growing consistently')
        recommendations.push('Check for proper resource disposal')
      }
      if (resourceGrowthRate > this.RESOURCE_GROWTH_THRESHOLD) {
        recommendations.push('Resource count is growing consistently')
        recommendations.push('Review object creation and cleanup patterns')
      }
    } else {
      recommendations.push('No significant memory leaks detected')
    }

    return {
      isLeaking,
      memoryGrowthRate,
      resourceGrowthRate,
      recommendations
    }
  }

  // Get memory trend data for visualization
  getTrendData(minutes: number = 30): MemorySnapshot[] {
    const cutoffTime = Date.now() - (minutes * 60 * 1000)
    return this.snapshots.filter(snapshot => snapshot.timestamp > cutoffTime)
  }

  // Force a leak analysis
  forceAnalysis(): MemoryWarning | null {
    if (this.snapshots.length < this.SNAPSHOT_WINDOW) {
      return null
    }

    this.takeSnapshot()
    
    const recentSnapshots = this.snapshots.slice(-this.SNAPSHOT_WINDOW)
    const oldestSnapshot = recentSnapshots[0]
    const newestSnapshot = recentSnapshots[recentSnapshots.length - 1]

    const timeDiffMinutes = (newestSnapshot.timestamp - oldestSnapshot.timestamp) / (1000 * 60)
    
    if (timeDiffMinutes === 0) return null

    const memoryGrowthRate = (newestSnapshot.jsHeapSize - oldestSnapshot.jsHeapSize) / timeDiffMinutes
    const resourceGrowthRate = (newestSnapshot.resourceCount - oldestSnapshot.resourceCount) / timeDiffMinutes

    if (memoryGrowthRate > this.MEMORY_GROWTH_THRESHOLD || resourceGrowthRate > this.RESOURCE_GROWTH_THRESHOLD) {
      return this.createLeakWarning(memoryGrowthRate, resourceGrowthRate, recentSnapshots)
    }

    return null
  }

  // Clear all snapshots
  clearHistory(): void {
    this.snapshots = []
    console.info('[MemoryLeakDetector] History cleared')
  }

  // Get statistics
  getStats() {
    return {
      isMonitoring: this.isMonitoring,
      snapshotCount: this.snapshots.length,
      monitoringDuration: this.snapshots.length > 0 ? 
        Date.now() - this.snapshots[0].timestamp : 0,
      snapshotInterval: this.snapshotInterval
    }
  }
}

// Singleton instance
export const memoryLeakDetector = new MemoryLeakDetector()