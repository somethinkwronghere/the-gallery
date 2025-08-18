import React from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

const Moon = () => {
    const { scene } = useLoader(
      GLTFLoader,
      process.env.PUBLIC_URL + "/assets/3D/Moon/scene.gltf",
      (loader) => {
        const draco = new DRACOLoader();
        draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.0/');
        loader.setDRACOLoader(draco);
      }
    );
    scene.traverse( function ( child ) {
      if ( child.isMesh ) {                                     
          child.castShadow = false;
          child.receiveShadow = false;
          child.material.toneMapped = false;
          child.material.emissiveIntensity = 1;
      }
  });
  
    return (
         <primitive 
            scale={[2, 2, 2]} 
            position={[0, 50, -50]}
            rotation={[0, 0, 0]}
            object={scene}                    
            dispose={null}
          />
    )
  }
export default Moon;
