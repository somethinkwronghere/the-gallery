# Memory Management System

Bu sistem, dijital müze projesinde 3D kaynakların (geometri, materyal, tekstür) bellek yönetimini otomatikleştirmek ve bellek sızıntılarını önlemek için tasarlanmıştır.

## Özellikler

### 1. ResourceManager
- 3D kaynakların otomatik takibi ve dispose edilmesi
- Bellek kullanımı izleme
- Kullanılmayan kaynakların otomatik temizlenmesi
- Bellek sızıntısı tespiti ve uyarıları

### 2. GarbageCollector
- Zorla garbage collection tetikleme
- Bellek baskısı tespiti
- Temizlik önerileri

### 3. ResourcePool
- Object pooling pattern implementasyonu
- Kaynak yeniden kullanımı
- Performans optimizasyonu

### 4. MemoryLeakDetector
- Gerçek zamanlı bellek sızıntısı analizi
- Trend analizi ve raporlama
- Otomatik uyarı sistemi

## Kullanım

### React Hook ile Kullanım

```typescript
import { useMemoryManager } from '../hooks/useMemoryManager'

function MyComponent() {
  const {
    memoryUsage,
    warnings,
    trackResource,
    disposeResource,
    cleanupUnusedResources
  } = useMemoryManager({
    enableAutoCleanup: true,
    enableLeakDetection: true,
    memoryThreshold: 512 // MB
  })

  // Kaynak takibi
  const geometryId = trackResource(geometry, { type: 'geometry' })
  
  // Manuel temizlik
  const disposedCount = cleanupUnusedResources()
  
  return (
    <div>
      <p>Bellek Kullanımı: {memoryUsage.total}MB</p>
      {warnings.length > 0 && (
        <div>Uyarılar: {warnings.length}</div>
      )}
    </div>
  )
}
```

### Three.js ile Entegrasyon

```typescript
import { useThreeMemoryManager } from '../hooks/useMemoryManager'

function ThreeComponent() {
  const { trackGeometry, trackMaterial, trackTexture } = useThreeMemoryManager()

  useEffect(() => {
    const geometry = new BoxGeometry()
    const material = new MeshBasicMaterial()
    const texture = new TextureLoader().load('texture.jpg')

    // Kaynakları takip et
    const geometryId = trackGeometry(geometry)
    const materialId = trackMaterial(material)
    const textureId = trackTexture(texture)

    return () => {
      // Otomatik temizlik - hook dispose eder
    }
  }, [])
}
```

### Manuel ResourceManager Kullanımı

```typescript
import { resourceManager } from '../systems/memory'

// Kaynak takibi
const resourceId = resourceManager.trackResource(geometry, {
  type: 'geometry',
  size: 1024 * 1024 // 1MB
})

// Bellek durumu kontrolü
const usage = resourceManager.getMemoryUsage()
console.log(`Total memory: ${usage.total}MB`)

// Kullanılmayan kaynakları temizle
const disposedCount = resourceManager.disposeUnusedResources()

// Bellek sızıntısı kontrolü
const leaks = resourceManager.checkMemoryLeaks()
if (leaks.length > 0) {
  console.warn('Memory leaks detected:', leaks)
}
```

## Konfigürasyon

```typescript
resourceManager.setCleanupConfig({
  maxAge: 5 * 60 * 1000,        // 5 dakika
  maxUnusedTime: 2 * 60 * 1000, // 2 dakika
  memoryThreshold: 512,          // 512 MB
  checkInterval: 30 * 1000,      // 30 saniye
  enableAutoCleanup: true,
  enableLeakDetection: true
})
```

## Monitoring ve Debug

### MemoryMonitor Bileşeni

```typescript
import { MemoryMonitor } from '../components/MemoryMonitor/MemoryMonitor'

function App() {
  return (
    <div>
      {/* Basit gösterge */}
      <MemoryMonitor />
      
      {/* Detaylı panel */}
      <MemoryMonitor showDetails={true} />
    </div>
  )
}
```

### Console Logları

Sistem otomatik olarak önemli olayları console'a loglar:

```
[ResourceManager] Tracked geometry resource: resource_1_1234567890 (2.34 MB)
[ResourceManager] Disposed 5 unused resources
[ResourceManager] Critical memory usage detected!
[MemoryLeakDetector] Potential memory leak detected
```

## Event Sistemi

Bellek uyarıları için event listener ekleyebilirsiniz:

```typescript
window.addEventListener('memoryLeakDetected', (event) => {
  const warning = event.detail
  console.warn('Memory leak warning:', warning)
  
  // Kullanıcıya bildirim göster
  showNotification(`Memory warning: ${warning.message}`)
})
```

## Best Practices

### 1. Kaynak Takibi
- Tüm Three.js objelerini (geometry, material, texture) takip edin
- Component unmount olduğunda kaynakları dispose edin
- useEffect cleanup fonksiyonlarını kullanın

### 2. Performans
- Object pooling kullanarak kaynak yeniden kullanımını artırın
- LOD sistemi ile gereksiz detayları azaltın
- Texture sıkıştırması kullanın

### 3. Monitoring
- Production'da MemoryMonitor'u basit modda kullanın
- Development'da detaylı monitoring aktif edin
- Bellek eşiklerini cihaz kapasitesine göre ayarlayın

### 4. Error Handling
- Dispose işlemlerini try-catch ile sarın
- Graceful degradation uygulayın
- Kullanıcıya anlamlı hata mesajları verin

## API Referansı

### ResourceManager

```typescript
interface ResourceManager {
  trackResource(resource: DisposableResource, metadata?: Partial<ResourceMetadata>): string
  untrackResource(resourceId: string): void
  disposeResource(resourceId: string): boolean
  disposeUnusedResources(maxAge?: number): number
  emergencyCleanup(): number
  getMemoryUsage(): MemoryUsage
  checkMemoryLeaks(): MemoryLeakInfo[]
  getMemoryWarnings(): MemoryWarning[]
  setCleanupConfig(config: Partial<CleanupConfig>): void
  startMonitoring(): void
  stopMonitoring(): void
}
```

### GarbageCollector

```typescript
interface GarbageCollector {
  forceGC(): boolean
  isMemoryPressure(): boolean
  getSuggestedCleanupActions(): string[]
  getMemoryStats(): object
}
```

### ResourcePool

```typescript
interface ResourcePool<T> {
  acquire(): T
  release(resource: T): void
  clear(): void
  getStats(): { total: number; available: number; inUse: number }
}
```

## Troubleshooting

### Yüksek Bellek Kullanımı
1. `getMemoryUsage()` ile hangi kaynak türünün fazla yer kapladığını kontrol edin
2. `checkMemoryLeaks()` ile sızıntı olup olmadığını kontrol edin
3. `cleanupUnusedResources()` ile manuel temizlik yapın
4. Texture boyutlarını ve kalitesini düşürün

### Bellek Sızıntıları
1. Component cleanup fonksiyonlarını kontrol edin
2. Event listener'ların kaldırıldığından emin olun
3. Three.js objelerinin dispose edildiğini kontrol edin
4. Circular reference'ları kontrol edin

### Performans Sorunları
1. Object pooling kullanın
2. Kaynak takibini optimize edin
3. Monitoring interval'ini artırın
4. Otomatik temizlik eşiklerini ayarlayın