import React from 'react';
import { useLoader } from 'react-three-fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { draco } from 'drei';

const Picture = ({
  url,
  scale,
  position,  
  rotation,
  metalness,
  roughness,
  info = ""
}) => {
    const { scene } = useLoader(GLTFLoader, url.startsWith("/") ? process.env.PUBLIC_URL + url : process.env.PUBLIC_URL + "/" + url, draco("https://www.gstatic.com/draco/versioned/decoders/1.4.0/"));
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
