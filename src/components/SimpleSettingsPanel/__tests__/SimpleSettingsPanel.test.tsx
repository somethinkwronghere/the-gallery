import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { SimpleSettingsPanel } from '../SimpleSettingsPanel'

// Mock hooks
jest.mock('../../../hooks/useSimplePreferences', () => ({
  useSimplePreferences: () => ({
    preferences: {
      quality: 'medium',
      showFPS: false,
      showPerformanceStats: false,
      masterVolume: 0.8,
      fontSize: 'medium',
      lastUpdated: '2023-01-01T00:00:00.000Z'
    },
    isLoading: false,
    updatePreferences: jest.fn(),
    setQuality: jest.fn(),
    reset: jest.fn(),
    exportPreferences: jest.fn(() => '{}'),
    importPreferences: jest.fn(() => true)
  })
}))

jest.mock('../../../hooks/useSimpleErrorHandler', () => ({
  useSimpleErrorHandler: () => ({
    safeExecute: jest.fn((fn) => fn()),
    showMessage: jest.fn()
  })
}))

describe('SimpleSettingsPanel', () => {
  const mockOnClose = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render when visible', () => {
    render(<SimpleSettingsPanel visible={true} onClose={mockOnClose} />)
    
    expect(screen.getByText('Ayarlar')).toBeInTheDocument()
    expect(screen.getByText('🎮 Kalite Ayarları')).toBeInTheDocument()
  })

  it('should not render when not visible', () => {
    render(<SimpleSettingsPanel visible={false} onClose={mockOnClose} />)
    
    expect(screen.queryByText('Ayarlar')).not.toBeInTheDocument()
  })

  it('should call onClose when close button is clicked', () => {
    render(<SimpleSettingsPanel visible={true} onClose={mockOnClose} />)
    
    const closeButton = screen.getByTitle('Kapat')
    fireEvent.click(closeButton)
    
    expect(mockOnClose).toHaveBeenCalled()
  })
})