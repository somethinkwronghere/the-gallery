import { Vector3, Euler } from 'three'

// Camera state interface
export interface CameraState {
  position: Vector3
  rotation: Euler
  target?: Vector3
  zoom?: number
  fov?: number
}

// Teleport point interface
export interface TeleportPoint {
  id: string
  name: string
  position: Vector3
  rotation?: Euler
  description?: string
  thumbnail?: string
  category: string
  enabled: boolean
  createdAt: Date
  tags: string[]
}

// Teleport categories
export type TeleportCategory = 'gallery' | 'artwork' | 'entrance' | 'viewpoint' | 'debug' | 'custom'

// Camera transition options
export interface CameraTransitionOptions {
  duration: number
  easing: 'linear' | 'easeInOut' | 'easeIn' | 'easeOut'
  lookAt?: Vector3
  onStart?: () => void
  onUpdate?: (progress: number) => void
  onComplete?: () => void
}

// Camera bookmark with extended properties
export interface CameraBookmarkExtended {
  id: string
  name: string
  position: Vector3
  rotation: Euler
  target?: Vector3
  zoom?: number
  fov?: number
  createdAt: Date
  description?: string
  tags: string[]
  category: TeleportCategory
  thumbnail?: string
  isQuickAccess: boolean
}

// Camera utilities interface
export interface CameraUtilities {
  // State management
  getCurrentState(): CameraState
  setState(state: CameraState, options?: CameraTransitionOptions): Promise<void>
  
  // Smooth transitions
  transitionTo(target: CameraState, options?: CameraTransitionOptions): Promise<void>
  stopTransition(): void
  isTransitioning(): boolean
  
  // Look at functionality
  lookAt(target: Vector3, options?: CameraTransitionOptions): Promise<void>
  
  // Orbit functionality
  orbitAround(center: Vector3, radius: number, angle: number): void
  
  // Shake effects
  shake(intensity: number, duration: number): void
  
  // Zoom functionality
  zoomTo(target: Vector3, distance: number, options?: CameraTransitionOptions): Promise<void>
}

// Teleport manager interface
export interface TeleportManager {
  // Teleport points management
  addTeleportPoint(point: Omit<TeleportPoint, 'id' | 'createdAt'>): TeleportPoint
  removeTeleportPoint(id: string): boolean
  updateTeleportPoint(id: string, updates: Partial<TeleportPoint>): boolean
  getTeleportPoints(category?: TeleportCategory): TeleportPoint[]
  getTeleportPoint(id: string): TeleportPoint | null
  
  // Teleportation
  teleportTo(pointId: string, options?: CameraTransitionOptions): Promise<void>
  teleportToPosition(position: Vector3, rotation?: Euler, options?: CameraTransitionOptions): Promise<void>
  
  // Quick teleport (instant)
  quickTeleportTo(pointId: string): void
  quickTeleportToPosition(position: Vector3, rotation?: Euler): void
  
  // UI integration
  showTeleportUI(visible: boolean): void
  isTeleportUIVisible(): boolean
  
  // Map integration
  teleportFromMap(mapPosition: { x: number, y: number }): Promise<void>
  getMapPosition(worldPosition: Vector3): { x: number, y: number }
}

// Bookmark manager interface
export interface BookmarkManager {
  // Bookmark management
  saveBookmark(name: string, description?: string): CameraBookmarkExtended
  loadBookmark(id: string, options?: CameraTransitionOptions): Promise<void>
  deleteBookmark(id: string): boolean
  updateBookmark(id: string, updates: Partial<CameraBookmarkExtended>): boolean
  getBookmarks(category?: TeleportCategory): CameraBookmarkExtended[]
  getBookmark(id: string): CameraBookmarkExtended | null
  
  // Quick access bookmarks
  setQuickAccessBookmark(id: string, quickAccess: boolean): boolean
  getQuickAccessBookmarks(): CameraBookmarkExtended[]
  
  // Import/Export
  exportBookmarks(): string
  importBookmarks(data: string): boolean
  
  // Storage
  saveToStorage(): void
  loadFromStorage(): void
}

// Development tools for camera
export interface CameraDevTools {
  // Predefined positions
  getPredefinedPositions(): TeleportPoint[]
  addPredefinedPosition(name: string, position: Vector3, rotation?: Euler): void
  
  // Quick navigation
  enableQuickNavigation(enabled: boolean): void
  setQuickNavigationKeys(keys: Record<string, string>): void
  
  // Camera debugging
  showCameraInfo(visible: boolean): void
  logCameraState(): void
  
  // Path recording
  startRecordingPath(): void
  stopRecordingPath(): TeleportPoint[]
  playbackPath(points: TeleportPoint[], options?: { speed: number, loop: boolean }): void
  
  // Cleanup
  dispose(): void
}

// Combined camera system interface
export interface CameraSystem {
  utilities: CameraUtilities
  teleport: TeleportManager
  bookmarks: BookmarkManager
  devTools: CameraDevTools
  
  // System control
  initialize(): void
  dispose(): void
  update(deltaTime: number): void
}

// Camera events
export interface CameraEvents {
  onPositionChange: (position: Vector3) => void
  onRotationChange: (rotation: Euler) => void
  onTransitionStart: (from: CameraState, to: CameraState) => void
  onTransitionComplete: (state: CameraState) => void
  onTeleport: (point: TeleportPoint) => void
  onBookmarkSaved: (bookmark: CameraBookmarkExtended) => void
  onBookmarkLoaded: (bookmark: CameraBookmarkExtended) => void
}