import React from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { useBox } from "@react-three/cannon";
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import * as THREE from 'three';

const Glass = ({
  position,
  rotation,
  scale = [1, 1, 1],
  modelUrl = "/assets/3D/WindowGlassL/scene.gltf",
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
    scene.traverse( function ( child ) {
      if ( child.isMesh ) {                                     
          child.castShadow = false;
          child.receiveShadow = true;
          child.material = new THREE.MeshPhysicalMaterial({
            color: '#8ec9ff',
            transparent: true,
            opacity: 0.15,
            roughness: 0,
            metalness: 0,
            transmission: 0.95, // real glassy refraction
            thickness: 0.2,
            ior: 1.3,
            reflectivity: 0.1,
            clearcoat: 1,
            clearcoatRoughness: 0.05,
            side: THREE.DoubleSide,
            depthWrite: false
          });
          child.material.toneMapped = true;
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

  export default Glass;
