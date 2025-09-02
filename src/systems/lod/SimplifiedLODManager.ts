import { Object3D, Vector3, BufferGeometry, Material, Camera } from 'three'
import { LODLevel, PerformanceLevel } from '../../types/performance'

/**
 * Basit LOD konfigürasyonu
 */
interface SimpleLODConfig {
  levels: LODLevel[]
  distances: number[] // [yakın, orta, uzak]
  hysteresis: number // Titreme önleme
}

/**
 * Simplified LOD Manager - Basitleştirilmiş Level of Detail yönetimi
 * Karmaşık geçişler yerine basit mesafe bazlı LOD seçimi
 */
export class SimplifiedLODManager {
  private lodConfigurations: Map<string, SimpleLODConfig> = new Map()
  private activeLODs: Map<string, LODLevel> = new Map()
  private frameCount = 0
  private updateFrequency = 5 // Her 5 frame'de bir güncelle

  /**
   * Asset için basit LOD seviyeleri tanımla
   */
  defineLODLevels(assetId: string, levels: LODLevel[]): void {
    // Sadece 3 seviye: yakın, orta, uzak
    const simplifiedLevels = levels.slice(0, 3)
    const distances = [10, 30, 80] // Basit mesafe seviyeleri
    
    const config: SimpleLODConfig = {
      levels: simplifiedLevels,
      distances,
      hysteresis: 5.0 // Daha büyük hysteresis titreme önleme için
    }
    
    this.lodConfigurations.set(assetId, config)
    
    // İlk seviyeyi aktif yap
    if (simplifiedLevels.length > 0) {
      this.activeLODs.set(assetId, simplifiedLevels[0])
    }
  }

  /**
   * Basit mesafe bazlı LOD seçimi
   */
  selectLOD(distance: number, performanceLevel: PerformanceLevel): number {
    // Performans seviyesine göre mesafe çarpanı
    const performanceMultiplier = this.getPerformanceMultiplier(performanceLevel)
    const adjustedDistance = distance * performanceMultiplier
    
    // Basit seviye seçimi
    if (adjustedDistance <= 15) return 0 // Yüksek kalite
    if (adjustedDistance <= 40) return 1 // Orta kalite
    return 2 // Düşük kalite
  }

  /**
   * Asset için LOD güncelleme (sadece gerektiğinde)
   */
  updateLOD(assetId: string, camera: Camera, object: Object3D, performanceLevel: PerformanceLevel): boolean {
    this.frameCount++
    
    // Sadece belirli frame'lerde güncelle
    if (this.frameCount % this.updateFrequency !== 0) {
      return false
    }

    const config = this.lodConfigurations.get(assetId)
    if (!config || config.levels.length === 0) {
      return false
    }

    // Mesafe hesapla
    const objectPosition = new Vector3()
    object.getWorldPosition(objectPosition)
    const distance = camera.position.distanceTo(objectPosition)

    // Yeni LOD seviyesi seç
    const newLevelIndex = this.selectLOD(distance, performanceLevel)
    const newLevel = config.levels[Math.min(newLevelIndex, config.levels.length - 1)]
    
    const currentLevel = this.activeLODs.get(assetId)
    
    // Hysteresis kontrolü - sadece büyük değişikliklerde güncelle
    if (currentLevel && Math.abs(distance - currentLevel.distance) < config.hysteresis) {
      return false
    }

    // LOD seviyesini güncelle
    if (!currentLevel || currentLevel.distance !== newLevel.distance) {
      this.activeLODs.set(assetId, { ...newLevel, distance })
      return true
    }

    return false
  }

  /**
   * Aktif LOD seviyesini al
   */
  getActiveLOD(assetId: string): LODLevel | null {
    return this.activeLODs.get(assetId) || null
  }

  /**
   * Tüm LOD'ları temizle
   */
  clear(): void {
    this.lodConfigurations.clear()
    this.activeLODs.clear()
  }

  /**
   * Basit istatistikler
   */
  getStats() {
    return {
      totalAssets: this.lodConfigurations.size,
      activeLODs: this.activeLODs.size,
      updateFrequency: this.updateFrequency
    }
  }

  /**
   * Güncelleme sıklığını ayarla
   */
  setUpdateFrequency(frequency: number): void {
    this.updateFrequency = Math.max(1, frequency)
  }

  /**
   * Performans seviyesine göre mesafe çarpanı
   */
  private getPerformanceMultiplier(performanceLevel: PerformanceLevel): number {
    switch (performanceLevel) {
      case 'low':
        return 0.6 // Daha erken düşük kalite
      case 'medium':
        return 0.8
      case 'high':
        return 1.0
      default:
        return 1.0
    }
  }
}

// Singleton instance
export const simplifiedLODManager = new SimplifiedLODManager()