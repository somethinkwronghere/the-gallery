# Simple Asset Loader

Basitleştirilmiş asset yükleme sistemi. Karmaşık özellikler çıkarılarak temel işlevsellik korunmuştur.

## Özellikler

- ✅ **Basit API**: Minimal prop'lar ve kolay kullanım
- ✅ **Otomatik Hata Yönetimi**: Fallback URL ve retry desteği
- ✅ **Progress Tracking**: Basit yüzde ve mesaj gösterimi
- ✅ **Batch Loading**: Çoklu asset yükleme desteği
- ✅ **TypeScript**: Tam tip desteği
- ✅ **Mobile Uyumlu**: Responsive tasarım

## Temel Kullanım

### Tek Asset Yükleme

```tsx
import { SimpleAssetLoader } from '../components/SimpleAssetLoader'

<SimpleAssetLoader
  url="/assets/model.glb"
  type="model"
  fallbackUrl="/assets/fallback.glb"
  onLoad={(asset) => console.log('Yüklendi:', asset)}
  onError={(error) => console.error('Hata:', error)}
>
  {(asset, loading, error) => {
    if (loading) return <div>Yükleniyor...</div>
    if (error) return <div>Hata: {error.message}</div>
    if (asset) return <div>Asset yüklendi!</div>
    return null
  }}
</SimpleAssetLoader>
```

### Özelleştirilmiş Loader'lar

```tsx
import { SimpleModelLoader, SimpleTextureLoader, SimpleAudioLoader } from '../components/SimpleAssetLoader'

// 3D Model
<SimpleModelLoader url="/assets/model.glb">
  {(model, loading, error) => (
    loading ? <div>Model yükleniyor...</div> : <ModelViewer model={model} />
  )}
</SimpleModelLoader>

// Texture
<SimpleTextureLoader url="/assets/texture.jpg">
  {(texture, loading, error) => (
    loading ? <div>Tekstür yükleniyor...</div> : <TexturePreview texture={texture} />
  )}
</SimpleTextureLoader>

// Audio
<SimpleAudioLoader url="/assets/sound.mp3">
  {(audio, loading, error) => (
    loading ? <div>Ses yükleniyor...</div> : <AudioPlayer audio={audio} />
  )}
</SimpleAudioLoader>
```

### Batch Loading

```tsx
import { SimpleBatchLoader } from '../components/SimpleAssetLoader'

const assets = [
  { id: 'model1', url: '/assets/model1.glb', type: 'model' },
  { id: 'texture1', url: '/assets/texture1.jpg', type: 'texture' },
  { id: 'sound1', url: '/assets/sound1.mp3', type: 'audio' }
]

<SimpleBatchLoader
  assets={assets}
  showProgress={true}
  onBatchComplete={(loadedAssets) => console.log('Tüm assetler yüklendi:', loadedAssets)}
  onBatchError={(errors) => console.error('Hatalar:', errors)}
>
  {(assets, loading, errors) => {
    if (loading) return <div>Assetler yükleniyor...</div>
    
    return (
      <div>
        <div>Yüklenen: {assets.size} asset</div>
        <div>Hatalar: {errors.size} hata</div>
        {/* Asset'leri kullan */}
      </div>
    )
  }}
</SimpleBatchLoader>
```

## Hook Kullanımı

### useSimpleAssetLoader

```tsx
import { useSimpleAssetLoader } from '../components/SimpleAssetLoader'

function MyComponent() {
  const { asset, loading, error, progress, reload } = useSimpleAssetLoader(
    '/assets/model.glb',
    'model',
    {
      autoLoad: true,
      fallbackUrl: '/assets/fallback.glb',
      onLoad: (asset) => console.log('Yüklendi!'),
      onError: (error) => console.error('Hata:', error)
    }
  )

  if (loading) {
    return (
      <div>
        {progress?.message} - {progress?.percentage}%
      </div>
    )
  }

  if (error) {
    return (
      <div>
        Hata: {error.message}
        <button onClick={reload}>Tekrar Dene</button>
      </div>
    )
  }

  return <div>Asset yüklendi: {asset?.name}</div>
}
```

### Özelleştirilmiş Hook'lar

```tsx
import { 
  useSimpleModelLoader, 
  useSimpleTextureLoader, 
  useSimpleAudioLoader 
} from '../components/SimpleAssetLoader'

// Model loading
const { asset: model, loading: modelLoading } = useSimpleModelLoader('/assets/model.glb')

// Texture loading
const { asset: texture, loading: textureLoading } = useSimpleTextureLoader('/assets/texture.jpg')

// Audio loading
const { asset: audio, loading: audioLoading } = useSimpleAudioLoader('/assets/sound.mp3')
```

### Batch Loading Hook

```tsx
import { useSimpleBatchLoader } from '../components/SimpleAssetLoader'

function BatchLoadingComponent() {
  const assets = [
    { id: 'model1', url: '/assets/model1.glb', type: 'model' },
    { id: 'texture1', url: '/assets/texture1.jpg', type: 'texture' }
  ]

  const { assets: loadedAssets, loading, errors, progress, reload } = useSimpleBatchLoader(
    assets,
    {
      autoLoad: true,
      onBatchComplete: (assets) => console.log('Batch tamamlandı:', assets),
      onBatchError: (errors) => console.error('Batch hataları:', errors)
    }
  )

  return (
    <div>
      <div>Progress: {progress.loaded}/{progress.total} ({progress.percentage}%)</div>
      {loading && <div>Yükleniyor...</div>}
      {errors.size > 0 && <div>Hatalar var: {errors.size}</div>}
      <button onClick={reload}>Yeniden Yükle</button>
    </div>
  )
}
```

## API Referansı

### SimpleAssetLoader Props

| Prop | Tip | Varsayılan | Açıklama |
|------|-----|------------|----------|
| `url` | `string` | - | Asset URL'i |
| `type` | `AssetType` | - | Asset tipi ('model', 'texture', 'audio') |
| `children` | `function` | - | Render function (asset, loading, error) => ReactNode |
| `fallbackUrl` | `string?` | - | Hata durumunda denenen URL |
| `onLoad` | `function?` | - | Yükleme tamamlandığında çağrılan callback |
| `onError` | `function?` | - | Hata oluştuğunda çağrılan callback |
| `className` | `string?` | `''` | CSS class |

### SimpleBatchLoader Props

| Prop | Tip | Varsayılan | Açıklama |
|------|-----|------------|----------|
| `assets` | `BatchAsset[]` | - | Yüklenecek asset listesi |
| `children` | `function` | - | Render function (assets, loading, errors) => ReactNode |
| `onBatchComplete` | `function?` | - | Batch tamamlandığında çağrılan callback |
| `onBatchError` | `function?` | - | Batch hatası oluştuğunda çağrılan callback |
| `showProgress` | `boolean?` | `true` | Progress bar gösterilsin mi |
| `className` | `string?` | `''` | CSS class |

### BatchAsset

```typescript
interface BatchAsset {
  id: string          // Benzersiz asset ID'si
  url: string         // Asset URL'i
  type: AssetType     // Asset tipi
  fallbackUrl?: string // Opsiyonel fallback URL
}
```

## Eski Sistemden Geçiş

### EnhancedAssetLoader → SimpleAssetLoader

```tsx
// ESKİ
<EnhancedAssetLoader
  url="/assets/model.glb"
  type="model"
  showProgress={true}
  showPlaceholder={true}
  retryCount={3}
  retryDelay={1000}
  fallbackUrl="/assets/fallback.glb"
>
  {(asset, loading, error) => (
    // render logic
  )}
</EnhancedAssetLoader>

// YENİ
<SimpleAssetLoader
  url="/assets/model.glb"
  type="model"
  fallbackUrl="/assets/fallback.glb"
>
  {(asset, loading, error) => (
    // aynı render logic
  )}
</SimpleAssetLoader>
```

### useAssetLoading → useSimpleAssetLoader

```tsx
// ESKİ
const { asset, error, loading, progress, reload } = useAssetLoading(url, type, true)

// YENİ
const { asset, error, loading, progress, reload } = useSimpleAssetLoader(url, type, {
  autoLoad: true
})
```

## Performans İpuçları

1. **Batch Loading Kullanın**: Çoklu asset için SimpleBatchLoader kullanın
2. **Fallback URL'ler**: Kritik assetler için fallback URL tanımlayın
3. **Progress Tracking**: Büyük dosyalar için progress gösterimi aktif edin
4. **Error Handling**: onError callback'leri ile hata durumlarını yönetin

## Sınırlamalar

- Retry mekanizması basitleştirildi (otomatik 1 kez deneme)
- Progress tracking sadece yüzde ve mesaj gösterir
- Placeholder'lar emoji tabanlı (daha basit)
- Batch loading sıralı değil paralel çalışır

Bu basitleştirmeler performansı artırır ve kod karmaşıklığını azaltır.