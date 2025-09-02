import { useState, useEffect, useCallback } from 'react';
import { getDeviceInfo, getOptimalSettings } from '../utils/deviceDetection';

export interface SimpleMobileOptimizationState {
  isMobile: boolean;
  isTablet: boolean;
  isTouchDevice: boolean;
  isLandscape: boolean;
  currentQuality: 'low' | 'medium' | 'high';
  fps: number;
  memoryUsage: number;
  autoOptimizationEnabled: boolean;
}

export interface SimpleMobileOptimizationActions {
  setQuality: (quality: 'low' | 'medium' | 'high') => void;
  toggleAutoOptimization: () => void;
  refreshDeviceInfo: () => void;
}

export const useSimpleMobileOptimization = () => {
  const [deviceInfo, setDeviceInfo] = useState(() => getDeviceInfo());
  const [currentQuality, setCurrentQuality] = useState<'low' | 'medium' | 'high'>(() => {
    const optimal = getOptimalSettings(getDeviceInfo());
    return optimal.quality as 'low' | 'medium' | 'high';
  });
  const [fps, setFps] = useState(60);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const [autoOptimizationEnabled, setAutoOptimizationEnabled] = useState(true);

  // Simple FPS monitoring
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const currentFPS = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setFps(currentFPS);
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };

    animationId = requestAnimationFrame(measureFPS);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Simple memory monitoring
  useEffect(() => {
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
        setMemoryUsage(usedMB);
      }
    };

    updateMemoryUsage();
    const interval = setInterval(updateMemoryUsage, 5000);

    return () => clearInterval(interval);
  }, []);

  // Auto quality adjustment based on performance
  useEffect(() => {
    if (!autoOptimizationEnabled) return;

    const checkPerformance = () => {
      // Auto-reduce quality if FPS is consistently low
      if (fps < 20 && currentQuality !== 'low') {
        console.log('Auto-reducing quality due to low FPS:', fps);
        setCurrentQuality('low');
      } else if (fps < 35 && currentQuality === 'high') {
        console.log('Auto-reducing quality from high to medium due to FPS:', fps);
        setCurrentQuality('medium');
      }
      // Auto-increase quality if performance is good (but be conservative)
      else if (fps > 50 && currentQuality === 'low' && deviceInfo.performance !== 'low') {
        console.log('Auto-increasing quality from low to medium due to good FPS:', fps);
        setCurrentQuality('medium');
      }
    };

    // Check performance every 10 seconds
    const interval = setInterval(checkPerformance, 10000);
    return () => clearInterval(interval);
  }, [fps, currentQuality, autoOptimizationEnabled, deviceInfo.performance]);

  // Handle orientation changes
  useEffect(() => {
    const handleOrientationChange = () => {
      setTimeout(() => {
        setDeviceInfo(getDeviceInfo());
      }, 100);
    };

    const handleResize = () => {
      setDeviceInfo(getDeviceInfo());
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Mobile-specific optimizations
  useEffect(() => {
    if (deviceInfo.isMobile) {
      // Reduce quality on mobile devices automatically
      if (deviceInfo.performance === 'low' && currentQuality !== 'low') {
        setCurrentQuality('low');
      } else if (deviceInfo.performance === 'medium' && currentQuality === 'high') {
        setCurrentQuality('medium');
      }
    }
  }, [deviceInfo.isMobile, deviceInfo.performance, currentQuality]);

  const refreshDeviceInfo = useCallback(() => {
    setDeviceInfo(getDeviceInfo());
  }, []);

  const setQuality = useCallback((quality: 'low' | 'medium' | 'high') => {
    setCurrentQuality(quality);
    console.log('Quality manually set to:', quality);
  }, []);

  const toggleAutoOptimization = useCallback(() => {
    setAutoOptimizationEnabled(prev => !prev);
  }, []);

  const state: SimpleMobileOptimizationState = {
    isMobile: deviceInfo.isMobile,
    isTablet: deviceInfo.isTablet,
    isTouchDevice: deviceInfo.isTouchDevice,
    isLandscape: deviceInfo.isLandscape,
    currentQuality,
    fps,
    memoryUsage,
    autoOptimizationEnabled
  };

  const actions: SimpleMobileOptimizationActions = {
    setQuality,
    toggleAutoOptimization,
    refreshDeviceInfo
  };

  return {
    ...state,
    actions
  };
};

export default useSimpleMobileOptimization;