# Unified Loading System

Bu modül, dijital müze projesinin tüm yükleme durumlarını tek bir sistemde birleştiren UnifiedLoading sistemini içerir. Eski loading bileşenleri (Loading, LoadingScreen, LoadingTransition, LoadingIndicator) artık bu unified sistem üzerinden çalışır.

## 🎯 Unified Loading System

### Temel Özellikler
- **Tek Merkezi Sistem**: Tüm loading durumları tek yerde yönetilir
- **Otomatik THREE.js Entegrasyonu**: THREE.DefaultLoadingManager ile otomatik senkronizasyon
- **Çoklu Loading Türü**: Asset, Scene, Teleport ve General loading desteği
- **Gerçek Zamanlı Progress**: Global ve bireysel progress tracking
- **Hata Yönetimi**: Otomatik error handling ve retry mekanizması
- **Backward Compatibility**: Mevcut bileşenlerle tam uyumluluk

### Hızlı Başlangıç

```tsx
import { UnifiedLoading, useUnifiedLoading } from '../components/Loading'

// Temel kullanım
function App() {
  return (
    <div>
      <YourAppContent />
      <UnifiedLoading />
    </div>
  )
}

// Hook ile kontrol
function YourComponent() {
  const { startLoading, updateProgress, completeLoading } = useUnifiedLoading()
  
  const loadAsset = async () => {
    startLoading('my-asset', 'asset', '3D Model yükleniyor...', 'model')
    // ... loading logic
    updateProgress('my-asset', 50, 'parsing')
    // ... complete
    completeLoading('my-asset')
  }
}
```

## Özellikler

### 1. Loading Indicators
- **Linear Progress Bar**: Çizgisel ilerleme göstergesi
- **Circular Progress**: Dairesel ilerleme göstergesi  
- **Dots Animation**: Nokta animasyonlu yükleme göstergesi
- Farklı boyutlar (small, medium, large)
- Aşama gösterimi (downloading, parsing, processing, complete)
- Yüzde gösterimi

### 2. Asset Placeholders
- Asset tipine göre özelleştirilmiş placeholder'lar
- Model, texture, audio için farklı ikonlar
- Hata durumları için özel görünüm
- Tıklanabilir placeholder'lar
- Yükleme animasyonları

### 3. Loading Manager
- Global yükleme durumu yönetimi
- Bireysel asset progress takibi
- Hata yönetimi ve retry mekanizması
- Batch loading desteği
- Context-based state management

### 4. Loading Transitions
- Smooth fade in/out geçişleri
- Slide ve scale animasyonları
- Configurable duration ve easing
- Reduced motion desteği

### 5. Enhanced Asset Loader
- Otomatik retry mekanizması
- Fallback URL desteği
- Progress tracking
- Error handling
- Specialized loaders (Model, Texture, Audio)

### 6. Loading Screen
- Full-screen loading deneyimi
- Logo ve branding desteği
- Loading tips sistemi
- Progress gösterimi
- Smooth exit animasyonları

## Kullanım

### Temel Loading Indicator

```tsx
import { LoadingIndicator } from '../components/Loading'

<LoadingIndicator
  progress={{
    assetId: 'model1',
    loaded: 0.7,
    total: 1,
    percentage: 70,
    stage: 'processing'
  }}
  variant="linear"
  size="medium"
  showPercentage={true}
  showStage={true}
/>
```

### Asset Placeholder

```tsx
import { AssetPlaceholder } from '../components/Loading'

<AssetPlaceholder
  type="model"
  size="medium"
  message="3D Model yükleniyor..."
  onClick={() => retryLoading()}
/>
```

### Enhanced Asset Loader

```tsx
import { EnhancedAssetLoader } from '../components/Loading'

<EnhancedAssetLoader
  url="/assets/model.glb"
  type="model"
  fallbackUrl="/assets/fallback.glb"
  retryCount={3}
  showProgress={true}
  onLoad={(asset) => console.log('Loaded:', asset)}
  onError={(error) => console.error('Error:', error)}
>
  {(asset, loading, error) => (
    <div>
      {asset && <Model3D data={asset.data} />}
      {loading && <div>Yükleniyor...</div>}
      {error && <div>Hata: {error.message}</div>}
    </div>
  )}
</EnhancedAssetLoader>
```

### Loading Manager

```tsx
import { LoadingManager, useLoadingManager } from '../components/Loading'

function App() {
  return (
    <LoadingManager
      showGlobalProgress={true}
      onLoadingComplete={(assets) => console.log('Complete:', assets)}
    >
      <YourAppContent />
    </LoadingManager>
  )
}

function YourComponent() {
  const { registerLoading, updateProgress, completeLoading } = useLoadingManager()
  
  // Asset yükleme işlemi
  const loadAsset = async () => {
    registerLoading('asset1', 'model', '/path/to/asset')
    // ... yükleme işlemi
    updateProgress('asset1', { percentage: 50, stage: 'processing' })
    // ... işlem tamamlandı
    completeLoading('asset1')
  }
}
```

### Batch Asset Loader

```tsx
import { BatchAssetLoader } from '../components/Loading'

<BatchAssetLoader
  assets={[
    { id: 'model1', url: '/assets/model1.glb', type: 'model' },
    { id: 'texture1', url: '/assets/texture1.jpg', type: 'texture' }
  ]}
  showGlobalProgress={true}
  onBatchComplete={(assets) => console.log('All loaded:', assets)}
>
  {(assets, loading, errors) => (
    <div>
      {loading ? 'Yükleniyor...' : `${assets.size} asset yüklendi`}
      {errors.size > 0 && <div>Hatalar: {errors.size}</div>}
    </div>
  )}
</BatchAssetLoader>
```

### Loading Screen

```tsx
import { LoadingScreen } from '../components/Loading'

<LoadingScreen
  visible={isInitialLoading}
  title="Dijital Müze"
  subtitle="Sanat eserleri yükleniyor..."
  progress={globalProgress}
  showTips={true}
  tips={[
    'WASD tuşları ile hareket edebilirsiniz',
    'Mouse ile etrafınıza bakabilirsiniz'
  ]}
  onComplete={() => setInitialLoading(false)}
/>
```

### Loading Transitions

```tsx
import { LoadingTransition, SmoothTransition } from '../components/Loading'

<LoadingTransition
  loading={isLoading}
  fadeIn={true}
  slideIn={true}
  duration={300}
  fallback={<AssetPlaceholder type="model" />}
>
  <YourContent />
</LoadingTransition>

// Veya önceden yapılandırılmış geçiş
<SmoothTransition
  loading={isLoading}
  fallback={<div>Yükleniyor...</div>}
>
  <YourContent />
</SmoothTransition>
```

### Custom Hooks

```tsx
import { useLoadingStates, useAssetLoading } from '../components/Loading'

// Global loading state yönetimi
function useAppLoading() {
  const {
    globalProgress,
    isLoading,
    startLoading,
    completeLoading
  } = useLoadingStates({
    onAllComplete: () => {
      console.log('Tüm yükleme işlemleri tamamlandı')
    }
  })
  
  return { globalProgress, isLoading, startLoading, completeLoading }
}

// Specific asset loading
function useModel(url: string) {
  const { asset, loading, error, reload } = useAssetLoading(url, 'model', true)
  
  return { model: asset, loading, error, reload }
}
```

## Konfigürasyon

### Loading Manager Options

```tsx
interface LoadingManagerOptions {
  showGlobalProgress?: boolean      // Global progress göster
  showIndividualProgress?: boolean  // Bireysel progress göster
  autoHideDelay?: number           // Otomatik gizleme gecikmesi
  onLoadingComplete?: (assets: string[]) => void
  onLoadingError?: (error: Error, assetId: string) => void
}
```

### Asset Loader Options

```tsx
interface AssetLoaderOptions {
  retryCount?: number        // Yeniden deneme sayısı
  retryDelay?: number       // Yeniden deneme gecikmesi
  showProgress?: boolean    // Progress göster
  showPlaceholder?: boolean // Placeholder göster
  fallbackUrl?: string     // Fallback URL
}
```

## Styling

Tüm bileşenler CSS custom properties kullanarak özelleştirilebilir:

```css
.loading-indicator {
  --transition-duration: 300ms;
  --transition-easing: ease-out;
  --primary-color: #4CAF50;
  --background-color: #f5f5f5;
}
```

## Accessibility

- ARIA labels ve roles
- Keyboard navigation desteği
- Screen reader uyumluluğu
- Reduced motion desteği
- High contrast mode desteği

## Performance

- Hardware acceleration
- Efficient re-renders
- Memory leak prevention
- Automatic cleanup
- Optimized animations

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers
- Progressive enhancement
- Graceful degradation

## Requirements Karşılama

Bu implementasyon aşağıdaki requirement'ları karşılar:

- **4.1**: Progress bar ile asset loading durumu gösterimi ✅
- **4.2**: Placeholder sistemi ve missing asset fallback'leri ✅
- **4.1**: Smooth loading transitions ve user feedback ✅
- **4.2**: Progressive loading ve user feedback mekanizmaları ✅
## 🔄 
Migration Guide

### Eski Sistemden Geçiş

```tsx
// ESKİ: Loading component
import Loading from './Loading'
<Loading />

// YENİ: Aynı görünüm, unified sistem
import { Loading } from './Loading'
<Loading />  // Otomatik olarak UnifiedLoading kullanır

// ESKİ: useLoadingStates hook
const { startLoading, updateProgress } = useLoadingStates()

// YENİ: useUnifiedLoading hook
const { startLoading, updateProgress } = useUnifiedLoading()

// ESKİ: AssetPlaceholder
<AssetPlaceholder type="model" message="Yükleniyor..." />

// YENİ: Migration utility ile entegrasyon
const adapter = createAssetPlaceholderAdapter('model', url)
adapter.startLoading('3D Model yükleniyor...')
```

### Migration Utilities

```tsx
import LoadingMigrationUtils from './LoadingMigrationUtils'

// Legacy Loading adapter
const legacyAdapter = LoadingMigrationUtils.createLegacyLoadingAdapter()
legacyAdapter.onStart()
legacyAdapter.onProgress(5, 10)
legacyAdapter.onComplete()

// Teleport loading adapter
const teleportAdapter = LoadingMigrationUtils.createTeleportLoadingAdapter()
teleportAdapter.startTeleport('Ana Salon')
teleportAdapter.completeTeleport()

// Async operation wrapper
LoadingMigrationUtils.withUnifiedLoading(
  async () => await someAsyncOperation(),
  'operation-id',
  'İşlem gerçekleştiriliyor...'
)
```

## 📋 API Reference

### UnifiedLoading Component

```tsx
interface UnifiedLoadingProps {
  showGlobalProgress?: boolean     // Global progress bar göster (default: true)
  showIndividualItems?: boolean    // Bireysel loading items göster (default: true)
  showMessages?: boolean           // Loading mesajları göster (default: true)
  autoHide?: boolean              // Otomatik gizleme (default: true)
  hideDelay?: number              // Gizleme gecikmesi ms (default: 1000)
  className?: string              // Ek CSS class
  style?: React.CSSProperties     // Inline styles
}
```

### useUnifiedLoading Hook

```tsx
const {
  loadingStates,    // Map<string, UnifiedLoadingState>
  globalProgress,   // number (0-100)
  isLoading,        // boolean
  startLoading,     // (id, type, message, assetType?) => void
  updateProgress,   // (id, progress, stage?) => void
  completeLoading,  // (id) => void
  errorLoading,     // (id, error) => void
  clearLoading,     // (id) => void
  clearAllLoading   // () => void
} = useUnifiedLoading()
```

### Loading State Interface

```tsx
interface UnifiedLoadingState {
  id: string                                    // Unique identifier
  type: 'asset' | 'scene' | 'teleport' | 'general'  // Loading türü
  assetType?: AssetType                        // Asset tipi (model, texture, etc.)
  message: string                              // Kullanıcı mesajı
  progress: number                             // Progress (0-100)
  stage: 'downloading' | 'parsing' | 'processing' | 'complete'  // Aşama
  startTime: number                            // Başlangıç zamanı
  error?: Error                                // Hata (varsa)
}
```

## 🎨 Styling

### CSS Custom Properties

```css
.unified-loading {
  --loading-bg: rgba(0, 0, 0, 0.9);
  --loading-text: white;
  --progress-color: linear-gradient(90deg, #4CAF50, #8BC34A);
  --item-bg: rgba(255, 255, 255, 0.1);
  --error-color: #F44336;
}
```

### Responsive Design

```css
/* Mobile optimizations */
@media (max-width: 768px) {
  .unified-loading__title { font-size: 2rem; }
  .unified-loading__progress-container { width: 250px; }
  .loading-item { padding: 0.5rem; }
}
```

## 🔧 Advanced Usage

### Custom Loading Types

```tsx
// Özel loading türü tanımlama
startLoading('custom-operation', 'general', 'Özel işlem yapılıyor...')

// Asset loading with specific type
startLoading('model-123', 'asset', '3D Model yükleniyor...', 'model')

// Scene loading
startLoading('scene-main', 'scene', 'Ana sahne hazırlanıyor...')

// Teleport loading
startLoading('teleport-hall', 'teleport', 'Ana salona teleport ediliyor...')
```

### Batch Operations

```tsx
// Birden fazla asset yükleme
const assets = ['model1.glb', 'texture1.jpg', 'sound1.mp3']

assets.forEach((asset, index) => {
  const id = `batch-${index}`
  startLoading(id, 'asset', `${asset} yükleniyor...`)
  
  // Simulate loading
  setTimeout(() => completeLoading(id), 1000 * (index + 1))
})
```

### Error Handling

```tsx
try {
  startLoading('risky-operation', 'general', 'Riskli işlem...')
  await riskyAsyncOperation()
  completeLoading('risky-operation')
} catch (error) {
  errorLoading('risky-operation', error)
}
```

## 🧪 Testing

### Unit Tests

```tsx
import { render, screen } from '@testing-library/react'
import { UnifiedLoading, unifiedLoadingManager } from './UnifiedLoading'

test('shows loading when active', () => {
  unifiedLoadingManager.startLoading('test', 'general', 'Test loading...')
  render(<UnifiedLoading />)
  
  expect(screen.getByText('Digistory')).toBeInTheDocument()
  expect(screen.getByText('Test loading...')).toBeInTheDocument()
})
```

### Integration Tests

```tsx
test('integrates with THREE.js DefaultLoadingManager', () => {
  setupThreeJSIntegration()
  
  // Simulate THREE.js loading
  THREE.DefaultLoadingManager.onStart?.('test.glb', 0, 1)
  THREE.DefaultLoadingManager.onProgress?.('test.glb', 1, 1)
  THREE.DefaultLoadingManager.onLoad?.()
  
  // Verify unified loading manager state
  expect(unifiedLoadingManager.isLoading).toBe(false)
})
```

## 📊 Performance

### Optimizations
- **Efficient Re-renders**: Sadece gerekli durumlarda component re-render
- **Memory Management**: Otomatik cleanup ve memory leak prevention
- **Smooth Animations**: Hardware-accelerated CSS transitions
- **Debounced Updates**: Rapid progress updates için debouncing

### Monitoring

```tsx
// Performance monitoring
const { loadingStates } = useUnifiedLoading()

useEffect(() => {
  const activeLoads = Array.from(loadingStates.values())
  console.log(`Active loads: ${activeLoads.length}`)
  
  activeLoads.forEach(state => {
    const duration = Date.now() - state.startTime
    if (duration > 5000) {
      console.warn(`Long loading detected: ${state.id} (${duration}ms)`)
    }
  })
}, [loadingStates])
```

## 🎯 Requirements Compliance

Bu unified sistem aşağıdaki requirement'ları karşılar:

### Requirement 3.1: Kullanıcı Deneyimi Basitleştirmeleri
- ✅ **Basit loading ekranı**: Tek, tutarlı loading interface
- ✅ **Smooth geçişler**: Hardware-accelerated transitions
- ✅ **Otomatik kaydetme**: Loading states otomatik yönetilir

### Backward Compatibility
- ✅ **Mevcut bileşenler**: Loading, AssetPlaceholder, EnhancedAssetLoader çalışmaya devam eder
- ✅ **Hook uyumluluğu**: useLoadingStates hook hala kullanılabilir
- ✅ **THREE.js entegrasyonu**: DefaultLoadingManager otomatik entegre

### Performance Benefits
- ✅ **Tek sistem**: Çoklu loading sistemleri yerine tek merkezi sistem
- ✅ **Bellek optimizasyonu**: Otomatik cleanup ve state management
- ✅ **Render optimizasyonu**: Efficient re-rendering strategies

## 🔍 Troubleshooting

### Common Issues

**Loading görünmüyor:**
```tsx
// UnifiedLoading component'ini render etmeyi unutmayın
<UnifiedLoading />

// Veya THREE.js entegrasyonunu kurun
setupThreeJSIntegration()
```

**Progress güncellenmiyor:**
```tsx
// Doğru ID kullandığınızdan emin olun
startLoading('my-id', 'asset', 'Loading...')
updateProgress('my-id', 50)  // Aynı ID
```

**Memory leaks:**
```tsx
// Component unmount'ta cleanup yapın
useEffect(() => {
  return () => {
    clearAllLoading()
  }
}, [])
```

## 📚 Examples

Detaylı kullanım örnekleri için `UnifiedLoadingExample.tsx` dosyasına bakın.

---

**Not**: Bu unified sistem, mevcut tüm loading bileşenlerini tek çatı altında toplar ve gelecekteki genişletmeler için sağlam bir temel oluşturur. Eski API'ler backward compatibility için korunmuştur.