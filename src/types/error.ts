// Error handling types for the digital museum application

export type ErrorType = 
  | 'webgl_context_loss'
  | 'asset_load_failure'
  | 'out_of_memory'
  | 'network_error'
  | 'shader_compilation_error'
  | 'texture_load_error'
  | 'model_parse_error'
  | 'performance_critical'
  | 'unknown_error';

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export type RecoveryStrategy = 
  | 'retry'
  | 'fallback'
  | 'degrade_quality'
  | 'emergency_cleanup'
  | 'context_restore'
  | 'reload_page'
  | 'notify_user';

// Error information interface
export interface ErrorInfo {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  timestamp: Date;
  stack?: string;
  context?: Record<string, any>;
  recoveryStrategies: RecoveryStrategy[];
}

// WebGL context loss event data
export interface WebGLContextLossEvent {
  event: WebGLContextEvent;
  timestamp: Date;
  canRestore: boolean;
  attemptCount: number;
}

// Asset loading error data
export interface AssetLoadError {
  assetId: string;
  url: string;
  type: string;
  error: Error;
  retryCount: number;
  fallbackUrl?: string;
  timestamp: Date;
}

// Memory error data
export interface MemoryError {
  currentUsage: number;
  maxUsage: number;
  threshold: number;
  timestamp: Date;
  criticalAssets: string[];
}

// Recovery action result
export interface RecoveryResult {
  success: boolean;
  strategy: RecoveryStrategy;
  message: string;
  timestamp: Date;
  nextAction?: RecoveryStrategy;
}

// Error recovery manager interface
export interface ErrorRecoveryManager {
  // WebGL context handling
  handleContextLoss(event: WebGLContextEvent): Promise<RecoveryResult>;
  handleContextRestore(event: WebGLContextEvent): Promise<RecoveryResult>;
  
  // Asset loading failures
  handleAssetLoadError(error: AssetLoadError): Promise<RecoveryResult>;
  registerFallbackAsset(assetId: string, fallbackUrl: string): void;
  
  // Memory management
  handleOutOfMemory(memoryInfo: MemoryError): Promise<RecoveryResult>;
  performEmergencyCleanup(): Promise<RecoveryResult>;
  
  // Error logging and reporting
  logError(error: ErrorInfo): void;
  getErrorHistory(): ErrorInfo[];
  clearErrorHistory(): void;
  
  // Recovery strategies
  executeRecoveryStrategy(strategy: RecoveryStrategy, context?: any): Promise<RecoveryResult>;
  
  // Configuration
  setErrorThresholds(thresholds: ErrorThresholds): void;
  getErrorThresholds(): ErrorThresholds;
}

// Error thresholds configuration
export interface ErrorThresholds {
  memoryWarningThreshold: number; // MB
  memoryCriticalThreshold: number; // MB
  maxRetryAttempts: number;
  contextLossTimeout: number; // ms
  assetLoadTimeout: number; // ms
  performanceFPSThreshold: number;
}

// Fallback asset configuration
export interface FallbackAssetConfig {
  model: string;
  texture: string;
  material: string;
  audio: string;
  showPlaceholder: boolean;
  placeholderColor: string;
  placeholderText: string;
}

// Error recovery state
export interface ErrorRecoveryState {
  isRecovering: boolean;
  currentStrategy?: RecoveryStrategy;
  errorHistory: ErrorInfo[];
  contextLossCount: number;
  lastContextLoss?: Date;
  fallbackAssets: Map<string, string>;
  thresholds: ErrorThresholds;
  fallbackConfig: FallbackAssetConfig;
}

// Error recovery context actions
export interface ErrorRecoveryActions {
  handleError: (error: ErrorInfo) => Promise<RecoveryResult>;
  registerFallback: (assetId: string, fallbackUrl: string) => void;
  clearErrors: () => void;
  setThresholds: (thresholds: Partial<ErrorThresholds>) => void;
}

// Combined error recovery context
export interface ErrorRecoveryContextType extends ErrorRecoveryState {
  actions: ErrorRecoveryActions;
}

// User notification interface
export interface ErrorNotification {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  title: string;
  message: string;
  timestamp: Date;
  dismissible: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  primary?: boolean;
}