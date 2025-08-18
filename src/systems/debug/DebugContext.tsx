import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { Vector3, Euler } from 'three'
import {
  DebugState,
  DebugActions,
  DebugContextType,
  DebugMode,
  DebugConfig,
  LogLevel,
  VisualizationType,
  CameraBookmark
} from '../../types/debug'
import { debugManager } from './DebugManager'

// Initial state
const initialState: DebugState = {
  isEnabled: process.env.NODE_ENV === 'development',
  mode: 'basic',
  config: debugManager.getConfig(),
  panelVisible: false,
  visualizations: debugManager.getVisualizationOptions(),
  bookmarks: debugManager.getBookmarks(),
  logs: [],
  stats: debugManager.getDebugStats(),
  profilingResults: []
}

// Action types
type DebugAction =
  | { type: 'TOGGLE_DEBUG_PANEL' }
  | { type: 'SET_DEBUG_MODE'; payload: DebugMode }
  | { type: 'UPDATE_CONFIG'; payload: Partial<DebugConfig> }
  | { type: 'SAVE_BOOKMARK'; payload: { name: string; position: Vector3; rotation: Euler; description?: string } }
  | { type: 'LOAD_BOOKMARK'; payload: string }
  | { type: 'DELETE_BOOKMARK'; payload: string }
  | { type: 'LOG'; payload: { level: LogLevel; category: string; message: string; data?: any } }
  | { type: 'CLEAR_LOGS' }
  | { type: 'TOGGLE_VISUALIZATION'; payload: VisualizationType }
  | { type: 'UPDATE_STATS'; payload: DebugState['stats'] }
  | { type: 'UPDATE_BOOKMARKS'; payload: CameraBookmark[] }
  | { type: 'UPDATE_LOGS'; payload: DebugState['logs'] }
  | { type: 'UPDATE_PROFILING_RESULTS'; payload: DebugState['profilingResults'] }

// Reducer
function debugReducer(state: DebugState, action: DebugAction): DebugState {
  switch (action.type) {
    case 'TOGGLE_DEBUG_PANEL':
      const newPanelVisible = !state.panelVisible
      debugManager.showDebugPanel(newPanelVisible)
      return {
        ...state,
        panelVisible: newPanelVisible
      }

    case 'SET_DEBUG_MODE':
      return {
        ...state,
        mode: action.payload,
        config: {
          ...state.config,
          mode: action.payload
        }
      }

    case 'UPDATE_CONFIG':
      const newConfig = { ...state.config, ...action.payload }
      debugManager.setConfig(newConfig)
      return {
        ...state,
        config: newConfig
      }

    case 'SAVE_BOOKMARK':
      const { name, position, rotation, description } = action.payload
      const bookmark = debugManager.saveBookmark(name, position, rotation, description)
      return {
        ...state,
        bookmarks: [...state.bookmarks, bookmark]
      }

    case 'LOAD_BOOKMARK':
      // The actual camera movement would be handled by the component using this context
      return state

    case 'DELETE_BOOKMARK':
      debugManager.deleteBookmark(action.payload)
      return {
        ...state,
        bookmarks: state.bookmarks.filter(b => b.id !== action.payload)
      }

    case 'LOG':
      const { level, category, message, data } = action.payload
      debugManager.log(level, category, message, data)
      return state // Logs will be updated via UPDATE_LOGS action

    case 'CLEAR_LOGS':
      debugManager.clearLogs()
      return {
        ...state,
        logs: []
      }

    case 'TOGGLE_VISUALIZATION':
      const visualizationType = action.payload
      const currentValue = state.visualizations[visualizationType]
      const newVisualizations = {
        ...state.visualizations,
        [visualizationType]: !currentValue
      }
      
      // Update debug manager
      switch (visualizationType) {
        case 'boundingBoxes':
          debugManager.showBoundingBoxes(!currentValue)
          break
        case 'wireframes':
          debugManager.showWireframes(!currentValue)
          break
        case 'normals':
          debugManager.showNormals(!currentValue)
          break
        case 'colliders':
          debugManager.showColliders(!currentValue)
          break
        // Additional visualization types can be handled here
        case 'lightHelpers':
        case 'cameraHelpers':
        case 'gridHelper':
        case 'axesHelper':
        case 'frustumHelper':
          // These would be handled by the visualization system
          break
      }
      
      return {
        ...state,
        visualizations: newVisualizations
      }

    case 'UPDATE_STATS':
      return {
        ...state,
        stats: action.payload
      }

    case 'UPDATE_BOOKMARKS':
      return {
        ...state,
        bookmarks: action.payload
      }

    case 'UPDATE_LOGS':
      return {
        ...state,
        logs: action.payload
      }

    case 'UPDATE_PROFILING_RESULTS':
      return {
        ...state,
        profilingResults: action.payload
      }

    default:
      return state
  }
}

// Context
const DebugContext = createContext<DebugContextType | null>(null)

// Provider component
interface DebugProviderProps {
  children: ReactNode
}

export function DebugProvider({ children }: DebugProviderProps) {
  const [state, dispatch] = useReducer(debugReducer, initialState)

  // Actions
  const actions: DebugActions = {
    toggleDebugPanel: () => dispatch({ type: 'TOGGLE_DEBUG_PANEL' }),
    
    setDebugMode: (mode: DebugMode) => dispatch({ type: 'SET_DEBUG_MODE', payload: mode }),
    
    updateConfig: (config: Partial<DebugConfig>) => dispatch({ type: 'UPDATE_CONFIG', payload: config }),
    
    saveBookmark: (name: string, position: Vector3, rotation: Euler, description?: string) => {
      const bookmark = dispatch({ 
        type: 'SAVE_BOOKMARK', 
        payload: { name, position, rotation, description } 
      })
      return bookmark as any // Type assertion for return value
    },
    
    loadBookmark: (id: string) => {
      dispatch({ type: 'LOAD_BOOKMARK', payload: id })
    },
    
    deleteBookmark: (id: string) => dispatch({ type: 'DELETE_BOOKMARK', payload: id }),
    
    log: (level: LogLevel, category: string, message: string, data?: any) => {
      dispatch({ type: 'LOG', payload: { level, category, message, data } })
    },
    
    clearLogs: () => dispatch({ type: 'CLEAR_LOGS' }),
    
    takeScreenshot: async (filename?: string) => {
      return await debugManager.takeScreenshot(filename)
    },
    
    toggleVisualization: (type: VisualizationType) => {
      dispatch({ type: 'TOGGLE_VISUALIZATION', payload: type })
    }
  }

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.panelVisible) {
        const stats = debugManager.getDebugStats()
        dispatch({ type: 'UPDATE_STATS', payload: stats })
        
        const logs = debugManager.getLogs()
        dispatch({ type: 'UPDATE_LOGS', payload: logs })
        
        const profilingResults = debugManager.getProfilingResults()
        dispatch({ type: 'UPDATE_PROFILING_RESULTS', payload: profilingResults })
      }
    }, 1000) // Update every second when panel is visible

    return () => clearInterval(interval)
  }, [state.panelVisible])

  // Sync bookmarks
  useEffect(() => {
    const bookmarks = debugManager.getBookmarks()
    dispatch({ type: 'UPDATE_BOOKMARKS', payload: bookmarks })
  }, [])

  const contextValue: DebugContextType = {
    ...state,
    actions
  }

  return (
    <DebugContext.Provider value={contextValue}>
      {children}
    </DebugContext.Provider>
  )
}

// Hook to use debug context
export function useDebug(): DebugContextType {
  const context = useContext(DebugContext)
  if (!context) {
    throw new Error('useDebug must be used within a DebugProvider')
  }
  return context
}

// Hook for debug logging
export function useDebugLog() {
  const { actions } = useDebug()
  
  return {
    debug: (category: string, message: string, data?: any) => 
      actions.log('debug', category, message, data),
    info: (category: string, message: string, data?: any) => 
      actions.log('info', category, message, data),
    warn: (category: string, message: string, data?: any) => 
      actions.log('warn', category, message, data),
    error: (category: string, message: string, data?: any) => 
      actions.log('error', category, message, data)
  }
}

// Hook for performance profiling
export function useDebugProfiling() {
  const { config } = useDebug()
  
  const profile = (name: string, fn: () => any): any => {
    if (!config.enableProfiling) return fn()
    
    debugManager.startProfiling(name)
    try {
      const result = fn()
      return result
    } finally {
      debugManager.endProfiling(name)
    }
  }
  
  const profileAsync = async (name: string, fn: () => Promise<any>): Promise<any> => {
    if (!config.enableProfiling) return fn()
    
    debugManager.startProfiling(name)
    try {
      const result = await fn()
      return result
    } finally {
      debugManager.endProfiling(name)
    }
  }
  
  return {
    profile,
    profileAsync
  }
}