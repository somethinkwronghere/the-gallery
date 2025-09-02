import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { WebGLRenderer, Mesh } from 'three';
import { assetOptimizer, OptimizationConfig } from './AssetOptimizer';

export interface LoadingConfig {
  enableDraco: boolean;
  enableKTX2: boolean;
  enableMeshopt: boolean;
  maxRetries: number;
  timeout: number;
  cacheEnabled: boolean;
  optimizationConfig?: Partial<OptimizationConfig>;
}

export interface LoadingProgress {
  url: string;
  loaded: number;
  total: number;
  percentage: number;
  stage: 'downloading' | 'parsing' | 'optimizing' | 'complete';
}

export class EnhancedGLTFLoader {
  private loader: GLTFLoader;
  private dracoLoader: DRACOLoader | null = null;
  private ktx2Loader: KTX2Loader | null = null;
  private config: LoadingConfig;
  private cache: Map<string, GLTF> = new Map();
  private loadingPromises: Map<string, Promise<GLTF>> = new Map();

  constructor(renderer?: WebGLRenderer) {
    this.loader = new GLTFLoader();
    this.config = this.getDefaultConfig();
    this.setupLoaders(renderer);
  }

  private getDefaultConfig(): LoadingConfig {
    return {
      enableDraco: true,
      enableKTX2: true,
      enableMeshopt: true,
      maxRetries: 3,
      timeout: 30000,
      cacheEnabled: true,
      optimizationConfig: {
        qualityLevel: 'medium',
        maxTextureSize: 1024,
        enableCompression: true,
        enableLOD: true,
        enableCulling: true
      }
    };
  }

  setConfig(config: Partial<LoadingConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Update asset optimizer config
    if (config.optimizationConfig) {
      assetOptimizer.setConfig(config.optimizationConfig);
    }
  }

  private setupLoaders(renderer?: WebGLRenderer): void {
    // Setup DRACO loader
    if (this.config.enableDraco) {
      this.dracoLoader = new DRACOLoader();
      this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
      this.dracoLoader.setDecoderConfig({ type: 'js' });
      this.loader.setDRACOLoader(this.dracoLoader);
    }

    // Setup KTX2 loader
    if (this.config.enableKTX2 && renderer) {
      this.ktx2Loader = new KTX2Loader();
      this.ktx2Loader.setTranscoderPath('https://unpkg.com/three@0.150.0/examples/js/libs/basis/');
      this.ktx2Loader.detectSupport(renderer);
      this.loader.setKTX2Loader(this.ktx2Loader);
    }

    // Setup Meshopt decoder
    if (this.config.enableMeshopt) {
      this.loader.setMeshoptDecoder(MeshoptDecoder);
    }
  }

  /**
   * Load GLTF with advanced optimization and caching
   */
  async loadOptimized(
    url: string, 
    onProgress?: (progress: LoadingProgress) => void
  ): Promise<GLTF> {
    // Check cache first
    if (this.config.cacheEnabled && this.cache.has(url)) {
      const cached = this.cache.get(url)!;
      onProgress?.({
        url,
        loaded: 100,
        total: 100,
        percentage: 100,
        stage: 'complete'
      });
      return this.cloneGLTF(cached);
    }

    // Check if already loading
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }

    // Create loading promise
    const loadingPromise = this.loadWithRetry(url, onProgress);
    this.loadingPromises.set(url, loadingPromise);

    try {
      const result = await loadingPromise;
      this.loadingPromises.delete(url);
      return result;
    } catch (error) {
      this.loadingPromises.delete(url);
      throw error;
    }
  }

  private async loadWithRetry(
    url: string,
    onProgress?: (progress: LoadingProgress) => void,
    attempt: number = 1
  ): Promise<GLTF> {
    try {
      return await this.performLoad(url, onProgress);
    } catch (error) {
      if (attempt < this.config.maxRetries) {
        console.warn(`Loading attempt ${attempt} failed for ${url}, retrying...`, error);
        await this.delay(1000 * attempt); // Exponential backoff
        return this.loadWithRetry(url, onProgress, attempt + 1);
      } else {
        console.error(`Failed to load ${url} after ${this.config.maxRetries} attempts:`, error);
        throw error;
      }
    }
  }

  private async performLoad(
    url: string,
    onProgress?: (progress: LoadingProgress) => void
  ): Promise<GLTF> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Loading timeout for ${url}`));
      }, this.config.timeout);

      this.loader.load(
        url,
        (gltf) => {
          clearTimeout(timeoutId);
          
          // Optimization stage
          onProgress?.({
            url,
            loaded: 90,
            total: 100,
            percentage: 90,
            stage: 'optimizing'
          });

          try {
            // Apply optimizations
            const optimizedGLTF = assetOptimizer.optimizeGLTF(gltf);
            
            // Cache the result
            if (this.config.cacheEnabled) {
              this.cache.set(url, optimizedGLTF);
            }

            onProgress?.({
              url,
              loaded: 100,
              total: 100,
              percentage: 100,
              stage: 'complete'
            });

            resolve(optimizedGLTF);
          } catch (optimizationError) {
            console.warn('Optimization failed, returning unoptimized GLTF:', optimizationError);
            resolve(gltf);
          }
        },
        (progress) => {
          const percentage = progress.total > 0 ? (progress.loaded / progress.total) * 90 : 0;
          onProgress?.({
            url,
            loaded: progress.loaded,
            total: progress.total,
            percentage,
            stage: progress.loaded === progress.total ? 'parsing' : 'downloading'
          });
        },
        (error) => {
          clearTimeout(timeoutId);
          reject(error);
        }
      );
    });
  }

  /**
   * Preload multiple assets for better performance
   */
  async preloadAssets(
    urls: string[],
    onProgress?: (overall: number, current: LoadingProgress) => void
  ): Promise<GLTF[]> {
    const results: GLTF[] = [];
    
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      
      try {
        const gltf = await this.loadOptimized(url, (progress) => {
          onProgress?.(
            (i / urls.length) * 100 + (progress.percentage / urls.length),
            progress
          );
        });
        results.push(gltf);
      } catch (error) {
        console.error(`Failed to preload ${url}:`, error);
        // Continue with other assets
      }
    }

    return results;
  }

  /**
   * Clone GLTF for reuse (important for instancing)
   */
  private cloneGLTF(gltf: GLTF): GLTF {
    const cloned: GLTF = {
      scene: gltf.scene.clone(),
      scenes: gltf.scenes.map(scene => scene.clone()),
      animations: gltf.animations.slice(),
      cameras: gltf.cameras.slice(),
      asset: { ...gltf.asset },
      parser: gltf.parser,
      userData: { ...gltf.userData }
    };

    return cloned;
  }

  /**
   * Clear cache to free memory
   */
  clearCache(): void {
    // Dispose of cached resources
    this.cache.forEach((gltf) => {
      this.disposeGLTF(gltf);
    });
    this.cache.clear();
    console.log('GLTF cache cleared');
  }

  /**
   * Dispose of GLTF resources
   */
  private disposeGLTF(gltf: GLTF): void {
    gltf.scene.traverse((object) => {
      if (object instanceof Mesh) {
        if (object.geometry) {
          object.geometry.dispose();
        }
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
    });
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      activePendingLoads: this.loadingPromises.size,
      config: this.config
    };
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.clearCache();
    
    if (this.dracoLoader) {
      this.dracoLoader.dispose();
    }
    
    if (this.ktx2Loader) {
      this.ktx2Loader.dispose();
    }

    this.loadingPromises.clear();
  }
}

// Export singleton instance
export const enhancedGLTFLoader = new EnhancedGLTFLoader();
