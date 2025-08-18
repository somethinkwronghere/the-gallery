import { Object3D, Vector3, BufferGeometry, Material, Mesh, LOD as ThreeLOD, Box3, Sphere, BufferAttribute, LinearMipmapLinearFilter, LinearFilter } from 'three'
import { LODLevel } from '../../types/performance'

/**
 * LODHelper - LOD sistemini Three.js objeleri ile entegre etmek için yardımcı sınıf
 */
export class LODHelper {
  /**
   * Bir 3D model için otomatik LOD seviyeleri oluşturur
   */
  static generateLODLevels(
    originalMesh: Mesh,
    distances: number[] = [10, 25, 50, 100]
  ): LODLevel[] {
    const levels: LODLevel[] = []
    
    distances.forEach((distance, index) => {
      const quality = 1.0 - (index * 0.25) // Her seviyede %25 kalite kaybı
      const simplifiedGeometry = this.simplifyGeometry(originalMesh.geometry, quality)
      const optimizedMaterial = this.optimizeMaterial(originalMesh.material as Material, quality)
      
      levels.push({
        distance,
        geometry: simplifiedGeometry,
        material: optimizedMaterial,
        triangleCount: this.getTriangleCount(simplifiedGeometry),
        quality
      })
    })
    
    return levels
  }

  /**
   * Three.js LOD objesi oluşturur
   */
  static createThreeLOD(levels: LODLevel[]): ThreeLOD {
    const lod = new ThreeLOD()
    
    levels.forEach(level => {
      const mesh = new Mesh(level.geometry, level.material)
      lod.addLevel(mesh, level.distance)
    })
    
    return lod
  }

  /**
   * Mesh'i LOD seviyesine göre günceller
   */
  static updateMeshLOD(mesh: Mesh, lodLevel: LODLevel): void {
    // Geometry'yi güncelle
    if (mesh.geometry !== lodLevel.geometry) {
      mesh.geometry.dispose()
      mesh.geometry = lodLevel.geometry
    }
    
    // Material'ı güncelle
    if (mesh.material !== lodLevel.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(mat => mat.dispose())
      } else {
        (mesh.material as Material).dispose()
      }
      mesh.material = lodLevel.material
    }
  }

  /**
   * İki nokta arasındaki mesafeyi hesaplar
   */
  static calculateDistance(object: Object3D, cameraPosition: Vector3): number {
    const objectPosition = new Vector3()
    object.getWorldPosition(objectPosition)
    return objectPosition.distanceTo(cameraPosition)
  }

  /**
   * Objenin bounding sphere yarıçapını hesaplar
   */
  static getBoundingSphereRadius(object: Object3D): number {
    const box = new Box3().setFromObject(object)
    const sphere = new Sphere()
    box.getBoundingSphere(sphere)
    return sphere.radius
  }

  /**
   * Geometry'yi basitleştirir (triangle count azaltır)
   */
  private static simplifyGeometry(geometry: BufferGeometry, quality: number): BufferGeometry {
    // Basit bir decimation algoritması
    // Gerçek uygulamada daha gelişmiş algoritma kullanılabilir
    const simplified = geometry.clone()
    
    if (quality < 1.0) {
      // Position attribute'unu al
      const positions = simplified.getAttribute('position')
      if (positions) {
        // Vertex sayısını azalt
        const targetVertexCount = Math.floor(positions.count * quality)
        const newPositions = new Float32Array(targetVertexCount * 3)
        
        // Basit sampling ile vertex'leri seç
        const step = Math.floor(positions.count / targetVertexCount)
        for (let i = 0; i < targetVertexCount; i++) {
          const sourceIndex = i * step
          newPositions[i * 3] = positions.getX(sourceIndex)
          newPositions[i * 3 + 1] = positions.getY(sourceIndex)
          newPositions[i * 3 + 2] = positions.getZ(sourceIndex)
        }
        
        simplified.setAttribute('position', new BufferAttribute(newPositions, 3))
      }
      
      // Index'leri yeniden hesapla
      if (simplified.index) {
        simplified.setIndex(null)
        simplified.computeVertexNormals()
      }
    }
    
    return simplified
  }

  /**
   * Material'ı optimize eder
   */
  private static optimizeMaterial(material: Material, quality: number): Material {
    const optimized = material.clone()
    
    // Kaliteye göre material özelliklerini ayarla
    try {
      if ('map' in optimized && optimized.map) {
        // Texture kalitesini azalt
        const texture = (optimized as any).map.clone()
        texture.generateMipmaps = quality > 0.5
        texture.minFilter = quality > 0.7 ? LinearMipmapLinearFilter : LinearFilter
        ;(optimized as any).map = texture
      }
    } catch (error) {
      // Texture cloning failed, continue without texture optimization
      console.warn('Texture optimization failed:', error)
    }
    
    // Düşük kalitede bazı özellikleri kapat
    if (quality < 0.5) {
      try {
        if ('normalMap' in optimized) (optimized as any).normalMap = null
        if ('roughnessMap' in optimized) (optimized as any).roughnessMap = null
        if ('metalnessMap' in optimized) (optimized as any).metalnessMap = null
      } catch (error) {
        // Property access failed, continue
        console.warn('Material property optimization failed:', error)
      }
    }
    
    return optimized
  }

  /**
   * Geometry'nin triangle sayısını hesaplar
   */
  private static getTriangleCount(geometry: BufferGeometry): number {
    const positions = geometry.getAttribute('position')
    if (!positions) return 0
    
    if (geometry.index) {
      return geometry.index.count / 3
    } else {
      return positions.count / 3
    }
  }
}

