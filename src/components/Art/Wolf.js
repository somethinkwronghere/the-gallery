import React from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

const Wolf = ({ info = "", position = [0, 0, 0], rotation = [0, Math.PI / 2, 0], scale = [0.5, 0.5, 0.5] }) => {
    const { scene } = useLoader(
      GLTFLoader,
      process.env.PUBLIC_URL + "/assets/3D/kurt/source/Werewolf_Warrior.glb",
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
         <primitive 
            scale={scale}
            position={position}
            rotation={rotation}
            object={scene}                    
            dispose={null}
          />
    )
  }

  export default Wolf;
