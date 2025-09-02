import React, { useEffect, useRef, useMemo } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import { Mesh, Vector3, Euler } from 'three'
import { useInstancing } from '../../hooks/useInstancing'
import Picture from '../Picture/Picture'
import Display from '../Display/Display'
import Wolf from './Wolf'


/**
 * Enhanced Art component with instancing support
 * Demonstrates how to use the instancing system for repeated objects
 */
const ArtInstanced: React.FC = () => {
  const instancing = useInstancing({
    config: {
      maxInstancesPerGroup: 100,
      enableObjectPooling: true,
      autoUpdateMatrices: true,
      frustumCulling: true
    }
  })

  // Refs for instance groups
  const displayGroupRef = useRef<string | null>(null)
  const decorativeElementsGroupRef = useRef<string | null>(null)

  // Load a simple geometry for instanced objects (decorative elements)
  const decorativeModel = useLoader(
    GLTFLoader,
    process.env.PUBLIC_URL + "/assets/3D/Girl/scene.gltf",
    (loader) => {
      const draco = new DRACOLoader()
      draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.0/')
      loader.setDRACOLoader(draco)
    }
  )

  // Create instance groups and instances
  useEffect(() => {
    if (!decorativeModel?.scene) return

    // Find the first mesh in the loaded model
    let decorativeMesh: Mesh | null = null
    decorativeModel.scene.traverse((child) => {
      if (child instanceof Mesh && !decorativeMesh) {
        decorativeMesh = child
      }
    })

    if (!decorativeMesh) return

    try {
      // Create instance group for decorative elements
      const groupId = instancing.createInstanceGroup(decorativeMesh, 20)
      decorativeElementsGroupRef.current = groupId

      // Create multiple instances of decorative elements around the gallery
      const decorativePositions = [
        // Corner decorations
        { position: new Vector3(-30, 2, -10), rotation: new Euler(0, 0, 0), scale: new Vector3(0.5, 0.5, 0.5) },
        { position: new Vector3(30, 2, -10), rotation: new Euler(0, Math.PI, 0), scale: new Vector3(0.5, 0.5, 0.5) },
        { position: new Vector3(-30, 2, 35), rotation: new Euler(0, Math.PI / 2, 0), scale: new Vector3(0.5, 0.5, 0.5) },
        { position: new Vector3(30, 2, 35), rotation: new Euler(0, -Math.PI / 2, 0), scale: new Vector3(0.5, 0.5, 0.5) },
        
        // Side decorations
        { position: new Vector3(-25, 1, 12), rotation: new Euler(0, Math.PI / 4, 0), scale: new Vector3(0.3, 0.3, 0.3) },
        { position: new Vector3(25, 1, 12), rotation: new Euler(0, -Math.PI / 4, 0), scale: new Vector3(0.3, 0.3, 0.3) },
        
        // Entrance decorations
        { position: new Vector3(-10, 3, -5), rotation: new Euler(0, 0, 0), scale: new Vector3(0.4, 0.4, 0.4) },
        { position: new Vector3(10, 3, -5), rotation: new Euler(0, Math.PI, 0), scale: new Vector3(0.4, 0.4, 0.4) },
      ]

      instancing.createMultipleInstances(groupId, decorativePositions.map(pos => ({
        position: pos.position,
        rotation: pos.rotation,
        scale: pos.scale,
        userData: { type: 'decoration', animated: true }
      })))

      console.log('Instancing system initialized with decorative elements')
      console.log('Instance stats:', instancing.getStats())

    } catch (error) {
      console.error('Error setting up instancing:', error)
    }

    // Cleanup function
    return () => {
      if (decorativeElementsGroupRef.current) {
        instancing.removeInstanceGroup(decorativeElementsGroupRef.current)
      }
    }
  }, [decorativeModel, instancing])

  // Animation frame for updating instances
  useFrame((state) => {
    // Simple animation for decorative elements
    if (decorativeElementsGroupRef.current) {
      const time = state.clock.elapsedTime
      const group = instancing.instanceManager.getInstanceGroup(decorativeElementsGroupRef.current)
      
      if (group) {
        const entries = Array.from(group.instances.entries()) as Array<[string, any]>
        entries.forEach((entry, index) => {
          const [instanceId, instance] = entry
          if (instance.userData?.animated) {
            // Create floating animation
            const originalY = 2 + (index % 2) * 1
            const floatOffset = Math.sin(time * 2 + index * 0.5) * 0.5
            const rotationOffset = time * 0.5 + index * 0.3
            
            const newPosition = new Vector3()
            newPosition.setFromMatrixPosition(instance.matrix)
            newPosition.y = originalY + floatOffset
            
            const newRotation = new Euler(0, rotationOffset, 0)
            const newScale = new Vector3(0.3, 0.3, 0.3)
            
            instancing.updateInstance(
              decorativeElementsGroupRef.current!,
              instanceId,
              newPosition,
              newRotation,
              newScale
            )
          }
        })
      }
    }
  })

  // Memoized stats display for development
  const stats = useMemo(() => {
    return instancing.getStats()
  }, [instancing])

  return (
    <>
      {/* Original art pieces */}
      {/* Liam portrait */}
      <Picture 
        url="assets/3D/Portrait/scene.gltf"
        scale={[4, 4, 4]}
        position={[19.3, 7, 0]}            
        rotation={[0, -Math.PI, 0]}
        metalness={0.9}
        roughness={0.9}
        info="Liam Portresi: 2021, Tuval üzerine yağlı boya. Bu portre, sanatçının kardeşi Liam'ın karakteristik özelliklerini ve duygusal derinliğini yansıtmak için yapılmıştır. Fırça darbeleri ve renk geçişleriyle portreye canlılık katılmıştır. Boyut: 70x100 cm. Sergilendiği yer: Ana Salon."
      />
      <Display position={[20, 5, 0]} size={[1, 18, 11]} />

      {/* Creation of Adam */}
      <Picture 
        url="assets/3D/Hands/scene.gltf"
        scale={[0.1, 0.1, 0.1]}
        position={[34.7, 12, 12]}            
        rotation={[0, -Math.PI / 2, Math.PI]}
        metalness={0}
        roughness={0.9}
        info="Creation of Adam: 2020, Dijital çalışma. Michelangelo'nun ünlü freskinden esinlenerek yapılan bu dijital eser, insanın yaratılış anını modern bir bakış açısıyla yorumluyor. Yüksek çözünürlüklü dijital baskı olarak sergilenmektedir. Boyut: 120x60 cm."
      />

      {/* Wedding */}
      <Picture 
        url="assets/3D/Wedding/scene.gltf"
        scale={[2.5, 2.5, 2.5]}
        position={[19.3, 7, 25]}            
        rotation={[Math.PI / 2, Math.PI, 0]}
        metalness={0.0}
        roughness={0.3}
        info="Wedding: 2019, Tuval üzerine akrilik. Bu eser, bir düğün anını soyut bir şekilde betimler. Renklerin ve formların dansı, izleyiciye neşe ve birliktelik duygusu aşılar. Boyut: 80x120 cm. Sergilendiği yer: Sağ Galeri."
      />
      <Display position={[20, 5, 25]} size={[1, 18, 11]} />

      {/* Wilson portrait */}
      <Picture 
        url="assets/3D/Wilson/scene.gltf"
        scale={[2.5, 2.5, 2.5]}
        position={[-19.3, 7, 0]}            
        rotation={[-Math.PI / 2, 0, 0]}
        metalness={0}
        roughness={0.3}
        info="Wilson Portresi: 2022, Tuval üzerine yağlı boya. Sanatçının yakın arkadaşı Wilson'ın portresi, detaylı ışık-gölge çalışmaları ve gerçekçi dokusuyla dikkat çeker. Boyut: 60x90 cm. Sergilendiği yer: Sol Galeri."
      />
      <Display position={[-20, 5, 0]} size={[1, 18, 11]} />

      {/* Old man portrait */}
      <Picture 
        url="assets/3D/OldMan/scene.gltf"
        scale={[4, 4, 4]}
        position={[-19.4, 7, 25]}            
        rotation={[0, 0, 0]}
        metalness={0.9}
        roughness={0.9}
        info="Kasımpatılı Natürmort: 1929, Sunta üzerine yağlı boya. Ali Sami Yetik'in bu eserinde, lacivert vazo ve cam kaseye yerleştirilmiş pembe, sarı, beyaz çiçekler ile dökülen yapraklar canlı renklerle ve izlenimci fırça darbeleriyle resmedilmiştir. Arka plan düz fon, imza sol üstte. Boyut: 123x97 cm (çerçeveli). Sergilendiği yer: Ankara RHM."
      />
      <Display position={[-20, 5, 25]} size={[1, 18, 11]} />

      {/* Girl portrait - Original (not instanced) */}
      <Picture 
        url="assets/3D/Girl/scene.gltf"
        scale={[6.5, 6.5, 6.5]}
        position={[-34.6, 10, 12]}            
        rotation={[-Math.PI / 2, 0, 0]}
        metalness={0.7}
        roughness={0.8}
        info="Kız Portresi: 2023, Dijital çalışma. Renkli ve enerjik bir kompozisyonla gençliğin dinamizmi ve umudu yansıtılmıştır. Dijital fırça teknikleriyle oluşturulmuş, canlı renkler ve modern bir tarzda sunulmuştur. Boyut: 100x100 cm."
      />

      {/* Wolf Sculpture - Center of gallery */}
      <Wolf 
        info="Werewolf Warrior: Fantastik heykel. Orta salon sergisi. Malzeme: Dijital/3B model."
        scale={[1.2, 1.2, 1.2]}
        position={[0, 0, 8]}
        rotation={[0, 0, 0]}
      />



      {/* Development info - only show in development mode */}
      {process.env.NODE_ENV === 'development' && (
        <>
          {/* Debug marker - would show instancing stats in a real debug panel */}
        </>
      )}
    </>
  )
}

export default ArtInstanced