import { Vector3, Euler } from 'three'
import { 
  TeleportPoint, 
  TeleportManager as ITeleportManager, 
  TeleportCategory,
  CameraTransitionOptions 
} from '../../types/camera'
import { CameraUtilities } from './CameraUtilities'

export class TeleportManager implements ITeleportManager {
  private teleportPoints: TeleportPoint[] = []
  private cameraUtilities: CameraUtilities
  private teleportIdCounter = 0
  private storageKey = 'teleport_points'
  private uiVisible = false
  private mapBounds = {
    minX: -50,
    maxX: 50,
    minZ: -50,
    maxZ: 50
  }

  constructor(cameraUtilities: CameraUtilities) {
    this.cameraUtilities = cameraUtilities
    this.loadFromStorage()
    this.initializePredefinedPoints()
  }

  private initializePredefinedPoints(): void {
    // Add some predefined teleport points for the gallery
    const predefinedPoints = [
      {
        name: 'Gallery Entrance',
        position: new Vector3(0, 6, 22),
        rotation: new Euler(0, 0, 0),
        description: 'Main entrance to the gallery',
        category: 'entrance' as TeleportCategory,
        enabled: true,
        tags: ['entrance', 'start']
      },
      {
        name: 'Gallery Center',
        position: new Vector3(0, 6, 0),
        rotation: new Euler(0, 0, 0),
        description: 'Center of the main gallery space',
        category: 'gallery' as TeleportCategory,
        enabled: true,
        tags: ['center', 'overview']
      },
      {
        name: 'Art Viewing Area',
        position: new Vector3(-10, 6, -5),
        rotation: new Euler(0, Math.PI / 4, 0),
        description: 'Optimal position for viewing artworks',
        category: 'viewpoint' as TeleportCategory,
        enabled: true,
        tags: ['art', 'viewing']
      },
      {
        name: 'Upper Gallery',
        position: new Vector3(0, 12, 0),
        rotation: new Euler(-0.2, 0, 0),
        description: 'Elevated view of the gallery',
        category: 'viewpoint' as TeleportCategory,
        enabled: true,
        tags: ['elevated', 'overview']
      }
    ]

    // Only add predefined points if no teleport points exist
    if (this.teleportPoints.length === 0) {
      predefinedPoints.forEach(point => {
        this.addTeleportPoint(point)
      })
    }
  }

  addTeleportPoint(point: Omit<TeleportPoint, 'id' | 'createdAt'>): TeleportPoint {
    const teleportPoint: TeleportPoint = {
      ...point,
      id: `teleport_${++this.teleportIdCounter}_${Date.now()}`,
      createdAt: new Date(),
      position: point.position.clone(),
      rotation: point.rotation?.clone() || new Euler(0, 0, 0)
    }

    this.teleportPoints.push(teleportPoint)
    this.saveToStorage()

    console.log(`Teleport point added: ${point.name}`, teleportPoint)
    return teleportPoint
  }

  removeTeleportPoint(id: string): boolean {
    const index = this.teleportPoints.findIndex(p => p.id === id)
    if (index === -1) {
      return false
    }

    const point = this.teleportPoints[index]
    this.teleportPoints.splice(index, 1)
    this.saveToStorage()

    console.log(`Teleport point removed: ${point.name}`)
    return true
  }

  updateTeleportPoint(id: string, updates: Partial<TeleportPoint>): boolean {
    const point = this.getTeleportPoint(id)
    if (!point) {
      return false
    }

    // Prevent updating certain fields
    const { id: _, createdAt: __, ...allowedUpdates } = updates
    Object.assign(point, allowedUpdates)
    
    this.saveToStorage()
    console.log(`Teleport point updated: ${point.name}`)
    return true
  }

  getTeleportPoints(category?: TeleportCategory): TeleportPoint[] {
    let points = this.teleportPoints.filter(p => p.enabled)
    
    if (category) {
      points = points.filter(p => p.category === category)
    }
    
    return [...points]
  }

  getTeleportPoint(id: string): TeleportPoint | null {
    return this.teleportPoints.find(p => p.id === id) || null
  }

  async teleportTo(pointId: string, options?: CameraTransitionOptions): Promise<void> {
    const point = this.getTeleportPoint(pointId)
    if (!point) {
      throw new Error(`Teleport point not found: ${pointId}`)
    }

    if (!point.enabled) {
      throw new Error(`Teleport point is disabled: ${point.name}`)
    }

    await this.teleportToPosition(point.position, point.rotation, options)
    console.log(`Teleported to: ${point.name}`)
  }

  async teleportToPosition(position: Vector3, rotation?: Euler, options?: CameraTransitionOptions): Promise<void> {
    const targetState = {
      position: position.clone(),
      rotation: rotation?.clone() || new Euler(0, 0, 0)
    }

    const defaultOptions: CameraTransitionOptions = {
      duration: 1500,
      easing: 'easeInOut',
      onStart: () => console.log('Teleport started'),
      onComplete: () => console.log('Teleport completed')
    }

    await this.cameraUtilities.setState(targetState, { ...defaultOptions, ...options })
  }

  quickTeleportTo(pointId: string): void {
    const point = this.getTeleportPoint(pointId)
    if (!point) {
      console.error(`Teleport point not found: ${pointId}`)
      return
    }

    if (!point.enabled) {
      console.error(`Teleport point is disabled: ${point.name}`)
      return
    }

    this.quickTeleportToPosition(point.position, point.rotation)
    console.log(`Quick teleported to: ${point.name}`)
  }

  quickTeleportToPosition(position: Vector3, rotation?: Euler): void {
    const targetState = {
      position: position.clone(),
      rotation: rotation?.clone() || new Euler(0, 0, 0)
    }

    this.cameraUtilities.setState(targetState) // No transition options = immediate
  }

  showTeleportUI(visible: boolean): void {
    this.uiVisible = visible
    console.log(`Teleport UI ${visible ? 'shown' : 'hidden'}`)
  }

  isTeleportUIVisible(): boolean {
    return this.uiVisible
  }

  async teleportFromMap(mapPosition: { x: number, y: number }): Promise<void> {
    // Convert 2D map coordinates to 3D world coordinates
    const worldPosition = this.mapToWorldPosition(mapPosition)
    
    // Use a standard height for map-based teleportation
    worldPosition.y = 6
    
    await this.teleportToPosition(worldPosition, undefined, {
      duration: 1000,
      easing: 'easeInOut'
    })
    
    console.log(`Teleported from map to: (${worldPosition.x}, ${worldPosition.y}, ${worldPosition.z})`)
  }

  getMapPosition(worldPosition: Vector3): { x: number, y: number } {
    // Convert 3D world coordinates to 2D map coordinates
    const normalizedX = (worldPosition.x - this.mapBounds.minX) / (this.mapBounds.maxX - this.mapBounds.minX)
    const normalizedZ = (worldPosition.z - this.mapBounds.minZ) / (this.mapBounds.maxZ - this.mapBounds.minZ)
    
    return {
      x: normalizedX,
      y: normalizedZ // Using Z as Y for top-down map view
    }
  }

  private mapToWorldPosition(mapPosition: { x: number, y: number }): Vector3 {
    const worldX = this.mapBounds.minX + mapPosition.x * (this.mapBounds.maxX - this.mapBounds.minX)
    const worldZ = this.mapBounds.minZ + mapPosition.y * (this.mapBounds.maxZ - this.mapBounds.minZ)
    
    return new Vector3(worldX, 0, worldZ)
  }

  // Utility methods
  getTeleportPointsByTag(tag: string): TeleportPoint[] {
    return this.teleportPoints.filter(p => 
      p.enabled && p.tags.includes(tag)
    )
  }

  searchTeleportPoints(query: string): TeleportPoint[] {
    const lowerQuery = query.toLowerCase()
    return this.teleportPoints.filter(p => 
      p.enabled && (
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description?.toLowerCase().includes(lowerQuery) ||
        p.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      )
    )
  }

  getRandomTeleportPoint(category?: TeleportCategory): TeleportPoint | null {
    const availablePoints = this.getTeleportPoints(category)
    if (availablePoints.length === 0) {
      return null
    }
    
    const randomIndex = Math.floor(Math.random() * availablePoints.length)
    return availablePoints[randomIndex]
  }

  async teleportToRandom(category?: TeleportCategory, options?: CameraTransitionOptions): Promise<void> {
    const randomPoint = this.getRandomTeleportPoint(category)
    if (!randomPoint) {
      throw new Error('No available teleport points found')
    }
    
    await this.teleportTo(randomPoint.id, options)
  }

  setMapBounds(minX: number, maxX: number, minZ: number, maxZ: number): void {
    this.mapBounds = { minX, maxX, minZ, maxZ }
  }

  getMapBounds(): { minX: number, maxX: number, minZ: number, maxZ: number } {
    return { ...this.mapBounds }
  }

  private saveToStorage(): void {
    try {
      const data = {
        teleportPoints: this.teleportPoints.map(point => ({
          ...point,
          position: {
            x: point.position.x,
            y: point.position.y,
            z: point.position.z
          },
          rotation: point.rotation ? {
            x: point.rotation.x,
            y: point.rotation.y,
            z: point.rotation.z
          } : undefined,
          createdAt: point.createdAt.toISOString()
        }))
      }

      localStorage.setItem(this.storageKey, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save teleport points to storage:', error)
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (!stored) {
        return
      }

      const data = JSON.parse(stored)
      if (!data.teleportPoints || !Array.isArray(data.teleportPoints)) {
        return
      }

      this.teleportPoints = data.teleportPoints.map((p: any) => ({
        ...p,
        position: new Vector3(p.position.x, p.position.y, p.position.z),
        rotation: p.rotation ? new Euler(p.rotation.x, p.rotation.y, p.rotation.z) : new Euler(0, 0, 0),
        createdAt: new Date(p.createdAt)
      }))

      // Update counter to avoid ID conflicts
      const maxId = Math.max(
        0,
        ...this.teleportPoints
          .map(p => parseInt(p.id.split('_')[1]))
          .filter(id => !isNaN(id))
      )
      this.teleportIdCounter = maxId

      console.log(`Loaded ${this.teleportPoints.length} teleport points from storage`)
    } catch (error) {
      console.error('Failed to load teleport points from storage:', error)
      this.teleportPoints = []
    }
  }

  getTeleportStats(): {
    total: number
    enabled: number
    byCategory: Record<TeleportCategory, number>
  } {
    const stats = {
      total: this.teleportPoints.length,
      enabled: 0,
      byCategory: {} as Record<TeleportCategory, number>
    }

    this.teleportPoints.forEach(point => {
      if (point.enabled) {
        stats.enabled++
      }
      
      const category = point.category as TeleportCategory
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1
    })

    return stats
  }

  dispose(): void {
    this.saveToStorage()
    this.teleportPoints = []
    this.uiVisible = false
  }
}