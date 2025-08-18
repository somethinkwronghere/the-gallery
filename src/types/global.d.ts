// Global type definitions for React Three Fiber components

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Three.js primitives
      group: any
      mesh: any
      primitive: any
      
      // Geometries
      boxGeometry: any
      sphereGeometry: any
      cylinderGeometry: any
      planeGeometry: any
      torusGeometry: any
      icosahedronGeometry: any
      
      // Materials
      meshBasicMaterial: any
      meshStandardMaterial: any
      meshPhongMaterial: any
      
      // Lights
      ambientLight: any
      directionalLight: any
      pointLight: any
      spotLight: any
      
      // Helpers
      axesHelper: any
      gridHelper: any
    }
  }
}

export {}