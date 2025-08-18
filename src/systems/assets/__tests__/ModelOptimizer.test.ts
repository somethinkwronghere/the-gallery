import test from 'node:test'
import test from 'node:test'
import test from 'node:test'
import { describe } from 'node:test'
import test from 'node:test'
import test from 'node:test'
import test from 'node:test'
import { describe } from 'node:test'
import test from 'node:test'
import test from 'node:test'
import { describe } from 'node:test'
import test from 'node:test'
import { describe } from 'node:test'
import test from 'node:test'
import test from 'node:test'
import test from 'node:test'
import test from 'node:test'
import { describe } from 'node:test'
import test from 'node:test'
import test from 'node:test'
import test from 'node:test'
import { describe } from 'node:test'
import test from 'node:test'
import test from 'node:test'
import test from 'node:test'
import { describe } from 'node:test'
import test from 'node:test'
import test from 'node:test'
import { describe } from 'node:test'
import test from 'node:test'
import test from 'node:test'
import test from 'node:test'
import { describe } from 'node:test'
import test from 'node:test'
import { describe } from 'node:test'
import { afterEach } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'
import { ModelOptimizer } from '../ModelOptimizer'
import { 
  Object3D, 
  Mesh, 
  BufferGeometry, 
  Material, 
  Box3, 
  Vector3,
  BufferAttribute,
  MeshStandardMaterial
} from 'three'

// Mock Three.js classes
const mockVector3 = jest.fn().mockImplementation((x = 0, y = 0, z = 0) => ({
  x, y, z,
  toArray: () => [x, y, z],
  length: () => Math.sqrt(x*x + y*y + z*z)
}))

jest.mock('three', () => ({
  Object3D: jest.fn().mockImplementation(() => ({
    traverse: jest.fn(),
    clone: jest.fn(() => ({
      traverse: jest.fn()
    })),
    parent: null,
    remove: jest.fn()
  })),
  Mesh: jest.fn().mockImplementation(() => ({
    geometry: {
      attributes: {
        position: { count: 1000, array: new Float32Array(3000) }
      },
      index: { count: 3000, array: new Uint32Array(3000) },
      dispose: jest.fn(),
      clone: jest.fn(),
      applyMatrix4: jest.fn(),
      computeBoundingBox: jest.fn(),
      computeBoundingSphere: jest.fn()
    },
    material: {
      dispose: jest.fn(),
      clone: jest.fn()
    },
    matrixWorld: {},
    traverse: jest.fn()
  })),
  BufferGeometry: jest.fn().mockImplementation(() => ({
    attributes: {
      position: { count: 1000, itemSize: 3, array: new Float32Array(3000) }
    },
    index: { count: 3000, array: new Uint32Array(3000) },
    dispose: jest.fn(),
    clone: jest.fn(),
    setAttribute: jest.fn(),
    setIndex: jest.fn(),
    computeBoundingBox: jest.fn(),
    computeBoundingSphere: jest.fn()
  })),
  Material: jest.fn().mockImplementation(() => ({
    dispose: jest.fn(),
    clone: jest.fn()
  })),
  MeshStandardMaterial: jest.fn().mockImplementation(() => ({
    dispose: jest.fn(),
    clone: jest.fn(),
    flatShading: false
  })),
  Box3: jest.fn().mockImplementation(() => ({
    setFromObject: jest.fn(),
    getSize: jest.fn(() => new mockVector3(10, 10, 10)),
    min: { toArray: () => [0, 0, 0] },
    max: { toArray: () => [10, 10, 10] }
  })),
  Vector3: mockVector3,
  BufferAttribute: jest.fn().mockImplementation((array, itemSize) => ({
    array,
    itemSize,
    count: array.length / itemSize
  }))
}))

describe('ModelOptimizer', () => {
  let optimizer: ModelOptimizer
  let mockModel: Object3D
  let mockMesh: Mesh
  let mockGeometry: BufferGeometry
  let mockMaterial: Material

  beforeEach(() => {
    optimizer = new ModelOptimizer()
    mockGeometry = new BufferGeometry()
    mockMaterial = new Material()
    mockMesh = new Mesh()
    mockMesh.geometry = mockGeometry
    mockMesh.material = mockMaterial
    
    mockModel = new Object3D()
    // Mock traverse to call callback with mesh
    mockModel.traverse = jest.fn((callback) => {
      callback(mockMesh)
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Model Optimization', () => {
    test('should optimize model by traversing and optimizing meshes', () => {
      optimizer.optimizeModel(mockModel)
      
      expect(mockModel.traverse).toHaveBeenCalled()
      expect(mockGeometry.computeBoundingBox).toHaveBeenCalled()
      expect(mockGeometry.computeBoundingSphere).toHaveBeenCalled()
    })
  })

  describe('Geometry Optimization', () => {
    test('should return original geometry if no position attribute', () => {
      const emptyGeometry = new BufferGeometry()
      emptyGeometry.attributes = {}
      
      const result = optimizer.optimizeGeometry(emptyGeometry)
      
      expect(result).toBe(emptyGeometry)
    })

    test('should clone and optimize geometry with position attribute', () => {
      const result = optimizer.optimizeGeometry(mockGeometry)
      
      expect(mockGeometry.clone).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    test('should apply target reduction when specified', () => {
      const result = optimizer.optimizeGeometry(mockGeometry, 0.5)
      
      expect(result).toBeDefined()
      // Note: Actual simplification would need proper implementation
    })
  })

  describe('LOD Generation', () => {
    test('should generate multiple LOD levels', () => {
      const levels = [1.0, 0.7, 0.4, 0.2]
      const lodModels = optimizer.generateLODLevels(mockModel, levels)
      
      expect(lodModels).toHaveLength(4)
      expect(mockModel.clone).toHaveBeenCalledTimes(4)
    })

    test('should use default LOD levels when none provided', () => {
      const lodModels = optimizer.generateLODLevels(mockModel)
      
      expect(lodModels).toHaveLength(4)
    })
  })

  describe('Geometry Merging', () => {
    test('should return null for empty mesh array', () => {
      const result = optimizer.mergeGeometries([])
      
      expect(result).toBeNull()
    })

    test('should merge multiple mesh geometries', () => {
      const meshes = [mockMesh, new Mesh(), new Mesh()]
      meshes.forEach(mesh => {
        mesh.geometry = new BufferGeometry()
        mesh.matrixWorld = {}
      })
      
      const result = optimizer.mergeGeometries(meshes)
      
      expect(result).toBeDefined()
    })

    test('should handle meshes without geometry', () => {
      const meshWithoutGeometry = new Mesh()
      meshWithoutGeometry.geometry = null
      
      const result = optimizer.mergeGeometries([meshWithoutGeometry])
      
      expect(result).toBeNull()
    })
  })

  describe('Material Extraction', () => {
    test('should extract materials from model', () => {
      const materials = optimizer.extractMaterials(mockModel)
      
      expect(materials).toContain(mockMaterial)
      expect(mockModel.traverse).toHaveBeenCalled()
    })

    test('should handle array materials', () => {
      const material1 = new Material()
      const material2 = new Material()
      mockMesh.material = [material1, material2]
      
      const materials = optimizer.extractMaterials(mockModel)
      
      expect(materials).toContain(material1)
      expect(materials).toContain(material2)
    })

    test('should deduplicate materials', () => {
      const sharedMaterial = new Material()
      const mesh1 = new Mesh()
      const mesh2 = new Mesh()
      mesh1.material = sharedMaterial
      mesh2.material = sharedMaterial
      
      mockModel.traverse = jest.fn((callback) => {
        callback(mesh1)
        callback(mesh2)
      })
      
      const materials = optimizer.extractMaterials(mockModel)
      
      expect(materials).toHaveLength(1)
      expect(materials[0]).toBe(sharedMaterial)
    })
  })

  describe('Statistics Calculation', () => {
    test('should calculate triangle count', () => {
      const triangleCount = optimizer.getTriangleCount(mockModel)
      
      expect(triangleCount).toBe(1000) // 3000 indices / 3
      expect(mockModel.traverse).toHaveBeenCalled()
    })

    test('should calculate triangle count without index buffer', () => {
      mockGeometry.index = null
      
      const triangleCount = optimizer.getTriangleCount(mockModel)
      
      expect(triangleCount).toBe(333) // 1000 vertices / 3
    })

    test('should calculate vertex count', () => {
      const vertexCount = optimizer.getVertexCount(mockModel)
      
      expect(vertexCount).toBe(1000)
      expect(mockModel.traverse).toHaveBeenCalled()
    })

    test('should calculate bounding box', () => {
      const boundingBox = optimizer.calculateBoundingBox(mockModel)
      
      expect(boundingBox).toBeInstanceOf(Box3)
      expect(boundingBox.setFromObject).toHaveBeenCalledWith(mockModel)
    })
  })

  describe('Material Optimization', () => {
    test('should optimize materials', () => {
      const materials = [new MeshStandardMaterial(), new Material()]
      
      const optimized = optimizer.optimizeMaterials(materials)
      
      expect(optimized).toHaveLength(2)
      expect(optimized[0]).toHaveProperty('flatShading', true)
    })
  })

  describe('Vertex Optimization', () => {
    test('should return original geometry if no index buffer', () => {
      mockGeometry.index = null
      
      const result = optimizer.removeUnusedVertices(mockGeometry)
      
      expect(result).toBe(mockGeometry)
    })

    test('should optimize geometry with index buffer', () => {
      const result = optimizer.removeUnusedVertices(mockGeometry)
      
      expect(result).toBeInstanceOf(BufferGeometry)
    })
  })

  describe('Model Disposal', () => {
    test('should dispose model and all resources', () => {
      optimizer.disposeModel(mockModel)
      
      expect(mockModel.traverse).toHaveBeenCalled()
      expect(mockGeometry.dispose).toHaveBeenCalled()
      expect(mockMaterial.dispose).toHaveBeenCalled()
    })

    test('should handle array materials during disposal', () => {
      const material1 = new Material()
      const material2 = new Material()
      mockMesh.material = [material1, material2]
      
      optimizer.disposeModel(mockModel)
      
      expect(material1.dispose).toHaveBeenCalled()
      expect(material2.dispose).toHaveBeenCalled()
    })

    test('should remove model from parent', () => {
      const parent = new Object3D()
      parent.remove = jest.fn()
      mockModel.parent = parent
      
      optimizer.disposeModel(mockModel)
      
      expect(parent.remove).toHaveBeenCalledWith(mockModel)
    })
  })

  describe('Model Analysis', () => {
    test('should analyze model and provide recommendations', () => {
      const analysis = optimizer.analyzeModel(mockModel)
      
      expect(analysis).toHaveProperty('triangleCount')
      expect(analysis).toHaveProperty('vertexCount')
      expect(analysis).toHaveProperty('materialCount')
      expect(analysis).toHaveProperty('meshCount')
      expect(analysis).toHaveProperty('boundingBox')
      expect(analysis).toHaveProperty('size')
      expect(analysis).toHaveProperty('estimatedMemory')
      expect(analysis).toHaveProperty('recommendations')
      expect(Array.isArray(analysis.recommendations)).toBe(true)
    })

    test('should provide high triangle count recommendation', () => {
      // Mock high triangle count
      mockGeometry.index = { count: 300000, array: new Uint32Array(300000) }
      
      const analysis = optimizer.analyzeModel(mockModel)
      
      expect(analysis.recommendations).toContain(
        'High triangle count detected - consider LOD or mesh simplification'
      )
    })

    test('should provide many materials recommendation', () => {
      // Mock many materials
      const materials = Array.from({ length: 15 }, () => new Material())
      mockModel.traverse = jest.fn((callback) => {
        materials.forEach((material, index) => {
          const mesh = new Mesh()
          mesh.material = material
          callback(mesh)
        })
      })
      
      const analysis = optimizer.analyzeModel(mockModel)
      
      expect(analysis.recommendations).toContain(
        'Many materials detected - consider material atlasing'
      )
    })
  })
})