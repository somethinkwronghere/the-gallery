import React, { useRef, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stats } from '@react-three/drei'
import { Mesh, BoxGeometry, MeshStandardMaterial, Vector3, Euler } from 'three'
import { RenderingProvider } from '../systems/rendering/RenderingContext'
import { useInstancing } from '../hooks/useInstancing'
import InstancedMeshWrapper, { InstancedMeshWrapperRef } from '../components/Art/InstancedMeshWrapper'

/**
 * Example component demonstrating the instancing system
 * Shows how to create multiple instances of the same object efficiently
 */
const InstancedArtScene: React.FC = () => {
  const instancing = useInstancing()
  const wrapperRef = useRef<InstancedMeshWrapperRef>(null)
  const [stats, setStats] = useState<any>(null)

  // Create a simple mesh for demonstration
  const demoMesh = new Mesh(
    new BoxGeometry(1, 1, 1),
    new MeshStandardMaterial({ color: 0x00ff00 })
  )

  // Define instance positions in a grid pattern
  const instanceData = Array.from({ length: 25 }, (_, i) => {
    const x = (i % 5) * 3 - 6
    const z = Math.floor(i / 5) * 3 - 6
    const y = Math.sin(i * 0.5) * 2

    return {
      position: new Vector3(x, y, z),
      rotation: new Euler(0, i * 0.2, 0),
      scale: new Vector3(0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5, 0.5 + Math.random() * 0.5),
      visible: true,
      userData: { index: i, color: `hsl(${i * 14}, 70%, 50%)` }
    }
  })

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(instancing.getStats())
    }, 1000)

    return () => clearInterval(interval)
  }, [instancing])

  // Animation example - update some instances
  useEffect(() => {
    const interval = setInterval(() => {
      if (wrapperRef.current) {
        // Animate first 5 instances
        for (let i = 0; i < 5; i++) {
          const time = Date.now() * 0.001
          const y = Math.sin(time + i) * 2
          const rotation = new Euler(0, time + i * 0.5, 0)
          
          wrapperRef.current.updateInstance(
            i,
            new Vector3((i % 5) * 3 - 6, y, -6),
            rotation,
            new Vector3(0.8, 0.8, 0.8)
          )
        }
      }
    }, 16) // ~60fps

    return () => clearInterval(interval)
  }, [])

  const handleInstancesCreated = (groupId: string, instanceIds: string[]) => {
    console.log(`Instances created - Group: ${groupId}, Count: ${instanceIds.length}`)
  }

  const handleToggleVisibility = () => {
    if (wrapperRef.current) {
      // Toggle visibility of every other instance
      for (let i = 0; i < instanceData.length; i += 2) {
        wrapperRef.current.setInstanceVisibility(i, Math.random() > 0.5)
      }
    }
  }

  const handleAddInstance = () => {
    if (wrapperRef.current) {
      const randomPos = new Vector3(
        (Math.random() - 0.5) * 20,
        Math.random() * 5,
        (Math.random() - 0.5) * 20
      )
      const randomRot = new Euler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      )
      const randomScale = new Vector3(0.5, 0.5, 0.5)
      
      wrapperRef.current.addInstance(randomPos, randomRot, randomScale, { dynamic: true })
    }
  }

  return (
    <>
      {/* Control Panel */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        zIndex: 100,
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        fontFamily: 'monospace',
        fontSize: '12px'
      }}>
        <h3>Instancing System Demo</h3>
        {stats && (
          <div>
            <div>Total Groups: {stats.totalGroups}</div>
            <div>Total Instances: {stats.totalInstances}</div>
            <div>Visible Instances: {stats.visibleInstances}</div>
            <div>Draw Calls Saved: {stats.drawCallsSaved}</div>
            <div>Memory Usage: {Math.round(stats.memoryUsage / 1024)}KB</div>
          </div>
        )}
        <div style={{ marginTop: '10px' }}>
          <button onClick={handleToggleVisibility} style={{ marginRight: '5px' }}>
            Toggle Visibility
          </button>
          <button onClick={handleAddInstance}>
            Add Instance
          </button>
        </div>
      </div>

      {/* 3D Scene */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color={0x404040} />
      </mesh>

      {/* Instanced objects */}
      <InstancedMeshWrapper
        ref={wrapperRef}
        originalMesh={demoMesh}
        maxInstances={100}
        instances={instanceData}
        onInstancesCreated={handleInstancesCreated}
        autoCleanup={true}
      />

      {/* Reference object (non-instanced) */}
      <mesh position={[10, 0, 0]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={0xff0000} />
      </mesh>

      <OrbitControls />
      <Stats />
    </>
  )
}

/**
 * Main example component with Canvas and providers
 */
const InstancedArtExample: React.FC = () => {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [15, 10, 15], fov: 60 }}>
        <RenderingProvider>
          <InstancedArtScene />
        </RenderingProvider>
      </Canvas>
    </div>
  )
}

export default InstancedArtExample