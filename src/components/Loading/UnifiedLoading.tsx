import React, { useState, useEffect } from 'react'
import * as THREE from 'three'
import { AssetType } from '../../types/assets'
import './UnifiedLoading.css'

// Unified loading state interface
export interface UnifiedLoadingState {
  id: string
  type: 'asset' | 'scene' | 'teleport' | 'general'
  assetType?: AssetType
  message: string
  progress: number
  stage: 'downloading' | 'parsing' | 'processing' | 'complete'
  startTime: number
  error?: Error
}

// Unified loading manager interface
interface UnifiedLoadingManager {
  // State management
  loadingStates: Map<string, UnifiedLoadingState>
  globalProgress: number
  isLoading: boolean
  
  // Actions
  startLoading: (id: string, type: UnifiedLoadingState['type'], message: string, assetType?: AssetType) => void
  updateProgress: (id: string, progress: number, stage?: UnifiedLoadingState['stage']) => void
  completeLoading: (id: string) => void
  errorLoading: (id: string, error: Error) => void
  clearLoading: (id: string) => void
  clearAllLoading: () => void
}

// Global loading manager instance
class LoadingManager implements UnifiedLoadingManager {
  private states = new Map<string, UnifiedLoadingState>()
  private listeners = new Set<() => void>()
  
  get loadingStates() {
    return new Map(this.states)
  }
  
  get globalProgress() {
    const states = Array.from(this.states.values())
    if (states.length === 0) return 100
    
    const totalProgress = states.reduce((sum, state) => sum + state.progress, 0)
    return Math.round(totalProgress / states.length)
  }
  
  get isLoading() {
    return this.states.size > 0
  }
  
  startLoading(id: string, type: UnifiedLoadingState['type'], message: string, assetType?: AssetType) {
    const state: UnifiedLoadingState = {
      id,
      type,
      assetType,
      message,
      progress: 0,
      stage: 'downloading',
      startTime: Date.now()
    }
    
    this.states.set(id, state)
    this.notifyListeners()
  }
  
  updateProgress(id: string, progress: number, stage?: UnifiedLoadingState['stage']) {
    const state = this.states.get(id)
    if (state) {
      state.progress = Math.max(0, Math.min(100, progress))
      if (stage) state.stage = stage
      this.notifyListeners()
    }
  }
  
  completeLoading(id: string) {
    const state = this.states.get(id)
    if (state) {
      state.progress = 100
      state.stage = 'complete'
      
      // Immediately remove the loading state to hide the loading screen
      this.states.delete(id)
      this.notifyListeners()
    }
  }
  
  errorLoading(id: string, error: Error) {
    const state = this.states.get(id)
    if (state) {
      state.error = error
      state.stage = 'complete'
      this.notifyListeners()
    }
  }
  
  clearLoading(id: string) {
    this.states.delete(id)
    this.notifyListeners()
  }
  
  clearAllLoading() {
    this.states.clear()
    this.notifyListeners()
  }
  
  subscribe(listener: () => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
  
  private notifyListeners() {
    this.listeners.forEach(listener => listener())
  }
}

// Global instance
export const unifiedLoadingManager = new LoadingManager()

// Hook for using the unified loading manager
export function useUnifiedLoading() {
  const [, forceUpdate] = useState(0)
  
  useEffect(() => {
    const unsubscribe = unifiedLoadingManager.subscribe(() => {
      forceUpdate(prev => prev + 1)
    })
    return () => {
      unsubscribe()
    }
  }, [])
  
  return {
    loadingStates: unifiedLoadingManager.loadingStates,
    globalProgress: unifiedLoadingManager.globalProgress,
    isLoading: unifiedLoadingManager.isLoading,
    startLoading: unifiedLoadingManager.startLoading.bind(unifiedLoadingManager),
    updateProgress: unifiedLoadingManager.updateProgress.bind(unifiedLoadingManager),
    completeLoading: unifiedLoadingManager.completeLoading.bind(unifiedLoadingManager),
    errorLoading: unifiedLoadingManager.errorLoading.bind(unifiedLoadingManager),
    clearLoading: unifiedLoadingManager.clearLoading.bind(unifiedLoadingManager),
    clearAllLoading: unifiedLoadingManager.clearAllLoading.bind(unifiedLoadingManager)
  }
}

// Main UnifiedLoading component props
interface UnifiedLoadingProps {
  showGlobalProgress?: boolean
  showIndividualItems?: boolean
  showMessages?: boolean
  autoHide?: boolean
  hideDelay?: number
  className?: string
  style?: React.CSSProperties
}

// Main UnifiedLoading component
export const UnifiedLoading: React.FC<UnifiedLoadingProps> = ({
  showGlobalProgress = true,
  showIndividualItems = true,
  showMessages = true,
  autoHide = true,
  hideDelay = 1000,
  className = '',
  style = {}
}) => {
  // Loading ekranını tamamen devre dışı bırak
  return null
}



// Integration with THREE.js DefaultLoadingManager
export function setupThreeJSIntegration() {
  THREE.DefaultLoadingManager.onStart = (url: string, itemsLoaded: number, itemsTotal: number) => {
    unifiedLoadingManager.startLoading('threejs-global', 'scene', 'Sahne yükleniyor...')
  }
  
  THREE.DefaultLoadingManager.onProgress = (url: string, itemsLoaded: number, itemsTotal: number) => {
    const progress = itemsTotal > 0 ? (itemsLoaded / itemsTotal) * 100 : 0
    unifiedLoadingManager.updateProgress('threejs-global', progress)
    
    // Individual asset tracking
    const assetId = `threejs-${btoa(url).replace(/[^a-zA-Z0-9]/g, '').substring(0, 8)}`
    unifiedLoadingManager.updateProgress(assetId, 100, 'complete')
  }
  
  THREE.DefaultLoadingManager.onLoad = () => {
    unifiedLoadingManager.completeLoading('threejs-global')
  }
  
  THREE.DefaultLoadingManager.onError = (url: string) => {
    const error = new Error(`Failed to load: ${url}`)
    unifiedLoadingManager.errorLoading('threejs-global', error)
  }
}

export default UnifiedLoading