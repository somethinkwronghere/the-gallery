import { unifiedLoadingManager } from './UnifiedLoading'
import { AssetType } from '../../types/assets'
import { simpleErrorHandler } from '../../utils/SimpleErrorHandler'

/**
 * Migration utilities to help transition from existing loading systems
 * to the unified loading system
 */

// Legacy Loading component compatibility
export function createLegacyLoadingAdapter() {
  return {
    // Simulate the old Loading component behavior
    onStart: () => {
      unifiedLoadingManager.startLoading('legacy-scene', 'scene', 'Sahne yükleniyor...')
    },
    
    onProgress: (itemsLoaded: number, itemsTotal: number) => {
      const progress = itemsTotal > 0 ? (itemsLoaded / itemsTotal) * 100 : 0
      unifiedLoadingManager.updateProgress('legacy-scene', progress)
    },
    
    onComplete: () => {
      unifiedLoadingManager.completeLoading('legacy-scene')
    },
    
    onError: (error: Error) => {
      unifiedLoadingManager.errorLoading('legacy-scene', error)
    }
  }
}

// AssetPlaceholder integration
export function createAssetPlaceholderAdapter(assetType: AssetType, url: string) {
  const assetId = `asset-${btoa(url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 8)}`
  
  return {
    startLoading: (message?: string) => {
      const defaultMessage = getDefaultAssetMessage(assetType)
      unifiedLoadingManager.startLoading(assetId, 'asset', message || defaultMessage, assetType)
    },
    
    updateProgress: (progress: number) => {
      unifiedLoadingManager.updateProgress(assetId, progress)
    },
    
    complete: () => {
      unifiedLoadingManager.completeLoading(assetId)
    },
    
    error: (error: Error) => {
      unifiedLoadingManager.errorLoading(assetId, error)
    }
  }
}

// EnhancedAssetLoader integration
export function createEnhancedAssetLoaderAdapter() {
  return {
    onLoadStart: (url: string, type: AssetType) => {
      const assetId = `enhanced-${btoa(url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 8)}`
      const message = `${getAssetTypeLabel(type)} yükleniyor...`
      unifiedLoadingManager.startLoading(assetId, 'asset', message, type)
      return assetId
    },
    
    onProgress: (assetId: string, progress: number, stage?: string) => {
      const loadingStage = mapProgressStage(stage)
      unifiedLoadingManager.updateProgress(assetId, progress, loadingStage)
    },
    
    onComplete: (assetId: string) => {
      unifiedLoadingManager.completeLoading(assetId)
    },
    
    onError: (assetId: string, error: Error) => {
      unifiedLoadingManager.errorLoading(assetId, error)
    }
  }
}

// TeleportUI loading integration
export function createTeleportLoadingAdapter() {
  return {
    startTeleport: (destination: string) => {
      unifiedLoadingManager.startLoading('teleport', 'teleport', `${destination} konumuna teleport ediliyor...`)
    },
    
    updateTeleportProgress: (progress: number) => {
      unifiedLoadingManager.updateProgress('teleport', progress)
    },
    
    completeTeleport: () => {
      unifiedLoadingManager.completeLoading('teleport')
    },
    
    errorTeleport: (error: Error) => {
      unifiedLoadingManager.errorLoading('teleport', error)
    }
  }
}

// useLoadingStates hook compatibility
export function createLoadingStatesAdapter() {
  return {
    startLoading: (id: string, type: AssetType, url: string) => {
      const message = `${getAssetTypeLabel(type)} yükleniyor...`
      unifiedLoadingManager.startLoading(id, 'asset', message, type)
    },
    
    updateProgress: (id: string, progress: { percentage: number; stage: string }) => {
      const stage = mapProgressStage(progress.stage)
      unifiedLoadingManager.updateProgress(id, progress.percentage, stage)
    },
    
    completeLoading: (id: string) => {
      unifiedLoadingManager.completeLoading(id)
    },
    
    errorLoading: (id: string, error: Error) => {
      unifiedLoadingManager.errorLoading(id, error)
    },
    
    clearLoading: (id: string) => {
      unifiedLoadingManager.clearLoading(id)
    },
    
    clearAllLoading: () => {
      unifiedLoadingManager.clearAllLoading()
    }
  }
}

// Utility functions
function getDefaultAssetMessage(assetType: AssetType): string {
  switch (assetType) {
    case 'model':
      return '3D Model yükleniyor...'
    case 'texture':
      return 'Tekstür yükleniyor...'
    case 'audio':
      return 'Ses dosyası yükleniyor...'
    case 'material':
      return 'Materyal yükleniyor...'
    case 'geometry':
      return 'Geometri yükleniyor...'
    default:
      return 'Asset yükleniyor...'
  }
}

function getAssetTypeLabel(assetType: AssetType): string {
  switch (assetType) {
    case 'model':
      return '3D Model'
    case 'texture':
      return 'Tekstür'
    case 'audio':
      return 'Ses'
    case 'material':
      return 'Materyal'
    case 'geometry':
      return 'Geometri'
    default:
      return 'Asset'
  }
}

function mapProgressStage(stage?: string): 'downloading' | 'parsing' | 'processing' | 'complete' {
  switch (stage) {
    case 'downloading':
      return 'downloading'
    case 'parsing':
      return 'parsing'
    case 'optimizing':
    case 'processing':
      return 'processing'
    case 'complete':
      return 'complete'
    default:
      return 'downloading'
  }
}

// Batch operations for migrating multiple loading states
export function migrateExistingLoadingStates(existingStates: any[]) {
  // Clear any existing states first
  unifiedLoadingManager.clearAllLoading()
  
  // Migrate each state
  existingStates.forEach(state => {
    if (state.type && state.id) {
      unifiedLoadingManager.startLoading(
        state.id,
        state.type,
        state.message || 'Yükleniyor...',
        state.assetType
      )
      
      if (state.progress !== undefined) {
        unifiedLoadingManager.updateProgress(state.id, state.progress, state.stage)
      }
      
      if (state.error) {
        unifiedLoadingManager.errorLoading(state.id, state.error)
      }
    }
  })
}

// Helper to create a simple loading wrapper for any async operation
export function withUnifiedLoading<T>(
  operation: () => Promise<T>,
  id: string,
  message: string,
  type: 'asset' | 'scene' | 'teleport' | 'general' = 'general'
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    try {
      unifiedLoadingManager.startLoading(id, type, message)
      
      const result = await operation()
      
      unifiedLoadingManager.completeLoading(id)
      resolve(result)
    } catch (error) {
      // Use SimpleErrorHandler for better error management
      simpleErrorHandler.handleAssetError(id, 'unknown', error as Error, {
        showToUser: true,
        autoRecover: true
      })
      unifiedLoadingManager.errorLoading(id, error as Error)
      reject(error)
    }
  })
}

export default {
  createLegacyLoadingAdapter,
  createAssetPlaceholderAdapter,
  createEnhancedAssetLoaderAdapter,
  createTeleportLoadingAdapter,
  createLoadingStatesAdapter,
  migrateExistingLoadingStates,
  withUnifiedLoading
}