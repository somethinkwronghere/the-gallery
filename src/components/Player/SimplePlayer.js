import * as THREE from 'three';
import React, { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import PointerLockControls from '../PointerLockControls/PointerLockControls'

const SimplePlayer = () => {
  const { camera, scene } = useThree();
  const positionRef = useRef(new THREE.Vector3(0, 6, 22));
  const keysRef = useRef({ forward: false, backward: false, left: false, right: false, shift: false, jump: false, info: false });
  const baseSpeed = 8; // units per second
  const baseEyeHeight = 6; // stand height
  const gravity = 18; // units/s^2
  const jumpVelocity = 7.5; // units/s
  const velocityYRef = useRef(0);

  const raycasterRef = useRef(new THREE.Raycaster());
  const [showInfo, setShowInfo] = useState(false);
  const [activeInfo, setActiveInfo] = useState("");
  const [activePos, setActivePos] = useState([0, 0, 0]);
  const hoveredInfoRef = useRef("");
  const infoPosRef = useRef([0, 0, 0]);
  const showInfoRef = useRef(false);

  useEffect(() => {
    camera.position.copy(positionRef.current)
  }, [camera])

  useEffect(() => {
    const onKeyDown = (e) => {
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
    const onKeyUp = (e) => {
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
  }, [])

  useEffect(() => {
    showInfoRef.current = showInfo;
  }, [showInfo])

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
      if (keysRef.current.jump) {
        velocityYRef.current = jumpVelocity;
      } else {
        velocityYRef.current = 0;
      }
    } else {
      velocityYRef.current -= gravity * delta;
    }
    positionRef.current.y += velocityYRef.current * delta;
    if (positionRef.current.y < baseEyeHeight) positionRef.current.y = baseEyeHeight;

    camera.position.copy(positionRef.current);

    // Raycast forward for info (from screen center)
    raycasterRef.current.setFromCamera({ x: 0, y: 0 }, camera);
    const intersects = raycasterRef.current.intersectObjects(scene.children, true);
    let foundInfo = "";
    let foundPos = null;
    if (intersects.length > 0) {
      for (let i = 0; i < intersects.length; i++) {
        const obj = intersects[i].object;
        if (obj && obj.userData && obj.userData.info) {
          foundInfo = obj.userData.info;
          foundPos = intersects[i].point;
          break;
        }
      }
    }
    if (foundInfo !== hoveredInfoRef.current) {
      hoveredInfoRef.current = foundInfo;
    }
    if (foundPos) {
      const pos = [foundPos.x, foundPos.y, foundPos.z];
      infoPosRef.current = pos;
    }
  })

  return (
    <>
      <PointerLockControls pointerSpeed={0.15} />
      {showInfo && activeInfo && (
        <Html position={activePos} center style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '20px',
            borderRadius: '10px',
            zIndex: 1000,
            fontSize: '1.1rem',
            minWidth: '180px',
            maxWidth: '360px',
            textAlign: 'center'
          }}>{activeInfo}</div>
        </Html>
      )}
    </>
  )
}

export default SimplePlayer


