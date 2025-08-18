import { 
  PerformanceLevel, 
  PerformanceConfig, 
  PerformanceMetrics, 
  ResourceMetrics,
  PerformanceManager as IPerformanceManager
} from '../../types/performance';

export class PerformanceManager implements IPerformanceManager {
  private config: PerformanceConfig;
  private metrics: PerformanceMetrics;
  private isAutoOptimizing: boolean = false;
  private frameCount: number = 0;
  private lastTime: number = 0;
  private fpsHistory: number[] = [];
  private performanceLevel: PerformanceLevel = 'medium';
  
  // Performance monitoring
  private rafId: number | null = null;
  private memoryCheckInterval: number | null = null;

  constructor() {
    this.config = this.getDefaultConfig();
    this.metrics = this.getDefaultMetrics();
    this.detectPerformanceLevel();
    this.startMonitoring();
  }

  private getDefaultConfig(): PerformanceConfig {
    return {
      quality: 'medium',
      targetFPS: 60,
      maxDrawCalls: 1000,
      maxTriangles: 100000,
      textureQuality: 1.0,
      shadowQuality: 'medium',
      antialiasing: true,
      postProcessing: true,
      enableLOD: true,
      enableCulling: true,
      enableInstancing: true
    };
  }

  private getDefaultMetrics(): PerformanceMetrics {
    return {
      fps: 0,
      memoryUsage: 0,
      drawCalls: 0,
      triangleCount: 0,
      textureMemory: 0,
      renderTime: 0,
      frameTime: 0
    };
  }

  detectPerformanceLevel(): PerformanceLevel {
    // GPU detection
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    
    if (!gl) {
      this.performanceLevel = 'low';
      return this.performanceLevel;
    }

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    let gpuTier = 'medium';
    
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      
      // High-end GPU patterns
      const highEndPatterns = [
        /RTX\s*(40|30|20)\d{2}/i,
        /GTX\s*(16|10)\d{2}/i,
        /RX\s*(7|6)\d{3}/i,
        /Radeon.*Pro/i,
        /Apple.*M[1-9]/i
      ];
      
      // Low-end GPU patterns
      const lowEndPatterns = [
        /Intel.*HD/i,
        /Intel.*UHD.*[4-6]\d{2}/i,
        /GT\s*[1-9]\d{2}M?/i,
        /MX\s*[1-4]\d{2}/i,
        /Radeon.*R[3-5]/i
      ];

      if (highEndPatterns.some(pattern => pattern.test(renderer))) {
        gpuTier = 'high';
      } else if (lowEndPatterns.some(pattern => pattern.test(renderer))) {
        gpuTier = 'low';
      }
    }

    // Memory detection
    const memoryInfo = (performance as any).memory;
    let memoryTier = 'medium';
    
    if (memoryInfo) {
      const totalMemoryMB = memoryInfo.totalJSHeapSize / (1024 * 1024);
      if (totalMemoryMB > 1000) {
        memoryTier = 'high';
      } else if (totalMemoryMB < 500) {
        memoryTier = 'low';
      }
    }

    // CPU cores detection
    const cores = navigator.hardwareConcurrency || 4;
    let cpuTier = cores >= 8 ? 'high' : cores >= 4 ? 'medium' : 'low';

    // Device type detection
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      cpuTier = cpuTier === 'high' ? 'medium' : 'low';
      memoryTier = memoryTier === 'high' ? 'medium' : 'low';
    }

    // Final performance level calculation
    const tiers = [gpuTier, memoryTier, cpuTier];
    const lowCount = tiers.filter(tier => tier === 'low').length;
    const highCount = tiers.filter(tier => tier === 'high').length;

    if (lowCount >= 2) {
      this.performanceLevel = 'low';
    } else if (highCount >= 2) {
      this.performanceLevel = 'high';
    } else {
      this.performanceLevel = 'medium';
    }

    // Update config based on detected performance
    this.updateConfigForPerformanceLevel();
    
    return this.performanceLevel;
  }

  private updateConfigForPerformanceLevel(): void {
    switch (this.performanceLevel) {
      case 'low':
        this.config = {
          ...this.config,
          quality: 'low',
          targetFPS: 30,
          maxDrawCalls: 500,
          maxTriangles: 50000,
          textureQuality: 0.5,
          shadowQuality: 'off',
          antialiasing: false,
          postProcessing: false
        };
        break;
      case 'high':
        this.config = {
          ...this.config,
          quality: 'high',
          targetFPS: 60,
          maxDrawCalls: 2000,
          maxTriangles: 200000,
          textureQuality: 1.0,
          shadowQuality: 'high',
          antialiasing: true,
          postProcessing: true
        };
        break;
      default: // medium
        this.config = {
          ...this.config,
          quality: 'medium',
          targetFPS: 60,
          maxDrawCalls: 1000,
          maxTriangles: 100000,
          textureQuality: 0.8,
          shadowQuality: 'medium',
          antialiasing: true,
          postProcessing: true
        };
    }
  }

  adjustQuality(targetFPS: number): void {
    const currentFPS = this.metrics.fps;
    const fpsRatio = currentFPS / targetFPS;

    if (fpsRatio < 0.8) {
      // Performance is too low, reduce quality
      this.reduceQuality();
    } else if (fpsRatio > 1.2 && this.performanceLevel !== 'high') {
      // Performance is good, can increase quality
      this.increaseQuality();
    }
  }

  private reduceQuality(): void {
    if (this.config.quality === 'high') {
      this.config.quality = 'medium';
      this.config.shadowQuality = 'medium';
      this.config.textureQuality = 0.8;
    } else if (this.config.quality === 'medium') {
      this.config.quality = 'low';
      this.config.shadowQuality = 'low';
      this.config.textureQuality = 0.5;
      this.config.antialiasing = false;
    } else if (this.config.quality === 'low') {
      this.config.shadowQuality = 'off';
      this.config.postProcessing = false;
      this.config.textureQuality = 0.3;
    }
  }

  private increaseQuality(): void {
    if (this.config.quality === 'low') {
      this.config.quality = 'medium';
      this.config.shadowQuality = 'medium';
      this.config.textureQuality = 0.8;
      this.config.antialiasing = true;
    } else if (this.config.quality === 'medium') {
      this.config.quality = 'high';
      this.config.shadowQuality = 'high';
      this.config.textureQuality = 1.0;
      this.config.postProcessing = true;
    }
  }

  monitorResources(): ResourceMetrics {
    const memoryInfo = (performance as any).memory;
    
    return {
      memoryUsage: memoryInfo ? memoryInfo.usedJSHeapSize / (1024 * 1024) : 0,
      drawCalls: this.metrics.drawCalls,
      triangleCount: this.metrics.triangleCount,
      textureMemory: this.metrics.textureMemory,
      fps: this.metrics.fps,
      activeObjects: 0, // Will be updated by scene manager
      culledObjects: 0  // Will be updated by culling manager
    };
  }

  enableAutoOptimization(enabled: boolean): void {
    this.isAutoOptimizing = enabled;
    
    if (enabled) {
      this.startAutoOptimization();
    } else {
      this.stopAutoOptimization();
    }
  }

  private startAutoOptimization(): void {
    // Auto optimization will run every 2 seconds
    setInterval(() => {
      if (this.isAutoOptimizing) {
        this.adjustQuality(this.config.targetFPS);
      }
    }, 2000);
  }

  private stopAutoOptimization(): void {
    this.isAutoOptimizing = false;
  }

  private startMonitoring(): void {
    // FPS monitoring
    const updateFPS = (currentTime: number) => {
      this.frameCount++;
      
      if (currentTime - this.lastTime >= 1000) {
        const fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
        this.metrics.fps = fps;
        
        // Keep FPS history for smoothing
        this.fpsHistory.push(fps);
        if (this.fpsHistory.length > 10) {
          this.fpsHistory.shift();
        }
        
        // Calculate average FPS
        const avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
        this.metrics.fps = Math.round(avgFPS);
        
        this.frameCount = 0;
        this.lastTime = currentTime;
      }
      
      this.rafId = requestAnimationFrame(updateFPS);
    };
    
    this.rafId = requestAnimationFrame(updateFPS);
    
    // Memory monitoring
    this.memoryCheckInterval = window.setInterval(() => {
      const memoryInfo = (performance as any).memory;
      if (memoryInfo) {
        this.metrics.memoryUsage = memoryInfo.usedJSHeapSize / (1024 * 1024);
      }
    }, 1000);
  }

  setConfig(config: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  resetMetrics(): void {
    this.metrics = this.getDefaultMetrics();
    this.fpsHistory = [];
    this.frameCount = 0;
    this.lastTime = 0;
  }

  // Update metrics from external sources (Three.js renderer info)
  updateRenderMetrics(drawCalls: number, triangleCount: number, renderTime: number): void {
    this.metrics.drawCalls = drawCalls;
    this.metrics.triangleCount = triangleCount;
    this.metrics.renderTime = renderTime;
    this.metrics.frameTime = performance.now() - this.lastTime;
  }

  // Cleanup
  dispose(): void {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }
  }
}

// Singleton instance
export const performanceManager = new PerformanceManager();