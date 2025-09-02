import { renderHook, waitFor } from '@testing-library/react'
import { useSimpleAssetLoader, useSimpleBatchLoader } from '../../../hooks/useSimpleAssetLoader'

// Mock the dependencies
jest.mock('../../../hooks/useAssetManager', () => ({
  useAssetManager: () => ({
    loadAsset: jest.fn().mockImplementation((url, type) => {
      if (url.includes('error')) {
        return Promise.reject(new Error('Load failed'))
      }
      return Promise.resolve({
        id: 'test-asset',
        name: `Test ${type}`,
        type,
        url,
        data: {}
      })
    })
  })
}))

jest.mock('../../../hooks/useSimpleErrorHandler', () => ({
  useSimpleErrorHandler: () => ({
    handleError: jest.fn()
  })
}))

describe('useSimpleAssetLoader', () => {
  it('loads asset successfully', async () => {
    const { result } = renderHook(() => 
      useSimpleAssetLoader('/test.glb', 'model')
    )

    // Initially loading
    expect(result.current.loading).toBe(true)
    expect(result.current.asset).toBe(null)
    expect(result.current.error).toBe(null)

    // Wait for load to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.asset).toEqual(expect.objectContaining({
      name: 'Test model',
      type: 'model'
    }))
    expect(result.current.error).toBe(null)
  })

  it('handles loading errors', async () => {
    const { result } = renderHook(() => 
      useSimpleAssetLoader('/error.glb', 'model')
    )

    // Wait for error
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.asset).toBe(null)
    expect(result.current.error).toEqual(expect.any(Error))
  })

  it('calls callbacks correctly', async () => {
    const onLoad = jest.fn()
    const onError = jest.fn()

    const { result } = renderHook(() => 
      useSimpleAssetLoader('/test.glb', 'model', { onLoad, onError })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(onLoad).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Test model'
    }))
    expect(onError).not.toHaveBeenCalled()
  })

  it('supports fallback URL', async () => {
    const { result } = renderHook(() => 
      useSimpleAssetLoader('/error.glb', 'model', { 
        fallbackUrl: '/fallback.glb' 
      })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should load fallback successfully
    expect(result.current.asset).toEqual(expect.objectContaining({
      name: 'Test model'
    }))
    expect(result.current.error).toBe(null)
  })

  it('reload function works', async () => {
    const { result } = renderHook(() => 
      useSimpleAssetLoader('/test.glb', 'model')
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Trigger reload
    result.current.reload()

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.asset).toBeTruthy()
  })
})

describe('useSimpleBatchLoader', () => {
  it('loads multiple assets', async () => {
    const assets = [
      { id: 'model1', url: '/test1.glb', type: 'model' as const },
      { id: 'texture1', url: '/test1.jpg', type: 'texture' as const }
    ]

    const { result } = renderHook(() => 
      useSimpleBatchLoader(assets)
    )

    // Initially loading
    expect(result.current.loading).toBe(true)
    expect(result.current.assets.size).toBe(0)

    // Wait for load to complete
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.assets.size).toBe(2)
    expect(result.current.errors.size).toBe(0)
    expect(result.current.progress.percentage).toBe(100)
  })

  it('handles mixed success and errors', async () => {
    const assets = [
      { id: 'model1', url: '/test1.glb', type: 'model' as const },
      { id: 'error1', url: '/error.jpg', type: 'texture' as const }
    ]

    const { result } = renderHook(() => 
      useSimpleBatchLoader(assets)
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.assets.size).toBe(1)
    expect(result.current.errors.size).toBe(1)
  })

  it('calls batch callbacks', async () => {
    const onBatchComplete = jest.fn()
    const onBatchError = jest.fn()

    const assets = [
      { id: 'model1', url: '/test1.glb', type: 'model' as const }
    ]

    const { result } = renderHook(() => 
      useSimpleBatchLoader(assets, { onBatchComplete, onBatchError })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(onBatchComplete).toHaveBeenCalledWith(expect.any(Map))
    expect(onBatchError).not.toHaveBeenCalled()
  })
})