import React, { useState, useEffect } from 'react'
import { useCameraSystem } from '../../hooks/useCameraSystem'
import { TeleportUI } from '../TeleportUI/TeleportUI'
import './CameraControls.css'

export function CameraControls() {
  const { 
    enableDevMode, 
    disableDevMode, 
    logCameraState,
    saveCurrentPosition
  } = useCameraSystem()
  
  const [showTeleportUI, setShowTeleportUI] = useState(false)
  const [devModeEnabled, setDevModeEnabled] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle teleport UI with 'T' key
      if (event.code === 'KeyT' && !event.ctrlKey && !event.altKey && !event.shiftKey) {
        event.preventDefault()
        setShowTeleportUI(prev => !prev)
      }
      
      // Toggle dev mode with Ctrl+Shift+D
      if (event.code === 'KeyD' && event.ctrlKey && event.shiftKey) {
        event.preventDefault()
        setDevModeEnabled(prev => {
          const newState = !prev
          if (newState) {
            enableDevMode()
          } else {
            disableDevMode()
          }
          return newState
        })
      }
      
      // Log camera state with Ctrl+Shift+C
      if (event.code === 'KeyC' && event.ctrlKey && event.shiftKey) {
        event.preventDefault()
        logCameraState()
      }
      
      // Quick save bookmark with Ctrl+Shift+B
      if (event.code === 'KeyB' && event.ctrlKey && event.shiftKey) {
        event.preventDefault()
        const name = `Quick Save ${new Date().toLocaleTimeString()}`
        saveCurrentPosition(name, 'Quick save bookmark')
        console.log(`Saved bookmark: ${name}`)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [enableDevMode, disableDevMode, logCameraState, saveCurrentPosition])

  return (
    <>
      {/* Floating controls */}
      <div className="camera-controls-overlay">
        <div className="camera-controls-panel">
          <button
            onClick={() => setShowTeleportUI(true)}
            className="camera-control-btn teleport"
            title="Open Teleport UI (T)"
          >
            🎯
          </button>
          
          <button
            onClick={() => {
              const name = `Position ${new Date().toLocaleTimeString()}`
              saveCurrentPosition(name)
            }}
            className="camera-control-btn bookmark"
            title="Save Current Position (Ctrl+Shift+B)"
          >
            📍
          </button>
          
          <button
            onClick={() => {
              setDevModeEnabled(prev => {
                const newState = !prev
                if (newState) {
                  enableDevMode()
                } else {
                  disableDevMode()
                }
                return newState
              })
            }}
            className={`camera-control-btn dev-mode ${devModeEnabled ? 'active' : ''}`}
            title="Toggle Dev Mode (Ctrl+Shift+D)"
          >
            🔧
          </button>
        </div>
        
        {devModeEnabled && (
          <div className="dev-mode-indicator">
            <span>🔧 Dev Mode Active</span>
            <div className="dev-shortcuts">
              <div>Ctrl+1/2/3: Quick teleports</div>
              <div>Ctrl+Shift+C: Log camera state</div>
              <div>T: Toggle teleport UI</div>
            </div>
          </div>
        )}
      </div>

      {/* Teleport UI */}
      <TeleportUI 
        visible={showTeleportUI}
        onClose={() => setShowTeleportUI(false)}
      />
    </>
  )
}