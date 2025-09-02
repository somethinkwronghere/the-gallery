import React, { useEffect, useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { PointerLockControls as PointerLockControlsExt } from 'three/examples/jsm/controls/PointerLockControls';

const PointerLockControls = (props) => {
    const { camera, gl } = useThree();
    const controls = useRef();
    
    // Fixed, low sensitivity for consistent desktop experience
    const pointerSpeed = 0.040; // slightly higher but still controlled

    // Create controls instance once to avoid stacking listeners and speed spikes
    const controlsInstance = useMemo(() => {
        return new PointerLockControlsExt(camera, gl.domElement);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [camera, gl]);

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

    // Update controls sensitivity when user settings change
    useEffect(() => {
        if (controls.current) {
            controls.current.pointerSpeed = pointerSpeed;
        }
    }, [pointerSpeed]);

    // Ensure cleanup of listeners on unmount
    useEffect(() => {
        controlsInstance.pointerSpeed = pointerSpeed;
        return () => {
            try {
                controlsInstance.dispose?.();
            } catch (_) {}
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <primitive
            object={controlsInstance}
            ref={controls}
            {...props}
        />
    )
}

export default PointerLockControls
