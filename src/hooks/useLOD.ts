import { useEffect, useRef, useCallback, useState } from 'react'
import { Object3D, Vector3, Camera } from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { lodManager } from '../systems/lod/LODManager'
import { LODHelper } from '../systems/lod/LODHelper'
import { LODLevel, PerformanceLevel } from '../types/performance'
import { usePerformance } from './usePerformance'

interface UseLODOptions {
  updateInterval?: number // LOD güncelleme sıklığı (frame)
  enableAutoUpdate?: boolean // Otomatik güncelleme
  hysteresis?: number // Titreme önleme
  minDistance?: number // Minimum mesafe
  maxDistance?: number // Maksimum mesafe
}

interface LODState {
  currentLOD: LODLevel | null
  distance: number
  isTransitioning: boolean
  triangleCount: number
}

/**
 * LOD (Level of Detail) sistemi için React hook
 */
export function useLOD(
  assetId: string,
  object3D: Object3D | null,
  camera: Camera | null,
  options: UseLODOptions = {}
) {
  const {
    updateInterval = 5, // Her 5 frame'de bir güncelle
    enableAutoUpdate = true,
    hysteresis = 2.0,
    minDistance = 1,
    maxDistance = 1000
  } = options

  const { level: performanceLevel } = usePerformance()
  const frameCount = useRef(0)
  const lastDistance = useRef(0)
  const [lodState, setLODState] = useState<LODState>({
    currentLOD: null,
    distance: 0,
    isTransitioning: false,
    triangleCount: 0
  })

  // LOD seviyelerini tanımla
  const defineLODLevels = useCallback((levels: LODLevel[]) => {
    lodManager.defineLODLevels(assetId, levels)
    
    // İlk LOD seviyesini ayarla
    if (levels.length > 0) {
      setLODState(prev => ({
        ...prev,
        currentLOD: levels[0],
        triangleCount: levels[0].triangleCount
      }))
    }
  }, [assetId])

  // Manuel LOD güncelleme
  const updateLOD = useCallback(async (forceUpdate = false) => {
    if (!object3D || !camera) return

    const distance = LODHelper.calculateDistance(object3D, camera.position)
    const clampedDistance = Math.max(minDistance, Math.min(maxDistance, distance))
    
    // Hysteresis kontrolü
    if (!forceUpdate && Math.abs(clampedDistance - lastDistance.current) < hysteresis) {
      return
    }

    const newLOD = lodManager.selectLODForAsset(assetId, clampedDistance, performanceLevel)
    if (!newLOD) return

    const currentLOD = lodState.currentLOD
    
    // LOD değişikliği gerekli mi?
    if (currentLOD && currentLOD.distance === newLOD.distance) {
      setLODState(prev => ({ ...prev, distance: clampedDistance }))
      return
    }

    // Geçiş animasyonu başlat
    setLODState(prev => ({ ...prev, isTransitioning: true, distance: clampedDistance }))

    try {
      if (currentLOD) {
        await lodManager.transitionAssetLOD(assetId, newLOD)
      }
      
      setLODState(prev => ({
        ...prev,
        currentLOD: newLOD,
        isTransitioning: false,
        triangleCount: newLOD.triangleCount
      }))
      
      lastDistance.current = clampedDistance
    } catch (error) {
      console.error('LOD transition failed:', error)
      setLODState(prev => ({ ...prev, isTransitioning: false }))
    }
  }, [object3D, camera, assetId, performanceLevel, hysteresis, minDistance, maxDistance, lodState.currentLOD])

  // Frame bazlı güncelleme
  useFrame(() => {
    if (!enableAutoUpdate) return
    
    frameCount.current++
    if (frameCount.current % updateInterval === 0) {
      updateLOD()
    }
  })

  // Performans seviyesi değiştiğinde LOD'u güncelle
  useEffect(() => {
    if (enableAutoUpdate) {
      updateLOD(true)
    }
  }, [performanceLevel, updateLOD, enableAutoUpdate])

  // LOD istatistiklerini al
  const getLODStats = useCallback(() => {
    return lodManager.getLODStats()
  }, [])

  // Aktif LOD seviyesini al
  const getActiveLOD = useCallback(() => {
    return lodManager.getActiveLOD(assetId)
  }, [assetId])

  // LOD konfigürasyonunu al
  const getLODConfig = useCallback(() => {
    return lodManager.getAssetLODConfig(assetId)
  }, [assetId])

  return {
    // State
    currentLOD: lodState.currentLOD,
    distance: lodState.distance,
    isTransitioning: lodState.isTransitioning,
    triangleCount: lodState.triangleCount,
    
    // Actions
    defineLODLevels,
    updateLOD,
    getLODStats,
    getActiveLOD,
    getLODConfig,
    
    // Utilities
    calculateDistance: useCallback((pos: Vector3) => {
      if (!camera) return 0
      return pos.distanceTo(camera.position)
    }, [camera])
  }
}

/**
 * Otomatik LOD yönetimi için basit hook
 */
export function useAutoLOD(
  assetId: string,
  object3D: Object3D | null,
  lodLevels: LODLevel[],
  options?: UseLODOptions
) {
  const { camera } = useThree()
  const lod = useLOD(assetId, object3D, camera, options)

  // LOD seviyelerini otomatik tanımla
  useEffect(() => {
    if (lodLevels.length > 0) {
      lod.defineLODLevels(lodLevels)
    }
  }, [lodLevels, lod])

  return lod
}