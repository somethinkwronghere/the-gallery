import { renderHook, act } from '@testing-library/react';
import { useSimpleMobileOptimization } from '../useSimpleMobileOptimization';

// Mock device detection
jest.mock('../../utils/deviceDetection', () => ({
  getDeviceInfo: jest.fn(() => ({
    isMobile: true,
    isTablet: false,
    isTouchDevice: true,
    isLandscape: false,
    performance: 'medium',
    platform: 'Android',
    screenWidth: 375,
    screenHeight: 667
  })),
  getOptimalSettings: jest.fn(() => ({
    quality: 'medium',
    shadowQuality: 'low',
    antialiasing: false,
    maxLights: 2,
    renderDistance: 50,
    textureQuality: 'medium',
    enableParticles: false,
    enableAdvancedEffects: false
  }))
}));

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 50 * 1024 * 1024, // 50MB
      totalJSHeapSize: 100 * 1024 * 1024,
      jsHeapSizeLimit: 200 * 1024 * 1024
    }
  }
});

describe('useSimpleMobileOptimization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with correct device info', () => {
    const { result } = renderHook(() => useSimpleMobileOptimization());

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isTouchDevice).toBe(true);
    expect(result.current.isLandscape).toBe(false);
    expect(result.current.currentQuality).toBe('medium');
  });

  it('provides quality control actions', () => {
    const { result } = renderHook(() => useSimpleMobileOptimization());

    expect(typeof result.current.actions.setQuality).toBe('function');
    expect(typeof result.current.actions.toggleAutoOptimization).toBe('function');
    expect(typeof result.current.actions.refreshDeviceInfo).toBe('function');
  });

  it('allows manual quality changes', () => {
    const { result } = renderHook(() => useSimpleMobileOptimization());

    act(() => {
      result.current.actions.setQuality('low');
    });

    expect(result.current.currentQuality).toBe('low');

    act(() => {
      result.current.actions.setQuality('high');
    });

    expect(result.current.currentQuality).toBe('high');
  });

  it('toggles auto optimization', () => {
    const { result } = renderHook(() => useSimpleMobileOptimization());

    const initialAutoOptimization = result.current.autoOptimizationEnabled;

    act(() => {
      result.current.actions.toggleAutoOptimization();
    });

    expect(result.current.autoOptimizationEnabled).toBe(!initialAutoOptimization);
  });

  it('tracks FPS over time', async () => {
    const { result } = renderHook(() => useSimpleMobileOptimization());

    // Initial FPS should be set
    expect(typeof result.current.fps).toBe('number');
    expect(result.current.fps).toBeGreaterThan(0);
  });

  it('tracks memory usage', () => {
    const { result } = renderHook(() => useSimpleMobileOptimization());

    expect(typeof result.current.memoryUsage).toBe('number');
    expect(result.current.memoryUsage).toBeGreaterThanOrEqual(0);
  });

  it('refreshes device info when requested', () => {
    const { result } = renderHook(() => useSimpleMobileOptimization());

    act(() => {
      result.current.actions.refreshDeviceInfo();
    });

    // Device info should still be available after refresh
    expect(result.current.isMobile).toBeDefined();
    expect(result.current.isTablet).toBeDefined();
    expect(result.current.isTouchDevice).toBeDefined();
  });
});