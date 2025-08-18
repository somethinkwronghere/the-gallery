import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const DirectionalLight = ({
    position,
    target,
    intensity,
    color,
    shadowCamBot,
    shadowCamTop,
    shadowCamL,
    shadowCamR
}) => {
    const lightRef = useRef();
    const targetRef = useRef();

    useEffect(() => {
        if (!lightRef.current || !targetRef.current) return;
        // Ensure light targets the helper object
        lightRef.current.target = targetRef.current;
        lightRef.current.target.updateMatrixWorld();
        // Ensure color applies even if it changes
        lightRef.current.color = new THREE.Color(color || 0xffffff);
        // Configure shadow camera bounds
        const cam = lightRef.current.shadow && lightRef.current.shadow.camera;
        if (cam) {
            if (shadowCamBot !== undefined) cam.bottom = shadowCamBot;
            if (shadowCamTop !== undefined) cam.top = shadowCamTop;
            if (shadowCamL !== undefined) cam.left = shadowCamL;
            if (shadowCamR !== undefined) cam.right = shadowCamR;
            cam.updateProjectionMatrix();
        }
    }, [color, shadowCamBot, shadowCamTop, shadowCamL, shadowCamR]);

    return (
        <>
            <directionalLight
                ref={lightRef}
                castShadow
                position={position}
                intensity={intensity}
                color={color}
                shadow-camera-bottom={shadowCamBot}
                shadow-camera-top={shadowCamTop}
                shadow-camera-left={shadowCamL}
                shadow-camera-right={shadowCamR}
                shadow-mapSize-width={1024}
                shadow-mapSize-height={1024}
            />
            <object3D ref={targetRef} position={target} />
        </>
    )
}

export default DirectionalLight;
