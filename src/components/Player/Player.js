import * as THREE from 'three';
import React, { useEffect, useRef, useState } from 'react';
import { useSphere } from '@react-three/cannon';
import { useThree, useFrame } from '@react-three/fiber';
import PointerLockControls from '../PointerLockControls/PointerLockControls'
import usePlayerControls from '../usePlayerControls/usePlayerControls'
import { Html } from '@react-three/drei';

const Player = (props) => {
  const { camera, scene } = useThree();
  const { 
    forward, 
    backward, 
    left, 
    right, 
    jump, 
    speed
  } = usePlayerControls();
  const [ref, api] = useSphere(() => ({ 
    mass: 1, 
    type: "Dynamic", 
    position: [0, 3, 22],
    rotation: [0, 0, 0],
    args: [1.2],
    linearDamping: 0.05,
    angularDamping: 0.5,
     ...props
  }));

  const velocity = useRef([0, 0, 0]);
  const raycaster = useRef(new THREE.Raycaster());
  const [hoveredInfo, setHoveredInfo] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [infoPos, setInfoPos] = useState([0,0,0]);
  const closeTimeout = useRef();

  useEffect(() =>  {
    api.velocity.subscribe(v => velocity.current = v)
  }, [api.velocity])
  
  useFrame(() => {
    if (!ref.current) return;
    camera.position.copy(ref.current.position)

    const frontVector = new THREE.Vector3(0, 0, (backward ? 1 : 0) - (forward ? 1 : 0))
    const sideVector = new THREE.Vector3((right ? 1 : 0) - (left ? 1 : 0), 0, 0)
    const direction = new THREE.Vector3()
    direction.addVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(speed)

    // Apply only camera yaw to movement direction
    const yawOnly = new THREE.Euler(0, camera.rotation.y, 0)
    direction.applyEuler(yawOnly)

    // Ground check against only meshes that receiveShadow (heuristic)
    const downRay = new THREE.Raycaster(ref.current.position, new THREE.Vector3(0, -1, 0), 0, 1.6)
    const intersectsDown = downRay.intersectObjects(scene.children, true)
    const grounded = intersectsDown && intersectsDown.length > 0

    // Apply velocity
    api.velocity.set(direction.x, velocity.current[1], direction.z)

    if (grounded && velocity.current[1] < 0) {
      api.velocity.set(velocity.current[0], 0, velocity.current[2])
    }

    if (jump && grounded) {
      api.velocity.set(velocity.current[0], 8, velocity.current[2])
    }

    // Raycast forward for info
    raycaster.current.setFromCamera({ x: 0, y: 0 }, camera);
    const intersects = raycaster.current.intersectObjects(scene.children, true);
    let foundInfo = "";
    let foundPos = null;
    if (intersects.length > 0) {
      for (let i = 0; i < intersects.length; i++) {
        if (intersects[i].object.userData && intersects[i].object.userData.info) {
          foundInfo = intersects[i].object.userData.info;
          foundPos = intersects[i].point;
          break;
        }
      }
    }
    setHoveredInfo(prev => prev !== foundInfo ? foundInfo : prev);
    if (foundPos) setInfoPos([foundPos.x, foundPos.y, foundPos.z]);
  });

  // E tuşu ile info aç/kapat
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === "KeyE" && hoveredInfo) {
        setShowInfo((prev) => !prev);
        if (closeTimeout.current) clearTimeout(closeTimeout.current);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hoveredInfo]);

  return (
    <>
      <PointerLockControls />
      <mesh ref={ref}></mesh>
      {showInfo && hoveredInfo && (
        <Html position={infoPos} center style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '20px',
            borderRadius: '10px',
            zIndex: 1000,
            fontSize: '1.2rem',
            minWidth: '180px',
            textAlign: 'center'
          }}>{hoveredInfo}</div>
        </Html>
      )}
    </>
  );

}

export default Player
