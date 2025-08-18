import { DebugManager } from '../DebugManager'
import { Vector3, Euler, Object3D, BufferGeometry, MeshBasicMaterial, Mesh } from 'three'

// Mock performance.memory
Object.defineProperty(performance, 'memory', {
  value: {
    usedJSHeapSize: 50 * 1024 * 1024, // 50MB
    totalJSHeapSize: 100 * 1024 * 1024, // 100MB
    jsHeapSizeLimit: 200 * 1024 * 1024 // 200MB
  },
  writable: true
})

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock console methods
const consoleMock = {
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}
Object.defineProperty(console, 'log', { value: consoleMock.log })
Object.defineProperty(console, 'info', { value: consoleMock.info })
Object.defineProperty(console, 'warn', { value: consoleMock.warn })
Object.defineProperty(console, 'error', { value: consoleMock.error })
Object.defineProperty(console, 'debug', { value: consoleMock.debug })

describe('DebugManager', () => {
  let debugManager: DebugManager

  beforeEach(() => {
    debugManager = new DebugManager()
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    debugManager.dispose()
  })

  describe('Debug Panel Control', () => {
    test('should show and hide debug panel', () => {
      expect(debugManager.isDebugPanelVisible()).toBe(false)
      
      debugManager.showDebugPanel(true)
      expect(debugManager.isDebugPanelVisible()).toBe(true)
      
      debugManager.showDebugPanel(false)
      expect(debugManager.isDebugPanelVisible()).toBe(false)
    })
  })

  describe('Performance Metrics', () => {
    test('should return performance metrics', () => {
      const metrics = debugManager.getPerformanceMetrics()
      
      expect(metrics).toHaveProperty('fps')
      expect(metrics).toHaveProperty('memoryUsage')
      expect(metrics).toHaveProperty('drawCalls')
      expect(metrics).toHaveProperty('triangleCount')
      expect(metrics).toHaveProperty('gpuMemory')
      expect(metrics).toHaveProperty('cpuUsage')
      expect(metrics).toHaveProperty('renderCalls')
      expect(metrics).toHaveProperty('shaderCompilations')
      expect(metrics).toHaveProperty('textureUploads')
      expect(metrics).toHaveProperty('bufferUploads')
    })

    test('should return memory info', () => {
      const memoryInfo = debugManager.getMemoryInfo()
      
      expect(memoryInfo).toHaveProperty('heapUsed')
      expect(memoryInfo).toHaveProperty('heapTotal')
      expect(memoryInfo).toHaveProperty('geometries')
      expect(memoryInfo).toHaveProperty('textures')
      expect(memoryInfo).toHaveProperty('materials')
      expect(memoryInfo).toHaveProperty('objects')
      
      expect(memoryInfo.heapUsed).toBeGreaterThan(0)
      expect(memoryInfo.heapTotal).toBeGreaterThan(0)
    })

    test('should return render info', () => {
      const renderInfo = debugManager.getRenderInfo()
      
      expect(renderInfo).toHaveProperty('drawCalls')
      expect(renderInfo).toHaveProperty('triangles')
      expect(renderInfo).toHaveProperty('points')
      expect(renderInfo).toHaveProperty('lines')
      expect(renderInfo).toHaveProperty('programs')
      expect(renderInfo).toHaveProperty('geometries')
      expect(renderInfo).toHaveProperty('textures')
    })
  })

  describe('Visualization Controls', () => {
    test('should toggle bounding boxes', () => {
      const initialOptions = debugManager.getVisualizationOptions()
      expect(initialOptions.boundingBoxes).toBe(false)
      
      debugManager.showBoundingBoxes(true)
      const updatedOptions = debugManager.getVisualizationOptions()
      expect(updatedOptions.boundingBoxes).toBe(true)
    })

    test('should toggle wireframes', () => {
      debugManager.showWireframes(true)
      const options = debugManager.getVisualizationOptions()
      expect(options.wireframes).toBe(true)
    })

    test('should toggle normals', () => {
      debugManager.showNormals(true)
      const options = debugManager.getVisualizationOptions()
      expect(options.normals).toBe(true)
    })

    test('should toggle colliders', () => {
      debugManager.showColliders(true)
      const options = debugManager.getVisualizationOptions()
      expect(options.colliders).toBe(true)
    })

    test('should set multiple visualization options', () => {
      debugManager.setVisualizationOptions({
        boundingBoxes: true,
        wireframes: true,
        normals: false
      })
      
      const options = debugManager.getVisualizationOptions()
      expect(options.boundingBoxes).toBe(true)
      expect(options.wireframes).toBe(true)
      expect(options.normals).toBe(false)
    })
  })

  describe('Camera Bookmarks', () => {
    test('should save and load bookmarks', () => {
      const position = new Vector3(1, 2, 3)
      const rotation = new Euler(0.1, 0.2, 0.3)
      
      const bookmark = debugManager.saveBookmark('Test Bookmark', position, rotation, 'Test description')
      
      expect(bookmark.name).toBe('Test Bookmark')
      expect(bookmark.description).toBe('Test description')
      expect(bookmark.position).toEqual(position)
      expect(bookmark.rotation).toEqual(rotation)
      expect(bookmark.id).toBeDefined()
      expect(bookmark.createdAt).toBeInstanceOf(Date)
      
      const loadedBookmark = debugManager.loadBookmark(bookmark.id)
      expect(loadedBookmark).toEqual(bookmark)
    })

    test('should delete bookmarks', () => {
      const position = new Vector3(1, 2, 3)
      const rotation = new Euler(0.1, 0.2, 0.3)
      
      const bookmark = debugManager.saveBookmark('Test Bookmark', position, rotation)
      expect(debugManager.getBookmarks()).toHaveLength(1)
      
      const deleted = debugManager.deleteBookmark(bookmark.id)
      expect(deleted).toBe(true)
      expect(debugManager.getBookmarks()).toHaveLength(0)
    })

    test('should return null for non-existent bookmark', () => {
      const bookmark = debugManager.loadBookmark('non-existent-id')
      expect(bookmark).toBeNull()
    })

    test('should return false when deleting non-existent bookmark', () => {
      const deleted = debugManager.deleteBookmark('non-existent-id')
      expect(deleted).toBe(false)
    })

    test('should get all bookmarks', () => {
      const position1 = new Vector3(1, 2, 3)
      const position2 = new Vector3(4, 5, 6)
      const rotation = new Euler(0, 0, 0)
      
      debugManager.saveBookmark('Bookmark 1', position1, rotation)
      debugManager.saveBookmark('Bookmark 2', position2, rotation)
      
      const bookmarks = debugManager.getBookmarks()
      expect(bookmarks).toHaveLength(2)
      expect(bookmarks[0].name).toBe('Bookmark 1')
      expect(bookmarks[1].name).toBe('Bookmark 2')
    })
  })

  describe('Logging', () => {
    test('should log messages', () => {
      debugManager.log('info', 'test', 'Test message', { data: 'test' })
      
      const logs = debugManager.getLogs()
      expect(logs).toHaveLength(1)
      
      const log = logs[0]
      expect(log.level).toBe('info')
      expect(log.category).toBe('test')
      expect(log.message).toBe('Test message')
      expect(log.data).toEqual({ data: 'test' })
      expect(log.timestamp).toBeInstanceOf(Date)
      expect(log.id).toBeDefined()
    })

    test('should filter logs by level', () => {
      debugManager.log('debug', 'test', 'Debug message')
      debugManager.log('info', 'test', 'Info message')
      debugManager.log('warn', 'test', 'Warning message')
      debugManager.log('error', 'test', 'Error message')
      
      const errorLogs = debugManager.getLogs('error')
      expect(errorLogs).toHaveLength(1)
      expect(errorLogs[0].level).toBe('error')
      
      const warnLogs = debugManager.getLogs('warn')
      expect(warnLogs).toHaveLength(1)
      expect(warnLogs[0].level).toBe('warn')
    })

    test('should filter logs by category', () => {
      debugManager.log('info', 'category1', 'Message 1')
      debugManager.log('info', 'category2', 'Message 2')
      debugManager.log('info', 'category1', 'Message 3')
      
      const category1Logs = debugManager.getLogs(undefined, 'category1')
      expect(category1Logs).toHaveLength(2)
      
      const category2Logs = debugManager.getLogs(undefined, 'category2')
      expect(category2Logs).toHaveLength(1)
    })

    test('should clear logs', () => {
      debugManager.log('info', 'test', 'Test message')
      expect(debugManager.getLogs()).toHaveLength(1)
      
      debugManager.clearLogs()
      expect(debugManager.getLogs()).toHaveLength(0)
    })

    test('should respect log level configuration', () => {
      debugManager.setConfig({ logLevel: 'warn' })
      
      debugManager.log('debug', 'test', 'Debug message')
      debugManager.log('info', 'test', 'Info message')
      debugManager.log('warn', 'test', 'Warning message')
      debugManager.log('error', 'test', 'Error message')
      
      const logs = debugManager.getLogs()
      expect(logs).toHaveLength(2) // Only warn and error should be logged
      expect(logs[0].level).toBe('warn')
      expect(logs[1].level).toBe('error')
    })
  })

  describe('Object Inspection', () => {
    test('should inspect Three.js objects', () => {
      const geometry = new BufferGeometry()
      const material = new MeshBasicMaterial()
      const mesh = new Mesh(geometry, material)
      mesh.name = 'Test Mesh'
      mesh.position.set(1, 2, 3)
      mesh.rotation.set(0.1, 0.2, 0.3)
      mesh.scale.set(2, 2, 2)
      
      const inspection = debugManager.inspectObject(mesh)
      
      expect(inspection.name).toBe('Test Mesh')
      expect(inspection.type).toBe('Mesh')
      expect(inspection.position).toEqual(new Vector3(1, 2, 3))
      expect(inspection.rotation).toEqual(new Euler(0.1, 0.2, 0.3))
      expect(inspection.scale).toEqual(new Vector3(2, 2, 2))
      expect(inspection.visible).toBe(true)
      expect(inspection.boundingBox).toBeDefined()
      expect(inspection.childCount).toBe(0)
      expect(inspection.properties).toBeDefined()
    })
  })

  describe('Performance Profiling', () => {
    test('should profile function execution', () => {
      debugManager.setConfig({ enableProfiling: true })
      
      debugManager.startProfiling('test-function')
      // Simulate some work
      const endTime = debugManager.endProfiling('test-function')
      
      expect(endTime).toBeGreaterThanOrEqual(0)
      
      const results = debugManager.getProfilingResults()
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('test-function')
      expect(results[0].duration).toBeGreaterThanOrEqual(0)
      expect(results[0].callCount).toBe(1)
    })

    test('should not profile when disabled', () => {
      debugManager.setConfig({ enableProfiling: false })
      
      debugManager.startProfiling('test-function')
      const endTime = debugManager.endProfiling('test-function')
      
      expect(endTime).toBe(0)
      expect(debugManager.getProfilingResults()).toHaveLength(0)
    })

    test('should track multiple calls to same function', () => {
      debugManager.setConfig({ enableProfiling: true })
      
      debugManager.startProfiling('test-function')
      debugManager.endProfiling('test-function')
      
      debugManager.startProfiling('test-function')
      debugManager.endProfiling('test-function')
      
      const results = debugManager.getProfilingResults()
      expect(results).toHaveLength(1)
      expect(results[0].callCount).toBe(2)
    })

    test('should clear profiling results', () => {
      debugManager.setConfig({ enableProfiling: true })
      
      debugManager.startProfiling('test-function')
      debugManager.endProfiling('test-function')
      
      expect(debugManager.getProfilingResults()).toHaveLength(1)
      
      debugManager.clearProfilingResults()
      expect(debugManager.getProfilingResults()).toHaveLength(0)
    })
  })

  describe('Configuration', () => {
    test('should update configuration', () => {
      const newConfig = {
        logLevel: 'error' as const,
        maxLogEntries: 500,
        enableProfiling: true
      }
      
      debugManager.setConfig(newConfig)
      const config = debugManager.getConfig()
      
      expect(config.logLevel).toBe('error')
      expect(config.maxLogEntries).toBe(500)
      expect(config.enableProfiling).toBe(true)
    })

    test('should get debug stats', () => {
      const stats = debugManager.getDebugStats()
      
      expect(stats).toHaveProperty('performance')
      expect(stats).toHaveProperty('memory')
      expect(stats).toHaveProperty('render')
      expect(stats).toHaveProperty('timestamp')
      expect(stats.timestamp).toBeInstanceOf(Date)
    })
  })

  describe('Cleanup', () => {
    test('should dispose properly', () => {
      debugManager.log('info', 'test', 'Test message')
      debugManager.saveBookmark('Test', new Vector3(), new Euler())
      
      expect(debugManager.getLogs()).toHaveLength(1)
      expect(debugManager.getBookmarks()).toHaveLength(1)
      
      debugManager.dispose()
      
      // After disposal, the manager should still function but may have cleared some data
      expect(() => debugManager.getDebugStats()).not.toThrow()
    })
  })
})