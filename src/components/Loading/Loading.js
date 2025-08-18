import React, { useState, useEffect } from 'react';
import * as THREE from 'three'

const Loading = () => {
    const [finished, set] = useState(false)
    const [width, setWidth] = useState(0)
    const [opacity, setOpacity] = useState(1)
  
    useEffect(() => {
      THREE.DefaultLoadingManager.onLoad = () => {
        set(true)
        // Fade out effect
        setTimeout(() => setOpacity(0), 500)
      }
      THREE.DefaultLoadingManager.onProgress = (url, itemsLoaded, itemsTotal) =>
        setWidth((itemsLoaded / itemsTotal) * 200)
    }, [])
  
    if (finished && opacity === 0) {
      return null
    }
  
    return (
      <div 
        className="loading" 
        style={{ 
          opacity,
          transition: 'opacity 0.5s ease-out'
        }}
      >
        <h1 className="welcome">Digistory</h1>   
        <div className="loading-bar-container">                
          <div 
            className="loading-bar" 
            style={{ 
              width: `${width}px`,
              transition: 'width 0.3s ease-out'
            }} 
          />
        </div>
      </div>
    )
  }

  export default Loading;
