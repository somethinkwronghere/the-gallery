# Asset Management System

Bu sistem, dijital müze projesinde 3D modeller, tekstürler ve diğer varlıkların verimli yönetimi için geliştirilmiştir.

## Özellikler

### 🚀 Progressive Loading
- Varlıkların aşamalı yüklenmesi
- Gerçek zamanlı ilerleme takibi
- Batch loading desteği

### 💾 Intelligent Caching
- Otomatik bellek yönetimi
- LRU (Least Recently Used) cache stratejisi
- Configurable cache limits
- Cache hit/miss istatistikleri

### 🎯 Asset Optimization
- Texture compression (Low, Medium, High)
- Model geometry optimization
- LOD (Level of Detail) generation
- Automatic mipmap generation

### 🔄 Instance Management
- Asset instance creation ve management
- Transform tracking
- Memory-efficient instancing

### 📊 Performance Monitoring
- Real-time cache statistics
- Memory usage tracking
- Loading progress monitoring
- Debug tools integration

## Kullanım

### Temel Kullanım

```tsx
import { AssetProvider, useAssetManager } from '../systems/assets'

// App seviyesinde provider'ı wrap edin
function App() {
  return (
    <AssetProvider>
      <YourComponents />
    </AssetProvider>
  )
}

// Component içinde asset yönetimi
function MyComponent() {
  const { loadAsset, cacheStats } = useAssetManager()
  
  const handleLoadModel = async () => {
    try {
      const asset = await loadAsset('/models/artwork.glb', 'model', {
        cache: true,
        compress: true,
        generateLOD: true
      })
      console.log('Model loaded:', asset)
    } catch (error) {
      console.error('Loading failed:', error)
    }
  }
  
  return (
    <div>
      <button onClick={handleLoadModel}>Load Model</button>
      <p>Cache: {cacheStats.totalAssets} assets</p>
    </div>
  )
}
```

### Model Loading Hook

```tsx
import { useModelAsset } from '../hooks/useAssetManager'

function ModelComponent({ url }: { url: string }) {
  const { asset, loading, error, progress } = useModelAsset(url, {
    cache: true,
    compress: true
  })
  
  if (loading) return <div>Loading... {progress?.percentage}%</div>
  if (error) return <div>Error: {error.message}</div>
  if (!asset) return null
  
  return <primitive object={asset.data} />
}
```

### Batch Loading

```tsx
import { useBatchAssetLoader } from '../hooks/useAssetManager'

function PreloadAssets() {
  const { loadBatch, loading, progress, completed } = useBatchAssetLoader()
  
  const preloadEssentialAssets = async () => {
    const requests = [
      { url: '/models/gallery.glb', type: 'model' as const },
      { url: '/textures/floor.jpg', type: 'texture' as const },
      { url: '/models/artwork1.glb', type: 'model' as const }
    ]
    
    try {
      const assets = await loadBatch(requests)
      console.log('Preloaded:', assets.length, 'assets')
    } catch (error) {
      console.error('Preload failed:', error)
    }
  }
  
  return (
    <div>
      <button onClick={preloadEssentialAssets}>Preload Assets</button>
      {loading && <div>Loading batch... {progress}%</div>}
      <div>Completed: {completed.length} assets</div>
    </div>
  )
}
```

### Asset Monitoring

```tsx
import { AssetMonitor } from '../components/AssetMonitor/AssetMonitor'

function DebugView() {
  return (
    <AssetMonitor 
      visible={true} 
      position="top-right" 
    />
  )
}
```

## API Reference

### AssetManager

Ana asset yönetim sınıfı.

#### Methods

- `loadAsset(url, type, options)` - Tek asset yükleme
- `loadAssetProgressive(url, type, onProgress, options)` - Progress callback ile yükleme
- `loadBatch(requests, onProgress)` - Batch yükleme
- `cacheAsset(asset)` - Asset'i cache'e ekleme
- `getCachedAsset(id)` - Cache'den asset alma
- `clearCache()` - Cache'i temizleme
- `compressTexture(texture, level)` - Texture sıkıştırma
- `optimizeGeometry(geometry)` - Geometry optimizasyonu
- `createInstance(originalId, transform)` - Instance oluşturma

### TextureOptimizer

Texture optimizasyon utilities.

#### Methods

- `compressTexture(texture, level)` - Texture compression
- `optimizeTexture(texture)` - Genel texture optimizasyonu
- `generateMipmaps(texture)` - Mipmap generation
- `resizeTexture(texture, width, height)` - Texture resizing
- `analyzeTexture(texture)` - Texture analizi ve öneriler

### ModelOptimizer

Model optimizasyon utilities.

#### Methods

- `optimizeModel(model)` - Genel model optimizasyonu
- `optimizeGeometry(geometry, targetReduction)` - Geometry simplification
- `generateLODLevels(model, levels)` - LOD level generation
- `mergeGeometries(meshes)` - Geometry merging
- `getTriangleCount(model)` - Triangle sayısı hesaplama
- `analyzeModel(model)` - Model analizi ve öneriler

## Configuration

### Loading Options

```typescript
interface LoadingOptions {
  priority: number        // Loading priority (1-10)
  cache: boolean         // Enable caching
  compress: boolean      // Enable compression
  generateLOD: boolean   // Generate LOD levels
  timeout: number        // Loading timeout (ms)
  retryCount: number     // Retry attempts
  fallbackUrl?: string   // Fallback asset URL
}
```

### Cache Configuration

```typescript
// AssetManager constructor'da
const assetManager = new AssetManager({
  maxCacheSize: 500 * 1024 * 1024, // 500MB
  maxCacheAge: 30 * 60 * 1000,     // 30 minutes
  fallbackConfig: {
    model: '/assets/fallback/default-model.glb',
    texture: '/assets/fallback/default-texture.jpg',
    showPlaceholder: true,
    placeholderColor: '#cccccc'
  }
})
```

## Performance Tips

### 1. Cache Strategy
- Essential assets'leri persistent olarak işaretleyin
- Frequently used assets için cache priority ayarlayın
- Regular cache cleanup yapın

### 2. Loading Strategy
- Critical assets'leri preload edin
- Non-critical assets için lazy loading kullanın
- Batch loading ile network requests'leri optimize edin

### 3. Optimization
- Large textures için compression kullanın
- High-poly models için LOD system kullanın
- Duplicate geometries için instancing kullanın

### 4. Memory Management
- Unused assets'leri dispose edin
- Cache limits'leri device capabilities'e göre ayarlayın
- Memory usage'ı monitor edin

## Error Handling

System otomatik error recovery mekanizmaları içerir:

- **Asset Loading Failures**: Fallback assets kullanır
- **Memory Issues**: Otomatik cache cleanup
- **Network Timeouts**: Retry mechanism
- **WebGL Context Loss**: State recovery

## Integration

Existing systems ile entegrasyon:

```tsx
// Performance system ile
import { usePerformance } from '../systems/performance'
import { useAssetManager } from '../systems/assets'

function OptimizedModel({ url }: { url: string }) {
  const { performanceLevel } = usePerformance()
  const { loadAsset } = useAssetManager()
  
  const compressionLevel = performanceLevel === 'low' ? 'high' : 
                          performanceLevel === 'medium' ? 'medium' : 'low'
  
  // Load with performance-based optimization
  const asset = loadAsset(url, 'model', {
    compress: true,
    compressionLevel
  })
}
```

## Testing

Asset system için test utilities:

```typescript
// Mock asset manager for testing
import { createMockAssetManager } from '../systems/assets/testing'

const mockAssetManager = createMockAssetManager({
  mockAssets: [
    { id: 'test-model', type: 'model', url: '/test.glb' }
  ]
})
```

## Troubleshooting

### Common Issues

1. **High Memory Usage**
   - Cache size'ı kontrol edin
   - Unused assets'leri dispose edin
   - Compression settings'leri artırın

2. **Slow Loading**
   - Network connection'ı kontrol edin
   - Asset sizes'ı optimize edin
   - Preloading strategy'sini gözden geçirin

3. **Cache Misses**
   - Cache configuration'ı kontrol edin
   - Asset URLs'lerinin consistent olduğunu doğrulayın
   - Cache invalidation logic'ini gözden geçirin

### Debug Tools

AssetMonitor component'i kullanarak:
- Real-time cache statistics
- Loading progress tracking
- Memory usage monitoring
- Error logging

```tsx
<AssetMonitor visible={process.env.NODE_ENV === 'development'} />
```