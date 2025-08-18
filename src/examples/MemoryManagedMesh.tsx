import { useEffect, useRef } from 'react'
import { Mesh, BoxGeometry, MeshBasicMaterial, Scene, WebGLRenderer } from 'three'
import { useThreeMemoryManager } from '../hooks/useMemoryManager'

interface MemoryManagedMeshOptions {
  position?: [number, number, number]
  color?: string
  scene?: Scene
}

/**
 * Example utility showing how to use the memory management system
 * with Three.js objects. This automatically tracks and disposes
 * of geometry and materials when cleanup is called.
 */
export class MemoryManagedMesh {
  private geometryId?: string
  private materialId?: string
  private mesh: Mesh
  private memoryManager: any

  constructor(options: MemoryManagedMeshOptions = {}) {
    const { position = [0, 0, 0], color = '#ffffff', scene } = options

    // Create Three.js objects
    const geometry = new BoxGeometry(1, 1, 1)
    const material = new MeshBasicMaterial({ color })
    this.mesh = new Mesh(geometry, material)

    // Set position
    this.mesh.position.set(...position)

    // Add to scene if provided
    if (scene) {
      scene.add(this.mesh)
    }

    console.log('[MemoryManagedMesh] Created mesh with memory management')
  }

  // Initialize memory tracking (call this after creating the instance)
  initMemoryTracking(memoryManager: any) {
    this.memoryManager = memoryManager
    
    // Track resources with memory manager
    this.geometryId = memoryManager.trackGeometry(this.mesh.geometry)
    this.materialId = memoryManager.trackMaterial(this.mesh.material)

    console.log('[MemoryManagedMesh] Tracked resources:', {
      geometryId: this.geometryId,
      materialId: this.materialId
    })
  }

  // Update resource usage timestamps
  updateUsage() {
    if (this.memoryManager && this.geometryId) {
      this.memoryManager.updateResourceUsage(this.geometryId)
    }
    if (this.memoryManager && this.materialId) {
      this.memoryManager.updateResourceUsage(this.materialId)
    }
    console.log('[MemoryManagedMesh] Updated resource usage timestamps')
  }

  // Get the Three.js mesh object
  getMesh(): Mesh {
    return this.mesh
  }

  // Cleanup resources
  dispose() {
    console.log('[MemoryManagedMesh] Cleaning up resources')
    
    if (this.memoryManager) {
      if (this.geometryId) {
        this.memoryManager.disposeResource(this.geometryId)
      }
      if (this.materialId) {
        this.memoryManager.disposeResource(this.materialId)
      }
    }

    // Remove from scene if it has a parent
    if (this.mesh.parent) {
      this.mesh.parent.remove(this.mesh)
    }
  }
}

/**
 * React hook example for using MemoryManagedMesh
 */
export function useMemoryManagedMesh(options: MemoryManagedMeshOptions = {}) {
  const meshRef = useRef<MemoryManagedMesh | null>(null)
  const memoryManager = useThreeMemoryManager()

  useEffect(() => {
    // Create mesh
    meshRef.current = new MemoryManagedMesh(options)
    meshRef.current.initMemoryTracking(memoryManager)

    // Cleanup on unmount
    return () => {
      if (meshRef.current) {
        meshRef.current.dispose()
        meshRef.current = null
      }
    }
  }, [memoryManager])

  return {
    mesh: meshRef.current?.getMesh(),
    updateUsage: () => meshRef.current?.updateUsage(),
    dispose: () => meshRef.current?.dispose()
  }
}

export default MemoryManagedMesh