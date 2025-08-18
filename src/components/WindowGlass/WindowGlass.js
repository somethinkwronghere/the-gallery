import React, { useState, useEffect } from 'react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { useLoader } from '@react-three/fiber';
import * as THREE from 'three';


const WindowGlass = ({ position }) => {
    let newMaterial;
    const [model, setModel] = useState();

    newMaterial = new THREE.MeshPhysicalMaterial({
        color: "#8ec9ff",
        transparent: true,
        opacity: 0.12,
        roughness: 0,
        metalness: 0,
        transmission: 0.95,
        thickness: 0.25,
        ior: 1.3,
        reflectivity: 0.1,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
        side: THREE.DoubleSide,
        depthWrite: false
      });

    useEffect(() => {
      new GLTFLoader().load(process.env.PUBLIC_URL + "/assets/3D/WindowGlass/scene.gltf", setModel)
    }, []);
  
    return (
        
        model ? <primitive 
                    renderOrder={1}
                    scale={[4, 4, 4]}
                    position={[0, 0, 0]}
                    rotation={[0, -Math.PI /2, 0]}
                    object={model.scene}
                    shadows={model.scene.traverse( function ( child ) {
                        if ( child.isMesh ) {   
                            child.material = newMaterial;
                        }
                    })} 
                >                   
                </primitive>  : null
    )
  }

  export default WindowGlass;
