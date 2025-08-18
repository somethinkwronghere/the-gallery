import { useEffect, useRef } from 'react'
import { WebGLRenderer } from 'three'
import { useDebug, useDebugLog, useDebugProfiling } from '../systems/debug/DebugContext'
import { debugManager } from '../systems/debug/DebugManager'

/**
 * Hook for integrating the debug system with Three.js renderer
 */
export function useDebugSystem(renderer?: WebGLRenderer) {
  const { isEnabled, config } = useDebug()
  const rendererRef = useRef<WebGLRenderer | null>(null)

  useEffect(() => {
    if (renderer && renderer !== rendererRef.current) {
      rendererRef.current = renderer
      debugManager.setRenderer(renderer)
    }
  }, [renderer])

  useEffect(() => {
    // Initialize debug system when enabled
    if (isEnabled) {
      debugManager.log('info', 'debug', 'Debug system initialized')
    }
  }, [isEnabled])

  return {
    debugManager,
    isEnabled,
    config
  }
}

/**
 * Hook for debugging Three.js objects with bounding box visualization
 */
export function useDebugVisualization() {
  const { visualizations, actions } = useDebug()
  const log = useDebugLog()

  const inspectObject = (object: any, name?: string) => {
    try {
      const inspection = debugManager.inspectObject(object)
      log.info('debug', `Object inspection: ${name || object.name || 'Unnamed'}`, inspection)
      return inspection
    } catch (error) {
      log.error('debug', 'Failed to inspect object', error)
      return null
    }
  }

  const highlightObject = (object: any, highlight: boolean = true) => {
    try {
      debugManager.highlightObject(object, highlight)
      log.info('debug', `Object ${highlight ? 'highlighted' : 'unhighlighted'}: ${object.name}`)
    } catch (error) {
      log.error('debug', 'Failed to highlight object', error)
    }
  }

  return {
    visualizations,
    inspectObject,
    highlightObject,
    toggleVisualization: actions.toggleVisualization
  }
}

/**
 * Hook for camera bookmarking functionality
 */
export function useDebugBookmarks() {
  const { bookmarks, actions } = useDebug()
  const log = useDebugLog()

  const saveCurrentPosition = (name: string, camera: any, description?: string) => {
    try {
      const bookmark = actions.saveBookmark(
        name,
        camera.position.clone(),
        camera.rotation.clone(),
        description
      )
      log.info('bookmark', `Bookmark saved: ${name}`)
      return bookmark
    } catch (error) {
      log.error('bookmark', 'Failed to save bookmark', error)
      return null
    }
  }

  const loadBookmark = (bookmarkId: string, camera: any) => {
    try {
      const bookmark = debugManager.loadBookmark(bookmarkId)
      if (bookmark && camera) {
        camera.position.copy(bookmark.position)
        camera.rotation.copy(bookmark.rotation)
        log.info('bookmark', `Bookmark loaded: ${bookmark.name}`)
        return true
      }
      return false
    } catch (error) {
      log.error('bookmark', 'Failed to load bookmark', error)
      return false
    }
  }

  return {
    bookmarks,
    saveCurrentPosition,
    loadBookmark,
    deleteBookmark: actions.deleteBookmark
  }
}

/**
 * Hook for performance monitoring and optimization suggestions
 */
export function useDebugPerformance() {
  const { stats, config } = useDebug()
  const log = useDebugLog()
  const { profile, profileAsync } = useDebugProfiling()

  const analyzePerformance = () => {
    const { performance, memory, render } = stats
    const suggestions: string[] = []

    // FPS analysis
    if (performance.fps < 30) {
      suggestions.push('Low FPS detected - Consider reducing scene complexity')
    }

    // Memory analysis
    if (memory.heapUsed > 200) {
      suggestions.push('High memory usage - Consider implementing resource cleanup')
    }

    // Render analysis
    if (render.drawCalls > 500) {
      suggestions.push('High draw calls - Consider batching or instancing')
    }

    if (render.triangles > 100000) {
      suggestions.push('High triangle count - Consider LOD system')
    }

    if (suggestions.length > 0) {
      log.warn('performance', 'Performance issues detected', suggestions)
    } else {
      log.info('performance', 'Performance is optimal')
    }

    return suggestions
  }

  const measureFrameTime = (callback: () => void) => {
    return profile('frame-render', callback)
  }

  const measureAsyncOperation = async (name: string, operation: () => Promise<any>) => {
    return profileAsync(name, operation)
  }

  return {
    stats,
    config,
    analyzePerformance,
    measureFrameTime,
    measureAsyncOperation
  }
}

/**
 * Hook for development tools and utilities
 */
export function useDebugTools() {
  const { actions, config } = useDebug()
  const log = useDebugLog()

  const takeScreenshot = async (filename?: string) => {
    try {
      const dataUrl = await actions.takeScreenshot(filename)
      log.info('debug', `Screenshot taken: ${filename || 'unnamed'}`)
      return dataUrl
    } catch (error) {
      log.error('debug', 'Screenshot failed', error)
      return null
    }
  }

  const exportDebugData = () => {
    try {
      const debugData = {
        config,
        stats: debugManager.getDebugStats(),
        bookmarks: debugManager.getBookmarks(),
        logs: debugManager.getLogs(),
        profilingResults: debugManager.getProfilingResults(),
        timestamp: new Date().toISOString()
      }

      const dataStr = JSON.stringify(debugData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `debug-export-${Date.now()}.json`
      link.click()
      
      URL.revokeObjectURL(url)
      log.info('debug', 'Debug data exported')
      
      return true
    } catch (error) {
      log.error('debug', 'Failed to export debug data', error)
      return false
    }
  }

  const clearAllData = () => {
    try {
      actions.clearLogs()
      debugManager.clearProfilingResults()
      log.info('debug', 'All debug data cleared')
      return true
    } catch (error) {
      log.error('debug', 'Failed to clear debug data', error)
      return false
    }
  }

  return {
    takeScreenshot,
    exportDebugData,
    clearAllData,
    updateConfig: actions.updateConfig
  }
}