import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { cameraSystem } from '../systems/camera/CameraSystem'

export function useCameraSystemInitializer() {
  const { camera } = useThree()

  useEffect(() => {
    if (camera) {
      cameraSystem.initialize(camera)
      console.log('Camera system initialized with camera:', camera)
    }
  }, [camera])

  return null // This hook doesn't return anything, just initializes the system
}