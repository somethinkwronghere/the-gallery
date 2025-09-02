import { useRef, useCallback, useMemo, useEffect } from 'react'
import { Camera, Object3D } from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { simplifiedLODManager } from '../systems/lod/SimplifiedLODManager'
import { simpleFrustumCulling } from '../systems/rendering/SimpleFrustumCulling'
import { usePerformance } from './usePerformance'

/**
 * Render optimizasyonu için ana hook
 * LOD yönetimi ve frustum culling'i birleştirir
 */
export function useRenderOptimization() {
  const { camera } = useThree()
  const { level: performanceLevel } = usePerformance()
  const frameCount = useRef(0)
  const lastOptimizationTime = useRef(0)
  
  // Optimizasyon ayarları
  const optimizationConfig = useMemo(() => ({
    lodUpdateFrequency: performanceLevel === 'low' ? 10 : 
                       performanceLevel === 'medium' ? 5 : 3,
    cullingUpdateFrequency: performanceLevel === 'low' ? 3 : 2,
    maxRenderDistance: performanceLevel === 'low' ? 100 : 
                      performanceLevel === 'medium' ? 150 : 200
  }), [performanceLevel])

  // Frustum culling konfigürasyonunu güncelle
  useEffect(() => {
    simpleFrustumCulling.setConfig({
      maxDistance: optimizationConfig.maxRenderDistance,
      updateFrequency: optimizationConfig.cullingUpdateFrequency,
      enabled: true,
      margin: performanceLevel === 'low' ? 0.5 : 1.0
    })
  }, [optimizationConfig, performanceLevel])

  // LOD manager konfigürasyonunu güncelle
  useEffect(() => {
    simplifiedLODManager.setUpdateFrequency(optimizationConfig.lodUpdateFrequency)
  }, [optimizationConfig.lodUpdateFrequency])

  /**
   * Obje için LOD tanımla
   */
  const defineLOD = useCallback((assetId: string, levels: any[]) => {
    simplifiedLODManager.defineLODLevels(assetId, levels)
  }, [])

  /**
   * Objenin görünür olup olmadığını kontrol et
   */
  const isObjectVisible = useCallback((object: Object3D): boolean => {
    if (!camera) return true
    return simpleFrustumCulling.isVisible(camera, object)
  }, [camera])

  /**
   * Birden fazla obje için culling yap
   */
  const cullObjects = useCallback((objects: Object3D[]) => {
    if (!camera) return { visible: objects, culled: [] }
    return simpleFrustumCulling.cullObjects(camera, objects)
  }, [camera])

  /**
   * Obje için LOD güncelle
   */
  const updateObjectLOD = useCallback((assetId: string, object: Object3D) => {
    if (!camera) return false
    return simplifiedLODManager.updateLOD(assetId, camera, object, performanceLevel)
  }, [camera, performanceLevel])

  /**
   * Frame bazlı optimizasyon
   */
  useFrame(() => {
    frameCount.current++
    const now = performance.now()
    
    // Performans bazlı optimizasyon sıklığı
    const optimizationInterval = performanceLevel === 'low' ? 100 : 
                                 performanceLevel === 'medium' ? 50 : 33

    if (now - lastOptimizationTime.current > optimizationInterval) {
      lastOptimizationTime.current = now
      
      // Burada genel optimizasyon işlemleri yapılabilir
      // Örneğin: memory cleanup, LOD güncellemeleri vb.
    }
  })

  /**
   * Optimizasyon istatistikleri
   */
  const getStats = useCallback(() => {
    return {
      lod: simplifiedLODManager.getStats(),
      culling: simpleFrustumCulling.getStats(),
      frameCount: frameCount.current,
      performanceLevel
    }
  }, [performanceLevel])

  /**
   * Optimizasyonu sıfırla
   */
  const reset = useCallback(() => {
    frameCount.current = 0
    lastOptimizationTime.current = 0
    simpleFrustumCulling.reset()
    simplifiedLODManager.clear()
  }, [])

  return {
    // LOD functions
    defineLOD,
    updateObjectLOD,
    getActiveLOD: useCallback((assetId: string) => 
      simplifiedLODManager.getActiveLOD(assetId), []),
    
    // Culling functions
    isObjectVisible,
    cullObjects,
    
    // Stats and control
    getStats,
    reset,
    
    // Configuration
    config: optimizationConfig
  }
}

/**
 * Basit LOD hook - tek obje için
 */
export function useSimpleLOD(assetId: string, object: Object3D | null, lodLevels: any[]) {
  const { defineLOD, updateObjectLOD, getActiveLOD } = useRenderOptimization()

  // LOD seviyelerini tanımla
  useEffect(() => {
    if (lodLevels.length > 0) {
      defineLOD(assetId, lodLevels)
    }
  }, [assetId, lodLevels, defineLOD])

  // LOD güncelleme
  const updateLOD = useCallback(() => {
    if (object) {
      return updateObjectLOD(assetId, object)
    }
    return false
  }, [assetId, object, updateObjectLOD])

  // Aktif LOD
  const activeLOD = useMemo(() => {
    return getActiveLOD(assetId)
  }, [assetId, getActiveLOD])

  return {
    activeLOD,
    updateLOD
  }
}

/**
 * Basit visibility hook - obje görünürlüğü için
 */
export function useVisibilityCheck(object: Object3D | null) {
  const { isObjectVisible } = useRenderOptimization()

  const isVisible = useMemo(() => {
    if (!object) return false
    return isObjectVisible(object)
  }, [object, isObjectVisible])

  return isVisible
}