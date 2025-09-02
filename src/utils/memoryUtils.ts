import { simpleMemoryManager, SimpleMemoryStats } from './SimpleMemoryManager'

/**
 * Get current memory usage in MB
 */
export const getMemoryUsage = (): number => {
  const stats = simpleMemoryManager.getMemoryStats()
  return stats.totalMemoryMB
}

/**
 * Get detailed memory statistics
 */
export const getDetailedMemoryStats = (): SimpleMemoryStats => {
  return simpleMemoryManager.getMemoryStats()
}

/**
 * Perform memory cleanup
 */
export const performMemoryCleanup = (): void => {
  simpleMemoryManager.performCleanup()
}

/**
 * Check if system is under memory pressure
 */
export const isMemoryPressure = (): boolean => {
  const stats = simpleMemoryManager.getMemoryStats()
  return stats.isMemoryPressure
}

/**
 * Get memory usage as percentage (0-100)
 */
export const getMemoryUsagePercentage = (): number => {
  const stats = simpleMemoryManager.getMemoryStats()
  const config = simpleMemoryManager.getConfig()
  return Math.min(100, (stats.totalMemoryMB / config.memoryThresholdMB) * 100)
}

/**
 * Force emergency cleanup
 */
export const forceEmergencyCleanup = (): void => {
  simpleMemoryManager.performEmergencyCleanup()
}