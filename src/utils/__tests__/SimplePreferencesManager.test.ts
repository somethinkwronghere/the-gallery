import { SimplePreferencesManager } from '../SimplePreferencesManager'
import { DEFAULT_SIMPLE_PREFERENCES } from '../../types/simpleSettings'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { describe } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('SimplePreferencesManager', () => {
  let manager: SimplePreferencesManager

  beforeEach(() => {
    jest.clearAllMocks()
    manager = new SimplePreferencesManager()
  })

  describe('initialization', () => {
    it('should initialize with default preferences', () => {
      const preferences = manager.getPreferences()
      expect(preferences.quality).toBe('medium')
      expect(preferences.showFPS).toBe(false)
      expect(preferences.masterVolume).toBe(0.8)
    })

    it('should load preferences from localStorage if available', () => {
      const storedPrefs = {
        quality: 'high',
        showFPS: true,
        masterVolume: 0.5,
        lastUpdated: '2023-01-01T00:00:00.000Z'
      }
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedPrefs))
      
      const newManager = new SimplePreferencesManager()
      const preferences = newManager.getPreferences()
      
      expect(preferences.quality).toBe('high')
      expect(preferences.showFPS).toBe(true)
      expect(preferences.masterVolume).toBe(0.5)
    })
  })

  describe('updatePreferences', () => {
    it('should update preferences and save to localStorage', () => {
      manager.updatePreferences({ quality: 'high', showFPS: true })
      
      const preferences = manager.getPreferences()
      expect(preferences.quality).toBe('high')
      expect(preferences.showFPS).toBe(true)
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })

    it('should update lastUpdated timestamp', () => {
      const beforeUpdate = new Date()
      manager.updatePreferences({ quality: 'low' })
      const afterUpdate = new Date()
      
      const preferences = manager.getPreferences()
      const updatedTime = new Date(preferences.lastUpdated)
      expect(updatedTime.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime())
      expect(updatedTime.getTime()).toBeLessThanOrEqual(afterUpdate.getTime())
    })
  })

  describe('setQuality', () => {
    it('should set quality level', () => {
      manager.setQuality('high')
      
      const preferences = manager.getPreferences()
      expect(preferences.quality).toBe('high')
    })
  })

  describe('getQualitySettings', () => {
    it('should return settings for current quality', () => {
      manager.setQuality('low')
      const settings = manager.getQualitySettings()
      
      expect(settings.targetFPS).toBe(30)
      expect(settings.shadowQuality).toBe('off')
      expect(settings.antialiasing).toBe(false)
    })

    it('should return settings for specified quality', () => {
      const settings = manager.getQualitySettings('high')
      
      expect(settings.targetFPS).toBe(60)
      expect(settings.shadowQuality).toBe('high')
      expect(settings.antialiasing).toBe(true)
    })
  })

  describe('reset', () => {
    it('should reset to default preferences', () => {
      manager.updatePreferences({ quality: 'high', showFPS: true })
      manager.reset()
      
      const preferences = manager.getPreferences()
      expect(preferences.quality).toBe(DEFAULT_SIMPLE_PREFERENCES.quality)
      expect(preferences.showFPS).toBe(DEFAULT_SIMPLE_PREFERENCES.showFPS)
    })
  })

  describe('export/import', () => {
    it('should export preferences as JSON string', () => {
      manager.updatePreferences({ quality: 'high', showFPS: true })
      const exported = manager.export()
      
      const parsed = JSON.parse(exported)
      expect(parsed.quality).toBe('high')
      expect(parsed.showFPS).toBe(true)
    })

    it('should import valid preferences', () => {
      const importData = JSON.stringify({
        quality: 'low',
        showFPS: true,
        masterVolume: 0.3
      })
      
      const success = manager.import(importData)
      expect(success).toBe(true)
      
      const preferences = manager.getPreferences()
      expect(preferences.quality).toBe('low')
      expect(preferences.showFPS).toBe(true)
      expect(preferences.masterVolume).toBe(0.3)
    })

    it('should reject invalid import data', () => {
      const success = manager.import('invalid json')
      expect(success).toBe(false)
    })
  })

  describe('listeners', () => {
    it('should notify listeners on preference changes', () => {
      const listener = jest.fn()
      const unsubscribe = manager.addListener(listener)
      
      manager.updatePreferences({ quality: 'high' })
      
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ quality: 'high' })
      )
      
      unsubscribe()
    })

    it('should remove listeners when unsubscribed', () => {
      const listener = jest.fn()
      const unsubscribe = manager.addListener(listener)
      
      unsubscribe()
      manager.updatePreferences({ quality: 'high' })
      
      expect(listener).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage full')
      })
      
      // Should not throw
      expect(() => {
        manager.updatePreferences({ quality: 'high' })
      }).not.toThrow()
    })

    it('should handle corrupted localStorage data', () => {
      localStorageMock.getItem.mockReturnValue('corrupted json')
      
      // Should not throw and use defaults
      expect(() => {
        new SimplePreferencesManager()
      }).not.toThrow()
    })
  })
})