import React from 'react';
import { useLoader } from 'react-three-fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { draco } from 'drei';
import { useBox } from "use-cannon";

const Globe = () => {
    // Globe için fiziksel kutu ekle (duvar gibi)
    const [ref] = useBox(() => ({
        type: "static",
        args: [5, 5, 0.5], // Genişlik, yükseklik, kalınlık (duvar gibi)
        position: [0, 11, 12], // Modelle aynı konumda
    }));
    const { scene } = useLoader(
        GLTFLoader,
        process.env.PUBLIC_URL + '/assets/3D/3d world/earth_globe_hologram_2mb_looping_animation.glb',
        draco('https://www.gstatic.com/draco/versioned/decoders/1.4.0/')
    );

    scene.traverse(function (child) {
        if (child.isMesh) {
            child.castShadow = false;
            child.receiveShadow = false;
            child.material.transparent = true;
            child.material.opacity = 0.85;
            child.material.emissiveIntensity = 1;
        }
    });

    return (
        <>
            <mesh ref={ref} />
            <primitive
                scale={[2.5, 2.5, 2.5]}
                position={[0, 11, 12]}
                rotation={[0, 0, 0]}
                object={scene}
                dispose={null}
            />
        </>
    );
};

export default Globe;
