import * as THREE from 'three';
import React, { useEffect, useRef, useState } from 'react';
import { useSphere } from 'use-cannon';
import { useThree, useFrame } from 'react-three-fiber';
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
    position: [-11, 5, 33],
    rotation: [0, 0, Math.PI / 2],
    args: 5,
     ...props
  }));

  const velocity = useRef([0, 0, 0]);
  const raycaster = useRef(new THREE.Raycaster());
  const [hoveredInfo, setHoveredInfo] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [infoPos, setInfoPos] = useState([0,0,0]);
  const closeTimeout = useRef();

  useEffect(() =>  {
    //update reference everytime velocity changes
    api.velocity.subscribe(v => velocity.current = v)
  }, [api.velocity])
  
  useFrame(() => {
    if (!ref.current) return;
    camera.position.copy(ref.current.position)

    const frontVector = new THREE.Vector3(0, 0, Number(backward) - Number(forward))
    const sideVector = new THREE.Vector3(Number(left) - Number(right), 0, 0)
    const direction = new THREE.Vector3()
    direction.subVectors(frontVector, sideVector).normalize().multiplyScalar(speed).applyEuler(camera.rotation)
    api.velocity.set(direction.x, velocity.current[1], direction.z)
    if (jump && Math.abs(velocity.current[1].toFixed(2)) < 100) {
      api.velocity.set(velocity.current[0], 10, velocity.current[2])
    }
    // Raycast tam ortadaki noktadan ileriye
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
        // Timeout'u temizle
        if (closeTimeout.current) clearTimeout(closeTimeout.current);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hoveredInfo]);

  // hoveredInfo değişirse ve info kutusu açıksa, bakmayı bırakınca 3 sn sonra kapat
  useEffect(() => {
    if (!showInfo) return;
    if (hoveredInfo) {
      if (closeTimeout.current) clearTimeout(closeTimeout.current);
    } else {
      closeTimeout.current = setTimeout(() => setShowInfo(false), 3000);
    }
    return () => {
      if (closeTimeout.current) clearTimeout(closeTimeout.current);
    };
  }, [hoveredInfo, showInfo]);

  return (
    <>
      <PointerLockControls />
      <mesh ref={ref}></mesh>
      {/* InfoBox yerine Html ile overlay göster */}
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
