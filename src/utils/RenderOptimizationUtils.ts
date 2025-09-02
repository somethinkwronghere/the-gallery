import { Object3D, Camera, Vector3, Box3, Frustum, Matrix4 } from 'three'

/**
 * Render optimizasyon yardımcı fonksiyonları
 * Basit ve etkili optimizasyon teknikleri
 */

/**
 * Obje mesafe hesaplama (optimize edilmiş)
 */
export function calculateDistance(object: Object3D, camera: Camera): number {
  const objectPosition = new Vector3()
  object.getWorldPosition(objectPosition)
  return camera.position.distanceTo(objectPosition)
}

/**
 * Basit frustum culling kontrolü
 */
export function isInFrustum(object: Object3D, camera: Camera, frustum?: Frustum): boolean {
  if (!frustum) {
    frustum = new Frustum()
    const cameraMatrix = new Matrix4()
    cameraMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
    frustum.setFromProjectionMatrix(cameraMatrix)
  }

  const box = new Box3().setFromObject(object)
  return frustum.intersectsBox(box)
}

/**
 * Mesafe bazlı görünürlük kontrolü
 */
export function isWithinRenderDistance(object: Object3D, camera: Camera, maxDistance: number): boolean {
  const distance = calculateDistance(object, camera)
  return distance <= maxDistance
}

/**
 * Ekran boyutu hesaplama (LOD için)
 */
export function calculateScreenSize(object: Object3D, camera: Camera): number {
  const distance = calculateDistance(object, camera)
  if (distance === 0) return 1

  const box = new Box3().setFromObject(object)
  const size = box.getSize(new Vector3()).length()
  
  // Basit açısal boyut hesaplama
  const angularSize = size / distance
  return Math.min(angularSize, 1)
}

/**
 * Performans seviyesine göre render mesafesi
 */
export function getMaxRenderDistance(performanceLevel: 'low' | 'medium' | 'high'): number {
  switch (performanceLevel) {
    case 'low': return 80
    case 'medium': return 120
    case 'high': return 200
    default: return 120
  }
}

/**
 * LOD seviyesi seçimi (basitleştirilmiş)
 */
export function selectLODLevel(distance: number, performanceLevel: 'low' | 'medium' | 'high'): number {
  const maxDistance = getMaxRenderDistance(performanceLevel)
  const normalizedDistance = distance / maxDistance

  if (normalizedDistance <= 0.2) return 0 // Yüksek kalite
  if (normalizedDistance <= 0.5) return 1 // Orta kalite
  if (normalizedDistance <= 0.8) return 2 // Düşük kalite
  return 3 // En düşük kalite veya culled
}

/**
 * Batch rendering için obje gruplama
 */
export function groupObjectsForBatching(objects: Object3D[]): Map<string, Object3D[]> {
  const groups = new Map<string, Object3D[]>()

  for (const object of objects) {
    // Basit gruplama: geometry ve material tipine göre
    const key = `${object.type}_${(object as any).geometry?.type || 'unknown'}`
    
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(object)
  }

  return groups
}

/**
 * Render önceliği hesaplama
 */
export function calculateRenderPriority(object: Object3D, camera: Camera): number {
  const distance = calculateDistance(object, camera)
  const screenSize = calculateScreenSize(object, camera)
  
  // Yakın ve büyük objeler yüksek öncelik
  return (1 / distance) * screenSize
}

/**
 * Basit occlusion culling (sadece büyük objeler için)
 */
export function isOccluded(object: Object3D, camera: Camera, occluders: Object3D[]): boolean {
  if (occluders.length === 0) return false

  const objectBox = new Box3().setFromObject(object)
  const objectCenter = objectBox.getCenter(new Vector3())
  const cameraPosition = camera.position

  // Sadece kamera ile obje arasındaki büyük occluder'ları kontrol et
  for (const occluder of occluders) {
    const occluderBox = new Box3().setFromObject(occluder)
    const occluderSize = occluderBox.getSize(new Vector3()).length()
    
    // Sadece yeterince büyük objeler occluder olabilir
    if (occluderSize < 5) continue

    const occluderCenter = occluderBox.getCenter(new Vector3())
    const occluderDistance = cameraPosition.distanceTo(occluderCenter)
    const objectDistance = cameraPosition.distanceTo(objectCenter)

    // Occluder objenin önünde mi?
    if (occluderDistance < objectDistance - 2) {
      // Basit ray-box intersection kontrolü
      const direction = objectCenter.clone().sub(cameraPosition).normalize()
      const ray = { origin: cameraPosition, direction }
      
      if (rayIntersectsBox(ray, occluderBox)) {
        return true
      }
    }
  }

  return false
}

/**
 * Basit ray-box intersection
 */
function rayIntersectsBox(ray: { origin: Vector3, direction: Vector3 }, box: Box3): boolean {
  const invDir = new Vector3(1 / ray.direction.x, 1 / ray.direction.y, 1 / ray.direction.z)
  
  const t1 = (box.min.x - ray.origin.x) * invDir.x
  const t2 = (box.max.x - ray.origin.x) * invDir.x
  const t3 = (box.min.y - ray.origin.y) * invDir.y
  const t4 = (box.max.y - ray.origin.y) * invDir.y
  const t5 = (box.min.z - ray.origin.z) * invDir.z
  const t6 = (box.max.z - ray.origin.z) * invDir.z

  const tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6))
  const tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6))

  return tmax >= 0 && tmin <= tmax
}

/**
 * Performans bazlı render ayarları
 */
export function getOptimalRenderSettings(performanceLevel: 'low' | 'medium' | 'high') {
  const settings = {
    low: {
      maxRenderDistance: 80,
      lodUpdateFrequency: 10,
      cullingUpdateFrequency: 5,
      enableOcclusion: false,
      maxBatchSize: 50,
      shadowQuality: 'off' as const,
      antialiasing: false
    },
    medium: {
      maxRenderDistance: 120,
      lodUpdateFrequency: 5,
      cullingUpdateFrequency: 3,
      enableOcclusion: false,
      maxBatchSize: 100,
      shadowQuality: 'low' as const,
      antialiasing: true
    },
    high: {
      maxRenderDistance: 200,
      lodUpdateFrequency: 3,
      cullingUpdateFrequency: 2,
      enableOcclusion: true,
      maxBatchSize: 200,
      shadowQuality: 'high' as const,
      antialiasing: true
    }
  }

  return settings[performanceLevel]
}

/**
 * Render istatistikleri hesaplama
 */
export function calculateRenderStats(visibleObjects: Object3D[]) {
  let totalTriangles = 0
  let totalVertices = 0
  let drawCalls = visibleObjects.length

  for (const object of visibleObjects) {
    const mesh = object as any
    if (mesh.geometry) {
      const positions = mesh.geometry.attributes.position
      if (positions) {
        totalVertices += positions.count
        totalTriangles += mesh.geometry.index ? 
          mesh.geometry.index.count / 3 : 
          positions.count / 3
      }
    }
  }

  return {
    visibleObjects: visibleObjects.length,
    drawCalls,
    triangles: Math.floor(totalTriangles),
    vertices: totalVertices
  }
}