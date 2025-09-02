import { Camera, Object3D, Frustum, Matrix4, Box3, Vector3 } from 'three'

/**
 * Basit frustum culling konfigürasyonu
 */
interface SimpleConfig {
  enabled: boolean
  maxDistance: number
  margin: number
  updateFrequency: number
}

/**
 * Basit Frustum Culling sistemi
 * Karmaşık occlusion culling yerine sadece temel görünürlük kontrolü
 */
export class SimpleFrustumCulling {
  private frustum = new Frustum()
  private cameraMatrix = new Matrix4()
  private tempBox = new Box3()
  private tempVector = new Vector3()
  private frameCount = 0
  private updateFrequency = 2 // Her 2 frame'de bir güncelle

  private config: SimpleConfig = {
    enabled: true,
    maxDistance: 150, // Maksimum render mesafesi
    margin: 1.0, // Frustum kenar boşluğu
    updateFrequency: 2
  }

  /**
   * Konfigürasyonu güncelle
   */
  setConfig(newConfig: Partial<SimpleConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.updateFrequency = this.config.updateFrequency
  }

  /**
   * Basit görünürlük kontrolü
   */
  isVisible(camera: Camera, object: Object3D): boolean {
    if (!this.config.enabled || !object.visible) {
      return object.visible
    }

    // Frustum'u güncelle (sadece gerektiğinde)
    this.frameCount++
    if (this.frameCount % this.updateFrequency === 0) {
      this.updateFrustum(camera)
    }

    // Mesafe kontrolü (en hızlı test)
    if (!this.isWithinDistance(camera, object)) {
      return false
    }

    // Frustum kontrolü
    return this.isInFrustum(object)
  }

  /**
   * Birden fazla obje için toplu culling
   */
  cullObjects(camera: Camera, objects: Object3D[]): { visible: Object3D[], culled: Object3D[] } {
    if (!this.config.enabled) {
      return { visible: objects.filter(obj => obj.visible), culled: [] }
    }

    // Frustum'u güncelle
    this.frameCount++
    if (this.frameCount % this.updateFrequency === 0) {
      this.updateFrustum(camera)
    }

    const visible: Object3D[] = []
    const culled: Object3D[] = []

    for (const object of objects) {
      if (!object.visible) {
        culled.push(object)
        continue
      }

      // Hızlı mesafe testi
      if (!this.isWithinDistance(camera, object)) {
        culled.push(object)
        continue
      }

      // Frustum testi
      if (this.isInFrustum(object)) {
        visible.push(object)
      } else {
        culled.push(object)
      }
    }

    return { visible, culled }
  }

  /**
   * Frustum'u güncelle
   */
  private updateFrustum(camera: Camera): void {
    this.cameraMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse)
    this.frustum.setFromProjectionMatrix(this.cameraMatrix)
  }

  /**
   * Objenin frustum içinde olup olmadığını kontrol et
   */
  private isInFrustum(object: Object3D): boolean {
    // Bounding box hesapla
    this.tempBox.setFromObject(object)
    
    // Margin ekle
    if (this.config.margin > 0) {
      this.tempBox.expandByScalar(this.config.margin)
    }

    // Frustum testi
    return this.frustum.intersectsBox(this.tempBox)
  }

  /**
   * Mesafe kontrolü
   */
  private isWithinDistance(camera: Camera, object: Object3D): boolean {
    object.getWorldPosition(this.tempVector)
    const distance = camera.position.distanceTo(this.tempVector)
    return distance <= this.config.maxDistance
  }

  /**
   * İstatistikleri al
   */
  getStats() {
    return {
      enabled: this.config.enabled,
      maxDistance: this.config.maxDistance,
      updateFrequency: this.updateFrequency,
      frameCount: this.frameCount
    }
  }

  /**
   * Sistemi sıfırla
   */
  reset(): void {
    this.frameCount = 0
  }
}

// Singleton instance
export const simpleFrustumCulling = new SimpleFrustumCulling()