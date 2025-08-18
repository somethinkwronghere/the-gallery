import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

const Spotlight = ({
    position,
    target,
    intensity,
    penumbra,
    sNormalBias,
    sBias,
    angle,
    decay    
}) => {

    const ref = useRef();
    const targetRef = useRef();
    const light = useMemo(() => new THREE.SpotLight(0xffffff), [])

    useEffect(() => {
        if (!ref.current || !targetRef.current) return;
        ref.current.target = targetRef.current;
        ref.current.target.updateMatrixWorld();
        // Ensure bias configuration applies even if primitive misses props
        if (ref.current.shadow) {
            if (typeof sBias === 'number') ref.current.shadow.bias = sBias;
            if (typeof sNormalBias === 'number') ref.current.shadow.normalBias = sNormalBias;
        }
    }, [sBias, sNormalBias])

    return (
        <>
            <primitive 
                ref={ref}
                object={light}
                castShadow
                position={position}
                intensity={intensity} 
                penumbra={penumbra}
                angle={angle}
                decay={decay}
            />
            <primitive ref={targetRef} object={light.target} position={target}  />
            {/* <primitive object={new THREE.SpotLightHelper(light)} /> */}
        </>
    )
}

export default Spotlight;
