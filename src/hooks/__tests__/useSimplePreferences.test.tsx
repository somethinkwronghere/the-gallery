import { renderHook, act } from '@testing-library/react'
import { useSimplePreferences } from '../useSimplePreferences'
import { simplePreferencesManager } from '../../utils/SimplePreferencesManager'

// Mock the preferences manager
jest.mock('../../utils/SimplePreferencesManager', () => ({
  simplePreferencesManager: {
    getPreferences: jest.fn(),
    addListener: jest.fn(),
    updatePreferences: jest.fn(),
    setQuality: jest.fn(),
    reset: jest.fn(),
    export: jest.fn(),
    import: jest.fn(),
    getQualitySettings: jest.fn()
  }
}))

const mockManager = simplePreferencesManager as jest.Mocked<typeof simplePreferencesManager>

describe('useSimplePreferences', () => {
  const mockPreferences = {
    quality: 'medium' as const,
    showFPS: false,
    showPerformanceStats: false,
    masterVolume: 0.8,
    fontSize: 'medium' as const,
    lastUpdated: '2023-01-01T00:00:00.000Z'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockManager.getPreferences.mockReturnValue(mockPreferences)
    mockManager.addListener.mockReturnValue(() => {})
  })

  it('should return current preferences', () => {
    const { result } = renderHook(() => useSimplePreferences())
    
    expect(result.current.preferences).toEqual(mockPreferences)
  })

  it('should update preferences', async () => {
    const { result } = renderHook(() => useSimplePreferences())
    
    await act(async () => {
      await result.current.updatePreferences({ showFPS: true })
    })
    
    expect(mockManager.updatePreferences).toHaveBeenCalledWith({ showFPS: true })
  })
})