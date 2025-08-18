import { Vector3, Euler } from 'three'
import { BookmarkManager } from '../BookmarkManager'
import { CameraUtilities } from '../CameraUtilities'

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}
Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage
})

// Mock console methods
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation()
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation()

describe('BookmarkManager', () => {
  let bookmarkManager: BookmarkManager
  let mockCameraUtilities: jest.Mocked<CameraUtilities>

  beforeEach(() => {
    // Create mock camera utilities
    mockCameraUtilities = {
      getCurrentState: jest.fn(),
      setState: jest.fn(),
      transitionTo: jest.fn(),
      lookAt: jest.fn(),
      orbitAround: jest.fn(),
      shake: jest.fn(),
      zoomTo: jest.fn(),
      stopTransition: jest.fn(),
      isTransitioning: jest.fn(),
      setCamera: jest.fn(),
      dispose: jest.fn()
    } as any

    // Mock current state
    mockCameraUtilities.getCurrentState.mockReturnValue({
      position: new Vector3(0, 5, 10),
      rotation: new Euler(0, 0, 0),
      zoom: 1,
      fov: 75
    })

    mockLocalStorage.getItem.mockReturnValue(null)
    
    bookmarkManager = new BookmarkManager(mockCameraUtilities)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('saveBookmark', () => {
    it('should save a bookmark with current camera state', () => {
      const name = 'Test Bookmark'
      const description = 'Test description'

      const bookmark = bookmarkManager.saveBookmark(name, description)

      expect(bookmark.name).toBe(name)
      expect(bookmark.description).toBe(description)
      expect(bookmark.position).toEqual(new Vector3(0, 5, 10))
      expect(bookmark.rotation).toEqual(new Euler(0, 0, 0))
      expect(bookmark.category).toBe('custom')
      expect(bookmark.isQuickAccess).toBe(false)
      expect(bookmark.id).toMatch(/^bookmark_\d+_\d+$/)
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })

    it('should trim whitespace from name and description', () => {
      const bookmark = bookmarkManager.saveBookmark('  Test  ', '  Description  ')

      expect(bookmark.name).toBe('Test')
      expect(bookmark.description).toBe('Description')
    })

    it('should handle undefined description', () => {
      const bookmark = bookmarkManager.saveBookmark('Test')

      expect(bookmark.description).toBeUndefined()
    })
  })

  describe('loadBookmark', () => {
    it('should load bookmark and set camera state', async () => {
      const bookmark = bookmarkManager.saveBookmark('Test', 'Description')
      
      await bookmarkManager.loadBookmark(bookmark.id)

      expect(mockCameraUtilities.setState).toHaveBeenCalledWith(
        {
          position: bookmark.position,
          rotation: bookmark.rotation,
          zoom: bookmark.zoom,
          fov: bookmark.fov
        },
        undefined
      )
    })

    it('should load bookmark with transition options', async () => {
      const bookmark = bookmarkManager.saveBookmark('Test')
      const options = { duration: 1000, easing: 'easeInOut' as const }
      
      await bookmarkManager.loadBookmark(bookmark.id, options)

      expect(mockCameraUtilities.setState).toHaveBeenCalledWith(
        expect.any(Object),
        options
      )
    })

    it('should throw error for non-existent bookmark', async () => {
      await expect(bookmarkManager.loadBookmark('non-existent'))
        .rejects.toThrow('Bookmark not found: non-existent')
    })
  })

  describe('deleteBookmark', () => {
    it('should delete existing bookmark', () => {
      const bookmark = bookmarkManager.saveBookmark('Test')
      
      const result = bookmarkManager.deleteBookmark(bookmark.id)

      expect(result).toBe(true)
      expect(bookmarkManager.getBookmarks()).toHaveLength(0)
      expect(mockLocalStorage.setItem).toHaveBeenCalled()
    })

    it('should return false for non-existent bookmark', () => {
      const result = bookmarkManager.deleteBookmark('non-existent')

      expect(result).toBe(false)
    })
  })

  describe('updateBookmark', () => {
    it('should update bookmark properties', () => {
      const bookmark = bookmarkManager.saveBookmark('Test')
      
      const result = bookmarkManager.updateBookmark(bookmark.id, {
        name: 'Updated Name',
        description: 'Updated Description',
        isQuickAccess: true
      })

      expect(result).toBe(true)
      
      const updatedBookmark = bookmarkManager.getBookmark(bookmark.id)
      expect(updatedBookmark?.name).toBe('Updated Name')
      expect(updatedBookmark?.description).toBe('Updated Description')
      expect(updatedBookmark?.isQuickAccess).toBe(true)
    })

    it('should not update protected fields', () => {
      const bookmark = bookmarkManager.saveBookmark('Test')
      const originalId = bookmark.id
      const originalCreatedAt = bookmark.createdAt
      
      bookmarkManager.updateBookmark(bookmark.id, {
        id: 'new-id',
        createdAt: new Date('2020-01-01')
      } as any)

      const updatedBookmark = bookmarkManager.getBookmark(bookmark.id)
      expect(updatedBookmark?.id).toBe(originalId)
      expect(updatedBookmark?.createdAt).toEqual(originalCreatedAt)
    })

    it('should return false for non-existent bookmark', () => {
      const result = bookmarkManager.updateBookmark('non-existent', { name: 'Test' })

      expect(result).toBe(false)
    })
  })

  describe('getBookmarks', () => {
    it('should return all bookmarks', () => {
      bookmarkManager.saveBookmark('Test 1')
      bookmarkManager.saveBookmark('Test 2')

      const bookmarks = bookmarkManager.getBookmarks()

      expect(bookmarks).toHaveLength(2)
    })

    it('should filter by category', () => {
      const bookmark1 = bookmarkManager.saveBookmark('Test 1')
      const bookmark2 = bookmarkManager.saveBookmark('Test 2')
      
      bookmarkManager.updateBookmark(bookmark1.id, { category: 'gallery' })
      bookmarkManager.updateBookmark(bookmark2.id, { category: 'artwork' })

      const galleryBookmarks = bookmarkManager.getBookmarks('gallery')
      const artworkBookmarks = bookmarkManager.getBookmarks('artwork')

      expect(galleryBookmarks).toHaveLength(1)
      expect(artworkBookmarks).toHaveLength(1)
      expect(galleryBookmarks[0].name).toBe('Test 1')
      expect(artworkBookmarks[0].name).toBe('Test 2')
    })
  })

  describe('quick access bookmarks', () => {
    it('should set and get quick access bookmarks', () => {
      const bookmark = bookmarkManager.saveBookmark('Test')
      
      const result = bookmarkManager.setQuickAccessBookmark(bookmark.id, true)
      expect(result).toBe(true)

      const quickAccessBookmarks = bookmarkManager.getQuickAccessBookmarks()
      expect(quickAccessBookmarks).toHaveLength(1)
      expect(quickAccessBookmarks[0].id).toBe(bookmark.id)
    })

    it('should return false for non-existent bookmark', () => {
      const result = bookmarkManager.setQuickAccessBookmark('non-existent', true)
      expect(result).toBe(false)
    })
  })

  describe('import/export', () => {
    it('should export bookmarks as JSON', () => {
      bookmarkManager.saveBookmark('Test 1', 'Description 1')
      bookmarkManager.saveBookmark('Test 2', 'Description 2')

      const exportData = bookmarkManager.exportBookmarks()
      const parsed = JSON.parse(exportData)

      expect(parsed.version).toBe('1.0')
      expect(parsed.bookmarks).toHaveLength(2)
      expect(parsed.bookmarks[0].name).toBe('Test 1')
      expect(parsed.bookmarks[1].name).toBe('Test 2')
    })

    it('should import bookmarks from JSON', () => {
      const importData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        bookmarks: [
          {
            name: 'Imported 1',
            description: 'Imported description',
            position: { x: 1, y: 2, z: 3 },
            rotation: { x: 0.1, y: 0.2, z: 0.3 },
            category: 'gallery',
            isQuickAccess: false,
            tags: ['imported'],
            createdAt: new Date().toISOString()
          }
        ]
      }

      const result = bookmarkManager.importBookmarks(JSON.stringify(importData))

      expect(result).toBe(true)
      const bookmarks = bookmarkManager.getBookmarks()
      expect(bookmarks).toHaveLength(1)
      expect(bookmarks[0].name).toBe('Imported 1')
      expect(bookmarks[0].position).toEqual(new Vector3(1, 2, 3))
    })

    it('should handle invalid import data', () => {
      const result = bookmarkManager.importBookmarks('invalid json')

      expect(result).toBe(false)
      expect(mockConsoleError).toHaveBeenCalled()
    })
  })

  describe('storage', () => {
    it('should save to localStorage', () => {
      bookmarkManager.saveBookmark('Test')

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'camera_bookmarks',
        expect.stringContaining('Test')
      )
    })

    it('should load from localStorage', () => {
      const storedData = {
        bookmarks: [
          {
            id: 'test-id',
            name: 'Stored Bookmark',
            position: { x: 1, y: 2, z: 3 },
            rotation: { x: 0, y: 0, z: 0 },
            category: 'custom',
            isQuickAccess: false,
            tags: [],
            createdAt: new Date().toISOString()
          }
        ]
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedData))

      const newManager = new BookmarkManager(mockCameraUtilities)
      const bookmarks = newManager.getBookmarks()

      expect(bookmarks).toHaveLength(1)
      expect(bookmarks[0].name).toBe('Stored Bookmark')
    })

    it('should handle storage errors gracefully', () => {
      mockLocalStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      // Should not throw
      expect(() => bookmarkManager.saveBookmark('Test')).not.toThrow()
      expect(mockConsoleError).toHaveBeenCalled()
    })
  })

  describe('utility methods', () => {
    it('should add and remove tags', () => {
      const bookmark = bookmarkManager.saveBookmark('Test')
      
      bookmarkManager.addTag(bookmark.id, 'important')
      bookmarkManager.addTag(bookmark.id, 'scenic')

      const updatedBookmark = bookmarkManager.getBookmark(bookmark.id)
      expect(updatedBookmark?.tags).toContain('important')
      expect(updatedBookmark?.tags).toContain('scenic')

      bookmarkManager.removeTag(bookmark.id, 'important')
      const finalBookmark = bookmarkManager.getBookmark(bookmark.id)
      expect(finalBookmark?.tags).not.toContain('important')
      expect(finalBookmark?.tags).toContain('scenic')
    })

    it('should search bookmarks', () => {
      bookmarkManager.saveBookmark('Gallery View', 'Main gallery overview')
      bookmarkManager.saveBookmark('Artwork Detail', 'Close-up of painting')
      
      const results = bookmarkManager.searchBookmarksBy('gallery')
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('Gallery View')
    })

    it('should get bookmark statistics', () => {
      const bookmark1 = bookmarkManager.saveBookmark('Test 1')
      const bookmark2 = bookmarkManager.saveBookmark('Test 2')
      
      bookmarkManager.updateBookmark(bookmark1.id, { category: 'gallery' })
      bookmarkManager.setQuickAccessBookmark(bookmark1.id, true)
      bookmarkManager.addTag(bookmark2.id, 'important')

      const stats = bookmarkManager.getBookmarkStats()

      expect(stats.total).toBe(2)
      expect(stats.quickAccess).toBe(1)
      expect(stats.withTags).toBe(1)
      expect(stats.byCategory.gallery).toBe(1)
      expect(stats.byCategory.custom).toBe(1)
    })

    it('should clear all bookmarks', () => {
      bookmarkManager.saveBookmark('Test 1')
      bookmarkManager.saveBookmark('Test 2')

      bookmarkManager.clearAllBookmarks()

      expect(bookmarkManager.getBookmarks()).toHaveLength(0)
    })
  })
})