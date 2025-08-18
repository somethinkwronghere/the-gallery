import React from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

const Globe = () => {
    const { scene } = useLoader(
      GLTFLoader,
      process.env.PUBLIC_URL + "/assets/3D/3D world/earth_globe_hologram_2mb_looping_animation.glb",
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
      }
  });
  
    return (
         <primitive 
            scale={[0.5, 0.5, 0.5]} 
            position={[-11, 0, 33]}
            rotation={[0, Math.PI / 2, 0]}
            object={scene}                    
            dispose={null}
          />
    )
  }

  export default Globe;
