import React from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

const Picture = ({
  url,
  scale,
  position,  
  rotation,
  metalness,
  roughness,
  info = ""
}) => {
    const { scene } = useLoader(
      GLTFLoader,
      url.startsWith("/") ? process.env.PUBLIC_URL + url : process.env.PUBLIC_URL + "/" + url,
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
          child.material.metalness = metalness;
          child.material.roughness =roughness;
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

  export default Picture;
