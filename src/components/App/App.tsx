import React, { Suspense, useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import MobilePlayer from '../Player/MobilePlayer';
import Lights from '../Lights/Lights';
import { PerformanceProvider } from '../../systems/performance';
import { usePerformance } from '../../hooks/usePerformance';
import { SimplePerformance } from '../SimplePerformance';
import PerformanceToast from '../PerformanceToast/PerformanceToast';
import { CameraSystemInitializer } from '../CameraSystemInitializer/CameraSystemInitializer';
import { ErrorRecoveryProvider, ErrorBoundary } from '../../systems/error/ErrorRecoveryContext';
import { useErrorRecovery } from '../../hooks/useErrorRecovery';
import { UserSettingsProvider } from '../../systems/settings/UserSettingsContext';
import { SimpleMobileUI } from '../SimpleMobileUI/SimpleMobileUI';
import { useMobileSystem } from '../../hooks/useMobileSystem';
import MobileInputManager from '../../systems/mobile/MobileInputManager';
import { fpsStabilizer } from '../../utils/FPSStabilizer';
import { memoryManager } from '../../utils/MemoryManager';

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
  const [showPerformancePanel, setShowPerformancePanel] = useState<boolean>(false);
  const [showPerformanceCounter, setShowPerformanceCounter] = useState<boolean>(true);
  const { config, actions, userPreferences, metrics } = usePerformance();
  const { isRecovering, handlePerformanceError, registerFallbackAsset } = useErrorRecovery();
  
  // Mobile system integration
  const mobileSystem = useMobileSystem();
  
  // Mobile input manager
  const mobileInputManagerRef = useRef(MobileInputManager.getInstance());

  // Mobile UI callbacks - defined outside of conditional rendering
  const handleMobileMove = useCallback((direction: any) => {
    // Handle mobile movement input - directly integrated in MobilePlayer
    const mobileInput = mobileInputManagerRef.current;
    mobileInput.updateMovement(direction);
  }, []);

  const handleMobileLook = useCallback((rotation: any) => {
    // Handle mobile camera rotation - directly integrated in MobilePlayer
    const mobileInput = mobileInputManagerRef.current;
    mobileInput.updateCamera(rotation);
  }, []);

  const handleMobileAction = useCallback((action: any) => {
    const mobileInput = mobileInputManagerRef.current;
    if (action === 'jump') {
      mobileInput.updateAction('jump', true);
    } else if (action === 'interact') {
      mobileInput.updateAction('interact', true);
    } else if (action === 'menu') {
      // Toggle day/night mode for mobile performance
      setNight(prev => !prev);
    }
  }, []);

  // Optimize key handler with useCallback to prevent re-creation
  const handleKeyDown = useCallback((e: KeyboardEvent): void => {
    switch(e.code) {
      case "KeyN":
        setNight(prev => !prev);
        return;
      case "KeyP":
        // Toggle performance mode by adjusting quality
        const newQuality = config.quality === 'high' ? 'low' : 
                         config.quality === 'medium' ? 'high' : 'medium';
        actions.updateConfig({ quality: newQuality });
        return;
      case "KeyM":
        // Toggle performance panel
        setShowPerformancePanel(prev => !prev);
        return;
      case "KeyF":
        // Toggle performance counter
        setShowPerformanceCounter(prev => !prev);
        return;
      default: 
        return;
    }
  }, [config.quality, actions]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  // Initialize performance systems
  useEffect(() => {
    // Configure FPS stabilizer
    fpsStabilizer.setConfig({
      targetFPS: config.targetFPS,
      toleranceRange: 5,
      adaptiveRendering: true,
      frameSkipping: true,
      dynamicQuality: true,
      smoothingFactor: 0.3
    });
    
    // Configure memory manager
    memoryManager.setConfig({
      aggressiveCleanup: config.quality === 'low',
      autoGarbageCollection: true,
      memoryThreshold: config.quality === 'low' ? 200 : 
                      config.quality === 'medium' ? 300 : 400,
      cleanupInterval: config.quality === 'low' ? 5000 : 10000
    });
    
    // Start FPS stabilization
    fpsStabilizer.start();
    
    // Register fallback assets
    registerFallbackAsset('default-model', '/assets/fallback/default-model.glb');
    registerFallbackAsset('default-texture', '/assets/fallback/default-texture.jpg');
    registerFallbackAsset('artwork-placeholder', '/assets/fallback/artwork-placeholder.glb');
    
    // Cleanup on unmount
    return () => {
      fpsStabilizer.stop();
    };
  }, [registerFallbackAsset, config]);

  // Monitor performance and trigger error handling if needed (optimized)
  useEffect(() => {
    let performanceCheckInterval: number;
    
    const checkPerformance = () => {
      if (metrics.fps < 15 && metrics.fps > 0) {
        handlePerformanceError(metrics.fps, 30, metrics);
      }
    };

    // Only start monitoring after a delay to avoid initial loading issues
    const startTimeout = setTimeout(() => {
      performanceCheckInterval = window.setInterval(checkPerformance, 8000); // Less frequent
    }, 3000);

    return () => {
      clearTimeout(startTimeout);
      if (performanceCheckInterval) {
        clearInterval(performanceCheckInterval);
      }
    };
  }, [metrics, handlePerformanceError]); // Include metrics dependency

  return (
    <>
      {isRecovering && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          zIndex: 10000,
          textAlign: 'center'
        }}>
          <div>Sistem Kurtarma Devam Ediyor...</div>
          <div style={{ marginTop: '10px', fontSize: '14px', opacity: 0.8 }}>
            Deneyimi optimize ederken lütfen bekleyin
          </div>
        </div>
      )}
      
      <Canvas 
        gl={useMemo(() => ({ 
          antialias: mobileSystem.active ? mobileSystem.config.antialiasing : config.antialiasing,
          powerPreference: (mobileSystem.active ? mobileSystem.optimization.qualityLevel === 'ultra-low' || mobileSystem.optimization.qualityLevel === 'low' : config.quality === 'low') ? 'low-power' : 'high-performance',
          preserveDrawingBuffer: false,
          alpha: false,
          stencil: false,
          depth: true,
          precision: config.quality === 'low' ? 'lowp' : 'mediump',
          premultipliedAlpha: false,
          failIfMajorPerformanceCaveat: false,
        }), [mobileSystem.active, mobileSystem.config.antialiasing, mobileSystem.optimization.qualityLevel, config.antialiasing, config.quality])}
        onCreated={useCallback(({ gl, camera, scene }: { gl: any, camera: any, scene: any }) => { 
          // Apply performance-based shadow settings with mobile optimizations
          const shadowQuality = mobileSystem.active ? mobileSystem.config.shadowQuality : config.shadowQuality;
          gl.shadowMap.enabled = shadowQuality !== 'off';
          gl.shadowMap.type = shadowQuality === 'high' ? 
            THREE.PCFSoftShadowMap : 
            shadowQuality === 'medium' ? THREE.PCFShadowMap : THREE.BasicShadowMap;
            
          // Dynamic pixel ratio based on performance
          if (mobileSystem.active) {
            // Cap DPR harder on mobile and multiply by render scale
            const capped = Math.min(window.devicePixelRatio, 1.25);
            gl.setPixelRatio(capped * mobileSystem.config.renderScale);
          } else {
            const maxPixelRatio = config.quality === 'low' ? 1 : 
                                 config.quality === 'medium' ? 1.5 : 2;
            gl.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
          }
          
          // Advanced rendering optimizations
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.toneMapping = mobileSystem.active ? THREE.LinearToneMapping : (config.quality === 'low' ? THREE.LinearToneMapping : THREE.ACESFilmicToneMapping);
          gl.toneMappingExposure = 1.0;
          
          // Frustum culling optimization
          camera.far = mobileSystem.active ? 120 : (config.quality === 'low' ? 150 : 
                      config.quality === 'medium' ? 250 : 400);
          
          // Scene optimizations
          scene.matrixAutoUpdate = false; // Manual matrix updates for performance
          
          // WebGL state optimization
          gl.info.autoReset = false; // Manual reset for better control
          
          // Performance monitoring integration
          const performanceManager = (window as any).performanceManager;
          if (performanceManager) {
            performanceManager.enableAutoOptimization(true);
          }
          
        }, [mobileSystem.active, mobileSystem.config.shadowQuality, mobileSystem.config.renderScale, config.shadowQuality, config.quality])}
        frameloop="demand" // Only render when needed
        performance={{ min: 0.2, max: 1.0, debounce: 200 }} // Adaptive performance
      >
      <Camera fov={60} />
      <CameraSystemInitializer />
      
      {/* Conditional rendering for performance on mobile */}
      {night ? 
        <>
          {!mobileSystem.active && <Stars />}
          {!mobileSystem.active && (
            <Suspense fallback={null}>
              <Moon />
            </Suspense>
          )}
          {/* @ts-ignore */}
          <fog attach="fog" args={["#272730", 30, mobileSystem.active ? 100 : 250]}/>
        </>
        : 
        <>
          {!mobileSystem.active && <Sky sunPosition={[110, 170, -250]} />}
          {/* @ts-ignore */}
          <fog attach="fog" args={["#f0f4f5", 30, mobileSystem.active ? 100 : 250]}/>
        </>
      }

      <Lights 
        night={night}
        performance={false} // Always enable full lighting for picture visibility
      />
           
      {/* Player with mobile support */}
      <MobilePlayer />
      <Physics gravity={[0, -30, 0]}>
        <Suspense fallback={null}>
          <Ground /> 
          <Building />            
          <Art />  
          <Furniture />               
        </Suspense>
      </Physics>
    </Canvas>
    
    {/* Simple Performance Counter - Minimal Mode */}
    <SimplePerformance 
      visible={showPerformanceCounter}
      mode="minimal"
      position="top-left"
    />
    
    {/* Simple Performance Dashboard - Detailed Mode */}
    <SimplePerformance 
      visible={showPerformancePanel || userPreferences.showPerformanceStats}
      mode="dashboard"
    />
    
    <PerformanceToast enabled={true} />
    
    {/* Simplified Mobile UI Integration */}
    {mobileSystem.active && (
      <SimpleMobileUI
        visible={mobileSystem.ui.controlsVisible || mobileSystem.ui.hudVisible}
        onMove={handleMobileMove}
        onLook={handleMobileLook}
        onAction={handleMobileAction}
      />
    )}
  </>
  );
};

// Main App component with providers and error boundary
const App: React.FC = () => {
  return (
    <ErrorBoundary fallback={
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h1 style={{ color: '#333', marginBottom: '20px' }}>Dijital Müze - Sistem Hatası</h1>
        <p style={{ color: '#666', marginBottom: '30px', textAlign: 'center', maxWidth: '500px' }}>
          Müze deneyimini yüklerken beklenmeyen bir hata ile karşılaştık.
          Bu durum WebGL uyumluluk sorunlarından veya kaynak kısıtlamalarından kaynaklanıyor olabilir.
        </p>
        <button 
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Müzeyi Yeniden Yükle
        </button>
        <p style={{ color: '#999', marginTop: '20px', fontSize: '14px' }}>
          Sorun devam ederse farklı bir tarayıcı kullanmayı veya grafik sürücülerinizi güncellemeyi deneyin.
        </p>
      </div>
    }>
      <UserSettingsProvider>
        <ErrorRecoveryProvider>
          <PerformanceProvider>
            <AppContent />
          </PerformanceProvider>
        </ErrorRecoveryProvider>
      </UserSettingsProvider>
    </ErrorBoundary>
  );
};

export default App;