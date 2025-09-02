import { useState, useEffect, useCallback } from 'react';
import { getDeviceInfo, getOptimalSettings, DeviceInfo } from '../utils/deviceDetection';

export interface MobileOptimizationConfig {
  enableAutoOptimization: boolean;
  enableTouchControls: boolean;
  enableResponsiveAdjustments: boolean;
  forceQualityLevel?: 'low' | 'medium' | 'high';
  customSettings?: Partial<ReturnType<typeof getOptimalSettings>>;
}

export interface MobileOptimizationState {
  deviceInfo: DeviceInfo;
  isMobile: boolean;
  isTablet: boolean;
  isTouchDevice: boolean;
  isLandscape: boolean;
  optimizedConfig: ReturnType<typeof getOptimalSettings>;
  touchControlsEnabled: boolean;
  responsiveMode: boolean;
}

export interface MobileOptimizationActions {
  toggleTouchControls: () => void;
  toggleResponsiveMode: () => void;
  forceQuality: (quality: 'low' | 'medium' | 'high') => void;
  refreshDeviceInfo: () => void;
  updateCustomSettings: (settings: Partial<ReturnType<typeof getOptimalSettings>>) => void;
}

export const useMobileOptimization = (
  config: MobileOptimizationConfig = {
    enableAutoOptimization: true,
    enableTouchControls: true,
    enableResponsiveAdjustments: true
  }
) => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(getDeviceInfo());
  const [touchControlsEnabled, setTouchControlsEnabled] = useState(
    config.enableTouchControls && deviceInfo.isTouchDevice
  );
  const [responsiveMode, setResponsiveMode] = useState(config.enableResponsiveAdjustments);
  const [customSettings, setCustomSettings] = useState(config.customSettings || {});
  const [forcedQuality, setForcedQuality] = useState<'low' | 'medium' | 'high' | null>(
    config.forceQualityLevel || null
  );

  // Get optimal settings based on current device and overrides
  const getOptimizedConfig = useCallback(() => {
    let baseSettings = getOptimalSettings(deviceInfo);
    
    // Apply forced quality if set
    if (forcedQuality) {
      baseSettings = {
        ...baseSettings,
        quality: forcedQuality,
        shadowQuality: forcedQuality === 'low' ? 'off' : 
                      forcedQuality === 'medium' ? 'low' : 'high',
        antialiasing: forcedQuality !== 'low',
        enableParticles: forcedQuality === 'high',
        enableAdvancedEffects: forcedQuality === 'high'
      };
    }
    
    // Apply custom settings override
    return { ...baseSettings, ...customSettings };
  }, [deviceInfo, forcedQuality, customSettings]);

  const optimizedConfig = getOptimizedConfig();

  // Refresh device info (useful for orientation changes)
  const refreshDeviceInfo = useCallback(() => {
    setDeviceInfo(getDeviceInfo());
  }, []);

  // Handle orientation changes
  useEffect(() => {
    const handleOrientationChange = () => {
      setTimeout(refreshDeviceInfo, 100); // Small delay to ensure orientation change is complete
    };

    const handleResize = () => {
      refreshDeviceInfo();
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleResize);
    };
  }, [refreshDeviceInfo]);

  // Auto-enable touch controls on touch devices
  useEffect(() => {
    if (config.enableAutoOptimization && deviceInfo.isTouchDevice) {
      setTouchControlsEnabled(true);
    }
  }, [deviceInfo.isTouchDevice, config.enableAutoOptimization]);

  // Auto-adjust quality based on performance
  useEffect(() => {
    if (config.enableAutoOptimization && !forcedQuality) {
      // Monitor performance and adjust quality if needed
      const performanceCheckInterval = setInterval(() => {
        const currentFPS = (performance as any).now ? 60 : 30; // Simplified FPS check
        
        if (currentFPS < 20 && optimizedConfig.quality === 'high') {
          setForcedQuality('medium');
        } else if (currentFPS < 15 && optimizedConfig.quality === 'medium') {
          setForcedQuality('low');
        }
      }, 5000);

      return () => clearInterval(performanceCheckInterval);
    }
  }, [config.enableAutoOptimization, forcedQuality, optimizedConfig.quality]);

  const actions: MobileOptimizationActions = {
    toggleTouchControls: () => setTouchControlsEnabled(prev => !prev),
    toggleResponsiveMode: () => setResponsiveMode(prev => !prev),
    forceQuality: (quality) => setForcedQuality(quality),
    refreshDeviceInfo,
    updateCustomSettings: (settings) => setCustomSettings(prev => ({ ...prev, ...settings }))
  };

  const state: MobileOptimizationState = {
    deviceInfo,
    isMobile: deviceInfo.isMobile,
    isTablet: deviceInfo.isTablet,
    isTouchDevice: deviceInfo.isTouchDevice,
    isLandscape: deviceInfo.isLandscape,
    optimizedConfig,
    touchControlsEnabled,
    responsiveMode
  };

  return {
    ...state,
    actions
  };
};

export default useMobileOptimization;
