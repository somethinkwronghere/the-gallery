import { Camera, Vector3, Euler } from 'three'
import { CameraSystem as ICameraSystem, CameraDevTools, TeleportPoint } from '../../types/camera'
import { CameraUtilities } from './CameraUtilities'
import { BookmarkManager } from './BookmarkManager'
import { TeleportManager } from './TeleportManager'

class CameraDevToolsImpl implements CameraDevTools {
  private cameraUtilities: CameraUtilities
  private teleportManager: TeleportManager
  private predefinedPositions: TeleportPoint[] = []
  private quickNavEnabled = false
  private quickNavKeys: Record<string, string> = {}
  private cameraInfoVisible = false
  private pathRecording = false
  private recordedPath: TeleportPoint[] = []
  private recordingInterval: number | null = null

  constructor(cameraUtilities: CameraUtilities, teleportManager: TeleportManager) {
    this.cameraUtilities = cameraUtilities
    this.teleportManager = teleportManager
    this.initializePredefinedPositions()
    this.setupDefaultQuickNavKeys()
  }

  private initializePredefinedPositions(): void {
    this.predefinedPositions = [
      {
        id: 'dev_entrance',
        name: 'Dev: Entrance',
        position: new Vector3(0, 6, 22),
        rotation: new Euler(0, 0, 0),
        description: 'Development entrance position',
        category: 'debug',
        enabled: true,
        createdAt: new Date(),
        tags: ['dev', 'entrance']
      },
      {
        id: 'dev_overview',
        name: 'Dev: Overview',
        position: new Vector3(0, 15, 15),
        rotation: new Euler(-0.3, 0, 0),
        description: 'Development overview position',
        category: 'debug',
        enabled: true,
        createdAt: new Date(),
        tags: ['dev', 'overview']
      },
      {
        id: 'dev_debug',
        name: 'Dev: Debug Corner',
        position: new Vector3(20, 8, 20),
        rotation: new Euler(0, -Math.PI / 4, 0),
        description: 'Development debug position',
        category: 'debug',
        enabled: true,
        createdAt: new Date(),
        tags: ['dev', 'debug']
      }
    ]
  }

  private setupDefaultQuickNavKeys(): void {
    this.quickNavKeys = {
      'Digit1': 'dev_entrance',
      'Digit2': 'dev_overview',
      'Digit3': 'dev_debug'
    }
  }

  getPredefinedPositions(): TeleportPoint[] {
    return [...this.predefinedPositions]
  }

  addPredefinedPosition(name: string, position: Vector3, rotation?: Euler): void {
    const point: TeleportPoint = {
      id: `dev_custom_${Date.now()}`,
      name: `Dev: ${name}`,
      position: position.clone(),
      rotation: rotation?.clone() || new Euler(0, 0, 0),
      description: `Custom development position: ${name}`,
      category: 'debug',
      enabled: true,
      createdAt: new Date(),
      tags: ['dev', 'custom']
    }

    this.predefinedPositions.push(point)
    console.log(`Added predefined position: ${name}`)
  }

  enableQuickNavigation(enabled: boolean): void {
    this.quickNavEnabled = enabled
    
    if (enabled) {
      this.setupQuickNavListeners()
    } else {
      this.removeQuickNavListeners()
    }
    
    console.log(`Quick navigation ${enabled ? 'enabled' : 'disabled'}`)
  }

  private setupQuickNavListeners(): void {
    document.addEventListener('keydown', this.handleQuickNavKey)
  }

  private removeQuickNavListeners(): void {
    document.removeEventListener('keydown', this.handleQuickNavKey)
  }

  private handleQuickNavKey = (event: KeyboardEvent): void => {
    if (!this.quickNavEnabled) return
    
    // Only trigger on Ctrl + number keys
    if (!event.ctrlKey) return
    
    const pointId = this.quickNavKeys[event.code]
    if (!pointId) return
    
    event.preventDefault()
    
    // Try predefined positions first
    const predefinedPoint = this.predefinedPositions.find(p => p.id === pointId)
    if (predefinedPoint) {
      this.teleportManager.quickTeleportToPosition(predefinedPoint.position, predefinedPoint.rotation)
      console.log(`Quick nav to: ${predefinedPoint.name}`)
      return
    }
    
    // Try teleport points
    this.teleportManager.quickTeleportTo(pointId)
  }

  setQuickNavigationKeys(keys: Record<string, string>): void {
    this.quickNavKeys = { ...keys }
    console.log('Quick navigation keys updated:', keys)
  }

  showCameraInfo(visible: boolean): void {
    this.cameraInfoVisible = visible
    
    if (visible) {
      this.startCameraInfoDisplay()
    } else {
      this.stopCameraInfoDisplay()
    }
  }

  private startCameraInfoDisplay(): void {
    // This would typically create a UI element showing camera info
    // For now, we'll just log periodically
    const logInfo = () => {
      if (this.cameraInfoVisible) {
        this.logCameraState()
        setTimeout(logInfo, 1000)
      }
    }
    logInfo()
  }

  private stopCameraInfoDisplay(): void {
    // Stop the camera info display
  }

  logCameraState(): void {
    const state = this.cameraUtilities.getCurrentState()
    console.log('Camera State:', {
      position: `(${state.position.x.toFixed(2)}, ${state.position.y.toFixed(2)}, ${state.position.z.toFixed(2)})`,
      rotation: `(${(state.rotation.x * 180 / Math.PI).toFixed(1)}°, ${(state.rotation.y * 180 / Math.PI).toFixed(1)}°, ${(state.rotation.z * 180 / Math.PI).toFixed(1)}°)`,
      zoom: state.zoom,
      fov: state.fov
    })
  }

  startRecordingPath(): void {
    if (this.pathRecording) {
      console.warn('Path recording already in progress')
      return
    }

    this.pathRecording = true
    this.recordedPath = []
    
    // Record camera position every 500ms
    this.recordingInterval = window.setInterval(() => {
      const state = this.cameraUtilities.getCurrentState()
      const point: TeleportPoint = {
        id: `path_${Date.now()}`,
        name: `Path Point ${this.recordedPath.length + 1}`,
        position: state.position.clone(),
        rotation: state.rotation.clone(),
        description: `Recorded path point`,
        category: 'debug',
        enabled: true,
        createdAt: new Date(),
        tags: ['path', 'recorded']
      }
      
      this.recordedPath.push(point)
    }, 500)
    
    console.log('Started recording camera path')
  }

  stopRecordingPath(): TeleportPoint[] {
    if (!this.pathRecording) {
      console.warn('No path recording in progress')
      return []
    }

    this.pathRecording = false
    
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval)
      this.recordingInterval = null
    }
    
    console.log(`Stopped recording path. Recorded ${this.recordedPath.length} points`)
    return [...this.recordedPath]
  }

  async playbackPath(points: TeleportPoint[], options: { speed: number, loop: boolean } = { speed: 1, loop: false }): Promise<void> {
    if (points.length === 0) {
      console.warn('No points to playback')
      return
    }

    const playOnce = async () => {
      for (let i = 0; i < points.length; i++) {
        const point = points[i]
        const duration = 1000 / options.speed // Adjust duration based on speed
        
        await this.cameraUtilities.transitionTo(
          {
            position: point.position,
            rotation: point.rotation || new Euler(0, 0, 0)
          },
          {
            duration,
            easing: 'linear'
          }
        )
      }
    }

    await playOnce()
    
    if (options.loop) {
      // For simplicity, we'll just play once. A full implementation would handle looping
      console.log('Path playback completed (loop not implemented)')
    }
  }

  dispose(): void {
    this.removeQuickNavListeners()
    this.stopCameraInfoDisplay()
    
    if (this.recordingInterval) {
      clearInterval(this.recordingInterval)
    }
  }
}

export class CameraSystem implements ICameraSystem {
  public utilities: CameraUtilities
  public teleport: TeleportManager
  public bookmarks: BookmarkManager
  public devTools: CameraDevTools
  
  private camera: Camera | null = null
  private initialized = false

  constructor() {
    this.utilities = new CameraUtilities()
    this.bookmarks = new BookmarkManager(this.utilities)
    this.teleport = new TeleportManager(this.utilities)
    this.devTools = new CameraDevToolsImpl(this.utilities, this.teleport)
  }

  initialize(camera?: Camera): void {
    if (camera) {
      this.camera = camera
      this.utilities.setCamera(camera)
    }
    
    this.initialized = true
    console.log('Camera system initialized')

    // Apply any pending last teleport resume once camera is ready
    try {
      this.teleport.applyPendingLastTeleport()
    } catch {}
  }

  setCamera(camera: Camera): void {
    this.camera = camera
    this.utilities.setCamera(camera)
    
    if (!this.initialized) {
      this.initialize()
    }
  }

  dispose(): void {
    this.utilities.dispose()
    this.teleport.dispose()
    this.devTools.dispose()
    
    this.initialized = false
    console.log('Camera system disposed')
  }

  update(deltaTime: number): void {
    // Update any time-based functionality here
    // For now, this is mostly handled by the individual managers
  }

  // Convenience methods
  async teleportToBookmark(bookmarkId: string): Promise<void> {
    await this.bookmarks.loadBookmark(bookmarkId, {
      duration: 1500,
      easing: 'easeInOut'
    })
  }

  saveCurrentPositionAsBookmark(name: string, description?: string) {
    return this.bookmarks.saveBookmark(name, description)
  }

  addCurrentPositionAsTeleportPoint(name: string, category: string = 'custom', description?: string) {
    const currentState = this.utilities.getCurrentState()
    return this.teleport.addTeleportPoint({
      name,
      position: currentState.position,
      rotation: currentState.rotation,
      description,
      category: category as any,
      enabled: true,
      tags: ['user-created']
    })
  }

  // Development shortcuts
  enableDevMode(): void {
    this.devTools.enableQuickNavigation(true)
    this.devTools.showCameraInfo(true)
    console.log('Camera development mode enabled')
    console.log('Quick navigation: Ctrl + 1/2/3 for predefined positions')
  }

  disableDevMode(): void {
    this.devTools.enableQuickNavigation(false)
    this.devTools.showCameraInfo(false)
    console.log('Camera development mode disabled')
  }
}

// Singleton instance
export const cameraSystem = new CameraSystem()