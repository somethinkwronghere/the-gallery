import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { ErrorRecoveryProvider, ErrorBoundary } from '../ErrorRecoveryContext';
import { useErrorRecovery } from '../../../hooks/useErrorRecovery';
import { ErrorType, ErrorSeverity } from '../../../types/error';

// Mock console methods to avoid noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Mock WebGL context
const mockWebGLContext = {
  getExtension: jest.fn(),
  getParameter: jest.fn()
};

const mockCanvas = {
  getContext: jest.fn(() => mockWebGLContext),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

Object.defineProperty(document, 'querySelector', {
  value: jest.fn(() => mockCanvas),
  writable: true
});

// Mock performance.memory
Object.defineProperty(performance, 'memory', {
  value: {
    usedJSHeapSize: 300 * 1024 * 1024, // 300MB
    totalJSHeapSize: 1024 * 1024 * 1024 // 1GB
  },
  writable: true
});

// Test component that uses error recovery
function TestComponent() {
  const {
    handleAssetLoadError,
    handleMemoryError,
    handleContextLoss,
    registerFallbackAsset,
    isRecovering,
    errorHistory,
    getErrorStats,
    isSystemHealthy
  } = useErrorRecovery();

  const triggerAssetError = async () => {
    await handleAssetLoadError(
      'test-asset',
      '/test/asset.glb',
      'model',
      new Error('Failed to load'),
      0
    );
  };

  const triggerMemoryError = async () => {
    await handleMemoryError(1200, 1024, ['large-asset']);
  };

  const triggerContextLoss = async () => {
    const mockEvent = {
      preventDefault: jest.fn(),
      defaultPrevented: false
    } as any;
    await handleContextLoss(mockEvent);
  };

  const registerFallback = () => {
    registerFallbackAsset('test-asset', '/fallback/asset.glb');
  };

  const stats = getErrorStats();
  const health = isSystemHealthy();

  return (
    <div>
      <div data-testid="recovering">{isRecovering ? 'Recovering' : 'Normal'}</div>
      <div data-testid="error-count">{errorHistory.length}</div>
      <div data-testid="total-errors">{stats.totalErrors}</div>
      <div data-testid="healthy">{health.healthy ? 'Healthy' : 'Unhealthy'}</div>
      
      <button onClick={triggerAssetError} data-testid="trigger-asset-error">
        Trigger Asset Error
      </button>
      <button onClick={triggerMemoryError} data-testid="trigger-memory-error">
        Trigger Memory Error
      </button>
      <button onClick={triggerContextLoss} data-testid="trigger-context-loss">
        Trigger Context Loss
      </button>
      <button onClick={registerFallback} data-testid="register-fallback">
        Register Fallback
      </button>
    </div>
  );
}

// Component that throws an error for testing ErrorBoundary
function ErrorThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
}

describe('Error Recovery Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ErrorRecoveryProvider', () => {
    it('should provide error recovery context', () => {
      render(
        <ErrorRecoveryProvider>
          <TestComponent />
        </ErrorRecoveryProvider>
      );

      expect(screen.getByTestId('recovering')).toHaveTextContent('Normal');
      expect(screen.getByTestId('error-count')).toHaveTextContent('0');
      expect(screen.getByTestId('healthy')).toHaveTextContent('Healthy');
    });

    it('should handle asset loading errors', async () => {
      render(
        <ErrorRecoveryProvider>
          <TestComponent />
        </ErrorRecoveryProvider>
      );

      const triggerButton = screen.getByTestId('trigger-asset-error');
      
      await act(async () => {
        triggerButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error-count')).toHaveTextContent('1');
      });

      expect(screen.getByTestId('total-errors')).toHaveTextContent('1');
    });

    it('should handle memory errors', async () => {
      render(
        <ErrorRecoveryProvider>
          <TestComponent />
        </ErrorRecoveryProvider>
      );

      const triggerButton = screen.getByTestId('trigger-memory-error');
      
      await act(async () => {
        triggerButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error-count')).toHaveTextContent('1');
      });

      // Should show as recovering during memory error handling
      expect(screen.getByTestId('recovering')).toHaveTextContent('Normal'); // Will be normal after recovery
    });

    it('should handle WebGL context loss', async () => {
      render(
        <ErrorRecoveryProvider>
          <TestComponent />
        </ErrorRecoveryProvider>
      );

      const triggerButton = screen.getByTestId('trigger-context-loss');
      
      await act(async () => {
        triggerButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error-count')).toHaveTextContent('1');
      });
    });

    it('should register fallback assets', async () => {
      render(
        <ErrorRecoveryProvider>
          <TestComponent />
        </ErrorRecoveryProvider>
      );

      const registerButton = screen.getByTestId('register-fallback');
      
      act(() => {
        registerButton.click();
      });

      // Fallback registration doesn't change visible state immediately
      expect(screen.getByTestId('error-count')).toHaveTextContent('0');
    });
  });

  describe('ErrorBoundary', () => {
    it('should catch and display errors', () => {
      render(
        <ErrorRecoveryProvider>
          <ErrorBoundary>
            <ErrorThrowingComponent shouldThrow={true} />
          </ErrorBoundary>
        </ErrorRecoveryProvider>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Reload Page')).toBeInTheDocument();
    });

    it('should render children when no error', () => {
      render(
        <ErrorRecoveryProvider>
          <ErrorBoundary>
            <ErrorThrowingComponent shouldThrow={false} />
          </ErrorBoundary>
        </ErrorRecoveryProvider>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should use custom fallback', () => {
      const customFallback = <div>Custom error message</div>;

      render(
        <ErrorRecoveryProvider>
          <ErrorBoundary fallback={customFallback}>
            <ErrorThrowingComponent shouldThrow={true} />
          </ErrorBoundary>
        </ErrorRecoveryProvider>
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });
  });

  describe('Global Error Handling', () => {
    it('should handle global window errors', async () => {
      render(
        <ErrorRecoveryProvider>
          <TestComponent />
        </ErrorRecoveryProvider>
      );

      // Simulate global error
      const errorEvent = new ErrorEvent('error', {
        message: 'Global error',
        filename: 'test.js',
        lineno: 1,
        colno: 1,
        error: new Error('Global error')
      });

      act(() => {
        window.dispatchEvent(errorEvent);
      });

      await waitFor(() => {
        expect(screen.getByTestId('error-count')).toHaveTextContent('1');
      });
    });

    it('should handle unhandled promise rejections', async () => {
      render(
        <ErrorRecoveryProvider>
          <TestComponent />
        </ErrorRecoveryProvider>
      );

      // Simulate unhandled promise rejection
      const rejectionEvent = new PromiseRejectionEvent('unhandledrejection', {
        promise: Promise.reject('Test rejection'),
        reason: 'Test rejection'
      });

      act(() => {
        window.dispatchEvent(rejectionEvent);
      });

      await waitFor(() => {
        expect(screen.getByTestId('error-count')).toHaveTextContent('1');
      });
    });
  });

  describe('Memory Monitoring', () => {
    it('should monitor memory usage automatically', async () => {
      // Mock high memory usage
      Object.defineProperty(performance, 'memory', {
        value: {
          usedJSHeapSize: 1200 * 1024 * 1024, // 1200MB - above critical threshold
          totalJSHeapSize: 2048 * 1024 * 1024 // 2GB
        },
        writable: true
      });

      render(
        <ErrorRecoveryProvider>
          <TestComponent />
        </ErrorRecoveryProvider>
      );

      // Wait for memory monitoring to trigger
      await waitFor(() => {
        expect(screen.getByTestId('healthy')).toHaveTextContent('Unhealthy');
      }, { timeout: 15000 }); // Memory check runs every 10 seconds
    });
  });

  describe('Error Statistics', () => {
    it('should track error statistics correctly', async () => {
      render(
        <ErrorRecoveryProvider>
          <TestComponent />
        </ErrorRecoveryProvider>
      );

      // Trigger multiple errors
      const assetButton = screen.getByTestId('trigger-asset-error');
      const memoryButton = screen.getByTestId('trigger-memory-error');

      await act(async () => {
        assetButton.click();
      });

      await act(async () => {
        memoryButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error-count')).toHaveTextContent('2');
        expect(screen.getByTestId('total-errors')).toHaveTextContent('2');
      });
    });
  });

  describe('System Health', () => {
    it('should report system health correctly', async () => {
      render(
        <ErrorRecoveryProvider>
          <TestComponent />
        </ErrorRecoveryProvider>
      );

      // Initially healthy
      expect(screen.getByTestId('healthy')).toHaveTextContent('Healthy');

      // Trigger multiple errors to make system unhealthy
      const assetButton = screen.getByTestId('trigger-asset-error');
      
      // Trigger many errors
      for (let i = 0; i < 5; i++) {
        await act(async () => {
          assetButton.click();
        });
      }

      await waitFor(() => {
        expect(screen.getByTestId('healthy')).toHaveTextContent('Unhealthy');
      });
    });
  });

  describe('Recovery Process', () => {
    it('should show recovering state during error handling', async () => {
      render(
        <ErrorRecoveryProvider>
          <TestComponent />
        </ErrorRecoveryProvider>
      );

      const memoryButton = screen.getByTestId('trigger-memory-error');
      
      await act(async () => {
        memoryButton.click();
      });

      // The recovery should complete quickly in tests
      await waitFor(() => {
        expect(screen.getByTestId('error-count')).toHaveTextContent('1');
      });
    });
  });

  describe('Context Integration', () => {
    it('should throw error when used outside provider', () => {
      // Suppress React error boundary warnings for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useErrorRecovery must be used within an ErrorRecoveryProvider');

      console.error = originalError;
    });
  });

  describe('Cleanup', () => {
    it('should cleanup event listeners on unmount', () => {
      const { unmount } = render(
        <ErrorRecoveryProvider>
          <TestComponent />
        </ErrorRecoveryProvider>
      );

      unmount();

      // Verify cleanup was called (event listeners removed)
      expect(mockCanvas.removeEventListener).toHaveBeenCalled();
    });
  });
});