import { Texture, BufferGeometry, Material, Object3D, Mesh } from 'three';

export interface MemoryStats {
  usedMemory: number;
  totalMemory: number;
  textureMemory: number;
  geometryMemory: number;
  bufferMemory: number;
  heapUsed: number;
  heapTotal: number;
  percentage: number;
}

export interface CleanupConfig {
  aggressiveCleanup: boolean;
  autoGarbageCollection: boolean;
  memoryThreshold: number; // MB
  cleanupInterval: number; // ms
}

export class MemoryManager {
  private static instance: MemoryManager;
  private config: CleanupConfig;
  private cleanupInterval: number | null = null;
  private trackedTextures: Set<Texture> = new Set();
  private trackedGeometries: Set<BufferGeometry> = new Set();
  private trackedMaterials: Set<Material> = new Set();
  private disposalQueue: Array<() => void> = [];

  private constructor() {
    this.config = {
      aggressiveCleanup: true,
      autoGarbageCollection: true,
      memoryThreshold: 300, // 300MB
      cleanupInterval: 10000 // 10 seconds
    };
    
    this.startMonitoring();
  }

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  setConfig(config: Partial<CleanupConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart monitoring with new config
    this.stopMonitoring();
    this.startMonitoring();
  }

  /**
   * Start memory monitoring
   */
  private startMonitoring(): void {
    if (this.cleanupInterval) return;
    
    this.cleanupInterval = window.setInterval(() => {
      const stats = this.getMemoryStats();
      
      if (stats.usedMemory > this.config.memoryThreshold) {
        console.warn(`Memory threshold exceeded: ${stats.usedMemory.toFixed(1)}MB`);
        this.performCleanup();
      }
      
      // Process disposal queue
      this.processDisposalQueue();
      
    }, this.config.cleanupInterval);
  }

  /**
   * Stop memory monitoring
   */
  private stopMonitoring(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Track a texture for memory management
   */
  trackTexture(texture: Texture): void {
    this.trackedTextures.add(texture);
  }

  /**
   * Track a geometry for memory management
   */
  trackGeometry(geometry: BufferGeometry): void {
    this.trackedGeometries.add(geometry);
  }

  /**
   * Track a material for memory management
   */
  trackMaterial(material: Material): void {
    this.trackedMaterials.add(material);
  }

  /**
   * Track an entire Object3D hierarchy
   */
  trackObject3D(object: Object3D): void {
    object.traverse((child) => {
      if (child instanceof Mesh) {
        if (child.geometry) {
          this.trackGeometry(child.geometry);
        }
        
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => this.trackMaterial(material));
          } else {
            this.trackMaterial(child.material);
          }
        }
      }
    });
  }

  /**
   * Schedule texture for disposal
   */
  scheduleTextureDisposal(texture: Texture): void {
    this.disposalQueue.push(() => {
      try {
        texture.dispose();
        this.trackedTextures.delete(texture);
      } catch (error) {
        console.warn('Failed to dispose texture:', error);
      }
    });
  }

  /**
   * Schedule geometry for disposal
   */
  scheduleGeometryDisposal(geometry: BufferGeometry): void {
    this.disposalQueue.push(() => {
      try {
        geometry.dispose();
        this.trackedGeometries.delete(geometry);
      } catch (error) {
        console.warn('Failed to dispose geometry:', error);
      }
    });
  }

  /**
   * Schedule material for disposal
   */
  scheduleMaterialDisposal(material: Material): void {
    this.disposalQueue.push(() => {
      try {
        material.dispose();
        this.trackedMaterials.delete(material);
      } catch (error) {
        console.warn('Failed to dispose material:', error);
      }
    });
  }

  /**
   * Schedule Object3D for disposal
   */
  scheduleObject3DDisposal(object: Object3D): void {
    object.traverse((child) => {
      if (child instanceof Mesh) {
        if (child.geometry) {
          this.scheduleGeometryDisposal(child.geometry);
        }
        
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => this.scheduleMaterialDisposal(material));
          } else {
            this.scheduleMaterialDisposal(child.material);
          }
        }
      }
    });
  }

  /**
   * Process the disposal queue
   */
  private processDisposalQueue(): void {
    const batchSize = 10; // Process 10 items per frame
    const itemsToProcess = Math.min(batchSize, this.disposalQueue.length);
    
    for (let i = 0; i < itemsToProcess; i++) {
      const disposalFunc = this.disposalQueue.shift();
      if (disposalFunc) {
        try {
          disposalFunc();
        } catch (error) {
          console.warn('Error during disposal:', error);
        }
      }
    }
  }

  /**
   * Perform aggressive cleanup
   */
  performCleanup(): void {
    console.log('Performing memory cleanup...');
    
    const beforeStats = this.getMemoryStats();
    
    // Clean up unused textures
    this.cleanupUnusedTextures();
    
    // Clean up unused geometries
    this.cleanupUnusedGeometries();
    
    // Clean up unused materials
    this.cleanupUnusedMaterials();
    
    // Process all pending disposals immediately
    while (this.disposalQueue.length > 0) {
      this.processDisposalQueue();
    }
    
    // Force garbage collection if available
    if (this.config.autoGarbageCollection && window.gc) {
      window.gc();
    }
    
    const afterStats = this.getMemoryStats();
    const saved = beforeStats.usedMemory - afterStats.usedMemory;
    
    console.log(`Memory cleanup completed. Saved: ${saved.toFixed(1)}MB`);
  }

  /**
   * Clean up unused textures
   */
  private cleanupUnusedTextures(): void {
    const unusedTextures: Texture[] = [];
    
    this.trackedTextures.forEach(texture => {
      // Check if texture is still referenced
      if (this.isTextureUnused(texture)) {
        unusedTextures.push(texture);
      }
    });
    
    unusedTextures.forEach(texture => {
      this.scheduleTextureDisposal(texture);
    });
    
    if (unusedTextures.length > 0) {
      console.log(`Scheduled ${unusedTextures.length} unused textures for disposal`);
    }
  }

  /**
   * Clean up unused geometries
   */
  private cleanupUnusedGeometries(): void {
    const unusedGeometries: BufferGeometry[] = [];
    
    this.trackedGeometries.forEach(geometry => {
      // Simple check - in a real implementation, you'd track references
      if (this.isGeometryUnused(geometry)) {
        unusedGeometries.push(geometry);
      }
    });
    
    unusedGeometries.forEach(geometry => {
      this.scheduleGeometryDisposal(geometry);
    });
    
    if (unusedGeometries.length > 0) {
      console.log(`Scheduled ${unusedGeometries.length} unused geometries for disposal`);
    }
  }

  /**
   * Clean up unused materials
   */
  private cleanupUnusedMaterials(): void {
    const unusedMaterials: Material[] = [];
    
    this.trackedMaterials.forEach(material => {
      if (this.isMaterialUnused(material)) {
        unusedMaterials.push(material);
      }
    });
    
    unusedMaterials.forEach(material => {
      this.scheduleMaterialDisposal(material);
    });
    
    if (unusedMaterials.length > 0) {
      console.log(`Scheduled ${unusedMaterials.length} unused materials for disposal`);
    }
  }

  /**
   * Check if texture is unused (simplified)
   */
  private isTextureUnused(texture: Texture): boolean {
    // In a real implementation, you'd track actual usage
    return false; // Conservative approach
  }

  /**
   * Check if geometry is unused (simplified)
   */
  private isGeometryUnused(geometry: BufferGeometry): boolean {
    // In a real implementation, you'd track actual usage
    return false; // Conservative approach
  }

  /**
   * Check if material is unused (simplified)
   */
  private isMaterialUnused(material: Material): boolean {
    // In a real implementation, you'd track actual usage
    return false; // Conservative approach
  }

  /**
   * Get current memory statistics
   */
  getMemoryStats(): MemoryStats {
    const memoryInfo = (performance as any).memory;
    
    let textureMemory = 0;
    let geometryMemory = 0;
    
    // Estimate texture memory usage
    this.trackedTextures.forEach(texture => {
      if (texture.image) {
        const width = texture.image.width || 0;
        const height = texture.image.height || 0;
        textureMemory += width * height * 4; // RGBA
      }
    });
    
    // Estimate geometry memory usage
    this.trackedGeometries.forEach(geometry => {
      const attributes = geometry.attributes;
      let geometrySize = 0;
      
      for (const key in attributes) {
        const attribute = attributes[key];
        geometrySize += attribute.count * attribute.itemSize * 4; // Float32
      }
      
      geometryMemory += geometrySize;
    });
    
    const heapUsed = memoryInfo ? memoryInfo.usedJSHeapSize / (1024 * 1024) : 0;
    const heapTotal = memoryInfo ? memoryInfo.totalJSHeapSize / (1024 * 1024) : 0;
    const usedMemory = heapUsed + (textureMemory + geometryMemory) / (1024 * 1024);
    
    return {
      usedMemory,
      totalMemory: heapTotal,
      textureMemory: textureMemory / (1024 * 1024),
      geometryMemory: geometryMemory / (1024 * 1024),
      bufferMemory: (textureMemory + geometryMemory) / (1024 * 1024),
      heapUsed,
      heapTotal,
      percentage: heapTotal > 0 ? (usedMemory / heapTotal) * 100 : 0
    };
  }

  /**
   * Force immediate cleanup
   */
  forceCleanup(): void {
    this.performCleanup();
  }

  /**
   * Get tracked resource counts
   */
  getResourceCounts() {
    return {
      textures: this.trackedTextures.size,
      geometries: this.trackedGeometries.size,
      materials: this.trackedMaterials.size,
      pendingDisposals: this.disposalQueue.length
    };
  }

  /**
   * Clear all tracked resources
   */
  clearAll(): void {
    // Schedule all tracked resources for disposal
    this.trackedTextures.forEach(texture => this.scheduleTextureDisposal(texture));
    this.trackedGeometries.forEach(geometry => this.scheduleGeometryDisposal(geometry));
    this.trackedMaterials.forEach(material => this.scheduleMaterialDisposal(material));
    
    // Process all disposals
    while (this.disposalQueue.length > 0) {
      this.processDisposalQueue();
    }
  }

  /**
   * Dispose of the memory manager
   */
  dispose(): void {
    this.stopMonitoring();
    this.clearAll();
  }
}

// Export singleton instance
export const memoryManager = MemoryManager.getInstance();
