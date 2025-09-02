import * as THREE from 'three';
import React, { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import PointerLockControls from '../PointerLockControls/PointerLockControls';
import MobileInputManager from '../../systems/mobile/MobileInputManager';
import { isMobileDevice, isTouchDevice } from '../../utils/deviceDetection';
import { useUserSettings } from '../../systems/settings/UserSettingsContext';

interface KeysState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  shift: boolean;
  jump: boolean;
  info: boolean;
}

const MobilePlayer: React.FC = () => {
  const { camera, scene } = useThree();
  const { settings } = useUserSettings();
  const positionRef = useRef(new THREE.Vector3(0, 6, 22));
  const keysRef = useRef<KeysState>({ 
    forward: false, 
    backward: false, 
    left: false, 
    right: false, 
    shift: false, 
    jump: false, 
    info: false 
  });
  
  const baseSpeed = 8; // units per second
  const baseEyeHeight = 6; // stand height
  const gravity = 18; // units/s^2
  const jumpVelocity = 7.5; // units/s
  const velocityYRef = useRef(0);

  const raycasterRef = useRef(new THREE.Raycaster());
  const [showInfo, setShowInfo] = useState(false);
  const [activeInfo, setActiveInfo] = useState("");
  const [activePos, setActivePos] = useState<[number, number, number]>([0, 0, 0]);
  const hoveredInfoRef = useRef("");
  const infoPosRef = useRef<[number, number, number]>([0, 0, 0]);
  const showInfoRef = useRef(false);

  // Mobile support
  const isMobile = isMobileDevice() || isTouchDevice();
  const mobileInputRef = useRef(MobileInputManager.getInstance());
  const cameraRotationRef = useRef({ x: 0, y: 0 });
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const lastLookUpdateRef = useRef<number>(performance.now());
  const lastRaycastTsRef = useRef<number>(0);

  useEffect(() => {
    camera.position.copy(positionRef.current);
  }, [camera]);

  // Mobile input subscription
  useEffect(() => {
    if (!isMobile) return;

    const mobileInput = mobileInputRef.current;

    const unsubscribe = mobileInput.subscribe((inputState) => {
      // Update movement keys based on mobile input
      const threshold = 0.1;
      
      keysRef.current.forward = inputState.movement.forward > threshold;
      keysRef.current.backward = inputState.movement.backward > threshold;
      keysRef.current.left = inputState.movement.left > threshold;
      keysRef.current.right = inputState.movement.right > threshold;
      keysRef.current.jump = inputState.actions.jump;

      // Handle camera rotation for mobile
      if (inputState.camera.pitch !== 0 || inputState.camera.yaw !== 0) {
        const now = performance.now();
        const dt = Math.max(0.016, Math.min(0.05, (now - lastLookUpdateRef.current) / 1000));
        lastLookUpdateRef.current = now;

        // Use user settings for mobile sensitivity with proper scaling
        const baseSensitivity = 1.2; // joystick gives -1..1, scale per second
        const userSensitivity = settings.mobile?.touchSensitivity ?? 0.8;
        const mouseSensitivity = settings.camera?.mouseSensitivity ?? 1.0;
        const finalSensitivity = baseSensitivity * userSensitivity * mouseSensitivity;
        
        // Apply rotation directly to camera (accumulative), time-scaled for smoothness
        cameraRotationRef.current.x += inputState.camera.pitch * finalSensitivity * dt;
        cameraRotationRef.current.y += inputState.camera.yaw * finalSensitivity * dt;
        
        // Clamp pitch to prevent over-rotation
        cameraRotationRef.current.x = Math.max(
          -Math.PI / 2,
          Math.min(Math.PI / 2, cameraRotationRef.current.x)
        );
        
        // Apply rotation to camera
        euler.current.set(
          cameraRotationRef.current.x,
          cameraRotationRef.current.y,
          0,
          'YXZ'
        );
        camera.quaternion.setFromEuler(euler.current);
      }
    });

    return unsubscribe;
  }, [isMobile, camera, settings.camera?.mouseSensitivity, settings.mobile?.touchSensitivity]);

  // Desktop keyboard controls
  useEffect(() => {
    if (isMobile) return; // Skip keyboard controls on mobile

    const onKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': keysRef.current.forward = true; break;
        case 'KeyS': keysRef.current.backward = true; break;
        case 'KeyA': keysRef.current.left = true; break;
        case 'KeyD': keysRef.current.right = true; break;
        case 'ShiftLeft':
        case 'ShiftRight': keysRef.current.shift = true; break;
        case 'Space': keysRef.current.jump = true; break;
        case 'KeyE':
          if (hoveredInfoRef.current) {
            setActiveInfo(hoveredInfoRef.current);
            setActivePos(infoPosRef.current);
            setShowInfo((prev) => !prev);
          } else if (showInfoRef.current) {
            setShowInfo(false);
          }
          break;
        default: break;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': keysRef.current.forward = false; break;
        case 'KeyS': keysRef.current.backward = false; break;
        case 'KeyA': keysRef.current.left = false; break;
        case 'KeyD': keysRef.current.right = false; break;
        case 'ShiftLeft':
        case 'ShiftRight': keysRef.current.shift = false; break;
        case 'Space': keysRef.current.jump = false; break;
        default: break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [isMobile]);

  useEffect(() => {
    showInfoRef.current = showInfo;
  }, [showInfo]);

  useFrame((state, delta) => {
    const { forward, backward, left, right, shift } = keysRef.current;
    const step = (shift ? baseSpeed * 2 : baseSpeed) * delta;

    // Compute view-relative basis vectors
    const forwardDir = new THREE.Vector3();
    camera.getWorldDirection(forwardDir);
    forwardDir.y = 0;
    forwardDir.normalize();
    const rightDir = new THREE.Vector3().crossVectors(forwardDir, new THREE.Vector3(0, 1, 0)).normalize();

    // Build movement vector
    const move = new THREE.Vector3();
    if (forward) move.add(forwardDir);
    if (backward) move.sub(forwardDir);
    if (right) move.add(rightDir);
    if (left) move.sub(rightDir);

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(step);
      positionRef.current.add(move);
    }

    // Jump/gravity
    const grounded = positionRef.current.y <= baseEyeHeight + 0.001;
    if (grounded) {
      positionRef.current.y = baseEyeHeight;
      velocityYRef.current = 0;
      if (keysRef.current.jump) {
        velocityYRef.current = jumpVelocity;
        // Reset jump immediately after applying velocity
        keysRef.current.jump = false;
        if (isMobile) {
          mobileInputRef.current.updateAction('jump', false);
        }
      }
    } else {
      velocityYRef.current -= gravity * delta;
      positionRef.current.y += velocityYRef.current * delta;
    }

    // Update camera position
    camera.position.copy(positionRef.current);

    // Raycast for info detection (throttled on mobile for stability)
    const now = performance.now();
    const shouldRaycast = !isMobile || (now - lastRaycastTsRef.current) > 300;
    if (shouldRaycast) {
      if (isMobile) lastRaycastTsRef.current = now;
      raycasterRef.current.setFromCamera(new THREE.Vector2(0, 0), camera);
      const intersects = raycasterRef.current.intersectObjects(scene.children, true);
      
      let foundInfo = "";
      let foundPos: [number, number, number] = [0, 0, 0];
      
      for (const intersect of intersects) {
        if (intersect.distance < 5 && (intersect.object as any).userData?.info) {
          foundInfo = (intersect.object as any).userData.info;
          foundPos = [intersect.point.x, intersect.point.y + 1.5, intersect.point.z];
          break;
        }
      }
      
      hoveredInfoRef.current = foundInfo;
      infoPosRef.current = foundPos;
    }
  });

  return (
    <>
      {/* Only show PointerLockControls on desktop - rely on default/user sensitivity */}
      {!isMobile && <PointerLockControls />}
      
      {/* Info display */}
      {showInfo && activeInfo && (
        <Html position={activePos}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            pointerEvents: 'none',
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px',
            maxWidth: '300px',
            textAlign: 'center'
          }}>
            {activeInfo}
          </div>
        </Html>
      )}
      
      {/* Interaction hint */}
      {hoveredInfoRef.current && !showInfo && (
        <Html position={infoPosRef.current}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.9)',
            color: 'black',
            padding: '5px 10px',
            borderRadius: '15px',
            pointerEvents: 'none',
            fontFamily: 'Arial, sans-serif',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {isMobile ? 'Tap interact button' : 'Press E to interact'}
          </div>
        </Html>
      )}
    </>
  );
};

export default MobilePlayer;
