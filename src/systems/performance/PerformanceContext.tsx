import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { 
  PerformanceContextType, 
  PerformanceState, 
  PerformanceActions,
  PerformanceLevel,
  PerformanceConfig,
  UserPreferences
} from '../../types/performance';
import { performanceManager } from './PerformanceManager';

// Initial state
const initialState: PerformanceState = {
  level: 'medium',
  config: {
    quality: 'medium',
    targetFPS: 60,
    maxDrawCalls: 1000,
    maxTriangles: 100000,
    textureQuality: 1.0,
    shadowQuality: 'medium',
    antialiasing: true,
    postProcessing: true,
    enableLOD: true,
    enableCulling: true,
    enableInstancing: true
  },
  metrics: {
    fps: 0,
    memoryUsage: 0,
    drawCalls: 0,
    triangleCount: 0,
    textureMemory: 0,
    renderTime: 0,
    frameTime: 0
  },
  isOptimizing: false,
  userPreferences: {
    qualityPreset: 'auto',
    targetFPS: 60,
    enableDebugMode: false,
    showPerformanceStats: false,
    enableAutoQuality: true,
    maxMemoryUsage: 512
  }
};

// Action types
type PerformanceAction = 
  | { type: 'SET_PERFORMANCE_LEVEL'; payload: PerformanceLevel }
  | { type: 'UPDATE_CONFIG'; payload: Partial<PerformanceConfig> }
  | { type: 'UPDATE_METRICS'; payload: Partial<PerformanceState['metrics']> }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<UserPreferences> }
  | { type: 'SET_OPTIMIZING'; payload: boolean }
  | { type: 'RESET_METRICS' };

// Reducer
const performanceReducer = (state: PerformanceState, action: PerformanceAction): PerformanceState => {
  switch (action.type) {
    case 'SET_PERFORMANCE_LEVEL':
      return {
        ...state,
        level: action.payload
      };
    
    case 'UPDATE_CONFIG':
      return {
        ...state,
        config: { ...state.config, ...action.payload }
      };
    
    case 'UPDATE_METRICS':
      return {
        ...state,
        metrics: { ...state.metrics, ...action.payload }
      };
    
    case 'UPDATE_PREFERENCES':
      const newPreferences = { ...state.userPreferences, ...action.payload };
      // Save to localStorage
      localStorage.setItem('performance-preferences', JSON.stringify(newPreferences));
      return {
        ...state,
        userPreferences: newPreferences
      };
    
    case 'SET_OPTIMIZING':
      return {
        ...state,
        isOptimizing: action.payload
      };
    
    case 'RESET_METRICS':
      return {
        ...state,
        metrics: initialState.metrics
      };
    
    default:
      return state;
  }
};

// Context
const PerformanceContext = createContext<PerformanceContextType | null>(null);

// Provider component
interface PerformanceProviderProps {
  children: ReactNode;
}

export const PerformanceProvider: React.FC<PerformanceProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(performanceReducer, initialState);

  // Load user preferences from localStorage
  useEffect(() => {
    const savedPreferences = localStorage.getItem('performance-preferences');
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences);
        dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
      } catch (error) {
        console.warn('Failed to load performance preferences:', error);
      }
    }
  }, []);

  // Initialize performance manager
  useEffect(() => {
    const detectedLevel = performanceManager.detectPerformanceLevel();
    dispatch({ type: 'SET_PERFORMANCE_LEVEL', payload: detectedLevel });
    
    const config = performanceManager.getConfig();
    dispatch({ type: 'UPDATE_CONFIG', payload: config });

    // Enable auto optimization if user preference allows
    if (state.userPreferences.enableAutoQuality) {
      performanceManager.enableAutoOptimization(true);
      dispatch({ type: 'SET_OPTIMIZING', payload: true });
    }
  }, [state.userPreferences.enableAutoQuality]);

  // Update metrics periodically
  useEffect(() => {
    const updateMetrics = () => {
      const metrics = performanceManager.getMetrics();
      dispatch({ type: 'UPDATE_METRICS', payload: metrics });
    };

    const interval = setInterval(updateMetrics, 1000);
    return () => clearInterval(interval);
  }, []);

  // Actions
  const actions: PerformanceActions = {
    adjustQuality: (targetFPS: number) => {
      performanceManager.adjustQuality(targetFPS);
      const updatedConfig = performanceManager.getConfig();
      dispatch({ type: 'UPDATE_CONFIG', payload: updatedConfig });
    },

    setPerformanceLevel: (level: PerformanceLevel) => {
      dispatch({ type: 'SET_PERFORMANCE_LEVEL', payload: level });
      // Update performance manager config based on new level
      const config = performanceManager.getConfig();
      dispatch({ type: 'UPDATE_CONFIG', payload: config });
    },

    updateConfig: (config: Partial<PerformanceConfig>) => {
      performanceManager.setConfig(config);
      dispatch({ type: 'UPDATE_CONFIG', payload: config });
    },

    updatePreferences: (preferences: Partial<UserPreferences>) => {
      dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
      
      // Apply preference changes to performance manager
      if (preferences.enableAutoQuality !== undefined) {
        performanceManager.enableAutoOptimization(preferences.enableAutoQuality);
        dispatch({ type: 'SET_OPTIMIZING', payload: preferences.enableAutoQuality });
      }
    },

    resetMetrics: () => {
      performanceManager.resetMetrics();
      dispatch({ type: 'RESET_METRICS' });
    }
  };

  const contextValue: PerformanceContextType = {
    ...state,
    actions
  };

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
    </PerformanceContext.Provider>
  );
};

// Custom hook
export const usePerformance = (): PerformanceContextType => {
  const context = useContext(PerformanceContext);
  
  if (!context) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  
  return context;
};