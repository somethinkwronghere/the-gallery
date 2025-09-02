import { useEffect, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import MobileInputManager from '../systems/mobile/MobileInputManager';

export const useMobilePlayerControls = (enabled: boolean = false) => {
  const { camera } = useThree();
  const mobileInputRef = useRef(MobileInputManager.getInstance());
  const [isMobileActive, setIsMobileActive] = useState(enabled);
  
  // Camera rotation state
  const cameraRotationRef = useRef({ x: 0, y: 0 });
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));

  useEffect(() => {
    if (!enabled) return;

    const mobileInput = mobileInputRef.current;

    // Subscribe to mobile input changes
    const unsubscribe = mobileInput.subscribe((inputState) => {
      // Handle camera rotation
      if (inputState.camera.pitch !== 0 || inputState.camera.yaw !== 0) {
        const sensitivity = 0.002; // Adjust this value to control sensitivity
        
        cameraRotationRef.current.x -= inputState.camera.pitch * sensitivity;
        cameraRotationRef.current.y -= inputState.camera.yaw * sensitivity;
        
        // Clamp pitch to prevent over-rotation
        cameraRotationRef.current.x = Math.max(
          -Math.PI / 2,
          Math.min(Math.PI / 2, cameraRotationRef.current.x)
        );
        
        // Apply rotation to camera
        euler.current.setFromQuaternion(camera.quaternion);
        euler.current.y = cameraRotationRef.current.y;
        euler.current.x = cameraRotationRef.current.x;
        camera.quaternion.setFromEuler(euler.current);
      }
    });

    return unsubscribe;
  }, [enabled, camera]);

  return {
    isMobileActive,
    setIsMobileActive
  };
};

export default useMobilePlayerControls;
