import { GarbageCollector as IGarbageCollector } from '../../types/memory'

export class GarbageCollector implements IGarbageCollector {
  private memoryPressureThreshold = 0.8 // 80% of available memory
  private lastGCTime = 0
  private gcCooldown = 5000 // 5 seconds between forced GC calls

  forceGC(): boolean {
    const now = Date.now()
    
    // Prevent too frequent GC calls
    if (now - this.lastGCTime < this.gcCooldown) {
      return false
    }

    try {
      // Try different methods to trigger garbage collection
      if ('gc' in window && typeof (window as any).gc === 'function') {
        (window as any).gc()
        this.lastGCTime = now
        console.info('[GarbageCollector] Forced garbage collection (window.gc)')
        return true
      }

      // Alternative method for some browsers
      if ('webkitGC' in window && typeof (window as any).webkitGC === 'function') {
        (window as any).webkitGC()
        this.lastGCTime = now
        console.info('[GarbageCollector] Forced garbage collection (webkit)')
        return true
      }

      // Fallback: create memory pressure to encourage GC
      this.createMemoryPressure()
      this.lastGCTime = now
      console.info('[GarbageCollector] Created memory pressure to encourage GC')
      return true

    } catch (error) {
      console.warn('[GarbageCollector] Failed to force garbage collection:', error)
      return false
    }
  }

  private createMemoryPressure(): void {
    // Create and immediately release large arrays to encourage GC
    const arrays: ArrayBuffer[] = []
    
    try {
      // Create several large ArrayBuffers
      for (let i = 0; i < 10; i++) {
        arrays.push(new ArrayBuffer(1024 * 1024)) // 1MB each
      }
    } catch (error) {
      // Ignore allocation errors
    } finally {
      // Clear references to encourage GC
      arrays.length = 0
    }
  }

  isMemoryPressure(): boolean {
    const memoryInfo = (performance as any).memory
    
    if (!memoryInfo) {
      // Fallback: check if we can allocate memory
      try {
        const testArray = new ArrayBuffer(10 * 1024 * 1024) // Try to allocate 10MB
        return false // If successful, no memory pressure
      } catch (error) {
        return true // If failed, likely memory pressure
      }
    }

    const usedRatio = memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize
    const limitRatio = memoryInfo.totalJSHeapSize / memoryInfo.jsHeapSizeLimit

    // Memory pressure if:
    // 1. Using more than 80% of allocated heap
    // 2. Allocated heap is more than 90% of limit
    return usedRatio > this.memoryPressureThreshold || limitRatio > 0.9
  }

  getSuggestedCleanupActions(): string[] {
    const suggestions: string[] = []
    const memoryInfo = (performance as any).memory

    if (this.isMemoryPressure()) {
      suggestions.push('Force garbage collection')
      suggestions.push('Dispose unused 3D resources')
      suggestions.push('Clear texture caches')
      suggestions.push('Reduce scene complexity')
    }

    if (memoryInfo) {
      const usedMB = memoryInfo.usedJSHeapSize / (1024 * 1024)
      const totalMB = memoryInfo.totalJSHeapSize / (1024 * 1024)
      const limitMB = memoryInfo.jsHeapSizeLimit / (1024 * 1024)

      if (usedMB > 100) {
        suggestions.push('Memory usage is high (${usedMB.toFixed(1)}MB)')
      }

      if (totalMB > limitMB * 0.8) {
        suggestions.push('Approaching memory limit')
        suggestions.push('Consider reducing application complexity')
      }

      // Check for potential memory leaks
      const growthRate = this.estimateMemoryGrowthRate()
      if (growthRate > 1) { // Growing more than 1MB per minute
        suggestions.push('Potential memory leak detected')
        suggestions.push('Review resource disposal patterns')
      }
    }

    // Browser-specific suggestions
    const userAgent = navigator.userAgent.toLowerCase()
    if (userAgent.includes('chrome')) {
      suggestions.push('Use Chrome DevTools Memory tab for detailed analysis')
    } else if (userAgent.includes('firefox')) {
      suggestions.push('Use Firefox Memory tool for analysis')
    }

    return suggestions
  }

  private estimateMemoryGrowthRate(): number {
    // This is a simplified estimation
    // In a real implementation, you'd track memory usage over time
    const memoryInfo = (performance as any).memory
    if (!memoryInfo) return 0

    // Store memory samples for growth rate calculation
    const now = Date.now()
    const currentUsage = memoryInfo.usedJSHeapSize / (1024 * 1024)
    
    // Get or create memory history
    if (!(window as any).__memoryHistory) {
      (window as any).__memoryHistory = []
    }
    
    const history = (window as any).__memoryHistory as Array<{time: number, usage: number}>
    history.push({ time: now, usage: currentUsage })
    
    // Keep only last 10 minutes of data
    const tenMinutesAgo = now - 10 * 60 * 1000
    const recentHistory: Array<{time: number, usage: number}> = history.filter((entry: {time: number, usage: number}) => entry.time > tenMinutesAgo)
    ;(window as any).__memoryHistory = recentHistory
    
    if (recentHistory.length < 2) return 0
    
    // Calculate growth rate (MB per minute)
    const oldest = recentHistory[0]
    const newest = recentHistory[recentHistory.length - 1]
    const timeDiff = (newest.time - oldest.time) / (1000 * 60) // minutes
    const usageDiff = newest.usage - oldest.usage // MB
    
    return timeDiff > 0 ? usageDiff / timeDiff : 0
  }

  // Get memory statistics
  getMemoryStats() {
    const memoryInfo = (performance as any).memory
    
    if (!memoryInfo) {
      return {
        available: false,
        message: 'Memory API not available in this browser'
      }
    }

    return {
      available: true,
      usedJSHeapSize: Math.round(memoryInfo.usedJSHeapSize / (1024 * 1024)), // MB
      totalJSHeapSize: Math.round(memoryInfo.totalJSHeapSize / (1024 * 1024)), // MB
      jsHeapSizeLimit: Math.round(memoryInfo.jsHeapSizeLimit / (1024 * 1024)), // MB
      usagePercentage: Math.round((memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize) * 100),
      limitPercentage: Math.round((memoryInfo.totalJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100),
      isMemoryPressure: this.isMemoryPressure(),
      growthRate: this.estimateMemoryGrowthRate()
    }
  }

  // Cleanup memory history
  clearMemoryHistory(): void {
    delete (window as any).__memoryHistory
  }
}

// Singleton instance
export const garbageCollector = new GarbageCollector()