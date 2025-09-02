import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { Object3D, Mesh, Material, Texture, BufferGeometry } from 'three';

export interface OptimizationConfig {
  qualityLevel: 'low' | 'medium' | 'high';
  maxTextureSize: number;
  enableCompression: boolean;
  enableLOD: boolean;
  enableCulling: boolean;
}

export class AssetOptimizer {
  private static instance: AssetOptimizer;
  private config: OptimizationConfig;

  private constructor() {
    this.config = {
      qualityLevel: 'medium',
      maxTextureSize: 1024,
      enableCompression: true,
      enableLOD: true,
      enableCulling: true
    };
  }

  static getInstance(): AssetOptimizer {
    if (!AssetOptimizer.instance) {
      AssetOptimizer.instance = new AssetOptimizer();
    }
    return AssetOptimizer.instance;
  }

  setConfig(config: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Optimize a GLTF scene for better performance
   */
  optimizeGLTF(gltf: GLTF): GLTF {
    const startTime = performance.now();
    
    if (gltf.scene) {
      this.optimizeObject3D(gltf.scene);
    }

    const endTime = performance.now();
    console.log(`Asset optimization completed in ${(endTime - startTime).toFixed(2)}ms`);

    return gltf;
  }

  /**
   * Optimize an Object3D and its children
   */
  private optimizeObject3D(object: Object3D): void {
    object.traverse((child) => {
      if (child instanceof Mesh) {
        this.optimizeMesh(child);
      }
    });

    // Note: Don't freeze Three.js objects as they need to be mutable for R3F
    // Static optimizations are applied via matrixAutoUpdate = false instead
  }

  /**
   * Optimize a mesh for better performance
   */
  private optimizeMesh(mesh: Mesh): void {
    // Optimize geometry
    if (mesh.geometry) {
      this.optimizeGeometry(mesh.geometry);
    }

    // Optimize material
    if (mesh.material) {
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach(material => this.optimizeMaterial(material));
      } else {
        this.optimizeMaterial(mesh.material);
      }
    }

    // Enable frustum culling
    mesh.frustumCulled = this.config.enableCulling;
    
    // Set render order for transparency optimization
    if (this.isMaterialTransparent(mesh.material)) {
      mesh.renderOrder = 1000;
    }

    // Disable automatic matrix updates for static objects
    mesh.matrixAutoUpdate = false;
    mesh.updateMatrix();
  }

  /**
   * Optimize geometry for better performance
   */
  private optimizeGeometry(geometry: BufferGeometry): void {
    // Compute bounding box/sphere for culling
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    // Dispose of unnecessary attributes for low quality
    if (this.config.qualityLevel === 'low') {
      if (geometry.attributes.uv2) {
        geometry.deleteAttribute('uv2');
      }
      if (geometry.attributes.tangent) {
        geometry.deleteAttribute('tangent');
      }
    }

    // Note: mergeVertices() is not available in newer Three.js versions
    // Geometry is already optimized during GLTF loading
  }

  /**
   * Optimize material for better performance
   */
  private optimizeMaterial(material: Material): void {
    // Disable unnecessary features for low quality
    if (this.config.qualityLevel === 'low') {
      if ('normalMap' in material) {
        (material as any).normalMap = null;
      }
      if ('bumpMap' in material) {
        (material as any).bumpMap = null;
      }
      if ('displacementMap' in material) {
        (material as any).displacementMap = null;
      }
    }

    // Optimize textures
    this.optimizeMaterialTextures(material);

    // Set material properties for performance
    material.precision = this.config.qualityLevel === 'low' ? 'lowp' : 'mediump';
    
    // Force material compilation
    material.needsUpdate = true;
  }

  /**
   * Optimize textures in a material
   */
  private optimizeMaterialTextures(material: Material): void {
    const textureProperties = [
      'map', 'normalMap', 'bumpMap', 'displacementMap', 
      'specularMap', 'emissiveMap', 'metalnessMap', 'roughnessMap',
      'aoMap', 'envMap'
    ];

    textureProperties.forEach(prop => {
      const texture = (material as any)[prop] as Texture;
      if (texture && texture.isTexture) {
        this.optimizeTexture(texture);
      }
    });
  }

  /**
   * Optimize a texture for better performance
   */
  private optimizeTexture(texture: Texture): void {
    // Limit texture size based on quality
    const maxSize = this.getMaxTextureSize();
    
    if (texture.image) {
      const canvas = texture.image as HTMLCanvasElement;
      if (canvas.width > maxSize || canvas.height > maxSize) {
        this.resizeTexture(texture, maxSize);
      }
    }

    // Set texture parameters for performance
    texture.generateMipmaps = this.config.qualityLevel !== 'low';
    texture.flipY = false; // Better performance
    
    // Force texture update
    texture.needsUpdate = true;
  }

  /**
   * Get maximum texture size based on quality level
   */
  private getMaxTextureSize(): number {
    switch (this.config.qualityLevel) {
      case 'low': return 512;
      case 'medium': return 1024;
      case 'high': return 2048;
      default: return 1024;
    }
  }

  /**
   * Resize texture to maximum allowed size
   */
  private resizeTexture(texture: Texture, maxSize: number): void {
    const image = texture.image;
    if (!image) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = Math.min(maxSize / image.width, maxSize / image.height);
    canvas.width = Math.floor(image.width * scale);
    canvas.height = Math.floor(image.height * scale);

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    texture.image = canvas;
    texture.needsUpdate = true;
  }

  /**
   * Check if material has transparency
   */
  private isMaterialTransparent(material: Material | Material[]): boolean {
    if (Array.isArray(material)) {
      return material.some(m => m.transparent || m.opacity < 1);
    }
    return material.transparent || material.opacity < 1;
  }

  /**
   * Get optimization statistics
   */
  getStats() {
    return {
      config: this.config,
      optimizedObjects: 0, // This would be tracked in a real implementation
      savedMemory: 0, // This would be calculated based on optimizations
    };
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    // Clean up any resources if needed
  }
}

// Export singleton instance
export const assetOptimizer = AssetOptimizer.getInstance();
