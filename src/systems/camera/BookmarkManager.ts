import { Vector3, Euler } from 'three'
import { 
  CameraBookmarkExtended, 
  BookmarkManager as IBookmarkManager, 
  TeleportCategory,
  CameraTransitionOptions 
} from '../../types/camera'
import { CameraUtilities } from './CameraUtilities'

export class BookmarkManager implements IBookmarkManager {
  private bookmarks: CameraBookmarkExtended[] = []
  private cameraUtilities: CameraUtilities
  private bookmarkIdCounter = 0
  private storageKey = 'camera_bookmarks'

  constructor(cameraUtilities: CameraUtilities) {
    this.cameraUtilities = cameraUtilities
    this.loadFromStorage()
  }

  saveBookmark(name: string, description?: string): CameraBookmarkExtended {
    const currentState = this.cameraUtilities.getCurrentState()
    
    const bookmark: CameraBookmarkExtended = {
      id: `bookmark_${++this.bookmarkIdCounter}_${Date.now()}`,
      name: name.trim(),
      position: currentState.position.clone(),
      rotation: currentState.rotation.clone(),
      target: undefined,
      zoom: currentState.zoom,
      fov: currentState.fov,
      createdAt: new Date(),
      description: description?.trim(),
      tags: [],
      category: 'custom',
      thumbnail: undefined,
      isQuickAccess: false
    }

    this.bookmarks.push(bookmark)
    this.saveToStorage()

    console.log(`Bookmark saved: ${name}`, bookmark)
    return bookmark
  }

  async loadBookmark(id: string, options?: CameraTransitionOptions): Promise<void> {
    const bookmark = this.getBookmark(id)
    if (!bookmark) {
      throw new Error(`Bookmark not found: ${id}`)
    }

    const targetState = {
      position: bookmark.position.clone(),
      rotation: bookmark.rotation.clone(),
      zoom: bookmark.zoom,
      fov: bookmark.fov
    }

    await this.cameraUtilities.setState(targetState, options)
    console.log(`Bookmark loaded: ${bookmark.name}`)
  }

  deleteBookmark(id: string): boolean {
    const index = this.bookmarks.findIndex(b => b.id === id)
    if (index === -1) {
      return false
    }

    const bookmark = this.bookmarks[index]
    this.bookmarks.splice(index, 1)
    this.saveToStorage()

    console.log(`Bookmark deleted: ${bookmark.name}`)
    return true
  }

  updateBookmark(id: string, updates: Partial<CameraBookmarkExtended>): boolean {
    const bookmark = this.getBookmark(id)
    if (!bookmark) {
      return false
    }

    // Prevent updating certain fields
    const { id: _, createdAt: __, ...allowedUpdates } = updates
    Object.assign(bookmark, allowedUpdates)
    
    this.saveToStorage()
    console.log(`Bookmark updated: ${bookmark.name}`)
    return true
  }

  getBookmarks(category?: TeleportCategory): CameraBookmarkExtended[] {
    if (category) {
      return this.bookmarks.filter(b => b.category === category)
    }
    return [...this.bookmarks]
  }

  getBookmark(id: string): CameraBookmarkExtended | null {
    return this.bookmarks.find(b => b.id === id) || null
  }

  setQuickAccessBookmark(id: string, quickAccess: boolean): boolean {
    const bookmark = this.getBookmark(id)
    if (!bookmark) {
      return false
    }

    bookmark.isQuickAccess = quickAccess
    this.saveToStorage()
    return true
  }

  getQuickAccessBookmarks(): CameraBookmarkExtended[] {
    return this.bookmarks.filter(b => b.isQuickAccess)
  }

  exportBookmarks(): string {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      bookmarks: this.bookmarks.map(bookmark => ({
        ...bookmark,
        position: {
          x: bookmark.position.x,
          y: bookmark.position.y,
          z: bookmark.position.z
        },
        rotation: {
          x: bookmark.rotation.x,
          y: bookmark.rotation.y,
          z: bookmark.rotation.z
        }
      }))
    }

    return JSON.stringify(exportData, null, 2)
  }

  importBookmarks(data: string): boolean {
    try {
      const importData = JSON.parse(data)
      
      if (!importData.bookmarks || !Array.isArray(importData.bookmarks)) {
        throw new Error('Invalid bookmark data format')
      }

      const importedBookmarks: CameraBookmarkExtended[] = importData.bookmarks.map((b: any) => ({
        ...b,
        position: new Vector3(b.position.x, b.position.y, b.position.z),
        rotation: new Euler(b.rotation.x, b.rotation.y, b.rotation.z),
        createdAt: new Date(b.createdAt),
        id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }))

      // Add imported bookmarks to existing ones
      this.bookmarks.push(...importedBookmarks)
      this.saveToStorage()

      console.log(`Imported ${importedBookmarks.length} bookmarks`)
      return true
    } catch (error) {
      console.error('Failed to import bookmarks:', error)
      return false
    }
  }

  saveToStorage(): void {
    try {
      const data = {
        bookmarks: this.bookmarks.map(bookmark => ({
          ...bookmark,
          position: {
            x: bookmark.position.x,
            y: bookmark.position.y,
            z: bookmark.position.z
          },
          rotation: {
            x: bookmark.rotation.x,
            y: bookmark.rotation.y,
            z: bookmark.rotation.z
          },
          createdAt: bookmark.createdAt.toISOString()
        }))
      }

      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save bookmarks to storage:', error)
    }
  }

  loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (!stored) {
        return
      }

      const data = JSON.parse(stored)
      if (!data.bookmarks || !Array.isArray(data.bookmarks)) {
        return
      }

      this.bookmarks = data.bookmarks.map((b: any) => ({
        ...b,
        position: new Vector3(b.position.x, b.position.y, b.position.z),
        rotation: new Euler(b.rotation.x, b.rotation.y, b.rotation.z),
        createdAt: new Date(b.createdAt)
      }))

      // Update counter to avoid ID conflicts
      const maxId = Math.max(
        0,
        ...this.bookmarks
          .map(b => parseInt(b.id.split('_')[1]))
          .filter(id => !isNaN(id))
      )
      this.bookmarkIdCounter = maxId

      console.log(`Loaded ${this.bookmarks.length} bookmarks from storage`)
    } catch (error) {
      console.error('Failed to load bookmarks from storage:', error)
      this.bookmarks = []
    }
  }

  // Utility methods for bookmark management
  addTag(bookmarkId: string, tag: string): boolean {
    const bookmark = this.getBookmark(bookmarkId)
    if (!bookmark) {
      return false
    }

    if (!bookmark.tags.includes(tag)) {
      bookmark.tags.push(tag)
      this.saveToStorage()
    }
    return true
  }

  removeTag(bookmarkId: string, tag: string): boolean {
    const bookmark = this.getBookmark(bookmarkId)
    if (!bookmark) {
      return false
    }

    const index = bookmark.tags.indexOf(tag)
    if (index !== -1) {
      bookmark.tags.splice(index, 1)
      this.saveToStorage()
    }
    return true
  }

  searchBookmarksBy(query: string): CameraBookmarkExtended[] {
    const lowerQuery = query.toLowerCase()
    return this.bookmarks.filter(bookmark => 
      bookmark.name.toLowerCase().includes(lowerQuery) ||
      bookmark.description?.toLowerCase().includes(lowerQuery) ||
      bookmark.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  }

  getBookmarksByCategory(category: TeleportCategory): CameraBookmarkExtended[] {
    return this.bookmarks.filter(b => b.category === category)
  }

  clearAllBookmarks(): void {
    this.bookmarks = []
    this.saveToStorage()
    console.log('All bookmarks cleared')
  }

  getBookmarkStats(): {
    total: number
    byCategory: Record<TeleportCategory, number>
    quickAccess: number
    withTags: number
  } {
    const stats = {
      total: this.bookmarks.length,
      byCategory: {} as Record<TeleportCategory, number>,
      quickAccess: 0,
      withTags: 0
    }

    this.bookmarks.forEach(bookmark => {
      // Count by category
      stats.byCategory[bookmark.category] = (stats.byCategory[bookmark.category] || 0) + 1
      
      // Count quick access
      if (bookmark.isQuickAccess) {
        stats.quickAccess++
      }
      
      // Count with tags
      if (bookmark.tags.length > 0) {
        stats.withTags++
      }
    })

    return stats
  }
}