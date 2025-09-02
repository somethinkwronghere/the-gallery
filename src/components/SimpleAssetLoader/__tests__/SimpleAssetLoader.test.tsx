import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import SimpleAssetLoader, { SimpleModelLoader, SimpleTextureLoader, SimpleAudioLoader } from '../SimpleAssetLoader'

// Mock the hooks
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

describe('SimpleAssetLoader', () => {
  it('renders loading state initially', () => {
    render(
      <SimpleAssetLoader url="/test.glb" type="model">
        {(asset, loading, error) => {
          if (loading) return <div>Loading...</div>
          if (error) return <div>Error: {error.message}</div>
          return <div>Loaded: {asset?.name}</div>
        }}
      </SimpleAssetLoader>
    )

    expect(screen.getByText(/Yükleniyor/)).toBeInTheDocument()
  })

  it('renders loaded asset', async () => {
    render(
      <SimpleAssetLoader url="/test.glb" type="model">
        {(asset, loading, error) => {
          if (loading) return <div>Loading...</div>
          if (error) return <div>Error: {error.message}</div>
          return <div>Loaded: {asset?.name}</div>
        }}
      </SimpleAssetLoader>
    )

    await waitFor(() => {
      expect(screen.getByText('Loaded: Test model')).toBeInTheDocument()
    })
  })

  it('renders error state', async () => {
    render(
      <SimpleAssetLoader url="/error.glb" type="model">
        {(asset, loading, error) => {
          if (loading) return <div>Loading...</div>
          if (error) return <div>Error: {error.message}</div>
          return <div>Loaded: {asset?.name}</div>
        }}
      </SimpleAssetLoader>
    )

    await waitFor(() => {
      expect(screen.getByText(/Hata: Load failed/)).toBeInTheDocument()
    })
  })

  it('calls onLoad callback when asset loads', async () => {
    const onLoad = jest.fn()
    
    render(
      <SimpleAssetLoader url="/test.glb" type="model" onLoad={onLoad}>
        {(asset, loading, error) => {
          if (loading) return <div>Loading...</div>
          return <div>Loaded</div>
        }}
      </SimpleAssetLoader>
    )

    await waitFor(() => {
      expect(onLoad).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Test model',
        type: 'model'
      }))
    })
  })

  it('calls onError callback when loading fails', async () => {
    const onError = jest.fn()
    
    render(
      <SimpleAssetLoader url="/error.glb" type="model" onError={onError}>
        {(asset, loading, error) => {
          if (loading) return <div>Loading...</div>
          if (error) return <div>Error</div>
          return <div>Loaded</div>
        }}
      </SimpleAssetLoader>
    )

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.any(Error))
    })
  })
})

describe('Specialized Loaders', () => {
  it('SimpleModelLoader works correctly', async () => {
    render(
      <SimpleModelLoader url="/test.glb">
        {(asset, loading, error) => {
          if (loading) return <div>Loading model...</div>
          return <div>Model loaded: {asset?.name}</div>
        }}
      </SimpleModelLoader>
    )

    await waitFor(() => {
      expect(screen.getByText('Model loaded: Test model')).toBeInTheDocument()
    })
  })

  it('SimpleTextureLoader works correctly', async () => {
    render(
      <SimpleTextureLoader url="/test.jpg">
        {(asset, loading, error) => {
          if (loading) return <div>Loading texture...</div>
          return <div>Texture loaded: {asset?.name}</div>
        }}
      </SimpleTextureLoader>
    )

    await waitFor(() => {
      expect(screen.getByText('Texture loaded: Test texture')).toBeInTheDocument()
    })
  })

  it('SimpleAudioLoader works correctly', async () => {
    render(
      <SimpleAudioLoader url="/test.mp3">
        {(asset, loading, error) => {
          if (loading) return <div>Loading audio...</div>
          return <div>Audio loaded: {asset?.name}</div>
        }}
      </SimpleAudioLoader>
    )

    await waitFor(() => {
      expect(screen.getByText('Audio loaded: Test audio')).toBeInTheDocument()
    })
  })
})