/**
 * Mobile-specific type definitions
 */

import { DeviceInfo } from '../utils/deviceDetection';

export interface MobileConfiguration {
  // Device capabilities
  deviceInfo: DeviceInfo;
  
  // Performance settings
  maxFrameRate: number;
  targetFrameRate: number;
  adaptiveQuality: boolean;
  
  // Rendering settings
  renderScale: number;
  maxLights: number;
  shadowQuality: 'off' | 'low' | 'medium' | 'high';
  antialiasing: boolean;
  
  // Memory constraints
  maxTextureSize: number;
  maxGeometryComplexity: number;
  enableLOD: boolean;
  
  // Battery optimization
  enableBatteryOptimization: boolean;
  lowBatteryThreshold: number;
  
  // Network settings
  enablePreloading: boolean;
  maxConcurrentLoads: number;
}

export interface TouchInput {
  identifier: number;
  pageX: number;
  pageY: number;
  clientX: number;
  clientY: number;
  force?: number;
  radiusX?: number;
  radiusY?: number;
  rotationAngle?: number;
}

export interface GestureState {
  // Single touch
  tap: {
    active: boolean;
    position: { x: number; y: number };
    duration: number;
  };
  
  // Movement
  pan: {
    active: boolean;
    delta: { x: number; y: number };
    velocity: { x: number; y: number };
    distance: number;
  };
  
  // Pinch to zoom
  pinch: {
    active: boolean;
    scale: number;
    center: { x: number; y: number };
    distance: number;
  };
  
  // Rotation
  rotate: {
    active: boolean;
    angle: number;
    center: { x: number; y: number };
  };
  
  // Long press
  longPress: {
    active: boolean;
    position: { x: number; y: number };
    duration: number;
  };
}

export interface MobileControls {
  // Movement
  movement: {
    forward: number;    // -1 to 1
    backward: number;   // -1 to 1
    left: number;       // -1 to 1
    right: number;      // -1 to 1
    speed: number;      // 0 to 1
  };
  
  // Camera
  camera: {
    pitch: number;      // -1 to 1
    yaw: number;        // -1 to 1
    sensitivity: number; // 0 to 1
  };
  
  // Actions
  actions: {
    jump: boolean;
    interact: boolean;
    menu: boolean;
    back: boolean;
  };
  
  // UI
  ui: {
    showControls: boolean;
    showHUD: boolean;
    showMenu: boolean;
    orientation: 'portrait' | 'landscape';
  };
}

export interface MobilePerformanceMetrics {
  // Frame rate
  fps: number;
  frameTime: number;
  
  // Memory usage
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  
  // GPU metrics (if available)
  gpuMemoryUsed?: number;
  drawCalls?: number;
  triangles?: number;
  
  // Battery info
  batteryLevel?: number;
  batteryCharging?: boolean;
  
  // Thermal state (iOS)
  thermalState?: 'nominal' | 'fair' | 'serious' | 'critical';
  
  // Network
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

export interface MobileOptimizationStrategy {
  // Quality levels
  qualityLevel: 'ultra-low' | 'low' | 'medium' | 'high';
  
  // Rendering optimizations
  enableFrustumCulling: boolean;
  enableOcclusionCulling: boolean;
  enableInstancing: boolean;
  enableBatching: boolean;
  
  // LOD settings
  lodBias: number;
  maxLODLevel: number;
  lodDistanceMultiplier: number;
  
  // Texture optimizations
  textureCompression: boolean;
  mipmapGeneration: boolean;
  anisotropicFiltering: number;
  
  // Effect toggles
  enableParticles: boolean;
  enablePostProcessing: boolean;
  enableReflections: boolean;
  enableSSAO: boolean;
  
  // Update frequencies
  physicsUpdateRate: number;
  animationUpdateRate: number;
  cullingUpdateRate: number;
}

export interface MobileUIState {
  // Visibility
  controlsVisible: boolean;
  hudVisible: boolean;
  menuVisible: boolean;
  loadingVisible: boolean;
  
  // Interaction
  lastInteraction: number;
  autoHideDelay: number;
  
  // Responsive
  screenSize: { width: number; height: number };
  safeArea: { top: number; right: number; bottom: number; left: number };
  orientation: 'portrait' | 'landscape';
  
  // Accessibility
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

export interface MobileEvents {
  // Device events
  orientationChange: (orientation: 'portrait' | 'landscape') => void;
  deviceMotion: (acceleration: { x: number; y: number; z: number }) => void;
  batteryChange: (level: number, charging: boolean) => void;
  
  // Performance events
  performanceWarning: (metrics: MobilePerformanceMetrics) => void;
  lowMemory: (available: number) => void;
  thermalThrottle: (state: string) => void;
  
  // Network events
  connectionChange: (type: string, quality: string) => void;
  offline: () => void;
  online: () => void;
  
  // UI events
  controlsToggle: (visible: boolean) => void;
  qualityChange: (level: string) => void;
  fullscreen: (enabled: boolean) => void;
}

export interface MobileSystemState {
  // Core state
  initialized: boolean;
  active: boolean;
  
  // Configuration
  config: MobileConfiguration;
  controls: MobileControls;
  ui: MobileUIState;
  
  // Performance
  metrics: MobilePerformanceMetrics;
  optimization: MobileOptimizationStrategy;
  
  // Capabilities
  features: {
    fullscreen: boolean;
    orientation: boolean;
    vibration: boolean;
    gamepad: boolean;
    webxr: boolean;
    webgl2: boolean;
    offscreenCanvas: boolean;
  };
}

// Event handler types
export type MobileEventHandler<T = any> = (event: T) => void;
export type MobileEventMap = {
  [K in keyof MobileEvents]: MobileEventHandler<Parameters<MobileEvents[K]>[0]>;
};

// Hook return types
export interface UseMobileResult extends MobileSystemState {
  actions: {
    updateConfig: (config: Partial<MobileConfiguration>) => void;
    updateControls: (controls: Partial<MobileControls>) => void;
    updateUI: (ui: Partial<MobileUIState>) => void;
    toggleControls: () => void;
    toggleFullscreen: () => void;
    setQuality: (level: string) => void;
    resetSettings: () => void;
  };
  
  events: {
    on: <K extends keyof MobileEvents>(event: K, handler: MobileEvents[K]) => void;
    off: <K extends keyof MobileEvents>(event: K, handler: MobileEvents[K]) => void;
    emit: <K extends keyof MobileEvents>(event: K, ...args: Parameters<MobileEvents[K]>) => void;
  };
}

export default MobileConfiguration;
