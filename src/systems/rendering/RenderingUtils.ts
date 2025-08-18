import { 
  Object3D, 
  Mesh, 
  BufferGeometry, 
  Material, 
  Box3, 
  Sphere, 
  Camera,
  Vector3
} from 'three'
import { 
  RenderableObject, 
  RenderPriority, 
  VisibilityState 
} from '../../types/rendering'

/**
 * Convert a Three.js Object3D to a RenderableObject
 */
export const createRenderableObject = (
  object: Object3D,
  priority: RenderPriority = 'normal'
): RenderableObject | null => {
  // Only process Mesh objects for now
  if (!(object instanceof Mesh)) {
    return null
  }

  const mesh = object as Mesh
  
  // Ensure we have geometry and material
  if (!mesh.geometry || !mesh.material) {
    return null
  }

  // Calculate bounds
  const bounds = new Box3().setFromObject(mesh)
  const boundingSphere = bounds.getBoundingSphere(new Sphere())

  return {
    object: mesh,
    geometry: mesh.geometry,
    material: mesh.material,
    bounds,
    boundingSphere,
    priority,
    lastVisible: Date.now(),
    cullingState: 'visible',
    distanceToCamera: 0,
    screenSize: 0
  }
}

/**
 * Convert multiple Three.js objects to RenderableObjects
 */
export const createRenderableObjects = (
  objects: Object3D[],
  priority: RenderPriority = 'normal'
): RenderableObject[] => {
  const renderableObjects: RenderableObject[] = []
  
  for (const object of objects) {
    const renderable = createRenderableObject(object, priority)
    if (renderable) {
      renderableObjects.push(renderable)
    }
  }
  
  return renderableObjects
}

/**
 * Update renderable object with current camera information
 */
export const updateRenderableObject = (
  renderableObject: RenderableObject,
  camera: Camera
): void => {
  // Update distance to camera
  const objectCenter = renderableObject.bounds.getCenter(new Vector3())
  renderableObject.distanceToCamera = camera.position.distanceTo(objectCenter)
  
  // Update screen size (approximate)
  const distance = renderableObject.distanceToCamera
  if (distance > 0) {
    const angularSize = (renderableObject.boundingSphere.radius / distance) * 2
    renderableObject.screenSize = Math.min(angularSize, 1)
  } else {
    renderableObject.screenSize = 1
  }
  
  // Update last visible timestamp if object is visible
  if (renderableObject.cullingState === 'visible') {
    renderableObject.lastVisible = Date.now()
  }
}

/**
 * Determine render priority based on object properties
 */
export const calculateRenderPriority = (object: Object3D): RenderPriority => {
  // Check for special naming conventions or user data
  if (object.userData.priority) {
    return object.userData.priority as RenderPriority
  }
  
  // Check object name for priority hints
  const name = object.name.toLowerCase()
  if (name.includes('ui') || name.includes('hud')) {
    return 'immediate'
  }
  if (name.includes('important') || name.includes('main')) {
    return 'high'
  }
  if (name.includes('background') || name.includes('ambient')) {
    return 'low'
  }
  if (name.includes('effect') || name.includes('particle')) {
    return 'deferred'
  }
  
  // Default priority
  return 'normal'
}

/**
 * Check if an object should be included in rendering
 */
export const shouldRenderObject = (object: Object3D): boolean => {
  // Skip invisible objects
  if (!object.visible) {
    return false
  }
  
  // Skip objects without geometry or material (for Mesh objects)
  if (object instanceof Mesh) {
    if (!object.geometry || !object.material) {
      return false
    }
  }
  
  // Check for explicit exclusion
  if (object.userData.excludeFromRendering) {
    return false
  }
  
  return true
}

/**
 * Get all renderable objects from a scene or object hierarchy
 */
export const getAllRenderableObjects = (
  root: Object3D,
  priority?: RenderPriority
): RenderableObject[] => {
  const renderableObjects: RenderableObject[] = []
  
  root.traverse((object) => {
    if (shouldRenderObject(object)) {
      const objectPriority = priority || calculateRenderPriority(object)
      const renderable = createRenderableObject(object, objectPriority)
      if (renderable) {
        renderableObjects.push(renderable)
      }
    }
  })
  
  return renderableObjects
}

/**
 * Update culling state for multiple objects based on culling result
 */
export const updateCullingStates = (
  renderableObjects: RenderableObject[],
  visibleObjects: Object3D[],
  culledObjects: Object3D[],
  occludedObjects: Object3D[]
): void => {
  // Create sets for faster lookup
  const visibleSet = new Set(visibleObjects.map(obj => obj.uuid))
  const culledSet = new Set(culledObjects.map(obj => obj.uuid))
  const occludedSet = new Set(occludedObjects.map(obj => obj.uuid))
  
  for (const renderableObject of renderableObjects) {
    const uuid = renderableObject.object.uuid
    
    if (visibleSet.has(uuid)) {
      renderableObject.cullingState = 'visible'
    } else if (occludedSet.has(uuid)) {
      renderableObject.cullingState = 'occluded'
    } else if (culledSet.has(uuid)) {
      renderableObject.cullingState = 'culled'
    } else {
      renderableObject.cullingState = 'distant'
    }
  }
}

/**
 * Filter objects by visibility state
 */
export const filterByVisibilityState = (
  renderableObjects: RenderableObject[],
  state: VisibilityState
): RenderableObject[] => {
  return renderableObjects.filter(obj => obj.cullingState === state)
}

/**
 * Get render statistics from a collection of renderable objects
 */
export const calculateRenderStatistics = (
  renderableObjects: RenderableObject[]
): {
  totalObjects: number
  visibleObjects: number
  culledObjects: number
  occludedObjects: number
  triangles: number
} => {
  let totalObjects = renderableObjects.length
  let visibleObjects = 0
  let culledObjects = 0
  let occludedObjects = 0
  let triangles = 0
  
  for (const obj of renderableObjects) {
    switch (obj.cullingState) {
      case 'visible':
        visibleObjects++
        // Count triangles for visible objects
        const positions = obj.geometry.attributes.position
        if (positions) {
          triangles += positions.count / 3
        }
        break
      case 'culled':
      case 'distant':
        culledObjects++
        break
      case 'occluded':
        occludedObjects++
        break
    }
  }
  
  return {
    totalObjects,
    visibleObjects,
    culledObjects,
    occludedObjects,
    triangles
  }
}