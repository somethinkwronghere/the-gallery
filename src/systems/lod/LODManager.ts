import { Object3D, Vector3, BufferGeometry, Material } from 'three'
import { LODLevel, LODConfiguration, PerformanceLevel, LODManager as ILODManager } from '../../types/performance'

/**
 * LODManager - Level of Detail yönetim sistemi
 * Mesafe bazlı LOD seçimi ve smooth geçişler sağlar
 */
export class LODManager implements ILODManager {
  private lodConfigurations: Map<string, LODConfiguration> = new Map()
  private activeLODs: Map<string, LODLevel> = new Map()
  private transitionPromises: Map<string, Promise<void>> = new Map()
  
  // Default LOD configuration
  private defaultConfig: LODConfiguration = {
    levels: [],
    transitionDistance: 5.0, // Geçiş için minimum mesafe farkı
    hysteresis: 2.0 // Titreme önleme için hysteresis
  }

  /**
   * Bir asset için LOD seviyelerini tanımlar
   */
  defineLODLevels(assetId: string, levels: LODLevel[]): void {
    // LOD seviyelerini mesafeye göre sırala (yakından uzağa)
    const sortedLevels = [...levels].sort((a, b) => a.distance - b.distance)
    
    const config: LODConfiguration = {
      levels: sortedLevels,
      transitionDistance: this.defaultConfig.transitionDistance,
      hysteresis: this.defaultConfig.hysteresis
    }
    
    this.lodConfigurations.set(assetId, config)
    
    // İlk LOD seviyesini aktif olarak ayarla
    if (sortedLevels.length > 0) {
      this.activeLODs.set(assetId, sortedLevels[0])
    }
  }

  /**
   * Mesafe ve performans seviyesine göre uygun LOD seviyesini seçer
   */
  selectLOD(distance: number, performanceLevel: PerformanceLevel): LODLevel {
    // Performans seviyesine göre mesafe çarpanı
    const performanceMultiplier = this.getPerformanceMultiplier(performanceLevel)
    const adjustedDistance = distance * performanceMultiplier
    
    // Default LOD level döndür (eğer hiç tanımlanmamışsa)
    const defaultLOD: LODLevel = {
      distance: adjustedDistance,
      geometry: new BufferGeometry(),
      material: new Material(),
      triangleCount: 0,
      quality: performanceLevel === 'low' ? 0.5 : performanceLevel === 'medium' ? 0.75 : 1.0
    }
    
    return defaultLOD
  }

  /**
   * Belirli bir asset için mesafe bazlı LOD seçimi yapar
   */
  selectLODForAsset(assetId: string, distance: number, performanceLevel: PerformanceLevel): LODLevel | null {
    const config = this.lodConfigurations.get(assetId)
    if (!config || config.levels.length === 0) {
      return null
    }

    const performanceMultiplier = this.getPerformanceMultiplier(performanceLevel)
    const adjustedDistance = distance * performanceMultiplier
    const currentLOD = this.activeLODs.get(assetId)
    
    // Hysteresis ile titreme önleme
    let selectedLOD = config.levels[config.levels.length - 1] // En düşük kalite (en uzak)
    
    for (let i = 0; i < config.levels.length; i++) {
      const level = config.levels[i]
      let threshold = level.distance
      
      // Eğer şu anki LOD bu seviyeyse, hysteresis uygula
      if (currentLOD && currentLOD.distance === level.distance) {
        threshold += config.hysteresis
      }
      
      if (adjustedDistance <= threshold) {
        selectedLOD = level
        break
      }
    }
    
    return selectedLOD
  }

  /**
   * Smooth LOD geçişi yapar
   */
  async transitionToLOD(currentLOD: LODLevel, targetLOD: LODLevel): Promise<void> {
    const transitionKey = `${currentLOD.distance}-${targetLOD.distance}`
    
    // Eğer zaten bir geçiş devam ediyorsa, onu bekle
    if (this.transitionPromises.has(transitionKey)) {
      return this.transitionPromises.get(transitionKey)!
    }
    
    const transitionPromise = this.performTransition(currentLOD, targetLOD)
    this.transitionPromises.set(transitionKey, transitionPromise)
    
    try {
      await transitionPromise
    } finally {
      this.transitionPromises.delete(transitionKey)
    }
  }

  /**
   * Asset için LOD geçişi yapar
   */
  async transitionAssetLOD(assetId: string, targetLOD: LODLevel): Promise<void> {
    const currentLOD = this.activeLODs.get(assetId)
    if (!currentLOD || currentLOD.distance === targetLOD.distance) {
      return
    }

    await this.transitionToLOD(currentLOD, targetLOD)
    this.activeLODs.set(assetId, targetLOD)
  }

  /**
   * LOD konfigürasyonunu ayarlar
   */
  setLODConfig(config: LODConfiguration): void {
    this.defaultConfig = { ...config }
  }

  /**
   * LOD konfigürasyonunu döndürür
   */
  getLODConfig(): LODConfiguration {
    return { ...this.defaultConfig }
  }

  /**
   * Belirli bir asset için LOD konfigürasyonunu döndürür
   */
  getAssetLODConfig(assetId: string): LODConfiguration | null {
    return this.lodConfigurations.get(assetId) || null
  }

  /**
   * Aktif LOD seviyesini döndürür
   */
  getActiveLOD(assetId: string): LODLevel | null {
    return this.activeLODs.get(assetId) || null
  }

  /**
   * Tüm LOD konfigürasyonlarını temizler
   */
  clearLODConfigurations(): void {
    this.lodConfigurations.clear()
    this.activeLODs.clear()
  }

  /**
   * LOD istatistiklerini döndürür
   */
  getLODStats() {
    return {
      totalAssets: this.lodConfigurations.size,
      activeLODs: this.activeLODs.size,
      activeTransitions: this.transitionPromises.size,
      averageTriangles: this.calculateAverageTriangles()
    }
  }

  /**
   * Performans seviyesine göre mesafe çarpanını hesaplar
   */
  private getPerformanceMultiplier(performanceLevel: PerformanceLevel): number {
    switch (performanceLevel) {
      case 'low':
        return 0.5 // Düşük performansta daha erken düşük kalite LOD kullan
      case 'medium':
        return 0.75
      case 'high':
        return 1.0
      default:
        return 1.0
    }
  }

  /**
   * Gerçek LOD geçişini gerçekleştirir
   */
  private async performTransition(currentLOD: LODLevel, targetLOD: LODLevel): Promise<void> {
    const transitionDuration = 300 // ms
    const steps = 10
    const stepDuration = transitionDuration / steps
    
    return new Promise((resolve) => {
      let currentStep = 0
      
      const animate = () => {
        currentStep++
        const progress = currentStep / steps
        
        // Burada opacity veya morph geçişi yapılabilir
        // Şimdilik basit bir delay ile simüle ediyoruz
        
        if (currentStep >= steps) {
          resolve()
        } else {
          setTimeout(animate, stepDuration)
        }
      }
      
      animate()
    })
  }

  /**
   * Ortalama triangle sayısını hesaplar
   */
  private calculateAverageTriangles(): number {
    let totalTriangles = 0
    let count = 0
    
    this.activeLODs.forEach((lod) => {
      totalTriangles += lod.triangleCount
      count++
    })
    
    return count > 0 ? totalTriangles / count : 0
  }
}

// Singleton instance
export const lodManager = new LODManager()