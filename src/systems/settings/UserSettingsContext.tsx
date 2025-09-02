import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { 
  UserSettings, 
  SettingsCategory, 
  SettingsPreset,
  SettingsValidationResult,
  DEFAULT_SETTINGS,
  BUILT_IN_PRESETS
} from '../../types/settings'
import { settingsManager } from './SettingsManager'

// Context state interface
interface UserSettingsState {
  settings: UserSettings
  isLoading: boolean
  isDirty: boolean
  lastSaved: Date | null
  validationResult: SettingsValidationResult | null
  availablePresets: SettingsPreset[]
}

// Context actions interface
interface UserSettingsActions {
  updateSettings: (updates: Partial<UserSettings>) => void
  updateCategory: <T extends SettingsCategory>(category: T, updates: Partial<UserSettings[T]>) => void
  resetSettings: () => void
  resetCategory: (category: SettingsCategory) => void
  saveSettings: () => Promise<void>
  loadSettings: () => Promise<void>
  applyPreset: (presetId: string) => void
  createPreset: (name: string, description?: string) => SettingsPreset
  deletePreset: (presetId: string) => boolean
  exportSettings: () => Promise<string>
  importSettings: (data: string) => Promise<void>
  validateSettings: (settings?: Partial<UserSettings>) => SettingsValidationResult
}

// Combined context type
interface UserSettingsContextType extends UserSettingsState {
  actions: UserSettingsActions
}

// Action types
type UserSettingsAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SETTINGS'; payload: UserSettings }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<UserSettings> }
  | { type: 'UPDATE_CATEGORY'; payload: { category: SettingsCategory; updates: any } }
  | { type: 'SET_DIRTY'; payload: boolean }
  | { type: 'SET_LAST_SAVED'; payload: Date }
  | { type: 'SET_VALIDATION_RESULT'; payload: SettingsValidationResult | null }
  | { type: 'SET_PRESETS'; payload: SettingsPreset[] }
  | { type: 'RESET_SETTINGS' }
  | { type: 'RESET_CATEGORY'; payload: SettingsCategory }

// Initial state
const initialState: UserSettingsState = {
  settings: DEFAULT_SETTINGS,
  isLoading: false,
  isDirty: false,
  lastSaved: null,
  validationResult: null,
  availablePresets: [...BUILT_IN_PRESETS]
}

// Reducer
const userSettingsReducer = (state: UserSettingsState, action: UserSettingsAction): UserSettingsState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    
    case 'SET_SETTINGS':
      return { 
        ...state, 
        settings: action.payload,
        isDirty: false,
        validationResult: null
      }
    
    case 'UPDATE_SETTINGS':
      const updatedSettings = { ...state.settings, ...action.payload }
      return { 
        ...state, 
        settings: updatedSettings,
        isDirty: true,
        validationResult: null
      }
    
    case 'UPDATE_CATEGORY':
      const { category, updates } = action.payload
      return {
        ...state,
        settings: {
          ...state.settings,
          [category]: { ...state.settings[category], ...updates }
        },
        isDirty: true,
        validationResult: null
      }
    
    case 'SET_DIRTY':
      return { ...state, isDirty: action.payload }
    
    case 'SET_LAST_SAVED':
      return { ...state, lastSaved: action.payload, isDirty: false }
    
    case 'SET_VALIDATION_RESULT':
      return { ...state, validationResult: action.payload }
    
    case 'SET_PRESETS':
      return { ...state, availablePresets: action.payload }
    
    case 'RESET_SETTINGS':
      return { 
        ...state, 
        settings: DEFAULT_SETTINGS,
        isDirty: true,
        validationResult: null
      }
    
    case 'RESET_CATEGORY':
      return {
        ...state,
        settings: {
          ...state.settings,
          [action.payload]: DEFAULT_SETTINGS[action.payload]
        },
        isDirty: true,
        validationResult: null
      }
    
    default:
      return state
  }
}

// Context
const UserSettingsContext = createContext<UserSettingsContextType | null>(null)

// Provider component
interface UserSettingsProviderProps {
  children: ReactNode
}

export const UserSettingsProvider: React.FC<UserSettingsProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(userSettingsReducer, initialState)

  // Load settings on mount
  useEffect(() => {
    const loadInitialSettings = async () => {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      try {
        await settingsManager.loadSettings()
        const settings = settingsManager.getSettings()
        dispatch({ type: 'SET_SETTINGS', payload: settings })
        
        // Load available presets
        const presets = settingsManager.getPresets()
        dispatch({ type: 'SET_PRESETS', payload: presets })
      } catch (error) {
        console.error('Failed to load settings:', error)
        // Use default settings on error
        dispatch({ type: 'SET_SETTINGS', payload: DEFAULT_SETTINGS })
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    loadInitialSettings()
  }, [])

  // Auto-save settings when they change (debounced)
  useEffect(() => {
    if (!state.isDirty) return

    const autoSaveTimeout = setTimeout(async () => {
      try {
        settingsManager.updateSettings(state.settings)
        await settingsManager.saveSettings()
        dispatch({ type: 'SET_LAST_SAVED', payload: new Date() })
      } catch (error) {
        console.error('Auto-save failed:', error)
      }
    }, 2000) // 2 second debounce

    return () => clearTimeout(autoSaveTimeout)
  }, [state.isDirty, state.settings]) // Include settings for the callback

  // Actions
  const actions: UserSettingsActions = {
    updateSettings: (updates: Partial<UserSettings>) => {
      // Validate before updating
      const validation = settingsManager.validateSettings(updates)
      dispatch({ type: 'SET_VALIDATION_RESULT', payload: validation })
      
      if (validation.isValid) {
        dispatch({ type: 'UPDATE_SETTINGS', payload: updates })
      }
    },

    updateCategory: <T extends SettingsCategory>(category: T, updates: Partial<UserSettings[T]>) => {
      // Validate category before updating
      const validation = settingsManager.validateSettings({ [category]: updates } as Partial<UserSettings>)
      dispatch({ type: 'SET_VALIDATION_RESULT', payload: validation })
      
      if (validation.isValid) {
        dispatch({ type: 'UPDATE_CATEGORY', payload: { category, updates } })
      }
    },

    resetSettings: () => {
      dispatch({ type: 'RESET_SETTINGS' })
    },

    resetCategory: (category: SettingsCategory) => {
      dispatch({ type: 'RESET_CATEGORY', payload: category })
    },

    saveSettings: async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })
        settingsManager.updateSettings(state.settings)
        await settingsManager.saveSettings()
        dispatch({ type: 'SET_LAST_SAVED', payload: new Date() })
      } catch (error) {
        console.error('Failed to save settings:', error)
        throw error
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },

    loadSettings: async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })
        await settingsManager.loadSettings()
        const settings = settingsManager.getSettings()
        dispatch({ type: 'SET_SETTINGS', payload: settings })
      } catch (error) {
        console.error('Failed to load settings:', error)
        throw error
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    },

    applyPreset: (presetId: string) => {
      const preset = state.availablePresets.find(p => p.id === presetId)
      if (preset) {
        settingsManager.applyPreset(preset)
        const updatedSettings = settingsManager.getSettings()
        dispatch({ type: 'SET_SETTINGS', payload: updatedSettings })
      }
    },

    createPreset: (name: string, description?: string) => {
      const preset = settingsManager.createPreset(name, description)
      const updatedPresets = settingsManager.getPresets()
      dispatch({ type: 'SET_PRESETS', payload: updatedPresets })
      return preset
    },

    deletePreset: (presetId: string) => {
      const success = settingsManager.deletePreset(presetId)
      if (success) {
        const updatedPresets = settingsManager.getPresets()
        dispatch({ type: 'SET_PRESETS', payload: updatedPresets })
      }
      return success
    },

    exportSettings: async () => {
      return await settingsManager.exportSettings()
    },

    importSettings: async (data: string) => {
      try {
        await settingsManager.importSettings(data)
        const settings = settingsManager.getSettings()
        dispatch({ type: 'SET_SETTINGS', payload: settings })
        
        const presets = settingsManager.getPresets()
        dispatch({ type: 'SET_PRESETS', payload: presets })
      } catch (error) {
        console.error('Failed to import settings:', error)
        throw error
      }
    },

    validateSettings: (settings?: Partial<UserSettings>) => {
      const settingsToValidate = settings || state.settings
      const validation = settingsManager.validateSettings(settingsToValidate)
      dispatch({ type: 'SET_VALIDATION_RESULT', payload: validation })
      return validation
    }
  }

  const contextValue: UserSettingsContextType = {
    ...state,
    actions
  }

  return (
    <UserSettingsContext.Provider value={contextValue}>
      {children}
    </UserSettingsContext.Provider>
  )
}

// Custom hook
export const useUserSettings = (): UserSettingsContextType => {
  const context = useContext(UserSettingsContext)
  
  if (!context) {
    throw new Error('useUserSettings must be used within a UserSettingsProvider')
  }
  
  return context
}

// Convenience hooks for specific categories
export const usePerformanceSettings = () => {
  const { settings, actions } = useUserSettings()
  return {
    settings: settings.performance,
    updateSettings: (updates: Partial<UserSettings['performance']>) => 
      actions.updateCategory('performance', updates),
    resetSettings: () => actions.resetCategory('performance')
  }
}

export const useDisplaySettings = () => {
  const { settings, actions } = useUserSettings()
  return {
    settings: settings.display,
    updateSettings: (updates: Partial<UserSettings['display']>) => 
      actions.updateCategory('display', updates),
    resetSettings: () => actions.resetCategory('display')
  }
}

export const useCameraSettings = () => {
  const { settings, actions } = useUserSettings()
  return {
    settings: settings.camera,
    updateSettings: (updates: Partial<UserSettings['camera']>) => 
      actions.updateCategory('camera', updates),
    resetSettings: () => actions.resetCategory('camera')
  }
}

export const useTeleportSettings = () => {
  const { settings, actions } = useUserSettings()
  return {
    settings: settings.teleport,
    updateSettings: (updates: Partial<UserSettings['teleport']>) => 
      actions.updateCategory('teleport', updates),
    resetSettings: () => actions.resetCategory('teleport')
  }
}