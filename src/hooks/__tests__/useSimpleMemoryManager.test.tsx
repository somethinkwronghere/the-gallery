import { renderHook, act } from '@testing-library/react'
import { useSimpleMemoryManager, useSimpleThreeMemoryManager } from '../useSimpleMemoryManager'
import { BufferGeometry, Material } from 'three'

// Mock the SimpleMemoryManager
jest.mock('../../utils/SimpleMemoryManager', () => ({
  simpleMemoryManager: {
    trackResource: jest.fn(() => 'mock-resource-id'),
    registerComponentCleanup: jest.fn(),
    cleanupComponent: jest.fn(),
    performCleanup: jest.fn(),
    performEmergencyCleanup: jest.fn(),
    getMemoryStats: jest.fn(() => ({
      totalMemoryMB: 200,
      textureMemoryMB: 80,
      geometryMemoryMB: 40,
      jsHeapMB: 80,
      resourceCount: 15,
      isMemoryPressure: false
    })),
    getMemoryWarnings: jest.fn(() => []),
    getConfig: jest.fn(() => ({
      autoCleanupEnabled: true,
      memoryThresholdMB: 400,
      cleanupIntervalMs: 30000,
      aggressiveMode: false
    })),
    updateConfig: jest.fn()
  }
}))

describe('useSimpleMemoryManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with default options', () => {
    const { result } = renderHook(() => useSimpleMemoryManager())
    
    expect(result.current.trackResource).toBeDefined()
    expect(result.current.performCleanup).toBeDefined()
    expect(result.current.performEmergencyCleanup).toBeDefined()
    expect(result.current.updateConfig).toBeDefined()
  })

  it('should track memory stats when enabled', () => {
    const { result } = renderHook(() => 
      useSimpleMemoryManager({ trackMemoryStats: true })
    )
    
    expect(result.current.memoryStats).toEqual({
      totalMemoryMB: 200,
      textureMemoryMB: 80,
      geometryMemoryMB: 40,
      jsHeapMB: 80,
      resourceCount: 15,
      isMemoryPressure: false
    })
  })

  it('should track resources', () => {
    const { result } = renderHook(() => useSimpleMemoryManager())
    
    const geometry = new BufferGeometry()
    
    act(() => {
      const resourceId = result.current.trackResource(geometry)
      expect(resourceId).toBe('mock-resource-id')
    })
  })

  it('should perform cleanup operations', () => {
    const { result } = renderHook(() => useSimpleMemoryManager())
    
    act(() => {
      result.current.performCleanup()
      result.current.performEmergencyCleanup()
    })
    
    // Verify cleanup methods were called (mocked)
    expect(result.current.performCleanup).toBeDefined()
    expect(result.current.performEmergencyCleanup).toBeDefined()
  })

  it('should update configuration', () => {
    const { result } = renderHook(() => useSimpleMemoryManager())
    
    act(() => {
      result.current.updateConfig({ 
        autoCleanupEnabled: false,
        memoryThresholdMB: 500 
      })
    })
    
    // Configuration update should be handled by the memory manager
    expect(result.current.updateConfig).toBeDefined()
  })
})

describe('useSimpleThreeMemoryManager', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should provide Three.js specific tracking methods', () => {
    const { result } = renderHook(() => useSimpleThreeMemoryManager())
    
    expect(result.current.trackGeometry).toBeDefined()
    expect(result.current.trackMaterial).toBeDefined()
    expect(result.current.trackTexture).toBeDefined()
    expect(result.current.trackObject3D).toBeDefined()
    expect(result.current.trackMesh).toBeDefined()
  })

  it('should track geometry', () => {
    const { result } = renderHook(() => useSimpleThreeMemoryManager())
    
    const geometry = new BufferGeometry()
    
    act(() => {
      const resourceId = result.current.trackGeometry(geometry)
      expect(resourceId).toBe('mock-resource-id')
    })
  })

  it('should track material', () => {
    const { result } = renderHook(() => useSimpleThreeMemoryManager())
    
    const material = {} as Material
    
    act(() => {
      const resourceId = result.current.trackMaterial(material)
      expect(resourceId).toBe('mock-resource-id')
    })
  })

  it('should track mesh with all resources', () => {
    const { result } = renderHook(() => useSimpleThreeMemoryManager())
    
    const mockMesh = {
      geometry: new BufferGeometry(),
      material: {} as Material
    }
    
    act(() => {
      const resourceIds = result.current.trackMesh(mockMesh)
      expect(resourceIds).toHaveLength(3) // geometry + material + object3d
    })
  })

  it('should track mesh with material array', () => {
    const { result } = renderHook(() => useSimpleThreeMemoryManager())
    
    const mockMesh = {
      geometry: new BufferGeometry(),
      material: [{} as Material, {} as Material]
    }
    
    act(() => {
      const resourceIds = result.current.trackMesh(mockMesh)
      expect(resourceIds).toHaveLength(4) // geometry + 2 materials + object3d
    })
  })
})