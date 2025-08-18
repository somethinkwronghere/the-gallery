# LOD (Level of Detail) System

Bu modül, dijital müze projesinde performans optimizasyonu için LOD (Level of Detail) sistemi sağlar. Kameraya olan mesafeye ve cihaz performansına göre 3D modellerin kalitesini otomatik olarak ayarlar.

## Özellikler

- **Mesafe Bazlı LOD Seçimi**: Kameraya olan mesafeye göre otomatik kalite ayarlaması
- **Performans Bazlı Optimizasyon**: Cihaz performansına göre LOD seviyesi ayarlaması
- **Smooth Geçişler**: LOD seviyeleri arasında yumuşak geçişler
- **Hysteresis Desteği**: Titreme önleme mekanizması
- **React Entegrasyonu**: React Three Fiber ile kolay entegrasyon
- **TypeScript Desteği**: Tam tip güvenliği

## Kullanım

### Temel Kullanım

```tsx
import { LODMesh } from '../components/LODMesh/LODMesh'

function MyComponent() {
  return (
    <LODMesh
      assetId="my-model"
      geometry={myGeometry}
      material={myMaterial}
      position={[0, 0, 0]}
      lodDistances={[10, 25, 50, 100]}
      enableLOD={true}
    />
  )
}
```

### Hook Kullanımı

```tsx
import { useLOD } from '../../hooks/useLOD'

function MyCustomComponent() {
  const {
    currentLOD,
    distance,
    isTransitioning,
    defineLODLevels,
    updateLOD
  } = useLOD('my-asset', objectRef.current, camera)

  // LOD seviyelerini tanımla
  useEffect(() => {
    defineLODLevels(myLODLevels)
  }, [])

  return (
    <mesh ref={objectRef}>
      {/* Mesh içeriği */}
    </mesh>
  )
}
```

### Manuel LOD Yönetimi

```tsx
import { lodManager } from '../systems/lod/LODManager'
import { LODHelper } from '../systems/lod/LODHelper'

// LOD seviyelerini oluştur
const lodLevels = LODHelper.generateLODLevels(myMesh, [10, 25, 50, 100])

// LOD Manager'a kaydet
lodManager.defineLODLevels('my-asset', lodLevels)

// Mesafeye göre LOD seç
const selectedLOD = lodManager.selectLODForAsset('my-asset', distance, performanceLevel)

// LOD geçişi yap
await lodManager.transitionAssetLOD('my-asset', selectedLOD)
```

## API Referansı

### LODManager

Ana LOD yönetim sınıfı.

#### Metodlar

- `defineLODLevels(assetId: string, levels: LODLevel[])`: Asset için LOD seviyelerini tanımlar
- `selectLODForAsset(assetId: string, distance: number, performanceLevel: PerformanceLevel)`: Mesafe ve performansa göre LOD seçer
- `transitionAssetLOD(assetId: string, targetLOD: LODLevel)`: LOD geçişi yapar
- `getActiveLOD(assetId: string)`: Aktif LOD seviyesini döndürür
- `getLODStats()`: LOD istatistiklerini döndürür

### LODHelper

LOD işlemleri için yardımcı fonksiyonlar.

#### Metodlar

- `generateLODLevels(mesh: Mesh, distances: number[])`: Otomatik LOD seviyeleri oluşturur
- `createThreeLOD(levels: LODLevel[])`: Three.js LOD objesi oluşturur
- `updateMeshLOD(mesh: Mesh, lodLevel: LODLevel)`: Mesh'i LOD seviyesine göre günceller
- `calculateDistance(object: Object3D, cameraPosition: Vector3)`: Mesafe hesaplar

### useLOD Hook

React bileşenleri için LOD hook'u.

#### Parametreler

- `assetId: string`: Asset kimliği
- `object3D: Object3D | null`: 3D obje referansı
- `camera: Camera | null`: Kamera referansı
- `options: UseLODOptions`: Opsiyonel ayarlar

#### Döndürülen Değerler

- `currentLOD: LODLevel | null`: Şu anki LOD seviyesi
- `distance: number`: Kameraya olan mesafe
- `isTransitioning: boolean`: Geçiş durumu
- `triangleCount: number`: Triangle sayısı
- `defineLODLevels: (levels: LODLevel[]) => void`: LOD seviyelerini tanımlama fonksiyonu
- `updateLOD: (forceUpdate?: boolean) => void`: Manuel güncelleme fonksiyonu

## LOD Seviyeleri

Her LOD seviyesi şu özellikleri içerir:

```typescript
interface LODLevel {
  distance: number      // Mesafe eşiği
  geometry: BufferGeometry  // Geometry
  material: Material    // Material
  triangleCount: number // Triangle sayısı
  quality: number       // Kalite seviyesi (0-1)
}
```

### Kalite Seviyeleri

- **1.0**: En yüksek kalite (yakın mesafe)
- **0.75**: Yüksek kalite
- **0.5**: Orta kalite
- **0.25**: Düşük kalite (uzak mesafe)

## Performans Optimizasyonları

### Otomatik Optimizasyonlar

1. **Geometry Simplification**: Triangle sayısını azaltma
2. **Texture Optimization**: Texture kalitesini düşürme
3. **Material Simplification**: Karmaşık material özelliklerini kaldırma
4. **Visibility Culling**: Çok uzak objeleri gizleme

### Performans Seviyelerine Göre Ayarlama

- **Low Performance**: Daha erken düşük kalite LOD kullanımı
- **Medium Performance**: Dengeli LOD kullanımı
- **High Performance**: Geç düşük kalite LOD kullanımı

## Konfigürasyon

### LOD Konfigürasyonu

```typescript
interface LODConfiguration {
  levels: LODLevel[]
  transitionDistance: number  // Geçiş için minimum mesafe farkı
  hysteresis: number         // Titreme önleme değeri
}
```

### Kullanım Seçenekleri

```typescript
interface UseLODOptions {
  updateInterval?: number     // Güncelleme sıklığı (frame)
  enableAutoUpdate?: boolean  // Otomatik güncelleme
  hysteresis?: number        // Titreme önleme
  minDistance?: number       // Minimum mesafe
  maxDistance?: number       // Maksimum mesafe
}
```

## Örnekler

### Sanat Eseri LOD'u

```tsx
<PictureLOD 
  assetId="mona-lisa"
  url="assets/3D/MonaLisa/scene.gltf"
  scale={[2, 2, 2]}
  position={[0, 2, 0]}
  lodDistances={[15, 30, 60, 120]}
  metalness={0.1}
  roughness={0.8}
/>
```

### Heykel LOD'u

```tsx
<WolfLOD 
  assetId="wolf-sculpture"
  scale={[1.2, 1.2, 1.2]}
  position={[0, 0, 8]}
  lodDistances={[10, 25, 50, 100]}
/>
```

### Grup LOD'u

```tsx
<LODGroup assetId="art-collection" enableLOD={true}>
  <PictureLOD assetId="picture1" {...props1} />
  <PictureLOD assetId="picture2" {...props2} />
  <WolfLOD assetId="sculpture1" {...props3} />
</LODGroup>
```

## Debug ve Geliştirme

### Debug Bilgileri

Development modunda LOD sistemi debug bilgileri sağlar:

- LOD mesafesi
- Triangle sayısı
- Kalite seviyesi
- Geçiş durumu

### İstatistikler

```typescript
const stats = lodManager.getLODStats()
console.log({
  totalAssets: stats.totalAssets,
  activeLODs: stats.activeLODs,
  activeTransitions: stats.activeTransitions,
  averageTriangles: stats.averageTriangles
})
```

## Test Etme

```bash
# Unit testleri çalıştır
npm test src/systems/lod

# Belirli test dosyası
npm test LODManager.test.ts

# Coverage ile
npm test -- --coverage src/systems/lod
```

## Performans İpuçları

1. **LOD Mesafelerini Optimize Edin**: Sahne boyutuna göre uygun mesafeler seçin
2. **Hysteresis Kullanın**: Titreme önlemek için yeterli hysteresis değeri ayarlayın
3. **Güncelleme Sıklığını Ayarlayın**: Performansa göre updateInterval değerini optimize edin
4. **Grup LOD Kullanın**: İlişkili objeleri gruplandırarak performansı artırın
5. **Quality Threshold Ayarlayın**: Çok düşük kaliteli LOD'ları gizlemek için threshold kullanın

## Sorun Giderme

### Yaygın Sorunlar

1. **LOD Geçişleri Görünüyor**: Hysteresis değerini artırın
2. **Performans Düşük**: UpdateInterval değerini artırın
3. **Memory Leak**: Dispose işlemlerinin doğru çalıştığından emin olun
4. **LOD Seçilmiyor**: Asset ID'lerinin doğru olduğunu kontrol edin

### Debug Modunu Etkinleştirme

```tsx
// Development modunda otomatik aktif
process.env.NODE_ENV === 'development'

// Manuel debug
<LODMesh {...props} enableDebug={true} />
```