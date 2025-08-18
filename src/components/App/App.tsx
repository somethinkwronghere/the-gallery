import React, { Suspense, useState, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, extend } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { Stars, Sky } from "@react-three/drei";
import Moon from '../Moon/Moon';
import Building from '../Building/Building';
import Ground from '../Ground/Ground';
import Art from '../Art/Art';
import Furniture from '../Furniture/Furniture';
import Camera from '../Camera/Camera';
import SimplePlayer from '../Player/SimplePlayer';
import Lights from '../Lights/Lights';
import { PerformanceProvider } from '../../systems/performance';
import { usePerformance } from '../../hooks/usePerformance';
import PerformanceMonitor from '../PerformanceMonitor/PerformanceMonitor';
import FPSCounter from '../FPSCounter/FPSCounter';
import PerformanceToast from '../PerformanceToast/PerformanceToast';
import { CameraControls } from '../CameraControls/CameraControls';
import { CameraSystemInitializer } from '../CameraSystemInitializer/CameraSystemInitializer';

// Global type definitions for React Three Fiber
declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Three.js primitives
      group: any
      mesh: any
      primitive: any
      
      // Geometries
      boxGeometry: any
      sphereGeometry: any
      cylinderGeometry: any
      planeGeometry: any
      torusGeometry: any
      icosahedronGeometry: any
      
      // Materials
      meshBasicMaterial: any
      meshStandardMaterial: any
      meshPhongMaterial: any
      
      // Lights
      ambientLight: any
      directionalLight: any
      pointLight: any
      spotLight: any
      
      // Helpers
      axesHelper: any
      gridHelper: any
    }
  }
}

// Extend Three.js objects for JSX
extend({ Fog: THREE.Fog });

// Inner App component that uses performance context
const AppContent: React.FC = () => {
  const [night, setNight] = useState<boolean>(true);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState<boolean>(false);
  const [showFPSCounter, setShowFPSCounter] = useState<boolean>(true);
  const { config, actions, userPreferences } = usePerformance();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      switch(e.code) {
        case "KeyN":
          setNight(!night);
          return;
        case "KeyP":
          // Toggle performance mode by adjusting quality
          const newQuality = config.quality === 'high' ? 'low' : 
                           config.quality === 'medium' ? 'high' : 'medium';
          actions.updateConfig({ quality: newQuality });
          return;
        case "KeyM":
          // Toggle performance monitor
          setShowPerformanceMonitor(!showPerformanceMonitor);
          return;
        case "KeyF":
          // Toggle FPS counter
          setShowFPSCounter(!showFPSCounter);
          return;
        default: 
          return;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [night, config.quality, actions, showPerformanceMonitor, showFPSCounter]);

  return (
    <>
      <Canvas 
        gl={{ 
          antialias: config.antialiasing,
          powerPreference: config.quality === 'low' ? 'low-power' : 'high-performance'
        }}
        onCreated={({ gl }) => { 
          // Apply performance-based shadow settings
          gl.shadowMap.enabled = config.shadowQuality !== 'off';
          gl.shadowMap.type = config.shadowQuality === 'high' ? 
            THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
        }}
      >
      <Camera fov={60} />
      <CameraSystemInitializer />
      
      {night ? 
        <>
          <Stars />
          <Suspense fallback={null}>
            <Moon />
          </Suspense>
          {/* @ts-ignore */}
          <fog attach="fog" args={["#272730", 30, 250]}/>
        </>
        : 
        <>
          <Sky sunPosition={[110, 170, -250]} /> 
          {/* @ts-ignore */}
          <fog attach="fog" args={["#f0f4f5", 30, 250]}/>
        </>
      }

      <Lights 
        night={night}
        performance={config.quality === 'low'}
      />
           
      {/* SimplePlayer outside physics for minimal coupling */}
      <SimplePlayer />
      <Physics gravity={[0, -30, 0]}>
        <Suspense fallback={null}>
          <Ground /> 
          <Building />            
          <Art />  
          <Furniture />               
        </Suspense>
      </Physics>
    </Canvas>
    
    <FPSCounter 
      visible={showFPSCounter}
      position="top-left"
    />
    
    <PerformanceToast enabled={true} />
    
    <PerformanceMonitor 
      visible={showPerformanceMonitor || userPreferences.showPerformanceStats} 
    />
    
    <CameraControls />
  </>
  );
};

// Main App component with Performance Provider
const App: React.FC = () => {
  return (
    <PerformanceProvider>
      <AppContent />
    </PerformanceProvider>
  );
};

export default App;