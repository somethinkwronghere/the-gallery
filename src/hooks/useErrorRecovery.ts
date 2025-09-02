import { useCallback } from 'react';
import { 
  ErrorInfo, 
  ErrorType, 
  ErrorSeverity, 
  RecoveryStrategy,
  AssetLoadError,
  MemoryError,
  RecoveryResult
} from '../types/error';
import { useErrorRecovery as useErrorRecoveryContext } from '../systems/error/ErrorRecoveryContext';

export function useErrorRecovery() {
  const context = useErrorRecoveryContext();

  type ErrorStatsSummary = {
    totalErrors: number;
    recentErrors: number;
    errorsByType: Record<string, number>;
    errorsBySeverity: Record<string, number>;
    contextLossCount: number;
    lastContextLoss?: Date | null;
    isRecovering: boolean;
    currentStrategy?: RecoveryStrategy | null;
  };

  // Helper function to create error info
  const createError = useCallback((
    type: ErrorType,
    message: string,
    severity: ErrorSeverity = 'medium',
    context?: Record<string, any>,
    recoveryStrategies: RecoveryStrategy[] = ['notify_user']
  ): ErrorInfo => {
    return {
      type,
      severity,
      message,
      timestamp: new Date(),
      context,
      recoveryStrategies
    };
  }, []);

  // Handle WebGL context loss
  const handleContextLoss = useCallback(async (event: WebGLContextEvent): Promise<RecoveryResult> => {
    const error = createError(
      'webgl_context_loss',
      'WebGL context was lost',
      'critical',
      { event },
      ['context_restore', 'reload_page']
    );
    
    return await context.actions.handleError(error);
  }, [createError, context.actions]);

  // Handle asset loading errors
  const handleAssetLoadError = useCallback(async (
    assetId: string,
    url: string,
    type: string,
    error: Error,
    retryCount: number = 0
  ): Promise<RecoveryResult> => {
    const assetError: AssetLoadError = {
      assetId,
      url,
      type,
      error,
      retryCount,
      timestamp: new Date()
    };

    const errorInfo = createError(
      'asset_load_failure',
      `Failed to load asset: ${assetId}`,
      retryCount >= 3 ? 'high' : 'medium',
      assetError,
      retryCount < 3 ? ['retry', 'fallback'] : ['fallback']
    );
    
    return await context.actions.handleError(errorInfo);
  }, [createError, context.actions]);

  // Handle memory errors
  const handleMemoryError = useCallback(async (
    currentUsage: number,
    threshold: number,
    criticalAssets: string[] = []
  ): Promise<RecoveryResult> => {
    const memoryError: MemoryError = {
      currentUsage,
      maxUsage: threshold,
      threshold,
      timestamp: new Date(),
      criticalAssets
    };

    const severity: ErrorSeverity = currentUsage > threshold * 1.5 ? 'critical' : 'high';
    
    const errorInfo = createError(
      'out_of_memory',
      `Memory usage critical: ${currentUsage.toFixed(2)}MB`,
      severity,
      memoryError,
      ['emergency_cleanup', 'degrade_quality']
    );
    
    return await context.actions.handleError(errorInfo);
  }, [createError, context.actions]);

  // Handle network errors
  const handleNetworkError = useCallback(async (
    url: string,
    error: Error,
    retryCount: number = 0
  ): Promise<RecoveryResult> => {
    const errorInfo = createError(
      'network_error',
      `Network request failed: ${url}`,
      'medium',
      { url, error: error.message, retryCount },
      retryCount < 3 ? ['retry'] : ['notify_user']
    );
    
    return await context.actions.handleError(errorInfo);
  }, [createError, context.actions]);

  // Handle shader compilation errors
  const handleShaderError = useCallback(async (
    shaderType: string,
    error: string
  ): Promise<RecoveryResult> => {
    const errorInfo = createError(
      'shader_compilation_error',
      `Shader compilation failed: ${shaderType}`,
      'high',
      { shaderType, error },
      ['fallback', 'degrade_quality']
    );
    
    return await context.actions.handleError(errorInfo);
  }, [createError, context.actions]);

  // Handle performance critical errors
  const handlePerformanceError = useCallback(async (
    fps: number,
    targetFPS: number,
    metrics: Record<string, any>
  ): Promise<RecoveryResult> => {
    const errorInfo = createError(
      'performance_critical',
      `Performance critical: ${fps} FPS (target: ${targetFPS})`,
      'medium',
      { fps, targetFPS, metrics },
      ['degrade_quality', 'emergency_cleanup']
    );
    
    return await context.actions.handleError(errorInfo);
  }, [context.actions, createError]);

  // Register fallback assets
  const registerFallbackAsset = useCallback((assetId: string, fallbackUrl: string) => {
    context.actions.registerFallback(assetId, fallbackUrl);
  }, [context.actions]);

  // Get error statistics
  const getErrorStats = useCallback((): ErrorStatsSummary => {
    const errors = context.errorHistory;
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentErrors = errors.filter(error => error.timestamp > oneHourAgo);
    const errorsByType = errors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const errorsBySeverity = errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalErrors: errors.length,
      recentErrors: recentErrors.length,
      errorsByType,
      errorsBySeverity,
      contextLossCount: context.contextLossCount,
      lastContextLoss: context.lastContextLoss,
      isRecovering: context.isRecovering,
      currentStrategy: context.currentStrategy
    };
  }, [
    context.errorHistory,
    context.contextLossCount,
    context.lastContextLoss,
    context.isRecovering,
    context.currentStrategy
  ]);

  // Check if system is healthy
  const isSystemHealthy = useCallback(() => {
    const stats = getErrorStats();
    const criticalErrors = context.errorHistory.filter(
      error => error.severity === 'critical' && 
      error.timestamp > new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
    );
    
    return {
      healthy: criticalErrors.length === 0 && stats.recentErrors < 10,
      criticalErrors: criticalErrors.length,
      recentErrors: stats.recentErrors,
      isRecovering: context.isRecovering
    };
  }, [context.errorHistory, context.isRecovering, getErrorStats]);

  // Manual recovery trigger
  const triggerRecovery = useCallback(async (strategy: RecoveryStrategy, context?: any): Promise<RecoveryResult> => {
    const errorInfo = createError(
      'unknown_error',
      `Manual recovery triggered: ${strategy}`,
      'medium',
      context,
      [strategy]
    );
    
    return await context.actions.handleError(errorInfo);
  }, [createError, context.actions]);

  return {
    // State
    isRecovering: context.isRecovering,
    currentStrategy: context.currentStrategy,
    errorHistory: context.errorHistory,
    contextLossCount: context.contextLossCount,
    lastContextLoss: context.lastContextLoss,
    thresholds: context.thresholds,
    
    // Actions
    handleContextLoss,
    handleAssetLoadError,
    handleMemoryError,
    handleNetworkError,
    handleShaderError,
    handlePerformanceError,
    registerFallbackAsset,
    clearErrors: context.actions.clearErrors,
    setThresholds: context.actions.setThresholds,
    triggerRecovery,
    
    // Utilities
    createError,
    getErrorStats,
    isSystemHealthy
  };
}