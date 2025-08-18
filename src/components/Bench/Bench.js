import React from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { useBox } from "@react-three/cannon";
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

const Bench = ({
  position,
  rotation,
  scale = [1, 1, 1],
  info = ""
}) => {
    const [ref] = useBox(() => ({ 
        type: "static",         
        args: [2, 0.5, 0.8],
        position  
    }));

    const { scene } = useLoader(
      GLTFLoader,
      process.env.PUBLIC_URL + "/assets/3D/Bench/scene.gltf",
      (loader) => {
        const draco = new DRACOLoader();
        draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.0/');
        loader.setDRACOLoader(draco);
      }
    );
    
    // Add null check to prevent errors
    if (!scene) {
        return null;
    }
    
    scene.traverse( function ( child ) {
      if ( child.isMesh ) {                                     
          child.castShadow = true;
          child.receiveShadow = true;
          child.material.toneMapped = false;
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

  export default Bench;
