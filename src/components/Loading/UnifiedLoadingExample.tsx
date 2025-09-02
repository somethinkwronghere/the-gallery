import React from 'react'
import { useUnifiedLoading } from './UnifiedLoading'
import LoadingMigrationUtils from './LoadingMigrationUtils'

/**
 * Example component showing how to use the UnifiedLoading system
 * This demonstrates the new unified approach for loading management
 */
export const UnifiedLoadingExample: React.FC = () => {
  const { 
    startLoading, 
    updateProgress, 
    completeLoading, 
    errorLoading,
    isLoading,
    globalProgress 
  } = useUnifiedLoading()

  // Example: Asset loading
  const handleLoadAsset = async () => {
    const assetId = 'example-model'
    
    try {
      startLoading(assetId, 'asset', '3D Model yükleniyor...', 'model')
      
      // Simulate loading progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100))
        updateProgress(assetId, i, i < 50 ? 'downloading' : 'parsing')
      }
      
      completeLoading(assetId)
    } catch (error) {
      errorLoading(assetId, error as Error)
    }
  }

  // Example: Scene loading
  const handleLoadScene = async () => {
    const sceneId = 'example-scene'
    
    try {
      startLoading(sceneId, 'scene', 'Sahne hazırlanıyor...')
      
      // Simulate scene loading
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      completeLoading(sceneId)
    } catch (error) {
      errorLoading(sceneId, error as Error)
    }
  }

  // Example: Teleport loading
  const handleTeleport = async () => {
    const teleportAdapter = LoadingMigrationUtils.createTeleportLoadingAdapter()
    
    try {
      teleportAdapter.startTeleport('Ana Salon')
      
      // Simulate teleport progress
      for (let i = 0; i <= 100; i += 20) {
        await new Promise(resolve => setTimeout(resolve, 200))
        teleportAdapter.updateTeleportProgress(i)
      }
      
      teleportAdapter.completeTeleport()
    } catch (error) {
      teleportAdapter.errorTeleport(error as Error)
    }
  }

  // Example: Using the wrapper utility
  const handleWrappedOperation = () => {
    LoadingMigrationUtils.withUnifiedLoading(
      async () => {
        // Simulate some async operation
        await new Promise(resolve => setTimeout(resolve, 1500))
        return 'Operation completed!'
      },
      'wrapped-operation',
      'İşlem gerçekleştiriliyor...',
      'general'
    ).then(result => {
      console.log(result)
    }).catch(error => {
      console.error('Operation failed:', error)
    })
  }

  return (
    <div style={{ padding: '20px', maxWidth: '400px' }}>
      <h3>Unified Loading System Examples</h3>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Status:</strong> {isLoading ? `Loading... (${globalProgress}%)` : 'Ready'}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button onClick={handleLoadAsset}>
          Load 3D Model
        </button>
        
        <button onClick={handleLoadScene}>
          Load Scene
        </button>
        
        <button onClick={handleTeleport}>
          Teleport
        </button>
        
        <button onClick={handleWrappedOperation}>
          Wrapped Operation
        </button>
      </div>
      
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p>Bu örnekler UnifiedLoading sisteminin nasıl kullanılacağını gösterir:</p>
        <ul>
          <li>Asset yükleme (3D model, tekstür, ses)</li>
          <li>Sahne yükleme</li>
          <li>Teleport işlemleri</li>
          <li>Genel async operasyonlar</li>
        </ul>
      </div>
    </div>
  )
}

export default UnifiedLoadingExample