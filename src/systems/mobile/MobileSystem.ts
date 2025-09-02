/**
 * Mobile System Manager
 * Handles all mobile-specific optimizations, controls, and adaptations
 */

import { 
  MobileConfiguration, 
  MobileSystemState, 
  MobilePerformanceMetrics,
  MobileOptimizationStrategy,
  MobileEvents
  // UseMobileResult - not used in this file
} from '../../types/mobile';
import { getDeviceInfo, getOptimalSettings, DeviceInfo } from '../../utils/deviceDetection';

class MobileSystemManager {
  private state: MobileSystemState;
  private eventListeners: Map<keyof MobileEvents, Set<Function>> = new Map();
  private performanceMonitorInterval?: number;
  private batteryMonitorInterval?: number;
  private orientationSupported: boolean = false;

  constructor() {
    this.state = this.initializeState();
    this.setupEventListeners();
    this.startMonitoring();
  }

  private initializeState(): MobileSystemState {
    const deviceInfo = getDeviceInfo();
    const optimalSettings = getOptimalSettings(deviceInfo);
    
    return {
      initialized: false,
      active: deviceInfo.isMobile || deviceInfo.isTablet || deviceInfo.isTouchDevice,
      
      config: {
        deviceInfo,
        maxFrameRate: deviceInfo.isMobile ? 40 : 60,
        targetFrameRate: deviceInfo.isMobile ? 40 : 60,
        adaptiveQuality: true,
        renderScale: deviceInfo.isMobile ? 0.6 : 0.9, // More aggressive scaling on mobile for FPS
        maxLights: optimalSettings.maxLights,
        shadowQuality: optimalSettings.shadowQuality as any,
        antialiasing: optimalSettings.antialiasing,
        maxTextureSize: deviceInfo.isMobile ? 1024 : 2048,
        maxGeometryComplexity: deviceInfo.isMobile ? 10000 : 50000,
        enableLOD: true,
        enableBatteryOptimization: deviceInfo.isMobile,
        lowBatteryThreshold: 20,
        enablePreloading: !deviceInfo.isMobile,
        maxConcurrentLoads: deviceInfo.isMobile ? 2 : 4
      },
      
      controls: {
        movement: { forward: 0, backward: 0, left: 0, right: 0, speed: 1 },
        camera: { pitch: 0, yaw: 0, sensitivity: 0.5 },
        actions: { jump: false, interact: false, menu: false, back: false },
        ui: { 
          showControls: deviceInfo.isTouchDevice, 
          showHUD: true, 
          showMenu: false,
          orientation: deviceInfo.isLandscape ? 'landscape' : 'portrait'
        }
      },
      
      ui: {
        controlsVisible: deviceInfo.isTouchDevice,
        hudVisible: true,
        menuVisible: false,
        loadingVisible: false,
        lastInteraction: Date.now(),
        autoHideDelay: 5000,
        screenSize: { width: window.innerWidth, height: window.innerHeight },
        safeArea: this.getSafeAreaInsets(),
        orientation: deviceInfo.isLandscape ? 'landscape' : 'portrait',
        highContrast: window.matchMedia('(prefers-contrast: high)').matches,
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        fontSize: 'medium'
      },
      
      metrics: this.initializeMetrics(),
      optimization: this.getOptimizationStrategy(deviceInfo),
      
      features: {
        fullscreen: !!document.documentElement.requestFullscreen,
        orientation: 'orientation' in window || 'onorientationchange' in window,
        vibration: 'vibrate' in navigator,
        gamepad: 'getGamepads' in navigator,
        webxr: 'xr' in navigator,
        webgl2: this.checkWebGL2Support(),
        offscreenCanvas: 'OffscreenCanvas' in window
      }
    };
  }

  private initializeMetrics(): MobilePerformanceMetrics {
    const memory = (performance as any).memory;
    
    return {
      fps: 60,
      frameTime: 16.67,
      usedJSHeapSize: memory?.usedJSHeapSize || 0,
      totalJSHeapSize: memory?.totalJSHeapSize || 0,
      jsHeapSizeLimit: memory?.jsHeapSizeLimit || 0,
      batteryLevel: undefined,
      batteryCharging: undefined,
      thermalState: undefined,
      connectionType: (navigator as any).connection?.type,
      effectiveType: (navigator as any).connection?.effectiveType,
      downlink: (navigator as any).connection?.downlink,
      rtt: (navigator as any).connection?.rtt
    };
  }

  private getOptimizationStrategy(deviceInfo: DeviceInfo): MobileOptimizationStrategy {
    const performance = deviceInfo.performance;
    
    if (deviceInfo.isMobile) {
      return {
        qualityLevel: performance === 'high' ? 'medium' : 'low', // More balanced quality for mobile
        enableFrustumCulling: true,
        enableOcclusionCulling: true,
        enableInstancing: true,
        enableBatching: true,
        lodBias: 1.5, // Less aggressive LOD
        maxLODLevel: 3, // More LOD levels for smoother transitions
        lodDistanceMultiplier: 0.7, // Smoother LOD transitions
        textureCompression: true,
        mipmapGeneration: performance !== 'low', // Enable on decent mobile devices
        anisotropicFiltering: performance === 'high' ? 2 : 0,
        enableParticles: performance === 'high',
        enablePostProcessing: false,
        enableReflections: false,
        enableSSAO: false,
        physicsUpdateRate: 30, // Higher physics rate for smoother movement
        animationUpdateRate: 30, // Higher animation rate for smoother animations
        cullingUpdateRate: 15 // Less aggressive culling
      };
    }
    
    if (deviceInfo.isTablet) {
      return {
        qualityLevel: performance === 'high' ? 'high' : 'medium',
        enableFrustumCulling: true,
        enableOcclusionCulling: true,
        enableInstancing: true,
        enableBatching: true,
        lodBias: 1.0,
        maxLODLevel: 4,
        lodDistanceMultiplier: 1.0,
        textureCompression: performance !== 'high',
        mipmapGeneration: true,
        anisotropicFiltering: performance === 'high' ? 4 : 2,
        enableParticles: performance === 'high',
        enablePostProcessing: performance === 'high',
        enableReflections: performance === 'high',
        enableSSAO: false,
        physicsUpdateRate: 60,
        animationUpdateRate: 60,
        cullingUpdateRate: 30
      };
    }
    
    // Desktop fallback
    return {
      qualityLevel: 'high',
      enableFrustumCulling: true,
      enableOcclusionCulling: true,
      enableInstancing: true,
      enableBatching: false,
      lodBias: 0.5,
      maxLODLevel: 5,
      lodDistanceMultiplier: 1.2,
      textureCompression: false,
      mipmapGeneration: true,
      anisotropicFiltering: 8,
      enableParticles: true,
      enablePostProcessing: true,
      enableReflections: true,
      enableSSAO: true,
      physicsUpdateRate: 60,
      animationUpdateRate: 60,
      cullingUpdateRate: 60
    };
  }

  private getSafeAreaInsets() {
    const root = document.documentElement;
    const style = getComputedStyle(root);
    
    return {
      top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
      right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0'),
      bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
      left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0')
    };
  }

  private checkWebGL2Support(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl2') || canvas.getContext('experimental-webgl2'));
    } catch {
      return false;
    }
  }

  private setupEventListeners(): void {
    // Orientation change
    const handleOrientationChange = () => {
      setTimeout(() => {
        const deviceInfo = getDeviceInfo();
        this.updateConfig({ deviceInfo });
        this.updateUI({
          orientation: deviceInfo.isLandscape ? 'landscape' : 'portrait',
          screenSize: { width: window.innerWidth, height: window.innerHeight },
          safeArea: this.getSafeAreaInsets()
        });
        this.emit('orientationChange', deviceInfo.isLandscape ? 'landscape' : 'portrait');
      }, 100);
    };

    // Resize
    const handleResize = () => {
      this.updateUI({
        screenSize: { width: window.innerWidth, height: window.innerHeight },
        safeArea: this.getSafeAreaInsets()
      });
    };

    // Visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        this.pauseMonitoring();
      } else {
        this.resumeMonitoring();
      }
    };

    // Network change
    const handleNetworkChange = () => {
      const connection = (navigator as any).connection;
      if (connection) {
        this.updateMetrics({
          connectionType: connection.type,
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        });
        this.emit('connectionChange', connection.type, connection.effectiveType);
      }
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    if ((navigator as any).connection) {
      (navigator as any).connection.addEventListener('change', handleNetworkChange);
    }

    // Device motion (if supported)
    if ('DeviceMotionEvent' in window) {
      window.addEventListener('devicemotion', (event) => {
        const acceleration = event.acceleration;
        if (acceleration) {
          this.emit('deviceMotion', {
            x: acceleration.x || 0,
            y: acceleration.y || 0,
            z: acceleration.z || 0
          });
        }
      });
    }
  }

  private startMonitoring(): void {
    // Performance monitoring
    this.performanceMonitorInterval = window.setInterval(() => {
      this.updatePerformanceMetrics();
    }, 1000);

    // Battery monitoring
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBattery = () => {
          this.updateMetrics({
            batteryLevel: Math.round(battery.level * 100),
            batteryCharging: battery.charging
          });
          this.emit('batteryChange', battery.level * 100, battery.charging);
          
          // Trigger low battery optimizations
          if (battery.level < this.state.config.lowBatteryThreshold / 100) {
            this.enableLowBatteryMode();
          }
        };
        
        updateBattery();
        
        // Safe event listener attachment
        if (battery && typeof battery.addEventListener === 'function') {
          battery.addEventListener('levelchange', updateBattery);
          battery.addEventListener('chargingchange', updateBattery);
        } else if (battery) {
          // Fallback for older browsers
          battery.onlevelchange = updateBattery;
          battery.onchargingchange = updateBattery;
        }
      }).catch((error: any) => {
        console.warn('Battery API not supported or failed:', error);
      });
    }
  }

  private pauseMonitoring(): void {
    if (this.performanceMonitorInterval) {
      clearInterval(this.performanceMonitorInterval);
      this.performanceMonitorInterval = undefined;
    }
  }

  private resumeMonitoring(): void {
    if (!this.performanceMonitorInterval) {
      this.startMonitoring();
    }
  }

  private updatePerformanceMetrics(): void {
    const memory = (performance as any).memory;
    
    // Simple FPS calculation
    const now = performance.now();
    const fps = 1000 / (now - (this.lastFrameTime || now));
    this.lastFrameTime = now;

    const metrics: Partial<MobilePerformanceMetrics> = {
      fps: Math.min(60, Math.max(1, fps)),
      frameTime: 1000 / fps,
      usedJSHeapSize: memory?.usedJSHeapSize || 0,
      totalJSHeapSize: memory?.totalJSHeapSize || 0,
      jsHeapSizeLimit: memory?.jsHeapSizeLimit || 0
    };

    this.updateMetrics(metrics);

    // Trigger performance warnings
    if (metrics.fps! < 20) {
      this.emit('performanceWarning', { ...this.state.metrics, ...metrics });
    }

    // Auto-adjust quality if adaptive is enabled
    if (this.state.config.adaptiveQuality) {
      this.autoAdjustQuality(metrics.fps!);
    }
  }

  private lastFrameTime?: number;

  private enableLowBatteryMode(): void {
    this.updateOptimization({
      qualityLevel: 'ultra-low',
      enableParticles: false,
      enablePostProcessing: false,
      enableReflections: false,
      enableSSAO: false,
      physicsUpdateRate: 15,
      animationUpdateRate: 15,
      cullingUpdateRate: 10
    });

    this.updateConfig({
      maxFrameRate: 20,
      targetFrameRate: 20,
      renderScale: 0.5
    });
  }

  private autoAdjustQuality(currentFPS: number): void {
    const targetFPS = this.state.config.targetFrameRate;
    const threshold = targetFPS * 0.8;
    
    if (currentFPS < threshold) {
      // Decrease quality
      const currentLevel = this.state.optimization.qualityLevel;
      if (currentLevel === 'high') {
        this.updateOptimization({ qualityLevel: 'medium' });
      } else if (currentLevel === 'medium') {
        this.updateOptimization({ qualityLevel: 'low' });
      } else if (currentLevel === 'low') {
        this.updateOptimization({ qualityLevel: 'ultra-low' });
      }
    } else if (currentFPS > targetFPS * 1.2) {
      // Increase quality (gradually)
      const currentLevel = this.state.optimization.qualityLevel;
      if (currentLevel === 'ultra-low') {
        this.updateOptimization({ qualityLevel: 'low' });
      } else if (currentLevel === 'low' && this.state.config.deviceInfo.performance !== 'low') {
        this.updateOptimization({ qualityLevel: 'medium' });
      }
    }
  }

  // Public API
  public getState(): MobileSystemState {
    return { ...this.state };
  }

  public updateConfig(config: Partial<MobileConfiguration>): void {
    this.state.config = { ...this.state.config, ...config };
  }

  public updateUI(ui: Partial<MobileSystemState['ui']>): void {
    this.state.ui = { ...this.state.ui, ...ui };
  }

  public updateMetrics(metrics: Partial<MobilePerformanceMetrics>): void {
    this.state.metrics = { ...this.state.metrics, ...metrics };
  }

  public updateOptimization(optimization: Partial<MobileOptimizationStrategy>): void {
    this.state.optimization = { ...this.state.optimization, ...optimization };
  }

  public toggleControls(): void {
    const visible = !this.state.ui.controlsVisible;
    this.updateUI({ controlsVisible: visible });
    this.emit('controlsToggle', visible);
  }

  public toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  public setQuality(level: MobileOptimizationStrategy['qualityLevel']): void {
    this.updateOptimization({ qualityLevel: level });
    this.emit('qualityChange', level);
  }

  public resetSettings(): void {
    const deviceInfo = getDeviceInfo();
    this.state.config = { ...this.initializeState().config, deviceInfo };
    this.state.optimization = this.getOptimizationStrategy(deviceInfo);
  }

  // Event system
  public on<K extends keyof MobileEvents>(event: K, handler: MobileEvents[K]): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(handler);
  }

  public off<K extends keyof MobileEvents>(event: K, handler: MobileEvents[K]): void {
    const handlers = this.eventListeners.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  public emit<K extends keyof MobileEvents>(event: K, ...args: Parameters<MobileEvents[K]>): void {
    const handlers = this.eventListeners.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          (handler as any)(...args);
        } catch (error) {
          console.error(`Error in mobile event handler for ${event}:`, error);
        }
      });
    }
  }

  public destroy(): void {
    this.pauseMonitoring();
    this.eventListeners.clear();
    
    // Remove event listeners
    window.removeEventListener('orientationchange', () => {});
    window.removeEventListener('resize', () => {});
    document.removeEventListener('visibilitychange', () => {});
  }
}

// Singleton instance
let mobileSystemInstance: MobileSystemManager | null = null;

export const getMobileSystem = (): MobileSystemManager => {
  if (!mobileSystemInstance) {
    mobileSystemInstance = new MobileSystemManager();
  }
  return mobileSystemInstance;
};

export const destroyMobileSystem = (): void => {
  if (mobileSystemInstance) {
    mobileSystemInstance.destroy();
    mobileSystemInstance = null;
  }
};

export default MobileSystemManager;
