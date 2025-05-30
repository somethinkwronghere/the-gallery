import * as THREE from 'three';
import React, { useRef, useEffect } from 'react';
import { useFrame } from 'react-three-fiber';

// Simple animated RGB outline using THREE.LineSegments
export function AnimatedOutline({ mesh, visible = true, thickness = 0.04 }) {
  const group = useRef();
  const line = useRef();
  const timeRef = useRef(0);

  useEffect(() => {
    if (!mesh || !mesh.geometry) return;
    // Create outline geometry from mesh geometry
    const geo = mesh.geometry.clone();
    // If geometry is not indexed, convert to indexed
    if (!geo.index) geo.setIndex([...Array(geo.attributes.position.count).keys()]);
    // EdgesGeometry gives us the outline
    const edges = new THREE.EdgesGeometry(geo);
    line.current.geometry = edges;
  }, [mesh]);

  useFrame((_, delta) => {
    if (!line.current) return;
    timeRef.current += delta;
    // Animate color in RGB
    const t = timeRef.current;
    const r = 0.5 + 0.5 * Math.sin(t * 2.0);
    const g = 0.5 + 0.5 * Math.sin(t * 2.0 + 2.0);
    const b = 0.5 + 0.5 * Math.sin(t * 2.0 + 4.0);
    line.current.material.color.setRGB(r, g, b);
  });

  if (!mesh || !mesh.geometry) return null;

  return (
    <group ref={group} visible={visible} position={mesh.position} rotation={mesh.rotation} scale={mesh.scale}>
      <lineSegments
        ref={line}
        geometry={undefined}
        material={new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 })}
        renderOrder={10}
        scale={[1 + thickness, 1 + thickness, 1 + thickness]}
      />
    </group>
  );
}
