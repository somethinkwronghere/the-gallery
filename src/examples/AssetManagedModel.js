import React, { useEffect, useState, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh, BoxGeometry, MeshBasicMaterial } from 'three'
import { useModelAsset } from '../hooks/useAssetManager'

export function AssetManagedModel({
  url,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  autoOptimize = true,
  enableLOD = false
}) {
  const { asset, loading, error, progress } = useModelAsset(url, {
    cache: true,
    compress: autoOptimize,
    generateLOD: enableLOD
  })
  
  const [model, setModel] = useState(null)
  const [placeholderMesh, setPlaceholderMesh] = useState(null)
  const meshRef = useRef(null)

  useEffect(() => {
    if (asset && asset.type === 'model') {
      const clonedModel = asset.data.clone()
      clonedModel.position.set(...position)
      clonedModel.rotation.set(...rotation)
      clonedModel.scale.set(...scale)
      setModel(clonedModel)
      setPlaceholderMesh(null) // Clear placeholder
    }
  }, [asset, position, rotation, scale])

  useEffect(() => {
    if (loading && !placeholderMesh) {
      // Create placeholder mesh
      const geometry = new BoxGeometry(1, 1, 1)
      const material = new MeshBasicMaterial({ 
        color: progress ? `hsl(${progress.percentage * 1.2}, 70%, 50%)` : 'gray',
        opacity: 0.5,
        transparent: true
      })
      const mesh = new Mesh(geometry, material)
      mesh.position.set(...position)
      mesh.rotation.set(...rotation)
      mesh.scale.set(...scale)
      setPlaceholderMesh(mesh)
    }
  }, [loading, progress, position, rotation, scale, placeholderMesh])

  useEffect(() => {
    if (error && !placeholderMesh) {
      // Create error mesh
      const geometry = new BoxGeometry(1, 1, 1)
      const material = new MeshBasicMaterial({ color: 'red' })
      const mesh = new Mesh(geometry, material)
      mesh.position.set(...position)
      mesh.rotation.set(...rotation)
      mesh.scale.set(...scale)
      setPlaceholderMesh(mesh)
    }
  }, [error, position, rotation, scale, placeholderMesh])

  // Optional: Add LOD switching based on camera distance
  useFrame(({ camera }) => {
    if (meshRef.current && enableLOD) {
      const distance = camera.position.distanceTo(meshRef.current.position)
      // LOD logic would go here
      // This is a simplified example
    }
  })

  if (loading && placeholderMesh) {
    return <primitive ref={meshRef} object={placeholderMesh} />
  }

  if (error) {
    console.error('Failed to load model:', error)
    if (placeholderMesh) {
      return <primitive object={placeholderMesh} />
    }
    return null
  }

  if (!model) {
    return null
  }

  return <primitive ref={meshRef} object={model} />
}

// Example usage component
export function AssetManagedModelExample() {
  return (
    <>
      <AssetManagedModel 
        url="/assets/models/artwork1.glb"
        position={[0, 0, 0]}
        autoOptimize={true}
        enableLOD={true}
      />
      <AssetManagedModel 
        url="/assets/models/artwork2.glb"
        position={[5, 0, 0]}
        autoOptimize={true}
      />
      <AssetManagedModel 
        url="/assets/models/sculpture.glb"
        position={[-5, 0, 0]}
        autoOptimize={false}
      />
    </>
  )
}