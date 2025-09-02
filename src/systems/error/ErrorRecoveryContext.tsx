import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import {
  ErrorRecoveryState,
  ErrorRecoveryActions,
  ErrorRecoveryContextType,
  ErrorInfo,
  ErrorThresholds,
  RecoveryResult
} from '../../types/error';
import { errorRecoveryManager } from './ErrorRecoveryManager';

// Initial state
const initialState: ErrorRecoveryState = {
  isRecovering: false,
  currentStrategy: undefined,
  errorHistory: [],
  contextLossCount: 0,
  lastContextLoss: undefined,
  fallbackAssets: new Map(),
  thresholds: {
    memoryWarningThreshold: 512,
    memoryCriticalThreshold: 1024,
    maxRetryAttempts: 3,
    contextLossTimeout: 5000,
    assetLoadTimeout: 30000,
    performanceFPSThreshold: 15
  },
  fallbackConfig: {
    model: '/assets/fallback/default-model.glb',
    texture: '/assets/fallback/default-texture.jpg',
    material: '/assets/fallback/default-material.json',
    audio: '/assets/fallback/silence.mp3',
    showPlaceholder: true,
    placeholderColor: '#cccccc',
    placeholderText: 'Asset Loading...'
  }
};

// Action types
type ErrorRecoveryAction =
  | { type: 'SET_RECOVERING'; payload: boolean }
  | { type: 'SET_CURRENT_STRATEGY'; payload: string | undefined }
  | { type: 'ADD_ERROR'; payload: ErrorInfo }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'INCREMENT_CONTEXT_LOSS' }
  | { type: 'SET_LAST_CONTEXT_LOSS'; payload: Date }
  | { type: 'ADD_FALLBACK_ASSET'; payload: { assetId: string; fallbackUrl: string } }
  | { type: 'SET_THRESHOLDS'; payload: Partial<ErrorThresholds> };

// Reducer
function errorRecoveryReducer(state: ErrorRecoveryState, action: ErrorRecoveryAction): ErrorRecoveryState {
  switch (action.type) {
    case 'SET_RECOVERING':
      return { ...state, isRecovering: action.payload };
    
    case 'SET_CURRENT_STRATEGY':
      return { ...state, currentStrategy: action.payload as any };
    
    case 'ADD_ERROR':
      return {
        ...state,
        errorHistory: [...state.errorHistory, action.payload].slice(-100) // Keep last 100 errors
      };
    
    case 'CLEAR_ERRORS':
      return { ...state, errorHistory: [] };
    
    case 'INCREMENT_CONTEXT_LOSS':
      return { ...state, contextLossCount: state.contextLossCount + 1 };
    
    case 'SET_LAST_CONTEXT_LOSS':
      return { ...state, lastContextLoss: action.payload };
    
    case 'ADD_FALLBACK_ASSET':
      const newFallbackAssets = new Map(state.fallbackAssets);
      newFallbackAssets.set(action.payload.assetId, action.payload.fallbackUrl);
      return { ...state, fallbackAssets: newFallbackAssets };
    
    case 'SET_THRESHOLDS':
      return {
        ...state,
        thresholds: { ...state.thresholds, ...action.payload }
      };
    
    default:
      return state;
  }
}

// Create context
const ErrorRecoveryContext = createContext<ErrorRecoveryContextType | null>(null);

// Provider component
interface ErrorRecoveryProviderProps {
  children: ReactNode;
}

export function ErrorRecoveryProvider({ children }: ErrorRecoveryProviderProps) {
  const [state, dispatch] = useReducer(errorRecoveryReducer, initialState);

  // Actions
  const handleError = useCallback(async (error: ErrorInfo): Promise<RecoveryResult> => {
    dispatch({ type: 'ADD_ERROR', payload: error });
    dispatch({ type: 'SET_RECOVERING', payload: true });
    
    try {
      // Execute recovery strategies in order
      for (const strategy of error.recoveryStrategies) {
        dispatch({ type: 'SET_CURRENT_STRATEGY', payload: strategy });
        
        const result = await errorRecoveryManager.executeRecoveryStrategy(strategy, error.context);
        
        if (result.success) {
          dispatch({ type: 'SET_RECOVERING', payload: false });
          dispatch({ type: 'SET_CURRENT_STRATEGY', payload: undefined });
          return result;
        }
      }
      
      // If all strategies failed
      dispatch({ type: 'SET_RECOVERING', payload: false });
      dispatch({ type: 'SET_CURRENT_STRATEGY', payload: undefined });
      
      return {
        success: false,
        strategy: 'notify_user',
        message: 'All recovery strategies failed',
        timestamp: new Date()
      };
    } catch (err) {
      dispatch({ type: 'SET_RECOVERING', payload: false });
      dispatch({ type: 'SET_CURRENT_STRATEGY', payload: undefined });
      
      return {
        success: false,
        strategy: 'notify_user',
        message: `Recovery failed: ${err}`,
        timestamp: new Date()
      };
    }
  }, []);

  const actions: ErrorRecoveryActions = {
    handleError,

    registerFallback: (assetId: string, fallbackUrl: string) => {
      dispatch({ type: 'ADD_FALLBACK_ASSET', payload: { assetId, fallbackUrl } });
      errorRecoveryManager.registerFallbackAsset(assetId, fallbackUrl);
    },

    clearErrors: () => {
      dispatch({ type: 'CLEAR_ERRORS' });
      errorRecoveryManager.clearErrorHistory();
    },

    setThresholds: (thresholds: Partial<ErrorThresholds>) => {
      dispatch({ type: 'SET_THRESHOLDS', payload: thresholds });
      errorRecoveryManager.setErrorThresholds({ ...state.thresholds, ...thresholds });
    }
  };

  // Setup error listeners
  useEffect(() => {
    // Global error handler
    const handleGlobalError = (event: ErrorEvent) => {
      const errorInfo: ErrorInfo = {
        type: 'unknown_error',
        severity: 'medium',
        message: event.message,
        timestamp: new Date(),
        stack: event.error?.stack,
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        },
        recoveryStrategies: ['notify_user']
      };
      
      handleError(errorInfo);
    };

    // Unhandled promise rejection handler
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const errorInfo: ErrorInfo = {
        type: 'unknown_error',
        severity: 'high',
        message: `Unhandled promise rejection: ${event.reason}`,
        timestamp: new Date(),
        context: { reason: event.reason },
        recoveryStrategies: ['notify_user']
      };
      
      handleError(errorInfo);
    };

    // WebGL context loss handler
    const handleContextLoss = (event: Event) => {
      dispatch({ type: 'INCREMENT_CONTEXT_LOSS' });
      dispatch({ type: 'SET_LAST_CONTEXT_LOSS', payload: new Date() });
      
      const errorInfo: ErrorInfo = {
        type: 'webgl_context_loss',
        severity: 'critical',
        message: 'WebGL context was lost',
        timestamp: new Date(),
        context: { event },
        recoveryStrategies: ['context_restore', 'reload_page']
      };
      
      handleError(errorInfo);
    };

    // Add event listeners
    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    // Find canvas and add WebGL context loss listener
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('webglcontextlost', handleContextLoss);
    }

    // Cleanup
    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      
      if (canvas) {
        canvas.removeEventListener('webglcontextlost', handleContextLoss);
      }
    };
  }, [handleError]);

  // Memory monitoring
  useEffect(() => {
    const checkMemory = () => {
      const memoryInfo = (performance as any).memory;
      if (memoryInfo) {
        const usageMB = memoryInfo.usedJSHeapSize / (1024 * 1024);
        
        if (usageMB > state.thresholds.memoryCriticalThreshold) {
          const errorInfo: ErrorInfo = {
            type: 'out_of_memory',
            severity: 'critical',
            message: `Critical memory usage: ${usageMB.toFixed(2)}MB`,
            timestamp: new Date(),
            context: {
              currentUsage: usageMB,
              threshold: state.thresholds.memoryCriticalThreshold
            },
            recoveryStrategies: ['emergency_cleanup', 'degrade_quality']
          };
          
          handleError(errorInfo);
        } else if (usageMB > state.thresholds.memoryWarningThreshold) {
          const errorInfo: ErrorInfo = {
            type: 'out_of_memory',
            severity: 'medium',
            message: `High memory usage: ${usageMB.toFixed(2)}MB`,
            timestamp: new Date(),
            context: {
              currentUsage: usageMB,
              threshold: state.thresholds.memoryWarningThreshold
            },
            recoveryStrategies: ['emergency_cleanup']
          };
          
          handleError(errorInfo);
        }
      }
    };

    const memoryCheckInterval = setInterval(checkMemory, 10000); // Check every 10 seconds

    return () => clearInterval(memoryCheckInterval);
  }, [state.thresholds.memoryCriticalThreshold, state.thresholds.memoryWarningThreshold, handleError]);

  const contextValue: ErrorRecoveryContextType = {
    ...state,
    actions
  };

  return (
    <ErrorRecoveryContext.Provider value={contextValue}>
      {children}
    </ErrorRecoveryContext.Provider>
  );
}

// Hook to use error recovery context
export function useErrorRecovery(): ErrorRecoveryContextType {
  const context = useContext(ErrorRecoveryContext);
  if (!context) {
    throw new Error('useErrorRecovery must be used within an ErrorRecoveryProvider');
  }
  return context;
}

// Error boundary component
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorInfoData: ErrorInfo = {
      type: 'unknown_error',
      severity: 'high',
      message: error.message,
      timestamp: new Date(),
      stack: error.stack,
      context: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      },
      recoveryStrategies: ['notify_user', 'reload_page']
    };

    // Log error to recovery manager
    errorRecoveryManager.logError(errorInfoData);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          backgroundColor: '#f5f5f5',
          border: '1px solid #ddd',
          borderRadius: '4px',
          margin: '20px'
        }}>
          <h2>Something went wrong</h2>
          <p>An error occurred while rendering this component.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}