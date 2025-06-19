import React from 'react';
import { useLoader } from 'react-three-fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { draco } from 'drei';

const Wolf = () => {
    // Kurt modelinin doğru yolu
    const { scene } = useLoader(
        GLTFLoader,
        process.env.PUBLIC_URL + '/assets/3D/kurt/source/Werewolf_Warrior.glb',
        draco('https://www.gstatic.com/draco/versioned/decoders/1.4.0/')
    );

    scene.traverse(function (child) {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.material.metalness = 0.2;
            child.material.roughness = 0.8;
        }
    });

    return (
        <primitive
            scale={[1.95, 1.95, 1.95]} // %35 küçültülmüş boyut
            position={[0, 3, 12]} // Yerden tablolar kadar yüksekte ve tam ortada
            rotation={[0, Math.PI, 0]}
            object={scene}
            dispose={null}
        />
    );
};

export default Wolf;
