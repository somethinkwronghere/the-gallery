import React, { useState, useEffect } from 'react'
import { useCameraSystem } from '../../hooks/useCameraSystem'
import { TeleportUI } from '../TeleportUI/TeleportUI'
import './CameraControls.css'

export function CameraControls() {
  const { 
    saveCurrentPosition
  } = useCameraSystem()
  
  const [showTeleportUI, setShowTeleportUI] = useState(false)
  // Dev mode removed for stable build

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle teleport UI with 'T' key
      if (event.code === 'KeyT' && !event.ctrlKey && !event.altKey && !event.shiftKey) {
        event.preventDefault()
        setShowTeleportUI(prev => !prev)
      }
      
      // Dev hotkeys removed for stability
      
      // Quick save bookmark with Ctrl+Shift+B
      if (event.code === 'KeyB' && event.ctrlKey && event.shiftKey) {
        event.preventDefault()
        const name = `Hızlı Kayıt ${new Date().toLocaleTimeString()}`
        saveCurrentPosition(name, 'Hızlı kayıt yer imi')
        console.log(`Yer imi kaydedildi: ${name}`)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [saveCurrentPosition])

  return (
    <>
      {/* Floating controls */}
      <div className="camera-controls-overlay">
        <div className="camera-controls-panel">
          <button
            onClick={() => setShowTeleportUI(true)}
            className="camera-control-btn teleport"
            title="Teleport Arayüzünü Aç (T)"
          >
            🎯
          </button>
          
          <button
            onClick={() => {
              const name = `Konum ${new Date().toLocaleTimeString()}`
              saveCurrentPosition(name)
            }}
            className="camera-control-btn bookmark"
            title="Mevcut Konumu Kaydet (Ctrl+Shift+B)"
          >
            📍
          </button>
        </div>
      </div>

      {/* Teleport UI */}
      <TeleportUI 
        visible={showTeleportUI}
        onClose={() => setShowTeleportUI(false)}
      />
    </>
  )
}