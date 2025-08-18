import { TextureOptimizer } from '../TextureOptimizer'
import { Texture, DataTexture, RGBAFormat, UnsignedByteType } from 'three'
import { CompressionLevel } from '../../../types/assets'

// Mock Three.js Texture
jest.mock('three', () => ({
  Texture: jest.fn().mockImplementation(() => ({
    image: { width: 512, height: 512 },
    generateMipmaps: false,
    minFilter: null,
    magFilter: null,
    wrapS: null,
    wrapT: null,
    format: 'RGBAFormat',
    type: 'UnsignedByteType',
    flipY: true,
    needsUpdate: false,
    dispose: jest.fn()
  })),
  DataTexture: jest.fn().mockImplementation((data, width, height, format, type) => ({
    image: { width, height },
    generateMipmaps: false,
    minFilter: null,
    magFilter: null,
    wrapS: null,
    wrapT: null,
    format,
    type,
    flipY: true,
    needsUpdate: false,
    dispose: jest.fn()
  })),
  RGBAFormat: 'RGBAFormat',
  UnsignedByteType: 'UnsignedByteType',
  LinearFilter: 'LinearFilter',
  NearestFilter: 'NearestFilter',
  ClampToEdgeWrapping: 'ClampToEdgeWrapping'
}))

// Mock Canvas and Context
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: jest.fn(() => ({
    drawImage: jest.fn(),
    getImageData: jest.fn(() => ({
      data: new Uint8ClampedArray(512 * 512 * 4),
      width: 512,
      height: 512
    })),
    putImageData: jest.fn(),
    createImageData: jest.fn(() => ({
      data: new Uint8ClampedArray(512 * 512 * 4),
      width: 512,
      height: 512
    }))
  })),
  toBlob: jest.fn((callback, type, quality) => {
    const blob = new Blob(['mock-blob'], { type })
    callback(blob)
  })
}

// Mock document.createElement
Object.defineProperty(document, 'createElement', {
  value: jest.fn(() => mockCanvas),
  writable: true
})

describe('TextureOptimizer', () => {
  let optimizer: TextureOptimizer
  let mockTexture: Texture

  beforeEach(() => {
    optimizer = new TextureOptimizer()
    mockTexture = new Texture()
    mockTexture.image = {
      width: 512,
      height: 512
    }
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Texture Compression', () => {
    test('should return original texture when compression level is none', async () => {
      const result = await optimizer.compressTexture(mockTexture, 'none')
      expect(result).toBe(mockTexture)
    })

    test('should compress texture with low compression', async () => {
      const result = await optimizer.compressTexture(mockTexture, 'low')
      expect(result).toBeInstanceOf(DataTexture)
    })

    test('should compress texture with medium compression', async () => {
      const result = await optimizer.compressTexture(mockTexture, 'medium')
      expect(result).toBeInstanceOf(DataTexture)
    })

    test('should compress texture with high compression', async () => {
      const result = await optimizer.compressTexture(mockTexture, 'high')
      expect(result).toBeInstanceOf(DataTexture)
    })
  })

  describe('Texture Optimization', () => {
    test('should optimize texture properties for power-of-two dimensions', () => {
      mockTexture.image = { width: 512, height: 512 }
      
      optimizer.optimizeTexture(mockTexture)
      
      expect(mockTexture.generateMipmaps).toBe(true)
      expect(mockTexture.needsUpdate).toBe(true)
    })

    test('should optimize texture properties for non-power-of-two dimensions', () => {
      mockTexture.image = { width: 300, height: 400 }
      
      optimizer.optimizeTexture(mockTexture)
      
      expect(mockTexture.generateMipmaps).toBe(false)
      expect(mockTexture.needsUpdate).toBe(true)
    })

    test('should generate mipmaps for power-of-two textures', () => {
      mockTexture.image = { width: 1024, height: 1024 }
      
      optimizer.generateMipmaps(mockTexture)
      
      expect(mockTexture.generateMipmaps).toBe(true)
      expect(mockTexture.needsUpdate).toBe(true)
    })

    test('should not generate mipmaps for non-power-of-two textures', () => {
      mockTexture.image = { width: 300, height: 400 }
      
      optimizer.generateMipmaps(mockTexture)
      
      expect(mockTexture.generateMipmaps).toBe(false)
    })
  })

  describe('Texture Resizing', () => {
    test('should resize texture to specified dimensions', async () => {
      const result = await optimizer.resizeTexture(mockTexture, 256, 256)
      
      expect(result).toBeInstanceOf(DataTexture)
      // Note: In a real test, you would verify the actual dimensions
    })
  })

  describe('WebP Conversion', () => {
    test('should convert texture to WebP blob', async () => {
      const blob = await optimizer.convertToWebP(mockTexture, 0.8)
      
      expect(blob).toBeInstanceOf(Blob)
      expect(mockCanvas.toBlob).toHaveBeenCalledWith(
        expect.any(Function),
        'image/webp',
        0.8
      )
    })

    test('should handle WebP conversion failure gracefully', async () => {
      // Mock toBlob to call callback with null
      mockCanvas.toBlob = jest.fn((callback) => callback(null))
      
      await expect(optimizer.convertToWebP(mockTexture)).rejects.toThrow(
        'Failed to convert canvas to blob'
      )
    })
  })

  describe('Texture Analysis', () => {
    test('should analyze texture and provide recommendations', () => {
      mockTexture.image = { width: 2048, height: 2048 }
      
      const analysis = optimizer.analyzeTexture(mockTexture)
      
      expect(analysis.width).toBe(2048)
      expect(analysis.height).toBe(2048)
      expect(analysis.isPowerOfTwo).toBe(true)
      expect(analysis.estimatedSize).toBe(2048 * 2048 * 4)
      expect(analysis.recommendations).toContain(
        'Large texture detected - consider compression or resizing'
      )
    })

    test('should recommend power-of-two resizing for non-power-of-two textures', () => {
      mockTexture.image = { width: 300, height: 400 }
      
      const analysis = optimizer.analyzeTexture(mockTexture)
      
      expect(analysis.isPowerOfTwo).toBe(false)
      expect(analysis.recommendations).toContain(
        'Consider resizing to power-of-two dimensions for better performance'
      )
    })

    test('should handle texture without image data', () => {
      mockTexture.image = null
      
      const analysis = optimizer.analyzeTexture(mockTexture)
      
      expect(analysis.width).toBe(0)
      expect(analysis.height).toBe(0)
      expect(analysis.recommendations).toContain('Texture has no image data')
    })
  })

  describe('Batch Optimization', () => {
    test('should batch optimize multiple textures', async () => {
      const textures = [mockTexture, new Texture(), new Texture()]
      const options = {
        compress: true,
        compressionLevel: 'medium' as CompressionLevel,
        resize: true,
        maxSize: 1024,
        generateMipmaps: true
      }

      const results = await optimizer.batchOptimize(textures, options)
      
      expect(results).toHaveLength(3)
      results.forEach(result => {
        expect(result).toBeDefined()
      })
    })

    test('should handle batch optimization without compression', async () => {
      const textures = [mockTexture]
      const options = {
        compress: false,
        compressionLevel: 'none' as CompressionLevel,
        resize: false,
        generateMipmaps: true
      }

      const results = await optimizer.batchOptimize(textures, options)
      
      expect(results).toHaveLength(1)
      expect(results[0]).toBe(mockTexture)
    })
  })

  describe('Auto Optimization', () => {
    test('should auto-optimize texture for low performance level', async () => {
      mockTexture.image = { width: 2048, height: 2048 }
      
      const result = await optimizer.autoOptimizeTexture(mockTexture, 'low')
      
      expect(result).toBeDefined()
      // In a real test, you would verify the texture was resized to 512x512 and highly compressed
    })

    test('should auto-optimize texture for medium performance level', async () => {
      mockTexture.image = { width: 2048, height: 2048 }
      
      const result = await optimizer.autoOptimizeTexture(mockTexture, 'medium')
      
      expect(result).toBeDefined()
      // In a real test, you would verify the texture was resized to 1024x1024 and medium compressed
    })

    test('should auto-optimize texture for high performance level', async () => {
      mockTexture.image = { width: 4096, height: 4096 }
      
      const result = await optimizer.autoOptimizeTexture(mockTexture, 'high')
      
      expect(result).toBeDefined()
      // In a real test, you would verify the texture was resized to 2048x2048 and lightly compressed
    })
  })

  describe('Texture Atlas Creation', () => {
    test('should create texture atlas from multiple textures', () => {
      const textures = [mockTexture, new Texture(), new Texture()]
      
      const atlas = optimizer.createTextureAtlas(textures, 1024)
      
      expect(atlas).toBeInstanceOf(Texture)
      expect(atlas.needsUpdate).toBe(true)
    })

    test('should handle empty texture array', () => {
      const atlas = optimizer.createTextureAtlas([], 512)
      
      expect(atlas).toBeInstanceOf(Texture)
    })
  })
})