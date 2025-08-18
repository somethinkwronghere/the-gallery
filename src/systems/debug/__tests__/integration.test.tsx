import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DebugProvider, useDebug } from '../DebugContext'
import { DebugPanel } from '../../../components/DebugPanel/DebugPanel'
import { Vector3, Euler } from 'three'

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

// Mock performance.memory
Object.defineProperty(performance, 'memory', {
  value: {
    usedJSHeapSize: 50 * 1024 * 1024,
    totalJSHeapSize: 100 * 1024 * 1024,
    jsHeapSizeLimit: 200 * 1024 * 1024
  },
  writable: true
})

// Test component that uses debug context
function TestComponent() {
  const { panelVisible, actions, stats, bookmarks } = useDebug()

  return (
    <div>
      <div data-testid="panel-visible">{panelVisible.toString()}</div>
      <div data-testid="fps">{stats.performance.fps}</div>
      <div data-testid="memory">{stats.memory.heapUsed}</div>
      <div data-testid="bookmarks-count">{bookmarks.length}</div>
      
      <button onClick={() => actions.toggleDebugPanel()}>
        Toggle Panel
      </button>
      <button onClick={() => actions.saveBookmark('Test', new Vector3(1, 2, 3), new Euler(0, 0, 0))}>
        Save Bookmark
      </button>
      <button onClick={() => actions.log('info', 'test', 'Test message')}>
        Log Message
      </button>
      <button onClick={() => actions.clearLogs()}>
        Clear Logs
      </button>
    </div>
  )
}

describe('Debug System Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  test('should provide debug context to components', () => {
    render(
      <DebugProvider>
        <TestComponent />
      </DebugProvider>
    )

    expect(screen.getByTestId('panel-visible')).toHaveTextContent('false')
    expect(screen.getByTestId('fps')).toBeInTheDocument()
    expect(screen.getByTestId('memory')).toBeInTheDocument()
    expect(screen.getByTestId('bookmarks-count')).toHaveTextContent('0')
  })

  test('should toggle debug panel', async () => {
    render(
      <DebugProvider>
        <TestComponent />
      </DebugProvider>
    )

    const toggleButton = screen.getByText('Toggle Panel')
    
    expect(screen.getByTestId('panel-visible')).toHaveTextContent('false')
    
    fireEvent.click(toggleButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('panel-visible')).toHaveTextContent('true')
    })
  })

  test('should save bookmarks', async () => {
    render(
      <DebugProvider>
        <TestComponent />
      </DebugProvider>
    )

    const saveButton = screen.getByText('Save Bookmark')
    
    expect(screen.getByTestId('bookmarks-count')).toHaveTextContent('0')
    
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(screen.getByTestId('bookmarks-count')).toHaveTextContent('1')
    })
  })

  test('should render debug panel with all tabs', () => {
    render(
      <DebugProvider>
        <TestComponent />
        <DebugPanel />
      </DebugProvider>
    )

    // Toggle panel to make it visible
    fireEvent.click(screen.getByText('Toggle Panel'))

    // Check if debug panel is rendered
    expect(screen.getByText('Debug Panel')).toBeInTheDocument()
    
    // Check if all tabs are present
    expect(screen.getByText('Performance')).toBeInTheDocument()
    expect(screen.getByText('Memory')).toBeInTheDocument()
    expect(screen.getByText('Render')).toBeInTheDocument()
    expect(screen.getByText('Visualizations')).toBeInTheDocument()
    expect(screen.getByText('Bookmarks')).toBeInTheDocument()
    expect(screen.getByText('Logs')).toBeInTheDocument()
    expect(screen.getByText('Profiling')).toBeInTheDocument()
  })

  test('should switch between debug panel tabs', async () => {
    render(
      <DebugProvider>
        <TestComponent />
        <DebugPanel />
      </DebugProvider>
    )

    // Toggle panel to make it visible
    fireEvent.click(screen.getByText('Toggle Panel'))

    // Click on Memory tab
    fireEvent.click(screen.getByText('Memory'))
    
    await waitFor(() => {
      expect(screen.getByText('JavaScript Heap')).toBeInTheDocument()
    })

    // Click on Bookmarks tab
    fireEvent.click(screen.getByText('Bookmarks'))
    
    await waitFor(() => {
      expect(screen.getByText('Create Bookmark')).toBeInTheDocument()
    })
  })

  test('should handle logging functionality', async () => {
    render(
      <DebugProvider>
        <TestComponent />
        <DebugPanel />
      </DebugProvider>
    )

    // Toggle panel and go to logs tab
    fireEvent.click(screen.getByText('Toggle Panel'))
    fireEvent.click(screen.getByText('Logs'))

    // Log a message
    fireEvent.click(screen.getByText('Log Message'))

    await waitFor(() => {
      expect(screen.getByText('Test message')).toBeInTheDocument()
    })

    // Clear logs
    fireEvent.click(screen.getByText('Clear Logs'))

    await waitFor(() => {
      expect(screen.queryByText('Test message')).not.toBeInTheDocument()
    })
  })

  test('should handle bookmark management', async () => {
    render(
      <DebugProvider>
        <TestComponent />
        <DebugPanel />
      </DebugProvider>
    )

    // Toggle panel and go to bookmarks tab
    fireEvent.click(screen.getByText('Toggle Panel'))
    fireEvent.click(screen.getByText('Bookmarks'))

    // Save a bookmark
    fireEvent.click(screen.getByText('Save Bookmark'))

    await waitFor(() => {
      expect(screen.getByTestId('bookmarks-count')).toHaveTextContent('1')
    })

    // Check if bookmark appears in the panel
    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument()
    })
  })

  test('should handle visualization controls', async () => {
    render(
      <DebugProvider>
        <TestComponent />
        <DebugPanel />
      </DebugProvider>
    )

    // Toggle panel and go to visualizations tab
    fireEvent.click(screen.getByText('Toggle Panel'))
    fireEvent.click(screen.getByText('Visualizations'))

    await waitFor(() => {
      expect(screen.getByText('Visualization Controls')).toBeInTheDocument()
      expect(screen.getByText('Bounding Boxes')).toBeInTheDocument()
      expect(screen.getByText('Wireframes')).toBeInTheDocument()
    })

    // Test enable all button
    const enableAllButton = screen.getByText('Enable All')
    fireEvent.click(enableAllButton)

    await waitFor(() => {
      // Check if visualizations are enabled (this would depend on the actual implementation)
      expect(screen.getByText('9 / 9')).toBeInTheDocument()
    })
  })

  test('should handle profiling controls', async () => {
    render(
      <DebugProvider>
        <TestComponent />
        <DebugPanel />
      </DebugProvider>
    )

    // Toggle panel and go to profiling tab
    fireEvent.click(screen.getByText('Toggle Panel'))
    fireEvent.click(screen.getByText('Profiling'))

    await waitFor(() => {
      expect(screen.getByText('Profiling Status')).toBeInTheDocument()
    })

    // Enable profiling
    const enableButton = screen.getByText('Enable Profiling')
    fireEvent.click(enableButton)

    await waitFor(() => {
      expect(screen.getByText('Disable Profiling')).toBeInTheDocument()
    })
  })

  test('should handle screenshot functionality', async () => {
    // Mock canvas and toDataURL
    const mockCanvas = {
      toDataURL: jest.fn().mockReturnValue('data:image/png;base64,mock-image-data')
    }
    
    // Mock renderer
    const mockRenderer = {
      domElement: mockCanvas
    }

    render(
      <DebugProvider>
        <TestComponent />
        <DebugPanel />
      </DebugProvider>
    )

    // Toggle panel
    fireEvent.click(screen.getByText('Toggle Panel'))

    // Find and click screenshot button
    const screenshotButton = screen.getByTitle('Take Screenshot')
    fireEvent.click(screenshotButton)

    // Note: In a real test, you would need to mock the debugManager.setRenderer
    // and verify the screenshot functionality
  })

  test('should persist bookmarks to localStorage', async () => {
    render(
      <DebugProvider>
        <TestComponent />
      </DebugProvider>
    )

    // Save a bookmark
    fireEvent.click(screen.getByText('Save Bookmark'))

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'debug_bookmarks',
        expect.stringContaining('Test')
      )
    })
  })

  test('should handle errors gracefully', () => {
    // Mock console.error to avoid noise in test output
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

    // Test with invalid bookmark data
    localStorageMock.getItem.mockReturnValue('invalid-json')

    render(
      <DebugProvider>
        <TestComponent />
      </DebugProvider>
    )

    // Should not crash and should handle the error
    expect(screen.getByTestId('bookmarks-count')).toHaveTextContent('0')

    consoleSpy.mockRestore()
  })

  test('should update stats periodically when panel is visible', async () => {
    jest.useFakeTimers()

    render(
      <DebugProvider>
        <TestComponent />
      </DebugProvider>
    )

    // Toggle panel to make it visible
    fireEvent.click(screen.getByText('Toggle Panel'))

    // Fast-forward time to trigger stats update
    jest.advanceTimersByTime(1000)

    await waitFor(() => {
      // Stats should be updated (exact values depend on mocked data)
      expect(screen.getByTestId('fps')).toBeInTheDocument()
      expect(screen.getByTestId('memory')).toBeInTheDocument()
    })

    jest.useRealTimers()
  })
})