/**
 * Mobile System - Entry point for all mobile functionality
 */

export { default as MobileSystemManager, getMobileSystem, destroyMobileSystem } from './MobileSystem';

// Re-export mobile types
export type {
  MobileConfiguration,
  MobileSystemState,
  MobilePerformanceMetrics,
  MobileOptimizationStrategy,
  MobileEvents,
  UseMobileResult,
  TouchInput,
  GestureState,
  MobileControls as MobileControlsType,
  MobileUIState
} from '../../types/mobile';

// Re-export device detection utilities
export {
  getDeviceInfo,
  detectDevice,
  isMobileDevice,
  isTabletDevice,
  isTouchDevice,
  getOptimalSettings
} from '../../utils/deviceDetection';

export type { DeviceInfo } from '../../utils/deviceDetection';

// Re-export mobile hooks
export { default as useMobileOptimization } from '../../hooks/useMobileOptimization';

// Re-export mobile components
export { MobileControls } from '../../components/MobileControls/MobileControls';
export { MobileUI } from '../../components/MobileUI/MobileUI';

export type { MobileControlsProps } from '../../components/MobileControls/MobileControls';
export type { MobileUIProps } from '../../components/MobileUI/MobileUI';
