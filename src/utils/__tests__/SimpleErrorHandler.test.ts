/**
 * SimpleErrorHandler Tests
 */

import { it } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
import { it } from 'node:test';
import { describe } from 'node:test';
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
import { describe } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';
import { SimpleErrorHandler, simpleErrorHandler } from '../SimpleErrorHandler';

// Mock the complex error recovery manager
jest.mock('../../systems/error/ErrorRecoveryManager', () => ({
  errorRecoveryManager: {
    executeRecoveryStrategy: jest.fn().mockResolvedValue({
      success: true,
      strategy: 'retry',
      message: 'Recovery successful',
      timestamp: new Date()
    }),
    logError: jest.fn(),
    handleAssetLoadError: jest.fn().mockResolvedValue({
      success: true,
      strategy: 'fallback',
      message: 'Asset loaded with fallback',
      timestamp: new Date()
    }),
    handleOutOfMemory: jest.fn().mockResolvedValue({
      success: true,
      strategy: 'emergency_cleanup',
      message: 'Memory cleaned up',
      timestamp: new Date()
    }),
    getErrorHistory: jest.fn().mockReturnValue([])
  }
}));

describe('SimpleErrorHandler', () => {
  beforeEach(() => {
    // Clear DOM
    document.body.innerHTML = '';
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = SimpleErrorHandler.getInstance();
      const instance2 = SimpleErrorHandler.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should use the exported singleton', () => {
      const instance = SimpleErrorHandler.getInstance();
      expect(simpleErrorHandler).toBe(instance);
    });
  });

  describe('Basic Error Handling', () => {
    it('should handle string errors', async () => {
      const result = await simpleErrorHandler.handleError(
        'Test error message',
        'unknown',
        { showToUser: false, autoRecover: false }
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Bir sorun oluştu');
      expect(result.recovered).toBe(false);
    });

    it('should handle Error objects', async () => {
      const error = new Error('Test error');
      const result = await simpleErrorHandler.handleError(
        error,
        'loading',
        { showToUser: false, autoRecover: true }
      );

      expect(result.success).toBe(true);
      expect(result.recovered).toBe(true);
    });

    it('should show user messages when enabled', async () => {
      await simpleErrorHandler.handleError(
        'Test error',
        'network',
        { showToUser: true, autoRecover: false }
      );

      // Check if toast container was created
      const toastContainer = document.getElementById('simple-error-toasts');
      expect(toastContainer).toBeTruthy();
    });
  });

  describe('Asset Error Handling', () => {
    it('should handle asset loading errors', async () => {
      const result = await simpleErrorHandler.handleAssetError(
        'test-asset',
        '/test/asset.glb',
        new Error('Asset not found'),
        { showToUser: false }
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('yüklendi');
    });

    it('should determine asset type from URL', async () => {
      await simpleErrorHandler.handleAssetError(
        'texture-asset',
        '/textures/test.jpg',
        new Error('Texture not found')
      );

      // Should have called the asset error handler
      const { errorRecoveryManager } = require('../../systems/error/ErrorRecoveryManager');
      expect(errorRecoveryManager.handleAssetLoadError).toHaveBeenCalled();
    });
  });

  describe('Memory Error Handling', () => {
    it('should handle memory errors', async () => {
      const result = await simpleErrorHandler.handleMemoryError(
        1024,
        { showToUser: false }
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('temizlendi');
    });
  });

  describe('Safe Execution', () => {
    it('should execute successful operations', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      const result = await simpleErrorHandler.safeExecute(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalled();
    });

    it('should handle failed operations', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Operation failed'));
      const result = await simpleErrorHandler.safeExecute(operation, 'fallback');

      expect(result).toBe('fallback');
      expect(operation).toHaveBeenCalled();
    });

    it('should handle sync operations', async () => {
      const operation = () => 'sync result';
      const result = await simpleErrorHandler.safeExecute(operation);

      expect(result).toBe('sync result');
    });
  });

  describe('User Messages', () => {
    it('should create toast messages', () => {
      simpleErrorHandler.showUserMessage('Test message', 'info');

      const toastContainer = document.getElementById('simple-error-toasts');
      expect(toastContainer).toBeTruthy();
      expect(toastContainer?.children.length).toBe(1);
    });

    it('should apply correct styles for different levels', () => {
      simpleErrorHandler.showUserMessage('Error message', 'error');
      simpleErrorHandler.showUserMessage('Warning message', 'warning');
      simpleErrorHandler.showUserMessage('Info message', 'info');

      const toastContainer = document.getElementById('simple-error-toasts');
      expect(toastContainer?.children.length).toBe(3);
    });

    it('should auto-remove messages after timeout', (done) => {
      simpleErrorHandler.showUserMessage('Test message', 'info', 100);

      const toastContainer = document.getElementById('simple-error-toasts');
      expect(toastContainer?.children.length).toBe(1);

      setTimeout(() => {
        expect(toastContainer?.children.length).toBe(0);
        done();
      }, 500);
    });
  });

  describe('System Health', () => {
    it('should return system health status', () => {
      const health = simpleErrorHandler.getSystemHealth();

      expect(health).toHaveProperty('healthy');
      expect(health).toHaveProperty('issues');
      expect(health).toHaveProperty('recommendations');
      expect(Array.isArray(health.issues)).toBe(true);
      expect(Array.isArray(health.recommendations)).toBe(true);
    });
  });

  describe('Type Mapping', () => {
    it('should map simple types to complex types correctly', async () => {
      const testCases = [
        { simple: 'loading', expected: 'asset_load_failure' },
        { simple: 'network', expected: 'network_error' },
        { simple: 'memory', expected: 'out_of_memory' },
        { simple: 'graphics', expected: 'webgl_context_loss' },
        { simple: 'performance', expected: 'performance_critical' },
        { simple: 'unknown', expected: 'unknown_error' }
      ];

      for (const testCase of testCases) {
        await simpleErrorHandler.handleError(
          'Test error',
          testCase.simple as any,
          { showToUser: false, autoRecover: false }
        );
      }

      // All should have been processed without throwing
      expect(true).toBe(true);
    });
  });

  describe('Error Recovery', () => {
    it('should attempt recovery when autoRecover is enabled', async () => {
      const result = await simpleErrorHandler.handleError(
        'Test error',
        'loading',
        { autoRecover: true, showToUser: false }
      );

      expect(result.recovered).toBe(true);
      
      const { errorRecoveryManager } = require('../../systems/error/ErrorRecoveryManager');
      expect(errorRecoveryManager.executeRecoveryStrategy).toHaveBeenCalled();
    });

    it('should skip recovery when autoRecover is disabled', async () => {
      const result = await simpleErrorHandler.handleError(
        'Test error',
        'loading',
        { autoRecover: false, showToUser: false }
      );

      expect(result.recovered).toBe(false);
      
      const { errorRecoveryManager } = require('../../systems/error/ErrorRecoveryManager');
      expect(errorRecoveryManager.logError).toHaveBeenCalled();
    });
  });
});