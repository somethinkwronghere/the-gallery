/**
 * Mobile Quality Manager - Automatically adjusts quality based on device performance
 */

import { getDeviceInfo, getOptimalSettings } from './deviceDetection';

export interface QualitySettings {
  renderScale: number;
  shadowQuality: 'off' | 'low' | 'medium' | 'high';
  antialiasing: boolean;
  maxLights: number;
  textureQuality: 'low' | 'medium' | 'high';
  enableParticles: boolean;
  enablePostProcessing: boolean;
  targetFPS: number;
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  batteryLevel?: number;
  thermalState?: 'normal' | 'elevated' | 'critical';
}

export type QualityLevel = 'low' | 'medium' | 'high';

export class MobileQualityManager {
  private currentQuality: QualityLevel = 'medium';
  private autoAdjustEnabled = true;
  private performanceHistory: number[] = [];
  private adjustmentCooldown = 0;
  private listeners: ((quality: QualityLevel, settings: QualitySettings) => void)[] = [];

  // Quality presets optimized for mobile
  private qualityPresets: Record<QualityLevel, QualitySettings> = {
    low: {
      renderScale: 0.7,
      shadowQuality: 'off',
      antialiasing: false,
      maxLights: 1,
      textureQuality: 'low',
      enableParticles: false,
      enablePostProcessing: false,
      targetFPS: 30
    },
    medium: {
      renderScale: 0.85,
      shadowQuality: 'low',
      antialiasing: false,
      maxLights: 2,
      textureQuality: 'medium',
      enableParticles: false,
      enablePostProcessing: false,
      targetFPS: 45
    },
    high: {
      renderScale: 1.0,
      shadowQuality: 'medium',
      antialiasing: true,
      maxLights: 4,
      textureQuality: 'high',
      enableParticles: true,
      enablePostProcessing: true,
      targetFPS: 60
    }
  };

  constructor() {
    this.initializeQuality();
    this.startPerformanceMonitoring();
  }

  private initializeQuality() {
    const deviceInfo = getDeviceInfo();
    const optimalSettings = getOptimalSettings(deviceInfo);
    
    // Set initial quality based on device capabilities
    if (deviceInfo.isMobile) {
      if (deviceInfo.performance === 'low') {
        this.currentQuality = 'low';
      } else if (deviceInfo.performance === 'medium') {
        this.currentQuality = 'medium';
      } else {
        this.currentQuality = 'medium'; // Conservative for mobile
      }
    } else if (deviceInfo.isTablet) {
      this.currentQuality = deviceInfo.performance === 'high' ? 'high' : 'medium';
    } else {
      this.currentQuality = 'high'; // Desktop
    }

    console.log(`Initial quality set to: ${this.currentQuality} for ${deviceInfo.platform} device`);
  }

  private startPerformanceMonitoring() {
    let frameCount = 0;
    let lastTime = performance.now();
    let lastFrameTime = lastTime;

    const monitor = () => {
      const currentTime = performance.now();
      const frameTime = currentTime - lastFrameTime;
      lastFrameTime = currentTime;
      
      frameCount++;

      // Calculate FPS every second
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        // Add to performance history
        this.performanceHistory.push(fps);
        if (this.performanceHistory.length > 10) {
          this.performanceHistory.shift();
        }

        // Check if auto-adjustment is needed
        if (this.autoAdjustEnabled && this.adjustmentCooldown <= 0) {
          this.checkPerformanceAndAdjust(fps, frameTime);
        }

        if (this.adjustmentCooldown > 0) {
          this.adjustmentCooldown--;
        }

        frameCount = 0;
        lastTime = currentTime;
      }

      requestAnimationFrame(monitor);
    };

    requestAnimationFrame(monitor);
  }

  private checkPerformanceAndAdjust(fps: number, frameTime: number) {
    const targetFPS = this.qualityPresets[this.currentQuality].targetFPS;
    const avgFPS = this.performanceHistory.reduce((a, b) => a + b, 0) / this.performanceHistory.length;

    // Reduce quality if performance is consistently poor
    if (avgFPS < targetFPS * 0.7 && this.currentQuality !== 'low') {
      if (this.currentQuality === 'high') {
        this.setQuality('medium');
        console.log(`Auto-reduced quality to medium (FPS: ${avgFPS})`);
      } else if (this.currentQuality === 'medium') {
        this.setQuality('low');
        console.log(`Auto-reduced quality to low (FPS: ${avgFPS})`);
      }
      this.adjustmentCooldown = 10; // Wait 10 seconds before next adjustment
    }
    // Increase quality if performance is consistently good (be conservative)
    else if (avgFPS > targetFPS * 1.2 && this.currentQuality !== 'high') {
      const deviceInfo = getDeviceInfo();
      
      // Only increase quality on capable devices
      if (deviceInfo.performance !== 'low') {
        if (this.currentQuality === 'low' && avgFPS > 40) {
          this.setQuality('medium');
          console.log(`Auto-increased quality to medium (FPS: ${avgFPS})`);
          this.adjustmentCooldown = 15; // Longer cooldown for increases
        } else if (this.currentQuality === 'medium' && avgFPS > 55 && !deviceInfo.isMobile) {
          this.setQuality('high');
          console.log(`Auto-increased quality to high (FPS: ${avgFPS})`);
          this.adjustmentCooldown = 15;
        }
      }
    }
  }

  public setQuality(quality: QualityLevel) {
    if (this.currentQuality === quality) return;

    this.currentQuality = quality;
    const settings = this.getQualitySettings();
    
    // Notify listeners
    this.listeners.forEach(listener => listener(quality, settings));
    
    console.log(`Quality changed to: ${quality}`, settings);
  }

  public getQualitySettings(): QualitySettings {
    return { ...this.qualityPresets[this.currentQuality] };
  }

  public getCurrentQuality(): QualityLevel {
    return this.currentQuality;
  }

  public setAutoAdjust(enabled: boolean) {
    this.autoAdjustEnabled = enabled;
    console.log(`Auto quality adjustment ${enabled ? 'enabled' : 'disabled'}`);
  }

  public isAutoAdjustEnabled(): boolean {
    return this.autoAdjustEnabled;
  }

  public getPerformanceMetrics(): PerformanceMetrics {
    const avgFPS = this.performanceHistory.length > 0 
      ? this.performanceHistory.reduce((a, b) => a + b, 0) / this.performanceHistory.length 
      : 60;

    const metrics: PerformanceMetrics = {
      fps: Math.round(avgFPS),
      frameTime: 1000 / avgFPS,
      memoryUsage: this.getMemoryUsage()
    };

    // Add battery info if available
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        metrics.batteryLevel = Math.round(battery.level * 100);
      });
    }

    return metrics;
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024);
    }
    return 0;
  }

  public onQualityChange(listener: (quality: QualityLevel, settings: QualitySettings) => void) {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public forceQualityForBattery(batteryLevel: number) {
    if (batteryLevel < 20 && this.currentQuality !== 'low') {
      console.log(`Forcing low quality due to low battery: ${batteryLevel}%`);
      this.setQuality('low');
    } else if (batteryLevel < 50 && this.currentQuality === 'high') {
      console.log(`Reducing quality due to medium battery: ${batteryLevel}%`);
      this.setQuality('medium');
    }
  }

  public handleThermalThrottling(thermalState: 'normal' | 'elevated' | 'critical') {
    if (thermalState === 'critical' && this.currentQuality !== 'low') {
      console.log('Forcing low quality due to thermal throttling');
      this.setQuality('low');
    } else if (thermalState === 'elevated' && this.currentQuality === 'high') {
      console.log('Reducing quality due to thermal elevation');
      this.setQuality('medium');
    }
  }

  public reset() {
    this.performanceHistory = [];
    this.adjustmentCooldown = 0;
    this.initializeQuality();
  }
}

// Singleton instance
let qualityManagerInstance: MobileQualityManager | null = null;

export const getMobileQualityManager = (): MobileQualityManager => {
  if (!qualityManagerInstance) {
    qualityManagerInstance = new MobileQualityManager();
  }
  return qualityManagerInstance;
};

export default MobileQualityManager;