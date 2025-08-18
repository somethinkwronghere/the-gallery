import React, { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { PointerLockControls as PointerLockControlsExt } from 'three/examples/jsm/controls/PointerLockControls';

const PointerLockControls = (props) => {
    const { camera, gl } = useThree()
    const controls = useRef()
    const pointerSpeed = props.pointerSpeed ?? 0.2

    useEffect(() => {
        const canvasEl = gl && gl.domElement ? gl.domElement : null;
        if (!canvasEl) return;
        const handleClick = () => {
            if (controls.current) {
                controls.current.lock();
            }
        };
        canvasEl.addEventListener("click", handleClick);
        return () => {
            canvasEl.removeEventListener("click", handleClick);
        };
    }, [gl])

    return (
        <primitive
            object={new PointerLockControlsExt(camera, gl.domElement)}
            ref={controls}
            pointerSpeed={pointerSpeed}
            {...props}
        />
    )
}

export default PointerLockControls
