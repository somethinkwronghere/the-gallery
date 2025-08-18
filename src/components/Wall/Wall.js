import React, { useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import * as THREE from 'three';
import { useBox } from "@react-three/cannon";
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

const Wall = ({ 
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  modelUrl = "/assets/3D/Wall/scene.gltf",
  mapUrl = "/assets/3D/Wall/Textures/White_Wall.jpg",
  normalMapUrl = "/assets/3D/Wall/Textures/White_Wall_NORMAL.jpg",
  info = ""
}) => {
    // Room boundaries
    const [refFront] = useBox(() => ({ type: "static", args: [70, 50, 1], position: [0, 0, -17] }));
    const [refBack]  = useBox(() => ({ type: "static", args: [70, 50, 1], position: [0, 0, 44] }));
    const [refL]     = useBox(() => ({ type: "static", args: [1, 50, 80],  position: [-39.5, 0, 0] }));
    const [refR]     = useBox(() => ({ type: "static", args: [1, 50, 80],  position: [39.5, 0, 0] }));
    const [refTop]   = useBox(() => ({ type: "static", args: [150, 1, 150], position: [0, 30, 0] }));

    const { scene } = useLoader(
      GLTFLoader,
      modelUrl.startsWith("/") ? process.env.PUBLIC_URL + modelUrl : process.env.PUBLIC_URL + "/" + modelUrl,
      (loader) => {
        const draco = new DRACOLoader();
        draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.0/');
        loader.setDRACOLoader(draco);
      }
    );

    const size = 20;
    const texture = useMemo(() => new THREE.TextureLoader().load(mapUrl.startsWith("/") ? process.env.PUBLIC_URL + mapUrl : process.env.PUBLIC_URL + "/" + mapUrl), [mapUrl]);
    const normal  = useMemo(() => new THREE.TextureLoader().load(normalMapUrl.startsWith("/") ? process.env.PUBLIC_URL + normalMapUrl : process.env.PUBLIC_URL + "/" + normalMapUrl), [normalMapUrl]);
    if (texture) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(size, size);
      texture.flipY = false;
    }
    if (normal) {
      normal.wrapS = THREE.RepeatWrapping;
      normal.wrapT = THREE.RepeatWrapping;
      normal.repeat.set(size, size);
      normal.flipY = false;
    }

    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.material.side = THREE.DoubleSide;
        if (texture) child.material.map = texture;
        if (normal) child.material.normalMap = normal;
        child.material.metalness = 0;
        child.material.roughness = 1;
        child.userData.info = info;
      }
    });
  
    return (
         <>
           <mesh ref={refFront} />
           <mesh ref={refBack} />
           <mesh ref={refL} />
           <mesh ref={refR} />
           <mesh ref={refTop} />
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

  export default Wall;
