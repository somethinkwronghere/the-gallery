import React, { useMemo, useEffect, useRef } from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { usePerformance } from '../../hooks/usePerformance';
import { assetOptimizer } from '../../utils/AssetOptimizer';

const Picture = ({
  url,
  scale,
  position,  
  rotation,
  metalness,
  roughness,
  info = ""
}) => {
    const { config } = usePerformance();
    const sceneRef = useRef();
    
    // Memoized loader configuration based on performance settings
    const loaderConfig = useMemo(() => {
      return (loader) => {
        const draco = new DRACOLoader();
        draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
        
        // Optimize DRACO configuration based on performance
        if (config.quality === 'low') {
          draco.setDecoderConfig({ type: 'js' }); // Faster but larger
        } else {
          draco.setDecoderConfig({ type: 'wasm' }); // Smaller but potentially slower
        }
        
        loader.setDRACOLoader(draco);
      };
    }, [config.quality]);
    
    const gltf = useLoader(
      GLTFLoader,
      url.startsWith("/") ? process.env.PUBLIC_URL + url : process.env.PUBLIC_URL + "/" + url,
      loaderConfig
    );
    
    // Optimize the loaded scene
    const optimizedScene = useMemo(() => {
      if (!gltf?.scene) return null;
      
      // Configure asset optimizer based on performance settings
      assetOptimizer.setConfig({
        qualityLevel: config.quality,
        maxTextureSize: config.quality === 'low' ? 512 : 
                       config.quality === 'medium' ? 1024 : 2048,
        enableCompression: true,
        enableLOD: config.enableLOD,
        enableCulling: config.enableCulling
      });
      
      // Clone scene for optimization
      const scene = gltf.scene.clone();
      
      // Optimize the scene
      const optimizedGLTF = assetOptimizer.optimizeGLTF({ ...gltf, scene });
      
      return optimizedGLTF.scene;
    }, [gltf, config]);
    
    // Configure materials and shadows based on performance
    useEffect(() => {
      if (!optimizedScene) return;
      
      optimizedScene.traverse((child) => {
        if (child.isMesh) {
          // Shadow settings based on performance
          const shadowQuality = config.shadowQuality;
          child.castShadow = shadowQuality !== 'off';
          child.receiveShadow = shadowQuality !== 'off';
          
          // Material optimization
          if (child.material) {
            // Keep toneMapped = true for proper lighting calculations
            child.material.toneMapped = true;
            child.material.metalness = metalness;
            child.material.roughness = roughness;
            
            // Performance-based material adjustments (only for very low performance)
            if (config.quality === 'low' && config.shadowQuality === 'off') {
              // Only disable expensive maps when shadows are already off
              child.material.normalMap = null;
              child.material.roughnessMap = null;
              child.material.metalnessMap = null;
            }
          }
          
          // User data
          child.userData.info = info;
          
          // Frustum culling
          child.frustumCulled = config.enableCulling;
          
          // Disable auto matrix updates for static objects
          child.matrixAutoUpdate = false;
          child.updateMatrix();
        }
      });
      
      // Store reference for cleanup
      sceneRef.current = optimizedScene;
      
    }, [optimizedScene, config, metalness, roughness, info]);
    
    // Cleanup on unmount
    useEffect(() => {
      return () => {
        if (sceneRef.current) {
          sceneRef.current.traverse((child) => {
            if (child.isMesh) {
              if (child.geometry) {
                child.geometry.dispose();
              }
              if (child.material) {
                if (Array.isArray(child.material)) {
                  child.material.forEach(material => material.dispose());
                } else {
                  child.material.dispose();
                }
              }
            }
          });
        }
      };
    }, []);
    
    // Add null check to prevent errors
    if (!optimizedScene) {
        return null;
    }
  
    return (
         <primitive 
            scale={scale} 
            position={position}
            rotation={rotation}
            object={optimizedScene}                    
            dispose={null}
          />
    )
  }

  export default Picture;
