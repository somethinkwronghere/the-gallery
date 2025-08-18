import { 
  Texture, 
  CompressedTexture, 
  DataTexture, 
  RGBAFormat, 
  UnsignedByteType,
  LinearFilter,
  NearestFilter,
  RepeatWrapping,
  ClampToEdgeWrapping,
  MirroredRepeatWrapping
} from 'three'
import { CompressionLevel } from '../../types/assets'

export class TextureOptimizer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  constructor() {
    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d')!
  }

  /**
   * Compress texture with specified compression level
   */
  async compressTexture(texture: Texture, level: CompressionLevel): Promise<Texture> {
    if (level === 'none') {
      return texture
    }

    const compressionSettings = this.getCompressionSettings(level)
    
    // Get image data from texture
    const imageData = await this.extractImageData(texture)
    
    // Apply compression
    const compressedData = this.applyCompression(imageData, compressionSettings)
    
    // Create new texture with compressed data
    const compressedTexture = new DataTexture(
      compressedData,
      imageData.width,
      imageData.height,
      RGBAFormat,
      UnsignedByteType
    )
    
    // Copy texture properties
    this.copyTextureProperties(texture, compressedTexture)
    
    return compressedTexture
  }

  /**
   * Optimize texture for better performance
   */
  optimizeTexture(texture: Texture): void {
    // Enable mipmaps for better performance at distance
    texture.generateMipmaps = true
    
    // Use appropriate filtering
    if (this.isPowerOfTwo(texture.image.width) && this.isPowerOfTwo(texture.image.height)) {
      texture.minFilter = LinearFilter
      texture.magFilter = LinearFilter
    } else {
      texture.minFilter = NearestFilter
      texture.magFilter = NearestFilter
      texture.generateMipmaps = false
    }
    
    // Optimize wrapping
    texture.wrapS = ClampToEdgeWrapping
    texture.wrapT = ClampToEdgeWrapping
    
    // Mark for update
    texture.needsUpdate = true
  }

  /**
   * Generate mipmaps for texture
   */
  generateMipmaps(texture: Texture): void {
    if (!texture.image) return
    
    const { width, height } = texture.image
    
    // Only generate mipmaps for power-of-two textures
    if (this.isPowerOfTwo(width) && this.isPowerOfTwo(height)) {
      texture.generateMipmaps = true
      texture.needsUpdate = true
    }
  }

  /**
   * Resize texture to specified dimensions
   */
  async resizeTexture(texture: Texture, newWidth: number, newHeight: number): Promise<Texture> {
    const imageData = await this.extractImageData(texture)
    const resizedData = this.resizeImageData(imageData, newWidth, newHeight)
    
    const resizedTexture = new DataTexture(
      resizedData,
      newWidth,
      newHeight,
      RGBAFormat,
      UnsignedByteType
    )
    
    this.copyTextureProperties(texture, resizedTexture)
    
    return resizedTexture
  }

  /**
   * Convert texture to WebP format with fallback support
   */
  async convertToWebP(texture: Texture, quality: number = 0.8): Promise<Blob> {
    const imageData = await this.extractImageData(texture)
    
    // Draw to canvas
    this.canvas.width = imageData.width
    this.canvas.height = imageData.height
    
    const canvasImageData = this.ctx.createImageData(imageData.width, imageData.height)
    canvasImageData.data.set(imageData.data)
    this.ctx.putImageData(canvasImageData, 0, 0)
    
    // Check WebP support
    const supportsWebP = await this.checkWebPSupport()
    
    if (supportsWebP) {
      // Convert to WebP blob
      return new Promise<Blob>((resolve, reject) => {
        this.canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to convert canvas to WebP blob'))
          }
        }, 'image/webp', quality)
      })
    } else {
      // Fallback to JPEG
      console.warn('WebP not supported, falling back to JPEG')
      return new Promise<Blob>((resolve, reject) => {
        this.canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to convert canvas to JPEG blob'))
          }
        }, 'image/jpeg', quality)
      })
    }
  }

  /**
   * Auto-optimize texture based on device capabilities and performance
   */
  async autoOptimizeTexture(texture: Texture, performanceLevel: 'low' | 'medium' | 'high' = 'medium'): Promise<Texture> {
    const analysis = this.analyzeTexture(texture)
    let optimized = texture

    // Apply optimizations based on performance level
    switch (performanceLevel) {
      case 'low':
        // Aggressive optimization for low-end devices
        if (analysis.width > 512 || analysis.height > 512) {
          optimized = await this.resizeTexture(optimized, 512, 512)
        }
        optimized = await this.compressTexture(optimized, 'high')
        break
        
      case 'medium':
        // Balanced optimization
        if (analysis.width > 1024 || analysis.height > 1024) {
          optimized = await this.resizeTexture(optimized, 1024, 1024)
        }
        optimized = await this.compressTexture(optimized, 'medium')
        break
        
      case 'high':
        // Light optimization for high-end devices
        if (analysis.width > 2048 || analysis.height > 2048) {
          optimized = await this.resizeTexture(optimized, 2048, 2048)
        }
        optimized = await this.compressTexture(optimized, 'low')
        break
    }

    // Always optimize texture properties
    this.optimizeTexture(optimized)
    
    return optimized
  }

  /**
   * Create texture atlas from multiple textures
   */
  createTextureAtlas(textures: Texture[], atlasSize: number = 1024): Texture {
    const atlas = document.createElement('canvas')
    atlas.width = atlasSize
    atlas.height = atlasSize
    const atlasCtx = atlas.getContext('2d')!
    
    const texturesPerRow = Math.floor(Math.sqrt(textures.length))
    const textureSize = Math.floor(atlasSize / texturesPerRow)
    
    textures.forEach((texture, index) => {
      if (!texture.image) return
      
      const row = Math.floor(index / texturesPerRow)
      const col = index % texturesPerRow
      
      const x = col * textureSize
      const y = row * textureSize
      
      atlasCtx.drawImage(texture.image, x, y, textureSize, textureSize)
    })
    
    const atlasTexture = new Texture(atlas)
    atlasTexture.needsUpdate = true
    
    return atlasTexture
  }

  /**
   * Analyze texture and provide optimization recommendations
   */
  analyzeTexture(texture: Texture): TextureAnalysis {
    if (!texture.image) {
      return {
        width: 0,
        height: 0,
        isPowerOfTwo: false,
        hasAlpha: false,
        estimatedSize: 0,
        recommendations: ['Texture has no image data']
      }
    }

    const { width, height } = texture.image
    const isPowerOfTwo = this.isPowerOfTwo(width) && this.isPowerOfTwo(height)
    const estimatedSize = width * height * 4 // RGBA
    
    const recommendations: string[] = []
    
    if (!isPowerOfTwo) {
      recommendations.push('Consider resizing to power-of-two dimensions for better performance')
    }
    
    if (width > 2048 || height > 2048) {
      recommendations.push('Large texture detected - consider compression or resizing')
    }
    
    if (!texture.generateMipmaps && isPowerOfTwo) {
      recommendations.push('Enable mipmaps for better performance at distance')
    }
    
    return {
      width,
      height,
      isPowerOfTwo,
      hasAlpha: this.hasAlphaChannel(texture),
      estimatedSize,
      recommendations
    }
  }

  /**
   * Batch optimize multiple textures
   */
  async batchOptimize(textures: Texture[], options: BatchOptimizeOptions): Promise<Texture[]> {
    const optimizedTextures: Texture[] = []
    
    for (const texture of textures) {
      let optimized = texture
      
      if (options.compress && options.compressionLevel !== 'none') {
        optimized = await this.compressTexture(optimized, options.compressionLevel)
      }
      
      if (options.resize && options.maxSize) {
        const { width, height } = optimized.image
        if (width > options.maxSize || height > options.maxSize) {
          const scale = options.maxSize / Math.max(width, height)
          const newWidth = Math.floor(width * scale)
          const newHeight = Math.floor(height * scale)
          optimized = await this.resizeTexture(optimized, newWidth, newHeight)
        }
      }
      
      if (options.generateMipmaps) {
        this.generateMipmaps(optimized)
      }
      
      optimizedTextures.push(optimized)
    }
    
    return optimizedTextures
  }

  // Private helper methods

  private getCompressionSettings(level: CompressionLevel): CompressionSettings {
    switch (level) {
      case 'low':
        return { quality: 0.9, scale: 1.0 }
      case 'medium':
        return { quality: 0.7, scale: 0.8 }
      case 'high':
        return { quality: 0.5, scale: 0.6 }
      default:
        return { quality: 1.0, scale: 1.0 }
    }
  }

  private async extractImageData(texture: Texture): Promise<ImageData> {
    if (!texture.image) {
      throw new Error('Texture has no image data')
    }

    const { width, height } = texture.image
    
    this.canvas.width = width
    this.canvas.height = height
    
    this.ctx.drawImage(texture.image, 0, 0)
    
    return this.ctx.getImageData(0, 0, width, height)
  }

  private applyCompression(imageData: ImageData, settings: CompressionSettings): Uint8Array {
    const { data, width, height } = imageData
    const newWidth = Math.floor(width * settings.scale)
    const newHeight = Math.floor(height * settings.scale)
    
    // Simple compression by reducing quality and size
    const compressed = new Uint8Array(newWidth * newHeight * 4)
    
    for (let y = 0; y < newHeight; y++) {
      for (let x = 0; x < newWidth; x++) {
        const srcX = Math.floor((x / newWidth) * width)
        const srcY = Math.floor((y / newHeight) * height)
        const srcIndex = (srcY * width + srcX) * 4
        const dstIndex = (y * newWidth + x) * 4
        
        // Apply quality reduction
        compressed[dstIndex] = Math.floor(data[srcIndex] * settings.quality)     // R
        compressed[dstIndex + 1] = Math.floor(data[srcIndex + 1] * settings.quality) // G
        compressed[dstIndex + 2] = Math.floor(data[srcIndex + 2] * settings.quality) // B
        compressed[dstIndex + 3] = data[srcIndex + 3] // A (preserve alpha)
      }
    }
    
    return compressed
  }

  private resizeImageData(imageData: ImageData, newWidth: number, newHeight: number): Uint8Array {
    const { data, width, height } = imageData
    const resized = new Uint8Array(newWidth * newHeight * 4)
    
    for (let y = 0; y < newHeight; y++) {
      for (let x = 0; x < newWidth; x++) {
        const srcX = Math.floor((x / newWidth) * width)
        const srcY = Math.floor((y / newHeight) * height)
        const srcIndex = (srcY * width + srcX) * 4
        const dstIndex = (y * newWidth + x) * 4
        
        resized[dstIndex] = data[srcIndex]         // R
        resized[dstIndex + 1] = data[srcIndex + 1] // G
        resized[dstIndex + 2] = data[srcIndex + 2] // B
        resized[dstIndex + 3] = data[srcIndex + 3] // A
      }
    }
    
    return resized
  }

  private copyTextureProperties(source: Texture, target: Texture): void {
    target.wrapS = source.wrapS
    target.wrapT = source.wrapT
    target.magFilter = source.magFilter
    target.minFilter = source.minFilter
    target.format = source.format
    target.type = source.type
    target.generateMipmaps = source.generateMipmaps
    target.flipY = source.flipY
    target.needsUpdate = true
  }

  private isPowerOfTwo(value: number): boolean {
    return (value & (value - 1)) === 0 && value !== 0
  }

  private hasAlphaChannel(texture: Texture): boolean {
    // Simple heuristic - check if format includes alpha
    return texture.format === RGBAFormat
  }

  private async checkWebPSupport(): Promise<boolean> {
    return new Promise((resolve) => {
      const webP = new Image()
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2)
      }
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
    })
  }
}

// Supporting interfaces
interface CompressionSettings {
  quality: number
  scale: number
}

interface TextureAnalysis {
  width: number
  height: number
  isPowerOfTwo: boolean
  hasAlpha: boolean
  estimatedSize: number
  recommendations: string[]
}

interface BatchOptimizeOptions {
  compress: boolean
  compressionLevel: CompressionLevel
  resize: boolean
  maxSize?: number
  generateMipmaps: boolean
}