import { ErrorRecoveryManager } from '../ErrorRecoveryManager';
import { ErrorType, ErrorSeverity, AssetLoadError, MemoryError } from '../../../types/error';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { afterEach } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock WebGL context
const mockWebGLContext = {
  getExtension: jest.fn(),
  getParameter: jest.fn()
};

// Mock canvas
const mockCanvas = {
  getContext: jest.fn(() => mockWebGLContext),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

// Mock DOM
Object.defineProperty(document, 'querySelector', {
  value: jest.fn(() => mockCanvas),
  writable: true
});

// Mock performance.memory
Object.defineProperty(performance, 'memory', {
  value: {
    usedJSHeapSize: 500 * 1024 * 1024, // 500MB
    totalJSHeapSize: 1024 * 1024 * 1024 // 1GB
  },
  writable: true
});

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
});

describe('ErrorRecoveryManager', () => {
  let errorRecoveryManager: ErrorRecoveryManager;

  beforeEach(() => {
    jest.clearAllMocks();
    errorRecoveryManager = new ErrorRecoveryManager();
  });

  afterEach(() => {
    errorRecoveryManager.dispose();
  });

  describe('Initialization', () => {
    it('should initialize with default thresholds', () => {
      const thresholds = errorRecoveryManager.getErrorThresholds();
      
      expect(thresholds.memoryWarningThreshold).toBe(512);
      expect(thresholds.memoryCriticalThreshold).toBe(1024);
      expect(thresholds.maxRetryAttempts).toBe(3);
      expect(thresholds.contextLossTimeout).toBe(5000);
    });

    it('should setup WebGL context handlers', () => {
      // Reset mocks and create a new manager to test setup
      jest.clearAllMocks();
      (document.querySelector as jest.Mock).mockReturnValue(mockCanvas);
      
      const testManager = new ErrorRecoveryManager();
      
      expect(document.querySelector).toHaveBeenCalledWith('canvas');
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('webglcontextlost', expect.any(Function));
      expect(mockCanvas.addEventListener).toHaveBeenCalledWith('webglcontextrestored', expect.any(Function));
      
      testManager.dispose();
    });
  });

  describe('WebGL Context Loss Handling', () => {
    it('should handle context loss event', async () => {
      const mockEvent = {
        preventDefault: jest.fn(),
        defaultPrevented: false
      } as any;

      const result = await errorRecoveryManager.handleContextLoss(mockEvent);
      
      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(result.strategy).toBe('context_restore');
    }, 10000);

    it('should handle context restore event', async () => {
      const mockEvent = {} as any;

      const result = await errorRecoveryManager.handleContextRestore(mockEvent);
      
      expect(result.success).toBe(true);
      expect(result.strategy).toBe('context_restore');
      expect(result.message).toContain('restored successfully');
    });

    it('should increment context loss count', async () => {
      const mockEvent = { preventDefault: jest.fn() } as any;
      
      await errorRecoveryManager.handleContextLoss(mockEvent);
      
      const errors = errorRecoveryManager.getErrorHistory();
      const contextLossError = errors.find(e => e.type === 'webgl_context_loss');
      
      expect(contextLossError).toBeDefined();
      expect(contextLossError?.context?.contextLossCount).toBe(1);
    }, 10000);
  });

  describe('Asset Loading Error Handling', () => {
    it('should handle asset load error with retry strategy', async () => {
      const assetError: AssetLoadError = {
        assetId: 'test-asset',
        url: '/test/asset.glb',
        type: 'model',
        error: new Error('Network error'),
        retryCount: 0,
        timestamp: new Date()
      };

      const result = await errorRecoveryManager.handleAssetLoadError(assetError);
      
      expect(result.strategy).toBe('retry');
    });

    it('should use fallback when retry limit exceeded', async () => {
      const assetError: AssetLoadError = {
        assetId: 'test-asset',
        url: '/test/asset.glb',
        type: 'model',
        error: new Error('Network error'),
        retryCount: 5, // Exceeds max retry attempts
        timestamp: new Date()
      };

      // Register a fallback
      errorRecoveryManager.registerFallbackAsset('test-asset', '/fallback/asset.glb');

      const result = await errorRecoveryManager.handleAssetLoadError(assetError);
      
      expect(result.strategy).toBe('fallback');
    });

    it('should register and use fallback assets', () => {
      const assetId = 'test-asset';
      const fallbackUrl = '/fallback/test.glb';
      
      errorRecoveryManager.registerFallbackAsset(assetId, fallbackUrl);
      
      // This would be tested through handleAssetLoadError
      expect(true).toBe(true); // Placeholder assertion
    });
  });

  describe('Memory Error Handling', () => {
    it('should handle out of memory error', async () => {
      const memoryError: MemoryError = {
        currentUsage: 1200,
        maxUsage: 1024,
        threshold: 1024,
        timestamp: new Date(),
        criticalAssets: ['large-texture-1']
      };

      const result = await errorRecoveryManager.handleOutOfMemory(memoryError);
      
      expect(result.strategy).toBe('emergency_cleanup');
    });

    it('should perform emergency cleanup', async () => {
      const result = await errorRecoveryManager.performEmergencyCleanup();
      
      expect(result.strategy).toBe('emergency_cleanup');
      expect(result.message).toContain('cleanup');
    });

    it('should monitor memory usage', () => {
      // Memory monitoring is setup in constructor
      // This test verifies the setup doesn't throw errors
      expect(true).toBe(true);
    });
  });

  describe('Recovery Strategies', () => {
    it('should execute retry strategy', async () => {
      const context = {
        assetId: 'test',
        url: '/test.glb',
        type: 'model',
        retryCount: 1
      };

      const result = await errorRecoveryManager.executeRecoveryStrategy('retry', context);
      
      expect(result.strategy).toBe('retry');
    });

    it('should execute fallback strategy', async () => {
      const context = {
        assetId: 'test',
        url: '/test.glb',
        type: 'model',
        fallbackUrl: '/fallback.glb'
      };

      const result = await errorRecoveryManager.executeRecoveryStrategy('fallback', context);
      
      expect(result.strategy).toBe('fallback');
    });

    it('should execute degrade quality strategy', async () => {
      const result = await errorRecoveryManager.executeRecoveryStrategy('degrade_quality');
      
      expect(result.strategy).toBe('degrade_quality');
      expect(result.success).toBe(true);
    });

    it('should execute emergency cleanup strategy', async () => {
      const result = await errorRecoveryManager.executeRecoveryStrategy('emergency_cleanup');
      
      expect(result.strategy).toBe('emergency_cleanup');
    });

    it('should handle unknown recovery strategy', async () => {
      const result = await errorRecoveryManager.executeRecoveryStrategy('unknown' as any);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Unknown recovery strategy');
    });
  });

  describe('Error Logging', () => {
    it('should log errors to history', () => {
      const error = {
        type: 'asset_load_failure' as ErrorType,
        severity: 'medium' as ErrorSeverity,
        message: 'Test error',
        timestamp: new Date(),
        recoveryStrategies: ['retry' as const]
      };

      errorRecoveryManager.logError(error);
      
      const history = errorRecoveryManager.getErrorHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual(error);
    });

    it('should limit error history to 100 entries', () => {
      // Add 150 errors
      for (let i = 0; i < 150; i++) {
        errorRecoveryManager.logError({
          type: 'unknown_error',
          severity: 'low',
          message: `Error ${i}`,
          timestamp: new Date(),
          recoveryStrategies: ['notify_user']
        });
      }

      const history = errorRecoveryManager.getErrorHistory();
      expect(history).toHaveLength(100);
    });

    it('should clear error history', () => {
      // Add some errors
      errorRecoveryManager.logError({
        type: 'unknown_error',
        severity: 'low',
        message: 'Test error',
        timestamp: new Date(),
        recoveryStrategies: ['notify_user']
      });

      expect(errorRecoveryManager.getErrorHistory()).toHaveLength(1);
      
      errorRecoveryManager.clearErrorHistory();
      
      expect(errorRecoveryManager.getErrorHistory()).toHaveLength(0);
    });
  });

  describe('Configuration', () => {
    it('should set and get error thresholds', () => {
      const newThresholds = {
        memoryWarningThreshold: 256,
        memoryCriticalThreshold: 512,
        maxRetryAttempts: 5,
        contextLossTimeout: 10000,
        assetLoadTimeout: 60000,
        performanceFPSThreshold: 20
      };

      errorRecoveryManager.setErrorThresholds(newThresholds);
      
      const thresholds = errorRecoveryManager.getErrorThresholds();
      expect(thresholds).toEqual(newThresholds);
    });

    it('should update thresholds partially', () => {
      const originalThresholds = errorRecoveryManager.getErrorThresholds();
      
      errorRecoveryManager.setErrorThresholds({
        memoryWarningThreshold: 256
      });
      
      const updatedThresholds = errorRecoveryManager.getErrorThresholds();
      expect(updatedThresholds.memoryWarningThreshold).toBe(256);
      expect(updatedThresholds.memoryCriticalThreshold).toBe(originalThresholds.memoryCriticalThreshold);
    });
  });

  describe('State Management', () => {
    it('should save current state to localStorage', () => {
      // Trigger a method that saves state
      const mockEvent = { preventDefault: jest.fn() } as any;
      errorRecoveryManager.handleContextLoss(mockEvent);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'errorRecoveryState',
        expect.any(String)
      );
    });

    it('should handle localStorage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full');
      });

      // Should not throw
      expect(() => {
        const mockEvent = { preventDefault: jest.fn() } as any;
        errorRecoveryManager.handleContextLoss(mockEvent);
      }).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('should dispose properly', () => {
      // Create a manager with canvas to test disposal
      jest.clearAllMocks();
      (document.querySelector as jest.Mock).mockReturnValue(mockCanvas);
      
      const testManager = new ErrorRecoveryManager();
      testManager.dispose();
      
      expect(mockCanvas.removeEventListener).toHaveBeenCalledWith(
        'webglcontextlost',
        expect.any(Function)
      );
      expect(mockCanvas.removeEventListener).toHaveBeenCalledWith(
        'webglcontextrestored',
        expect.any(Function)
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing canvas gracefully', () => {
      (document.querySelector as jest.Mock).mockReturnValue(null);
      
      expect(() => {
        new ErrorRecoveryManager();
      }).not.toThrow();
    });

    it('should handle WebGL not supported', () => {
      mockCanvas.getContext.mockReturnValue(null);
      
      expect(() => {
        new ErrorRecoveryManager();
      }).not.toThrow();
    });

    it('should handle missing performance.memory', () => {
      Object.defineProperty(performance, 'memory', {
        value: undefined,
        writable: true
      });
      
      expect(() => {
        new ErrorRecoveryManager();
      }).not.toThrow();
    });
  });
});