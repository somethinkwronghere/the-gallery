import React from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { useBox } from "@react-three/cannon";
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import * as THREE from 'three';

const WindowFrame = ({ 
  position,
  rotation,
  scale = [1, 1, 1],
  modelUrl = "/assets/3D/WindowNoGlassL/scene.gltf",
  mapUrl = "/assets/3D/WindowNoGlassL/Textures/Material_49_baseColor.png",
  info = ""
}) => {
    const [ref] = useBox(() => ({ 
        type: "static",         
        args: [2, 0.5, 0.8],
        position  
    }));

    const { scene } = useLoader(
      GLTFLoader,
      modelUrl.startsWith("/") ? process.env.PUBLIC_URL + modelUrl : process.env.PUBLIC_URL + "/" + modelUrl,
      (loader) => {
        const draco = new DRACOLoader();
        draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.0/');
        loader.setDRACOLoader(draco);
      }
    );

    // Load frame texture
    const frameMap = new THREE.TextureLoader().load(mapUrl.startsWith("/") ? process.env.PUBLIC_URL + mapUrl : process.env.PUBLIC_URL + "/" + mapUrl);
    if (frameMap) frameMap.flipY = false;

    scene.traverse( function ( child ) {
      if ( child.isMesh ) {                                     
          child.castShadow = true;
          child.receiveShadow = true;
          child.material.toneMapped = false;
          if (frameMap) child.material.map = frameMap;
          // Info propunu mesh'e ekle
          child.userData.info = info;
      }
  });
  
    return (
         <>
         <mesh ref={ref} />
         <primitive 
            scale={scale} 
            position={position}
            rotation={rotation}
            object={scene}                    
            dispose={null}
          />
          </>
    )
  }

  export default WindowFrame;
