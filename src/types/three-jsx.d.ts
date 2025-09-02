import { ReactThreeFiber } from '@react-three/fiber'
import { 
  Fog, 
  Mesh, 
  BoxGeometry, 
  MeshBasicMaterial,
  Object3D,
  Group
} from 'three'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      fog: ReactThreeFiber.Object3DNode<Fog, typeof Fog>
      mesh: ReactThreeFiber.Object3DNode<Mesh, typeof Mesh>
      group: ReactThreeFiber.Object3DNode<Group, typeof Group>
      boxGeometry: ReactThreeFiber.Node<BoxGeometry, typeof BoxGeometry>
      meshBasicMaterial: ReactThreeFiber.MaterialNode<MeshBasicMaterial, typeof MeshBasicMaterial>
      primitive: ReactThreeFiber.Object3DNode<Object3D, typeof Object3D>
    }
  }
}