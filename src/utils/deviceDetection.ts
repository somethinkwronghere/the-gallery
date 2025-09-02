/**
 * Comprehensive device detection utilities for optimal mobile experience
 */

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isTouchDevice: boolean;
  isLandscape: boolean;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  userAgent: string;
  platform: 'iOS' | 'Android' | 'Windows' | 'macOS' | 'Linux' | 'unknown';
  browser: 'Chrome' | 'Firefox' | 'Safari' | 'Edge' | 'Opera' | 'unknown';
  performance: 'high' | 'medium' | 'low';
}

export const getDeviceInfo = (): DeviceInfo => {
  const userAgent = navigator.userAgent;
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const pixelRatio = window.devicePixelRatio || 1;
  
  // Mobile detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) ||
                   (screenWidth <= 768 && 'ontouchstart' in window);
  
  // Tablet detection
  const isTablet = /iPad|Android(?!.*Mobile)|Tablet/i.test(userAgent) ||
                   (screenWidth >= 768 && screenWidth <= 1024 && 'ontouchstart' in window);
  
  // Desktop detection
  const isDesktop = !isMobile && !isTablet;
  
  // Touch device detection
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Orientation detection
  const isLandscape = screenWidth > screenHeight;
  
  // Platform detection
  let platform: DeviceInfo['platform'] = 'unknown';
  if (/iPhone|iPad|iPod/i.test(userAgent)) platform = 'iOS';
  else if (/Android/i.test(userAgent)) platform = 'Android';
  else if (/Win/i.test(userAgent)) platform = 'Windows';
  else if (/Mac/i.test(userAgent)) platform = 'macOS';
  else if (/Linux/i.test(userAgent)) platform = 'Linux';
  
  // Browser detection
  let browser: DeviceInfo['browser'] = 'unknown';
  if (/Chrome/i.test(userAgent) && !/Edge/i.test(userAgent)) browser = 'Chrome';
  else if (/Firefox/i.test(userAgent)) browser = 'Firefox';
  else if (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)) browser = 'Safari';
  else if (/Edge/i.test(userAgent)) browser = 'Edge';
  else if (/Opera/i.test(userAgent)) browser = 'Opera';
  
  // Performance estimation based on device capabilities
  let performance: DeviceInfo['performance'] = 'medium';
  const memoryInfo = (navigator as any).deviceMemory;
  const hardwareConcurrency = navigator.hardwareConcurrency || 4;
  
  if (isMobile) {
    // Mobile performance estimation - more optimistic for smooth experience
    if (memoryInfo && memoryInfo >= 6 && hardwareConcurrency >= 6) {
      performance = 'high';
    } else if (memoryInfo && memoryInfo >= 3 && hardwareConcurrency >= 4) {
      performance = 'medium';
    } else if ((memoryInfo && memoryInfo >= 2) || hardwareConcurrency >= 4) {
      performance = 'medium'; // Less aggressive downgrade
    } else {
      performance = 'low';
    }
  } else if (isTablet) {
    // Tablet performance estimation - more generous
    performance = memoryInfo && memoryInfo >= 4 ? 'high' : 'medium';
  } else {
    // Desktop performance estimation
    performance = 'high'; // Assume desktop has good performance
  }
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice,
    isLandscape,
    screenWidth,
    screenHeight,
    pixelRatio,
    userAgent,
    platform,
    browser,
    performance
  };
};

export const detectDevice = () => {
  const device = getDeviceInfo();
  if (device.isMobile) return 'mobile';
  if (device.isTablet) return 'tablet';
  return 'desktop';
};

export const isMobileDevice = (): boolean => {
  return getDeviceInfo().isMobile;
};

export const isTabletDevice = (): boolean => {
  return getDeviceInfo().isTablet;
};

export const isTouchDevice = (): boolean => {
  return getDeviceInfo().isTouchDevice;
};

export const getOptimalSettings = (deviceInfo: DeviceInfo) => {
  const { isMobile, isTablet, performance } = deviceInfo;
  
  if (isMobile) {
    return {
      quality: performance === 'high' ? 'medium' : 'low',
      shadowQuality: 'off',
      antialiasing: false,
      maxLights: 2,
      renderDistance: 50,
      textureQuality: 'low',
      enableParticles: false,
      enableAdvancedEffects: false
    };
  }
  
  if (isTablet) {
    return {
      quality: performance === 'high' ? 'high' : 'medium',
      shadowQuality: performance === 'high' ? 'medium' : 'low',
      antialiasing: performance === 'high',
      maxLights: 4,
      renderDistance: 100,
      textureQuality: 'medium',
      enableParticles: performance === 'high',
      enableAdvancedEffects: performance === 'high'
    };
  }
  
  // Desktop settings
  return {
    quality: 'high',
    shadowQuality: 'high',
    antialiasing: true,
    maxLights: 8,
    renderDistance: 250,
    textureQuality: 'high',
    enableParticles: true,
    enableAdvancedEffects: true
  };
};