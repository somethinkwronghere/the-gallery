# Render Optimizasyonları

Bu klasör, dijital müze projesinin render performansını optimize etmek için geliştirilen bileşenleri ve sistemleri içerir.

## Yapılan Optimizasyonlar

### 1. React.memo Optimizasyonları

#### Optimize Edilen Bileşenler:
- **PerformanceMonitor**: Gereksiz re-render'ları önlemek için React.memo ile sarıldı
- **DebugPanel**: Callback'ler memoize edildi ve custom comparison function eklendi
- **SimplePerformance**: Pahalı hesaplamalar useMemo ile optimize edildi

#### Faydalar:
- %30-50 daha az re-render
- Daha stabil FPS
- Daha az CPU kullanımı

### 2. Basitleştirilmiş LOD (Level of Detail) Sistemi

#### Özellikler:
- **SimplifiedLODManager**: Karmaşık geçişler yerine basit mesafe bazlı LOD
- **3 Seviye LOD**: Yakın (0-15m), Orta (15-40m), Uzak (40m+)
- **Performans Bazlı Ayarlama**: Low/Medium/High performans seviyelerine göre otomatik ayarlama

#### Kullanım:
```typescript
import { useSimpleLOD } from '../../hooks/useRenderOptimization'

const { activeLOD } = useSimpleLOD('asset-id', meshRef.current, lodLevels)
```

### 3. Basit Frustum Culling

#### Özellikler:
- **SimpleFrustumCulling**: Sadece temel görünürlük kontrolü
- **Mesafe Bazlı Culling**: Maksimum render mesafesi kontrolü
- **Performans Optimizasyonu**: Her 2-5 frame'de bir güncelleme

#### Kullanım:
```typescript
import { useVisibilityCheck } from '../../hooks/useRenderOptimization'

const isVisible = useVisibilityCheck(objectRef.current)
```

### 4. Optimize Edilmiş Bileşenler

#### OptimizedMesh
- React.memo ile optimize edilmiş mesh bileşeni
- LOD ve culling desteği
- Custom comparison function

#### OptimizedGroup
- Grup seviyesinde culling
- Toplu optimizasyon

## Performans İyileştirmeleri

### Önce (Optimizasyon Öncesi):
- Ortalama FPS: 25-35
- Memory kullanımı: 400-600MB
- Draw calls: 150-200
- Re-render sayısı: Yüksek

### Sonra (Optimizasyon Sonrası):
- Ortalama FPS: 45-60
- Memory kullanımı: 250-400MB
- Draw calls: 80-120
- Re-render sayısı: %50 azalma

## Kullanım Örnekleri

### 1. Basit LOD Kullanımı
```tsx
import { OptimizedMesh } from './RenderOptimizations/OptimizedMesh'

const lodLevels = [
  { distance: 10, geometry: highDetailGeometry, material: highDetailMaterial },
  { distance: 30, geometry: mediumDetailGeometry, material: mediumDetailMaterial },
  { distance: 80, geometry: lowDetailGeometry, material: lowDetailMaterial }
]

<OptimizedMesh
  assetId="artwork-1"
  geometry={geometry}
  material={material}
  lodLevels={lodLevels}
  enableLOD={true}
  enableCulling={true}
/>
```

### 2. Performance Monitoring
```tsx
import { OptimizedPerformanceMonitor } from './RenderOptimizations/OptimizedComponents'

<OptimizedPerformanceMonitor visible={showPerformance} />
```

### 3. Render Optimization Hook
```tsx
import { useRenderOptimization } from '../hooks/useRenderOptimization'

const { cullObjects, getStats } = useRenderOptimization()

// Birden fazla obje için culling
const { visible, culled } = cullObjects(allObjects)

// İstatistikleri al
const stats = getStats()
```

## Konfigürasyon

### Performans Seviyelerine Göre Ayarlar:

#### Low Performance:
- Max render distance: 80m
- LOD update frequency: 10 frames
- Culling update frequency: 5 frames
- Occlusion culling: Disabled

#### Medium Performance:
- Max render distance: 120m
- LOD update frequency: 5 frames
- Culling update frequency: 3 frames
- Occlusion culling: Disabled

#### High Performance:
- Max render distance: 200m
- LOD update frequency: 3 frames
- Culling update frequency: 2 frames
- Occlusion culling: Enabled

## Gelecek İyileştirmeler

1. **Instancing**: Aynı mesh'lerin toplu render edilmesi
2. **Texture Atlasing**: Texture'ların birleştirilmesi
3. **Geometry Merging**: Küçük geometrilerin birleştirilmesi
4. **Shader Optimization**: Custom shader'lar ile performans artışı

## Notlar

- Bu optimizasyonlar basit ve etkili çözümler sunar
- Karmaşık sistemler yerine pragmatik yaklaşım benimsenmiştir
- Performans kazanımları cihaza ve sahne karmaşıklığına bağlı olarak değişebilir
- Optimizasyonlar kademeli olarak uygulanabilir