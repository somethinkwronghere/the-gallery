import React, { useState } from 'react'
import { Vector3, Euler } from 'three'
import { useDebug } from '../../systems/debug/DebugContext'
import { useCameraSystem } from '../../hooks/useCameraSystem'
import { CameraBookmark } from '../../types/debug'

export function BookmarkManager() {
  const { bookmarks, actions } = useDebug()
  const { 
    saveBookmark: saveCameraBookmark, 
    loadBookmark: loadCameraBookmark,
    bookmarks: cameraBookmarks,
    isTransitioning
  } = useCameraSystem()
  
  const [newBookmarkName, setNewBookmarkName] = useState('')
  const [newBookmarkDescription, setNewBookmarkDescription] = useState('')
  const [selectedBookmark, setSelectedBookmark] = useState<CameraBookmark | null>(null)
  const [useNewSystem, setUseNewSystem] = useState(true)

  const handleSaveBookmark = () => {
    if (!newBookmarkName.trim()) return

    if (useNewSystem) {
      // Use the new camera system
      saveCameraBookmark(newBookmarkName.trim(), newBookmarkDescription.trim() || undefined)
    } else {
      // Use the old debug system
      const position = new Vector3(0, 5, 10)
      const rotation = new Euler(0, 0, 0)

      actions.saveBookmark(
        newBookmarkName.trim(),
        position,
        rotation,
        newBookmarkDescription.trim() || undefined
      )
    }

    setNewBookmarkName('')
    setNewBookmarkDescription('')
  }

  const handleLoadBookmark = async (bookmark: CameraBookmark) => {
    if (useNewSystem) {
      // Find corresponding camera bookmark
      const cameraBookmark = cameraBookmarks.find(cb => cb.name === bookmark.name)
      if (cameraBookmark) {
        try {
          await loadCameraBookmark(cameraBookmark.id, {
            duration: 1500,
            easing: 'easeInOut'
          })
          setSelectedBookmark(bookmark)
          actions.log('info', 'bookmark', `Loaded camera bookmark: ${bookmark.name}`)
        } catch (error) {
          actions.log('error', 'bookmark', `Failed to load camera bookmark: ${error}`)
        }
      }
    } else {
      // Use the old debug system
      actions.loadBookmark(bookmark.id)
      setSelectedBookmark(bookmark)
      actions.log('info', 'bookmark', `Loaded bookmark: ${bookmark.name}`)
    }
  }

  const handleDeleteBookmark = (bookmarkId: string) => {
    if (selectedBookmark?.id === bookmarkId) {
      setSelectedBookmark(null)
    }
    actions.deleteBookmark(bookmarkId)
  }

  const formatPosition = (position: Vector3) => {
    return `(${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)})`
  }

  const formatRotation = (rotation: Euler) => {
    return `(${(rotation.x * 180 / Math.PI).toFixed(1)}°, ${(rotation.y * 180 / Math.PI).toFixed(1)}°, ${(rotation.z * 180 / Math.PI).toFixed(1)}°)`
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="bookmark-manager">
      <div className="debug-metric-group">
        <div className="bookmark-system-toggle">
          <label>
            <input
              type="checkbox"
              checked={useNewSystem}
              onChange={(e) => setUseNewSystem(e.target.checked)}
            />
            Use Enhanced Camera System
          </label>
          {isTransitioning && <span className="transition-indicator">🎯 Transitioning...</span>}
        </div>
      </div>
      
      <div className="debug-metric-group">
        <h3>Create Bookmark</h3>
        <div className="bookmark-form">
          <input
            type="text"
            placeholder="Bookmark name"
            value={newBookmarkName}
            onChange={(e) => setNewBookmarkName(e.target.value)}
            className="debug-input"
            maxLength={50}
          />
          <textarea
            placeholder="Description (optional)"
            value={newBookmarkDescription}
            onChange={(e) => setNewBookmarkDescription(e.target.value)}
            className="debug-textarea"
            rows={2}
            maxLength={200}
          />
          <button
            onClick={handleSaveBookmark}
            disabled={!newBookmarkName.trim()}
            className="debug-btn"
          >
            Save Current Position
          </button>
        </div>
      </div>

      <div className="debug-metric-group">
        <h3>Saved Bookmarks ({bookmarks.length})</h3>
        {bookmarks.length === 0 ? (
          <div className="empty-state">
            <p>No bookmarks saved yet.</p>
            <p>Save your current camera position to quickly return to it later.</p>
          </div>
        ) : (
          <div className="bookmark-list">
            {bookmarks.map(bookmark => (
              <div 
                key={bookmark.id} 
                className={`bookmark-item ${selectedBookmark?.id === bookmark.id ? 'selected' : ''}`}
              >
                <div className="bookmark-header">
                  <div className="bookmark-name">{bookmark.name}</div>
                  <div className="bookmark-actions">
                    <button
                      onClick={() => handleLoadBookmark(bookmark)}
                      className="debug-btn secondary"
                      title="Load bookmark"
                    >
                      📍
                    </button>
                    <button
                      onClick={() => handleDeleteBookmark(bookmark.id)}
                      className="debug-btn danger"
                      title="Delete bookmark"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                {bookmark.description && (
                  <div className="bookmark-description">
                    {bookmark.description}
                  </div>
                )}
                
                <div className="bookmark-details">
                  <div className="bookmark-detail">
                    <span className="detail-label">Position:</span>
                    <span className="detail-value">{formatPosition(bookmark.position)}</span>
                  </div>
                  <div className="bookmark-detail">
                    <span className="detail-label">Rotation:</span>
                    <span className="detail-value">{formatRotation(bookmark.rotation)}</span>
                  </div>
                  <div className="bookmark-detail">
                    <span className="detail-label">Created:</span>
                    <span className="detail-value">{formatDate(bookmark.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedBookmark && (
        <div className="debug-metric-group">
          <h3>Selected Bookmark</h3>
          <div className="selected-bookmark">
            <div className="bookmark-info">
              <div className="info-row">
                <span className="info-label">Name:</span>
                <span className="info-value">{selectedBookmark.name}</span>
              </div>
              {selectedBookmark.description && (
                <div className="info-row">
                  <span className="info-label">Description:</span>
                  <span className="info-value">{selectedBookmark.description}</span>
                </div>
              )}
              <div className="info-row">
                <span className="info-label">Position:</span>
                <span className="info-value">{formatPosition(selectedBookmark.position)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Rotation:</span>
                <span className="info-value">{formatRotation(selectedBookmark.rotation)}</span>
              </div>
            </div>
            <div className="bookmark-quick-actions">
              <button
                onClick={() => handleLoadBookmark(selectedBookmark)}
                className="debug-btn"
              >
                Go to Position
              </button>
              <button
                onClick={() => setSelectedBookmark(null)}
                className="debug-btn secondary"
              >
                Deselect
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="debug-metric-group">
        <h3>Bookmark Tips</h3>
        <div className="bookmark-tips">
          <div className="tip">
            💡 Bookmarks are automatically saved to localStorage
          </div>
          <div className="tip">
            🎯 Use bookmarks to quickly navigate to important areas
          </div>
          <div className="tip">
            📝 Add descriptions to remember what each bookmark is for
          </div>
        </div>
      </div>
    </div>
  )
}