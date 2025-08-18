import { useEffect, useRef, useState } from 'react'
import { Vector3, Euler } from 'three'
import { cameraSystem } from '../systems/camera/CameraSystem'
import { CameraBookmarkExtended, TeleportPoint, CameraTransitionOptions } from '../types/camera'

export function useCameraSystem() {
  const [bookmarks, setBookmarks] = useState<CameraBookmarkExtended[]>([])
  const [teleportPoints, setTeleportPoints] = useState<TeleportPoint[]>([])
  const [isTransitioning, setIsTransitioning] = useState(false)
  const systemInitialized = useRef(false)

  // Initialize camera system (will be initialized from Canvas component)
  useEffect(() => {
    if (!systemInitialized.current) {
      // Load initial data if system is already initialized
      if (cameraSystem.utilities && (cameraSystem.utilities as any).camera) {
        setBookmarks(cameraSystem.bookmarks.getBookmarks())
        setTeleportPoints(cameraSystem.teleport.getTeleportPoints())
        systemInitialized.current = true
      }
    }
  }, [])

  // Bookmark functions
  const saveBookmark = (name: string, description?: string) => {
    try {
      const bookmark = cameraSystem.bookmarks.saveBookmark(name, description)
      setBookmarks(cameraSystem.bookmarks.getBookmarks())
      return bookmark
    } catch (error) {
      console.warn('Camera system not initialized yet')
      return null
    }
  }

  const loadBookmark = async (bookmarkId: string, options?: CameraTransitionOptions) => {
    if (!(cameraSystem.utilities as any).camera) {
      console.warn('Camera system not initialized yet')
      return
    }
    
    setIsTransitioning(true)
    try {
      await cameraSystem.bookmarks.loadBookmark(bookmarkId, options)
    } finally {
      setIsTransitioning(false)
    }
  }

  const deleteBookmark = (bookmarkId: string) => {
    const success = cameraSystem.bookmarks.deleteBookmark(bookmarkId)
    if (success) {
      setBookmarks(cameraSystem.bookmarks.getBookmarks())
    }
    return success
  }

  // Teleport functions
  const teleportTo = async (pointId: string, options?: CameraTransitionOptions) => {
    setIsTransitioning(true)
    try {
      await cameraSystem.teleport.teleportTo(pointId, options)
    } finally {
      setIsTransitioning(false)
    }
  }

  const quickTeleportTo = (pointId: string) => {
    cameraSystem.teleport.quickTeleportTo(pointId)
  }

  const teleportToPosition = async (position: Vector3, rotation?: Euler, options?: CameraTransitionOptions) => {
    setIsTransitioning(true)
    try {
      await cameraSystem.teleport.teleportToPosition(position, rotation, options)
    } finally {
      setIsTransitioning(false)
    }
  }

  const addTeleportPoint = (point: Omit<TeleportPoint, 'id' | 'createdAt'>) => {
    const newPoint = cameraSystem.teleport.addTeleportPoint(point)
    setTeleportPoints(cameraSystem.teleport.getTeleportPoints())
    return newPoint
  }

  const removeTeleportPoint = (pointId: string) => {
    const success = cameraSystem.teleport.removeTeleportPoint(pointId)
    if (success) {
      setTeleportPoints(cameraSystem.teleport.getTeleportPoints())
    }
    return success
  }

  // Camera utilities
  const getCurrentState = () => {
    try {
      return cameraSystem.utilities.getCurrentState()
    } catch (error) {
      console.warn('Camera system not initialized yet')
      return {
        position: new Vector3(0, 0, 0),
        rotation: new Euler(0, 0, 0),
        zoom: 1,
        fov: 75
      }
    }
  }

  const transitionTo = async (targetState: any, options?: CameraTransitionOptions) => {
    setIsTransitioning(true)
    try {
      await cameraSystem.utilities.transitionTo(targetState, options)
    } finally {
      setIsTransitioning(false)
    }
  }

  const lookAt = async (target: Vector3, options?: CameraTransitionOptions) => {
    setIsTransitioning(true)
    try {
      await cameraSystem.utilities.lookAt(target, options)
    } finally {
      setIsTransitioning(false)
    }
  }

  const shake = (intensity: number, duration: number) => {
    cameraSystem.utilities.shake(intensity, duration)
  }

  // Development tools
  const enableDevMode = () => {
    try {
      cameraSystem.enableDevMode()
    } catch (error) {
      console.warn('Camera system not initialized yet')
    }
  }

  const disableDevMode = () => {
    try {
      cameraSystem.disableDevMode()
    } catch (error) {
      console.warn('Camera system not initialized yet')
    }
  }

  const logCameraState = () => {
    try {
      cameraSystem.devTools.logCameraState()
    } catch (error) {
      console.warn('Camera system not initialized yet')
    }
  }

  // Map integration
  const teleportFromMap = async (mapPosition: { x: number, y: number }) => {
    setIsTransitioning(true)
    try {
      await cameraSystem.teleport.teleportFromMap(mapPosition)
    } finally {
      setIsTransitioning(false)
    }
  }

  const getMapPosition = (worldPosition: Vector3) => {
    return cameraSystem.teleport.getMapPosition(worldPosition)
  }

  // Convenience functions
  const saveCurrentPosition = (name: string, description?: string) => {
    const result = saveBookmark(name, description)
    if (result) {
      console.log(`Saved bookmark: ${name}`)
    }
    return result
  }

  const addCurrentPositionAsTeleportPoint = (name: string, category: string = 'custom', description?: string) => {
    return cameraSystem.addCurrentPositionAsTeleportPoint(name, category, description)
  }

  return {
    // State
    bookmarks,
    teleportPoints,
    isTransitioning,
    
    // Bookmark functions
    saveBookmark,
    loadBookmark,
    deleteBookmark,
    
    // Teleport functions
    teleportTo,
    quickTeleportTo,
    teleportToPosition,
    addTeleportPoint,
    removeTeleportPoint,
    teleportFromMap,
    getMapPosition,
    
    // Camera utilities
    getCurrentState,
    transitionTo,
    lookAt,
    shake,
    
    // Development tools
    enableDevMode,
    disableDevMode,
    logCameraState,
    
    // Convenience functions
    saveCurrentPosition,
    addCurrentPositionAsTeleportPoint,
    
    // System access
    system: cameraSystem
  }
}