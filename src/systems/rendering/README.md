# Rendering System

Bu modül, dijital müze projesinin rendering optimizasyonlarını içerir. Frustum culling, render queue yönetimi ve instancing sistemlerini kapsar.

## Bileşenler

### CullingManager
Görünmeyen objeleri render etmemek için culling işlemlerini yönetir.

**Özellikler:**
- Frustum culling
- Occlusion culling  
- Distance culling
- Performans istatistikleri

### RenderQueue
Render edilecek objeleri optimize ederek batch'ler halinde organize eder.

**Özellikler:**
- Batch rendering
- Material bazlı sıralama
- Mesafe bazlı sıralama
- Draw call optimizasyonu

### InstanceManager ⭐ (Yeni)
Aynı modellerin birden fazla kopyasını verimli bir şekilde render etmek için instancing sistemini yönetir.

**Özellikler:**
- Instance group yönetimi
- Object pooling pattern
- Otomatik matrix güncellemeleri
- Frustum culling desteği
- Draw call optimizasyonu

## Instancing Sistemi Kullanımı

### Temel Kullanım

```typescript
import { useInstancing } from '../../hooks/useInstancing'
import { Mesh, BoxGeometry, MeshBasicMaterial, Vector3, Euler } from 'three'

const MyComponent = () => {
  const instancing = useInstancing({
    config: {
      maxInstancesPerGroup: 100,
      enableObjectPooling: true,
      autoUpdateMatrices: true,
      frustumCulling: true
    }
  })

  useEffect(() => {
    // Orijinal mesh oluştur
    const geometry = new BoxGeometry(1, 1, 1)
    const material = new MeshBasicMaterial({ color: 0xff0000 })
    const originalMesh = new Mesh(geometry, material)

    // Instance group oluştur
    const groupId = instancing.createInstanceGroup(originalMesh, 50)

    // Birden fazla instance oluştur
    const instances = [
      { position: new Vector3(0, 0, 0), rotation: new Euler(0, 0, 0) },
      { position: new Vector3(2, 0, 0), rotation: new Euler(0, Math.PI/2, 0) },
      { position: new Vector3(4, 0, 0), rotation: new Euler(0, Math.PI, 0) }
    ]

    const instanceIds = instancing.createMultipleInstances(groupId, instances)

    // Cleanup
    return () => {
      instancing.removeInstanceGroup(groupId)
    }
  }, [])

  return null
}
```

### InstancedMeshWrapper Kullanımı

```typescript
import InstancedMeshWrapper from '../components/Art/InstancedMeshWrapper'

const ArtGallery = () => {
  const [originalMesh, setOriginalMesh] = useState<Mesh | null>(null)

  const instanceData = [
    { position: new Vector3(-5, 0, 0), scale: new Vector3(0.5, 0.5, 0.5) },
    { position: new Vector3(0, 0, 0), scale: new Vector3(1, 1, 1) },
    { position: new Vector3(5, 0, 0), scale: new Vector3(1.5, 1.5, 1.5) }
  ]

  return (
    <>
      {originalMesh && (
        <InstancedMeshWrapper
          originalMesh={originalMesh}
          maxInstances={100}
          instances={instanceData}
          onInstancesCreated={(groupId, instanceIds) => {
            console.log(`Created ${instanceIds.length} instances`)
          }}
        />
      )}
    </>
  )
}
```

### Performans İstatistikleri

```typescript
const stats = instancing.getStats()
console.log({
  totalGroups: stats.totalGroups,
  totalInstances: stats.totalInstances,
  visibleInstances: stats.visibleInstances,
  drawCallsSaved: stats.drawCallsSaved,
  memoryUsage: stats.memoryUsage
})
```

## Entegrasyon

### Mevcut Art Bileşenleriyle Entegrasyon

```typescript
// ArtInstanced.tsx - Instancing destekli Art bileşeni
import { useInstancing } from '../../hooks/useInstancing'

const ArtInstanced = () => {
  const instancing = useInstancing()

  // Dekoratif elementler için instancing kullan
  useEffect(() => {
    // Küçük dekoratif objeler için instance group oluştur
    const groupId = instancing.createInstanceGroup(decorativeMesh, 20)
    
    // Galeri köşelerine dekoratif elementler yerleştir
    const decorativePositions = [
      { position: new Vector3(-30, 2, -10) },
      { position: new Vector3(30, 2, -10) },
      { position: new Vector3(-30, 2, 35) },
      { position: new Vector3(30, 2, 35) }
    ]

    instancing.createMultipleInstances(groupId, decorativePositions)
  }, [])

  return (
    <>
      {/* Mevcut art bileşenleri */}
      <Picture url="assets/3D/Portrait/scene.gltf" ... />
      <Wolf ... />
      <Globe ... />
    </>
  )
}
```

## Performans Faydaları

### Draw Call Optimizasyonu
- **Öncesi:** 100 aynı obje = 100 draw call
- **Sonrası:** 100 aynı obje = 1 draw call (instancing ile)

### Bellek Optimizasyonu
- Geometry ve material paylaşımı
- Instance matrix'leri için optimize edilmiş bellek kullanımı
- Object pooling ile bellek fragmentasyonu önleme

### CPU Optimizasyonu
- Batch rendering ile CPU overhead azaltma
- Frustum culling ile görünmeyen instance'ları atlama
- Otomatik matrix güncellemeleri

## Konfigürasyon Seçenekleri

```typescript
interface InstanceManagerConfig {
  maxInstancesPerGroup: number      // Grup başına maksimum instance sayısı
  enableObjectPooling: boolean      // Object pooling aktif/pasif
  autoUpdateMatrices: boolean       // Otomatik matrix güncellemesi
  frustumCulling: boolean          // Frustum culling aktif/pasif
  updateFrequency: number          // Güncelleme frekansı (frame)
}
```

## Test Edilmiş Senaryolar

1. ✅ Instance group oluşturma ve silme
2. ✅ Birden fazla instance oluşturma
3. ✅ Instance transform güncellemeleri
4. ✅ Görünürlük kontrolü
5. ✅ Object pooling
6. ✅ Performans istatistikleri
7. ✅ Frustum culling entegrasyonu

## Gelecek Geliştirmeler

- [ ] GPU-based culling
- [ ] Hierarchical instancing
- [ ] Animation support for instances
- [ ] Dynamic LOD per instance
- [ ] Occlusion culling for instances

## Örnek Projeler

- `src/examples/InstancedArtExample.tsx` - Temel instancing örneği
- `src/components/Art/ArtInstanced.tsx` - Galeri entegrasyonu örneği