import { 
  Object3D, 
  Mesh, 
  BufferGeometry, 
  Material, 
  Group,
  Box3,
  Vector3,
  BufferAttribute,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshPhongMaterial,
  MeshStandardMaterial
} from 'three'
export class ModelOptimizer {

  /**
   * Optimize a 3D model for better performance
   */
  optimizeModel(model: Object3D): void {
    model.traverse((child) => {
      if (child instanceof Mesh) {
        this.optimizeMesh(child)
      }
    })
    
    // Update bounding boxes
    this.updateBoundingBoxes(model)
  }

  /**
   * Optimize geometry by reducing vertices and faces
   */
  optimizeGeometry(geometry: BufferGeometry, targetReduction: number = 0.5): BufferGeometry {
    if (!geometry.attributes.position) {
      return geometry
    }

    // Clone geometry to avoid modifying original
    const optimizedGeometry = geometry.clone()
    
    // Apply vertex welding
    this.weldVertices(optimizedGeometry)
    
    // Apply mesh simplification if needed
    if (targetReduction > 0 && targetReduction < 1) {
      return this.simplifyGeometry(optimizedGeometry, targetReduction)
    }
    
    return optimizedGeometry
  }

  /**
   * Create multiple LOD levels for a model
   */
  generateLODLevels(model: Object3D, levels: number[] = [1.0, 0.7, 0.4, 0.2]): Object3D[] {
    const lodModels: Object3D[] = []
    
    levels.forEach((reduction, index) => {
      const lodModel = model.clone()
      
      if (index > 0) { // Skip original quality level
        lodModel.traverse((child) => {
          if (child instanceof Mesh && child.geometry) {
            const optimizedGeometry = this.optimizeGeometry(child.geometry, 1 - reduction)
            child.geometry.dispose()
            child.geometry = optimizedGeometry
          }
        })
      }
      
      lodModels.push(lodModel)
    })
    
    return lodModels
  }

  /**
   * Merge geometries to reduce draw calls
   */
  mergeGeometries(meshes: Mesh[]): BufferGeometry | null {
    if (meshes.length === 0) return null
    
    const geometries: BufferGeometry[] = []
    
    meshes.forEach(mesh => {
      if (mesh.geometry) {
        // Apply mesh transform to geometry
        const geometry = mesh.geometry.clone()
        geometry.applyMatrix4(mesh.matrixWorld)
        geometries.push(geometry)
      }
    })
    
    if (geometries.length === 0) return null
    
    // Use Three.js BufferGeometryUtils for merging
    return this.mergeBufferGeometries(geometries)
  }

  /**
   * Extract all materials from a model
   */
  extractMaterials(model: Object3D): Material[] {
    const materials: Material[] = []
    const materialSet = new Set<Material>()
    
    model.traverse((child) => {
      if (child instanceof Mesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => {
            if (!materialSet.has(mat)) {
              materialSet.add(mat)
              materials.push(mat)
            }
          })
        } else {
          if (!materialSet.has(child.material)) {
            materialSet.add(child.material)
            materials.push(child.material)
          }
        }
      }
    })
    
    return materials
  }

  /**
   * Get triangle count for a model
   */
  getTriangleCount(model: Object3D): number {
    let triangleCount = 0
    
    model.traverse((child) => {
      if (child instanceof Mesh && child.geometry) {
        const geometry = child.geometry
        if (geometry.index) {
          triangleCount += geometry.index.count / 3
        } else if (geometry.attributes.position) {
          triangleCount += geometry.attributes.position.count / 3
        }
      }
    })
    
    return Math.floor(triangleCount)
  }

  /**
   * Get vertex count for a model
   */
  getVertexCount(model: Object3D): number {
    let vertexCount = 0
    
    model.traverse((child) => {
      if (child instanceof Mesh && child.geometry && child.geometry.attributes.position) {
        vertexCount += child.geometry.attributes.position.count
      }
    })
    
    return vertexCount
  }

  /**
   * Calculate model bounding box
   */
  calculateBoundingBox(model: Object3D): Box3 {
    const box = new Box3()
    box.setFromObject(model)
    return box
  }

  /**
   * Optimize materials for better performance
   */
  optimizeMaterials(materials: Material[]): Material[] {
    return materials.map(material => this.optimizeMaterial(material))
  }

  /**
   * Remove unused vertices from geometry
   */
  removeUnusedVertices(geometry: BufferGeometry): BufferGeometry {
    if (!geometry.index) {
      return geometry // Already optimized or no index buffer
    }

    const index = geometry.index.array
    const attributes = geometry.attributes
    const usedVertices = new Set<number>()
    
    // Find used vertices
    for (let i = 0; i < index.length; i++) {
      usedVertices.add(index[i])
    }
    
    const usedVertexArray = Array.from(usedVertices).sort((a, b) => a - b)
    const vertexMap = new Map<number, number>()
    
    // Create vertex mapping
    usedVertexArray.forEach((oldIndex, newIndex) => {
      vertexMap.set(oldIndex, newIndex)
    })
    
    // Create new attributes with only used vertices
    const newAttributes: { [name: string]: BufferAttribute } = {}
    
    Object.keys(attributes).forEach(name => {
      const attribute = attributes[name] as BufferAttribute
      const itemSize = attribute.itemSize
      const newArray = new (attribute.array.constructor as any)(usedVertexArray.length * itemSize)
      
      usedVertexArray.forEach((oldIndex, newIndex) => {
        for (let i = 0; i < itemSize; i++) {
          newArray[newIndex * itemSize + i] = attribute.array[oldIndex * itemSize + i]
        }
      })
      
      newAttributes[name] = new BufferAttribute(newArray, itemSize)
    })
    
    // Update index buffer
    const newIndex = new Uint32Array(index.length)
    for (let i = 0; i < index.length; i++) {
      newIndex[i] = vertexMap.get(index[i])!
    }
    
    // Create optimized geometry
    const optimizedGeometry = new BufferGeometry()
    Object.keys(newAttributes).forEach(name => {
      optimizedGeometry.setAttribute(name, newAttributes[name])
    })
    optimizedGeometry.setIndex(new BufferAttribute(newIndex, 1))
    
    return optimizedGeometry
  }

  /**
   * Dispose model and all its resources
   */
  disposeModel(model: Object3D): void {
    model.traverse((child) => {
      if (child instanceof Mesh) {
        // Dispose geometry
        if (child.geometry) {
          child.geometry.dispose()
        }
        
        // Dispose materials
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => mat.dispose())
          } else {
            child.material.dispose()
          }
        }
      }
    })
    
    // Remove from parent
    if (model.parent) {
      model.parent.remove(model)
    }
  }

  /**
   * Analyze model and provide optimization recommendations
   */
  analyzeModel(model: Object3D): ModelAnalysis {
    const triangleCount = this.getTriangleCount(model)
    const vertexCount = this.getVertexCount(model)
    const materials = this.extractMaterials(model)
    const boundingBox = this.calculateBoundingBox(model)
    const size = boundingBox.getSize(new Vector3())
    
    const recommendations: string[] = []
    
    if (triangleCount > 100000) {
      recommendations.push('High triangle count detected - consider LOD or mesh simplification')
    }
    
    if (materials.length > 10) {
      recommendations.push('Many materials detected - consider material atlasing')
    }
    
    if (size.length() > 100) {
      recommendations.push('Large model detected - consider scaling or LOD system')
    }
    
    let meshCount = 0
    model.traverse((child) => {
      if (child instanceof Mesh) meshCount++
    })
    
    if (meshCount > 50) {
      recommendations.push('Many meshes detected - consider geometry merging')
    }
    
    return {
      triangleCount,
      vertexCount,
      materialCount: materials.length,
      meshCount,
      boundingBox: {
        min: boundingBox.min.toArray(),
        max: boundingBox.max.toArray()
      },
      size: size.toArray(),
      estimatedMemory: this.estimateModelMemory(model),
      recommendations
    }
  }

  // Private helper methods

  private optimizeMesh(mesh: Mesh): void {
    if (!mesh.geometry) return
    
    // Optimize geometry
    mesh.geometry = this.optimizeGeometry(mesh.geometry, 0.1)
    
    // Optimize material
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map(mat => this.optimizeMaterial(mat))
      } else {
        mesh.material = this.optimizeMaterial(mesh.material)
      }
    }
  }

  private optimizeMaterial(material: Material): Material {
    // Create optimized version based on material type
    if (material instanceof MeshStandardMaterial) {
      // For performance, consider downgrading to simpler materials
      const optimized = material.clone()
      optimized.flatShading = true // Reduce shading complexity
      return optimized
    }
    
    return material
  }

  private weldVertices(geometry: BufferGeometry, tolerance: number = 1e-4): void {
    const positionAttribute = geometry.attributes.position
    if (!positionAttribute) return
    
    const positions = positionAttribute.array
    const vertexCount = positionAttribute.count
    
    // Simple vertex welding implementation
    const hashToIndex = new Map<string, number>()
    const newIndices: number[] = []
    
    for (let i = 0; i < vertexCount; i++) {
      const x = Math.round(positions[i * 3] / tolerance) * tolerance
      const y = Math.round(positions[i * 3 + 1] / tolerance) * tolerance
      const z = Math.round(positions[i * 3 + 2] / tolerance) * tolerance
      
      const hash = `${x},${y},${z}`
      
      if (hashToIndex.has(hash)) {
        newIndices.push(hashToIndex.get(hash)!)
      } else {
        hashToIndex.set(hash, i)
        newIndices.push(i)
      }
    }
    
    // Update geometry if vertices were welded
    if (hashToIndex.size < vertexCount) {
      geometry.setIndex(newIndices)
    }
  }

  private simplifyGeometry(geometry: BufferGeometry, targetReduction: number): BufferGeometry {
    // Simple geometry simplification without external dependencies
    // In a real implementation, you would use a proper mesh simplification library
    
    if (targetReduction <= 0) return geometry
    
    // For now, return the original geometry
    // TODO: Implement proper mesh simplification
    console.warn('Mesh simplification not implemented - returning original geometry')
    return geometry
  }

  private mergeBufferGeometries(geometries: BufferGeometry[]): BufferGeometry {
    if (geometries.length === 0) return new BufferGeometry()
    if (geometries.length === 1) return geometries[0]
    
    // Simple merge implementation
    const merged = new BufferGeometry()
    
    // Get all attribute names
    const attributeNames = new Set<string>()
    geometries.forEach(geometry => {
      Object.keys(geometry.attributes).forEach(name => attributeNames.add(name))
    })
    
    // Merge each attribute
    attributeNames.forEach(name => {
      const arrays: number[][] = []
      let itemSize = 0
      
      geometries.forEach(geometry => {
        const attribute = geometry.attributes[name]
        if (attribute) {
          arrays.push(Array.from(attribute.array))
          itemSize = attribute.itemSize
        }
      })
      
      if (arrays.length > 0) {
        const mergedArray = new Float32Array(arrays.flat())
        merged.setAttribute(name, new BufferAttribute(mergedArray, itemSize))
      }
    })
    
    return merged
  }

  private updateBoundingBoxes(model: Object3D): void {
    model.traverse((child) => {
      if (child instanceof Mesh && child.geometry) {
        child.geometry.computeBoundingBox()
        child.geometry.computeBoundingSphere()
      }
    })
  }

  private estimateModelMemory(model: Object3D): number {
    let memoryUsage = 0
    
    model.traverse((child) => {
      if (child instanceof Mesh && child.geometry) {
        const geometry = child.geometry
        
        // Estimate geometry memory
        Object.values(geometry.attributes).forEach((attribute: any) => {
          if (attribute && attribute.array) {
            memoryUsage += attribute.array.byteLength
          }
        })
        
        // Estimate index memory
        if (geometry.index && geometry.index.array) {
          memoryUsage += geometry.index.array.byteLength
        }
      }
    })
    
    return memoryUsage
  }
}

// Supporting interfaces
interface ModelAnalysis {
  triangleCount: number
  vertexCount: number
  materialCount: number
  meshCount: number
  boundingBox: {
    min: [number, number, number]
    max: [number, number, number]
  }
  size: [number, number, number]
  estimatedMemory: number
  recommendations: string[]
}