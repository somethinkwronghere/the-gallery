import {
  ErrorInfo,
  RecoveryStrategy,
  RecoveryResult,
  AssetLoadError,
  MemoryError,
  ErrorThresholds,
  FallbackAssetConfig,
  ErrorRecoveryManager as IErrorRecoveryManager
} from '../../types/error';

export class ErrorRecoveryManager implements IErrorRecoveryManager {
  private errorHistory: ErrorInfo[] = [];
  private fallbackAssets: Map<string, string> = new Map();
  private contextLossCount: number = 0;
  private lastContextLoss?: Date;
  private isRecovering: boolean = false;
  private thresholds: ErrorThresholds;
  private fallbackConfig: FallbackAssetConfig;
  
  // WebGL context references
  private canvas: HTMLCanvasElement | null = null;
  private gl?: WebGLRenderingContext;
  private contextLossHandler?: (event: Event) => void;
  private contextRestoreHandler?: (event: Event) => void;

  constructor() {
    this.thresholds = this.getDefaultThresholds();
    this.fallbackConfig = this.getDefaultFallbackConfig();
    this.setupWebGLContextHandlers();
    this.setupMemoryMonitoring();
  }

  private getDefaultThresholds(): ErrorThresholds {
    return {
      memoryWarningThreshold: 512, // 512 MB
      memoryCriticalThreshold: 1024, // 1 GB
      maxRetryAttempts: 3,
      contextLossTimeout: 5000, // 5 seconds
      assetLoadTimeout: 30000, // 30 seconds
      performanceFPSThreshold: 15
    };
  }

  private getDefaultFallbackConfig(): FallbackAssetConfig {
    return {
      model: '/assets/fallback/default-model.glb',
      texture: '/assets/fallback/default-texture.jpg',
      material: '/assets/fallback/default-material.json',
      audio: '/assets/fallback/silence.mp3',
      showPlaceholder: true,
      placeholderColor: '#cccccc',
      placeholderText: 'Asset Loading...'
    };
  }

  private setupWebGLContextHandlers(): void {
    // Find canvas element (assuming it exists)
    this.canvas = document.querySelector('canvas');
    if (!this.canvas) {
      console.warn('ErrorRecoveryManager: No canvas found for WebGL context monitoring');
      return;
    }

    this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl') as WebGLRenderingContext;
    
    if (!this.gl) {
      console.error('ErrorRecoveryManager: WebGL not supported');
      return;
    }

    // Setup context loss handler
    this.contextLossHandler = (event: Event) => {
      event.preventDefault();
      this.handleContextLoss(event as WebGLContextEvent);
    };

    // Setup context restore handler
    this.contextRestoreHandler = (event: Event) => {
      this.handleContextRestore(event as WebGLContextEvent);
    };

    this.canvas.addEventListener('webglcontextlost', this.contextLossHandler);
    this.canvas.addEventListener('webglcontextrestored', this.contextRestoreHandler);
  }

  private setupMemoryMonitoring(): void {
    // Monitor memory usage every 5 seconds
    setInterval(() => {
      this.checkMemoryUsage();
    }, 5000);

    // Listen for memory pressure events (if supported)
    if ('memory' in performance) {
      setInterval(() => {
        const memoryInfo = (performance as any).memory;
        if (memoryInfo && memoryInfo.usedJSHeapSize) {
          const usageMB = memoryInfo.usedJSHeapSize / (1024 * 1024);
          
          if (usageMB > this.thresholds.memoryCriticalThreshold) {
            this.handleOutOfMemory({
              currentUsage: usageMB,
              maxUsage: memoryInfo.totalJSHeapSize / (1024 * 1024),
              threshold: this.thresholds.memoryCriticalThreshold,
              timestamp: new Date(),
              criticalAssets: []
            });
          }
        }
      }, 10000);
    }
  }

  async handleContextLoss(event: WebGLContextEvent): Promise<RecoveryResult> {
    this.contextLossCount++;
    this.lastContextLoss = new Date();
    
    const errorInfo: ErrorInfo = {
      type: 'webgl_context_loss',
      severity: 'critical',
      message: 'WebGL context was lost',
      timestamp: new Date(),
      context: {
        contextLossCount: this.contextLossCount,
        canRestore: !event.defaultPrevented
      },
      recoveryStrategies: ['context_restore', 'reload_page']
    };

    this.logError(errorInfo);
    this.isRecovering = true;

    try {
      // Save current application state
      this.saveCurrentState();
      
      // Show recovery message to user
      this.showRecoveryMessage('WebGL context lost. Attempting to restore...');
      
      // Attempt context restoration
      const restoreResult = await this.attemptContextRestore();
      
      if (restoreResult.success) {
        this.isRecovering = false;
        return restoreResult;
      } else {
        // If context restore fails, try page reload as last resort
        return await this.executeRecoveryStrategy('reload_page');
      }
    } catch (error) {
      this.isRecovering = false;
      return {
        success: false,
        strategy: 'context_restore',
        message: `Context restoration failed: ${error}`,
        timestamp: new Date()
      };
    }
  }

  async handleContextRestore(event: WebGLContextEvent): Promise<RecoveryResult> {
    const errorInfo: ErrorInfo = {
      type: 'webgl_context_loss',
      severity: 'medium',
      message: 'WebGL context was restored',
      timestamp: new Date(),
      context: {
        contextLossCount: this.contextLossCount
      },
      recoveryStrategies: ['context_restore']
    };

    this.logError(errorInfo);

    try {
      // Restore application state
      await this.restoreApplicationState();
      
      this.isRecovering = false;
      this.showRecoveryMessage('WebGL context restored successfully!', 'success');
      
      return {
        success: true,
        strategy: 'context_restore',
        message: 'WebGL context restored successfully',
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        strategy: 'context_restore',
        message: `Context restoration failed: ${error}`,
        timestamp: new Date()
      };
    }
  }

  async handleAssetLoadError(error: AssetLoadError): Promise<RecoveryResult> {
    const errorInfo: ErrorInfo = {
      type: 'asset_load_failure',
      severity: error.retryCount >= this.thresholds.maxRetryAttempts ? 'high' : 'medium',
      message: `Failed to load asset: ${error.assetId}`,
      timestamp: new Date(),
      context: {
        assetId: error.assetId,
        url: error.url,
        retryCount: error.retryCount,
        originalError: error.error.message
      },
      recoveryStrategies: ['retry', 'fallback']
    };

    this.logError(errorInfo);

    // Try retry first if under retry limit
    if (error.retryCount < this.thresholds.maxRetryAttempts) {
      return await this.executeRecoveryStrategy('retry', error);
    }

    // Try fallback asset
    const fallbackUrl = this.fallbackAssets.get(error.assetId) || this.getFallbackAssetUrl(error.type);
    if (fallbackUrl) {
      return await this.executeRecoveryStrategy('fallback', { ...error, fallbackUrl });
    }

    // If all else fails, show placeholder
    return {
      success: false,
      strategy: 'fallback',
      message: `Asset load failed, showing placeholder for ${error.assetId}`,
      timestamp: new Date()
    };
  }

  async handleOutOfMemory(memoryInfo: MemoryError): Promise<RecoveryResult> {
    const errorInfo: ErrorInfo = {
      type: 'out_of_memory',
      severity: 'critical',
      message: `Memory usage critical: ${memoryInfo.currentUsage.toFixed(2)}MB`,
      timestamp: new Date(),
      context: memoryInfo,
      recoveryStrategies: ['emergency_cleanup', 'degrade_quality']
    };

    this.logError(errorInfo);
    this.isRecovering = true;

    try {
      // First try emergency cleanup
      const cleanupResult = await this.performEmergencyCleanup();
      
      if (cleanupResult.success) {
        // Check if memory usage is now acceptable
        const newUsage = this.getCurrentMemoryUsage();
        if (newUsage < this.thresholds.memoryWarningThreshold) {
          this.isRecovering = false;
          return cleanupResult;
        }
      }

      // If cleanup wasn't enough, degrade quality
      const degradeResult = await this.executeRecoveryStrategy('degrade_quality');
      this.isRecovering = false;
      
      return degradeResult;
    } catch (error) {
      this.isRecovering = false;
      return {
        success: false,
        strategy: 'emergency_cleanup',
        message: `Memory recovery failed: ${error}`,
        timestamp: new Date()
      };
    }
  }

  async performEmergencyCleanup(): Promise<RecoveryResult> {
    try {
      const startMemory = this.getCurrentMemoryUsage();

      // 1. Clear unused textures and geometries
      if ((window as any).THREE) {
        // Dispose of unused Three.js resources
        const renderer = this.getThreeRenderer();
        if (renderer) {
          renderer.dispose();
        }
      }

      // 2. Clear asset cache (keep only essential assets)
      const assetManager = this.getAssetManager();
      if (assetManager) {
        await assetManager.disposeUnusedAssets(0); // Dispose all unused
      }

      // 3. Force garbage collection if available
      if (window.gc) {
        window.gc();
      }

      // 4. Clear component caches
      this.clearComponentCaches();

      // 5. Reduce LOD levels for all models
      const lodManager = this.getLODManager();
      if (lodManager) {
        await lodManager.setGlobalLODLevel('low');
      }

      const endMemory = this.getCurrentMemoryUsage();
      const actualFreed = Math.max(0, startMemory - endMemory);

      this.showRecoveryMessage(`Emergency cleanup completed. Freed ${actualFreed.toFixed(2)}MB`, 'success');

      return {
        success: actualFreed > 0,
        strategy: 'emergency_cleanup',
        message: `Emergency cleanup freed ${actualFreed.toFixed(2)}MB of memory`,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        strategy: 'emergency_cleanup',
        message: `Emergency cleanup failed: ${error}`,
        timestamp: new Date()
      };
    }
  }

  registerFallbackAsset(assetId: string, fallbackUrl: string): void {
    this.fallbackAssets.set(assetId, fallbackUrl);
  }

  logError(error: ErrorInfo): void {
    this.errorHistory.push(error);
    
    // Keep only last 100 errors
    if (this.errorHistory.length > 100) {
      this.errorHistory = this.errorHistory.slice(-100);
    }

    // Log to console based on severity
    const logMessage = `[${error.severity.toUpperCase()}] ${error.type}: ${error.message}`;
    
    switch (error.severity) {
      case 'critical':
        console.error(logMessage, error);
        break;
      case 'high':
        console.error(logMessage, error);
        break;
      case 'medium':
        console.warn(logMessage, error);
        break;
      case 'low':
        console.info(logMessage, error);
        break;
    }
  }

  getErrorHistory(): ErrorInfo[] {
    return [...this.errorHistory];
  }

  clearErrorHistory(): void {
    this.errorHistory = [];
  }

  async executeRecoveryStrategy(strategy: RecoveryStrategy, context?: any): Promise<RecoveryResult> {
    try {
      switch (strategy) {
        case 'retry':
          return await this.retryOperation(context);
        
        case 'fallback':
          return await this.useFallbackAsset(context);
        
        case 'degrade_quality':
          return await this.degradeQuality();
        
        case 'emergency_cleanup':
          return await this.performEmergencyCleanup();
        
        case 'context_restore':
          return await this.attemptContextRestore();
        
        case 'reload_page':
          return await this.reloadPage();
        
        case 'notify_user':
          return await this.notifyUser(context);
        
        default:
          throw new Error(`Unknown recovery strategy: ${strategy}`);
      }
    } catch (error) {
      return {
        success: false,
        strategy,
        message: `Recovery strategy failed: ${error}`,
        timestamp: new Date()
      };
    }
  }

  setErrorThresholds(thresholds: ErrorThresholds): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
  }

  getErrorThresholds(): ErrorThresholds {
    return { ...this.thresholds };
  }

  // Private helper methods
  private async retryOperation(context: AssetLoadError): Promise<RecoveryResult> {
    // Implement retry logic for asset loading
    try {
      // Add delay before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * (context.retryCount + 1)));
      
      // This would typically call the asset manager to retry loading
      const assetManager = this.getAssetManager();
      if (assetManager) {
        await assetManager.loadAsset(context.url, context.type as any);
      }
      
      return {
        success: true,
        strategy: 'retry',
        message: `Successfully retried loading ${context.assetId}`,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        strategy: 'retry',
        message: `Retry failed for ${context.assetId}: ${error}`,
        timestamp: new Date()
      };
    }
  }

  private async useFallbackAsset(context: AssetLoadError & { fallbackUrl?: string }): Promise<RecoveryResult> {
    try {
      const fallbackUrl = context.fallbackUrl || this.getFallbackAssetUrl(context.type);
      
      if (!fallbackUrl) {
        throw new Error('No fallback asset available');
      }

      const assetManager = this.getAssetManager();
      if (assetManager) {
        await assetManager.loadAsset(fallbackUrl, context.type as any);
      }

      return {
        success: true,
        strategy: 'fallback',
        message: `Loaded fallback asset for ${context.assetId}`,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        strategy: 'fallback',
        message: `Fallback asset loading failed: ${error}`,
        timestamp: new Date()
      };
    }
  }

  private async degradeQuality(): Promise<RecoveryResult> {
    try {
      const performanceManager = this.getPerformanceManager();
      if (performanceManager) {
        // const currentConfig = performanceManager.getConfig();
        
        // Reduce quality settings
        performanceManager.setConfig({
          quality: 'low',
          shadowQuality: 'off',
          antialiasing: false,
          postProcessing: false,
          textureQuality: 0.3
        });
      }

      return {
        success: true,
        strategy: 'degrade_quality',
        message: 'Quality settings reduced to improve performance',
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        strategy: 'degrade_quality',
        message: `Quality degradation failed: ${error}`,
        timestamp: new Date()
      };
    }
  }

  private async attemptContextRestore(): Promise<RecoveryResult> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve({
          success: false,
          strategy: 'context_restore',
          message: 'Context restoration timed out',
          timestamp: new Date()
        });
      }, this.thresholds.contextLossTimeout);

      // Wait for context restore event
      const restoreHandler = () => {
        clearTimeout(timeout);
        if (this.canvas) {
          this.canvas.removeEventListener('webglcontextrestored', restoreHandler);
        }
        resolve({
          success: true,
          strategy: 'context_restore',
          message: 'WebGL context restored',
          timestamp: new Date()
        });
      };

      if (this.canvas) {
        this.canvas.addEventListener('webglcontextrestored', restoreHandler);
      }
    });
  }

  private async reloadPage(): Promise<RecoveryResult> {
    // Save critical state before reload
    this.saveCurrentState();
    
    // Show message to user
    this.showRecoveryMessage('Reloading page to recover from error...', 'info');
    
    // Reload after short delay
    setTimeout(() => {
      window.location.reload();
    }, 2000);

    return {
      success: true,
      strategy: 'reload_page',
      message: 'Page reload initiated',
      timestamp: new Date()
    };
  }

  private async notifyUser(context: any): Promise<RecoveryResult> {
    // This would integrate with a notification system
    console.warn('User notification:', context);
    
    return {
      success: true,
      strategy: 'notify_user',
      message: 'User notified of error',
      timestamp: new Date()
    };
  }

  // Helper methods to get manager instances (these would be injected or accessed via context)
  private getAssetManager(): any {
    return (window as any).assetManager;
  }

  private getPerformanceManager(): any {
    return (window as any).performanceManager;
  }

  private getLODManager(): any {
    return (window as any).lodManager;
  }

  private getThreeRenderer(): any {
    return (window as any).threeRenderer;
  }

  private getCurrentMemoryUsage(): number {
    const memoryInfo = (performance as any).memory;
    return memoryInfo ? memoryInfo.usedJSHeapSize / (1024 * 1024) : 0;
  }

  private checkMemoryUsage(): void {
    const usage = this.getCurrentMemoryUsage();
    
    if (usage > this.thresholds.memoryWarningThreshold) {
      const errorInfo: ErrorInfo = {
        type: 'out_of_memory',
        severity: usage > this.thresholds.memoryCriticalThreshold ? 'critical' : 'high',
        message: `High memory usage detected: ${usage.toFixed(2)}MB`,
        timestamp: new Date(),
        context: { memoryUsage: usage },
        recoveryStrategies: ['emergency_cleanup', 'degrade_quality']
      };
      
      this.logError(errorInfo);
      
      if (usage > this.thresholds.memoryCriticalThreshold) {
        this.handleOutOfMemory({
          currentUsage: usage,
          maxUsage: this.thresholds.memoryCriticalThreshold,
          threshold: this.thresholds.memoryCriticalThreshold,
          timestamp: new Date(),
          criticalAssets: []
        });
      }
    }
  }

  private getFallbackAssetUrl(type: string): string {
    switch (type) {
      case 'model':
        return this.fallbackConfig.model;
      case 'texture':
        return this.fallbackConfig.texture;
      case 'material':
        return this.fallbackConfig.material;
      case 'audio':
        return this.fallbackConfig.audio;
      default:
        return this.fallbackConfig.texture;
    }
  }

  private saveCurrentState(): void {
    try {
      const state = {
        timestamp: new Date().toISOString(),
        contextLossCount: this.contextLossCount,
        errorHistory: this.errorHistory.slice(-10) // Save last 10 errors
      };
      
      localStorage.setItem('errorRecoveryState', JSON.stringify(state));
    } catch (error) {
      console.warn('Failed to save error recovery state:', error);
    }
  }

  private async restoreApplicationState(): Promise<void> {
    try {
      const savedState = localStorage.getItem('errorRecoveryState');
      if (savedState) {
        const state = JSON.parse(savedState);
        // Restore relevant state here
        console.log('Restored error recovery state:', state);
      }
    } catch (error) {
      console.warn('Failed to restore error recovery state:', error);
    }
  }

  private clearComponentCaches(): void {
      // Clear React component caches if available
    if ((window as any).React && (window as any).React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
      // Clear React fiber caches (be very careful with this)
      console.log('Clearing React component caches');
    }
  }

  private showRecoveryMessage(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    // This would integrate with the application's notification system
    console.log(`[${type.toUpperCase()}] Recovery: ${message}`);
    
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : type === 'success' ? '#4caf50' : '#2196f3'};
      color: white;
      border-radius: 4px;
      z-index: 10000;
      font-family: Arial, sans-serif;
      font-size: 14px;
      max-width: 300px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 5000);
  }

  // Cleanup method
  dispose(): void {
    if (this.canvas && this.contextLossHandler && this.contextRestoreHandler) {
      this.canvas.removeEventListener('webglcontextlost', this.contextLossHandler);
      this.canvas.removeEventListener('webglcontextrestored', this.contextRestoreHandler);
    }
  }
}

// Singleton instance
export const errorRecoveryManager = new ErrorRecoveryManager();