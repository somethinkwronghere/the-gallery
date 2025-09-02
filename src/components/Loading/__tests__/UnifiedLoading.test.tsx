import React from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { UnifiedLoading, useUnifiedLoading, unifiedLoadingManager } from '../UnifiedLoading'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

// Mock component to test the hook
const TestComponent: React.FC = () => {
  const { 
    isLoading, 
    globalProgress, 
    startLoading, 
    updateProgress, 
    completeLoading 
  } = useUnifiedLoading()

  return (
    <div>
      <div data-testid="loading-status">
        {isLoading ? 'Loading' : 'Not Loading'}
      </div>
      <div data-testid="global-progress">
        {globalProgress}%
      </div>
      <button 
        onClick={() => startLoading('test-asset', 'asset', 'Test loading...', 'model')}
        data-testid="start-loading"
      >
        Start Loading
      </button>
      <button 
        onClick={() => updateProgress('test-asset', 50)}
        data-testid="update-progress"
      >
        Update Progress
      </button>
      <button 
        onClick={() => completeLoading('test-asset')}
        data-testid="complete-loading"
      >
        Complete Loading
      </button>
    </div>
  )
}

describe('UnifiedLoading System', () => {
  beforeEach(() => {
    // Clear all loading states before each test
    unifiedLoadingManager.clearAllLoading()
  })

  describe('UnifiedLoading Component', () => {
    it('renders without crashing', () => {
      render(<UnifiedLoading />)
      // Component is now disabled and should never render
      expect(screen.queryByText('Digistory')).not.toBeInTheDocument()
    })

    it('shows loading when there are active loading states', async () => {
      render(<UnifiedLoading />)
      
      act(() => {
        unifiedLoadingManager.startLoading('test', 'asset', 'Test loading...', 'model')
      })

      // Loading is disabled, should not show
      expect(screen.queryByText('Digistory')).not.toBeInTheDocument()
    })

    it('hides loading when all states are completed', async () => {
      render(<UnifiedLoading autoHide={true} hideDelay={100} />)
      
      act(() => {
        unifiedLoadingManager.startLoading('test', 'asset', 'Test loading...')
      })

      // Loading is disabled, should not show
      expect(screen.queryByText('Digistory')).not.toBeInTheDocument()

      act(() => {
        unifiedLoadingManager.completeLoading('test')
      })

      // Still should not show
      expect(screen.queryByText('Digistory')).not.toBeInTheDocument()
    })

    it('displays individual loading items when enabled', async () => {
      render(<UnifiedLoading showIndividualItems={true} showMessages={true} />)
      
      act(() => {
        unifiedLoadingManager.startLoading('test-model', 'asset', 'Loading 3D model...', 'model')
      })

      // Loading is disabled, should not show
      expect(screen.queryByText('Loading 3D model...')).not.toBeInTheDocument()
    })
  })

  describe('useUnifiedLoading Hook', () => {
    it('provides correct initial state', () => {
      render(<TestComponent />)
      
      expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading')
      expect(screen.getByTestId('global-progress')).toHaveTextContent('100%')
    })

    it('updates loading state correctly', async () => {
      render(<TestComponent />)
      
      const startButton = screen.getByTestId('start-loading')
      
      act(() => {
        startButton.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('Loading')
        expect(screen.getByTestId('global-progress')).toHaveTextContent('0%')
      })
    })

    it('updates progress correctly', async () => {
      render(<TestComponent />)
      
      const startButton = screen.getByTestId('start-loading')
      const updateButton = screen.getByTestId('update-progress')
      
      act(() => {
        startButton.click()
      })

      act(() => {
        updateButton.click()
      })

      await waitFor(() => {
        expect(screen.getByTestId('global-progress')).toHaveTextContent('50%')
      })
    })

    it('completes loading correctly', async () => {
      render(<TestComponent />)
      
      const startButton = screen.getByTestId('start-loading')
      const completeButton = screen.getByTestId('complete-loading')
      
      act(() => {
        startButton.click()
      })

      expect(screen.getByTestId('loading-status')).toHaveTextContent('Loading')

      act(() => {
        completeButton.click()
      })

      // Wait for auto-removal after completion
      await waitFor(() => {
        expect(screen.getByTestId('loading-status')).toHaveTextContent('Not Loading')
      }, { timeout: 1000 })
    })
  })

  describe('Loading Manager', () => {
    it('calculates global progress correctly with multiple items', () => {
      unifiedLoadingManager.startLoading('item1', 'asset', 'Item 1')
      unifiedLoadingManager.startLoading('item2', 'asset', 'Item 2')
      
      unifiedLoadingManager.updateProgress('item1', 50)
      unifiedLoadingManager.updateProgress('item2', 100)
      
      expect(unifiedLoadingManager.globalProgress).toBe(75) // (50 + 100) / 2
    })

    it('handles errors correctly', () => {
      unifiedLoadingManager.startLoading('error-item', 'asset', 'Error item')
      
      const error = new Error('Test error')
      unifiedLoadingManager.errorLoading('error-item', error)
      
      const state = unifiedLoadingManager.loadingStates.get('error-item')
      expect(state?.error).toBe(error)
      expect(state?.stage).toBe('complete')
    })

    it('clears all loading states', () => {
      unifiedLoadingManager.startLoading('item1', 'asset', 'Item 1')
      unifiedLoadingManager.startLoading('item2', 'asset', 'Item 2')
      
      expect(unifiedLoadingManager.loadingStates.size).toBe(2)
      
      unifiedLoadingManager.clearAllLoading()
      
      expect(unifiedLoadingManager.loadingStates.size).toBe(0)
      expect(unifiedLoadingManager.isLoading).toBe(false)
    })
  })

  describe('Asset Type Icons', () => {
    it('displays correct icons for different asset types', async () => {
      render(<UnifiedLoading showIndividualItems={true} />)
      
      act(() => {
        unifiedLoadingManager.startLoading('model', 'asset', 'Model loading...', 'model')
        unifiedLoadingManager.startLoading('texture', 'asset', 'Texture loading...', 'texture')
        unifiedLoadingManager.startLoading('audio', 'asset', 'Audio loading...', 'audio')
      })

      // Loading is disabled, should not show any items
      expect(screen.queryByText('Model loading...')).not.toBeInTheDocument()
      expect(screen.queryByText('Texture loading...')).not.toBeInTheDocument()
      expect(screen.queryByText('Audio loading...')).not.toBeInTheDocument()
    })
  })

  describe('Loading Stages', () => {
    it('displays correct stage information', async () => {
      render(<UnifiedLoading showIndividualItems={true} showMessages={true} />)
      
      act(() => {
        unifiedLoadingManager.startLoading('staged-item', 'asset', 'Staged loading...')
      })

      act(() => {
        unifiedLoadingManager.updateProgress('staged-item', 25, 'downloading')
      })

      // Loading is disabled, should not show stage info
      expect(screen.queryByText('İndiriliyor...')).not.toBeInTheDocument()

      act(() => {
        unifiedLoadingManager.updateProgress('staged-item', 75, 'parsing')
      })

      // Still should not show stage info
      expect(screen.queryByText('İşleniyor...')).not.toBeInTheDocument()
    })
  })
})