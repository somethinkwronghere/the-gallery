import { LODHelper } from '../LODHelper'
import { Mesh, BufferGeometry, Material, Vector3, Object3D } from 'three'

// Mock Three.js objects
const mockGeometry = {
  clone: jest.fn().mockReturnThis(),
  setAttribute: jest.fn(),
  computeVertexNormals: jest.fn(),
  setIndex: jest.fn(),
  getAttribute: jest.fn().mockReturnValue({
    count: 300,
    getX: jest.fn().mockReturnValue(1),
    getY: jest.fn().mockReturnValue(2),
    getZ: jest.fn().mockReturnValue(3)
  }),
  index: { count: 900 },
  dispose: jest.fn()
}

const mockMaterial = {
  clone: jest.fn().mockReturnThis(),
  dispose: jest.fn()
}

jest.mock('three', () => ({
  Mesh: jest.fn().mockImplementation((geometry, material) => ({
    geometry: geometry || mockGeometry,
    material: material || mockMaterial,
    getWorldPosition: jest.fn().mockImplementation((target) => {
      target.set(0, 0, 0)
      return target
    })
  })),
  BufferGeometry: jest.fn().mockImplementation(() => mockGeometry),
  Material: jest.fn().mockImplementation(() => mockMaterial),
  Vector3: jest.fn().mockImplementation((x = 0, y = 0, z = 0) => ({
    x, y, z,
    set: jest.fn().mockReturnThis(),
    distanceTo: jest.fn().mockReturnValue(10)
  })),
  Object3D: jest.fn().mockImplementation(() => ({
    getWorldPosition: jest.fn().mockImplementation((target) => {
      target.set(0, 0, 0)
      return target
    })
  })),
  LOD: jest.fn().mockImplementation(() => ({
    addLevel: jest.fn()
  })),
  BufferAttribute: jest.fn()
}))

// Global THREE mock
global.THREE = {
  LinearMipmapLinearFilter: 'LinearMipmapLinearFilter',
  LinearFilter: 'LinearFilter',
  BufferAttribute: jest.fn(),
  Box3: jest.fn().mockImplementation(() => ({
    setFromObject: jest.fn().mockReturnThis(),
    getBoundingSphere: jest.fn().mockImplementation((sphere) => {
      sphere.radius = 5
    })
  })),
  Sphere: jest.fn().mockImplementation(() => ({
    radius: 5
  }))
}

describe('LODHelper', () => {
  let mockMesh: Mesh
  let mockGeometry: BufferGeometry
  let mockMaterial: Material

  beforeEach(() => {
    mockGeometry = mockGeometry || new BufferGeometry()
    mockMaterial = mockMaterial || new Material()
    mockMesh = new Mesh(mockGeometry, mockMaterial)
  })

  describe('generateLODLevels', () => {
    it('should generate LOD levels with default distances', () => {
      const lodLevels = LODHelper.generateLODLevels(mockMesh)
      
      expect(lodLevels).toHaveLength(4)
      expect(lodLevels[0].distance).toBe(10)
      expect(lodLevels[1].distance).toBe(25)
      expect(lodLevels[2].distance).toBe(50)
      expect(lodLevels[3].distance).toBe(100)
    })

    it('should generate LOD levels with custom distances', () => {
      const customDistances = [5, 15, 30]
      const lodLevels = LODHelper.generateLODLevels(mockMesh, customDistances)
      
      expect(lodLevels).toHaveLength(3)
      expect(lodLevels[0].distance).toBe(5)
      expect(lodLevels[1].distance).toBe(15)
      expect(lodLevels[2].distance).toBe(30)
    })

    it('should decrease quality with each level', () => {
      const lodLevels = LODHelper.generateLODLevels(mockMesh)
      
      expect(lodLevels[0].quality).toBe(1.0)
      expect(lodLevels[1].quality).toBe(0.75)
      expect(lodLevels[2].quality).toBe(0.5)
      expect(lodLevels[3].quality).toBe(0.25)
    })

    it('should have decreasing triangle counts', () => {
      const lodLevels = LODHelper.generateLODLevels(mockMesh)
      
      for (let i = 1; i < lodLevels.length; i++) {
        expect(lodLevels[i].triangleCount).toBeLessThanOrEqual(lodLevels[i - 1].triangleCount)
      }
    })
  })

  describe('createThreeLOD', () => {
    it('should create Three.js LOD object with correct levels', () => {
      const lodLevels = LODHelper.generateLODLevels(mockMesh)
      const threeLOD = LODHelper.createThreeLOD(lodLevels)
      
      expect(threeLOD.addLevel).toHaveBeenCalledTimes(4)
    })
  })

  describe('updateMeshLOD', () => {
    it('should update mesh geometry and material', () => {
      const newGeometry = new BufferGeometry()
      const newMaterial = new Material()
      const lodLevel = {
        distance: 10,
        geometry: newGeometry,
        material: newMaterial,
        triangleCount: 100,
        quality: 0.5
      }
      
      LODHelper.updateMeshLOD(mockMesh, lodLevel)
      
      expect(mockMesh.geometry).toBe(newGeometry)
      expect(mockMesh.material).toBe(newMaterial)
    })

    it('should dispose old geometry and material', () => {
      const oldGeometry = mockMesh.geometry
      const oldMaterial = mockMesh.material
      const newGeometry = new BufferGeometry()
      const newMaterial = new Material()
      
      const lodLevel = {
        distance: 10,
        geometry: newGeometry,
        material: newMaterial,
        triangleCount: 100,
        quality: 0.5
      }
      
      LODHelper.updateMeshLOD(mockMesh, lodLevel)
      
      expect(oldGeometry.dispose).toHaveBeenCalled()
      expect(oldMaterial.dispose).toHaveBeenCalled()
    })
  })

  describe('calculateDistance', () => {
    it('should calculate distance between object and camera position', () => {
      const object = new Object3D()
      const cameraPosition = new Vector3(10, 0, 0)
      
      const distance = LODHelper.calculateDistance(object, cameraPosition)
      
      expect(distance).toBe(10)
    })
  })

  describe('getBoundingSphereRadius', () => {
    it('should return bounding sphere radius', () => {
      const object = new Object3D()
      
      const radius = LODHelper.getBoundingSphereRadius(object)
      
      expect(radius).toBe(5)
    })
  })
})