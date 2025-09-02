# SimpleErrorHandler - Basit Hata Yönetimi Sistemi

SimpleErrorHandler, mevcut karmaşık ErrorRecoveryManager sistemini basitleştiren kullanıcı dostu bir hata yönetimi utility'sidir.

## Özellikler

- ✅ **Basit API**: Karmaşık hata yönetimini tek satırda halledin
- ✅ **Otomatik Kurtarma**: Hataları otomatik olarak düzeltmeye çalışır
- ✅ **Kullanıcı Dostu Mesajlar**: Anlaşılır Türkçe hata mesajları
- ✅ **Try-Catch Wrapper'ları**: Güvenli fonksiyon çalıştırma
- ✅ **React Hook Desteği**: React bileşenlerinde kolay kullanım
- ✅ **Toast Bildirimleri**: Otomatik görsel geri bildirim
- ✅ **Sistem Sağlık Kontrolü**: Genel sistem durumu izleme

## Hızlı Başlangıç

### 1. Temel Kullanım

```typescript
import { simpleErrorHandler } from '../utils/SimpleErrorHandler';

// Basit hata yakalama
const result = await simpleErrorHandler.handleError(
  'Bir şeyler ters gitti',
  'loading',
  { showToUser: true, autoRecover: true }
);

if (result.success) {
  console.log('Hata düzeltildi!');
}
```

### 2. React Hook ile Kullanım

```typescript
import { useSimpleErrorHandler } from '../hooks/useSimpleErrorHandler';

function MyComponent() {
  const { handleError, safeExecute, showMessage } = useSimpleErrorHandler();

  const loadData = async () => {
    const data = await safeExecute(
      () => fetch('/api/data').then(r => r.json()),
      null, // fallback değeri
      'network' // hata tipi
    );

    if (data) {
      showMessage('Veri yüklendi!', 'info');
    }
  };

  return <button onClick={loadData}>Veri Yükle</button>;
}
```

## API Referansı

### SimpleErrorHandler Sınıfı

#### `handleError(error, type?, options?)`

Ana hata yakalama metodu.

```typescript
await simpleErrorHandler.handleError(
  new Error('Dosya bulunamadı'),
  'loading',
  {
    showToUser: true,      // Kullanıcıya mesaj göster
    autoRecover: true,     // Otomatik kurtarma dene
    fallbackMessage: 'Özel mesaj',
    retryCount: 0
  }
);
```

**Parametreler:**
- `error`: Error | string - Hata objesi veya mesajı
- `type`: SimpleErrorType - Hata tipi ('loading', 'network', 'memory', 'graphics', 'performance', 'unknown')
- `options`: SimpleErrorOptions - Opsiyonel ayarlar

#### `handleAssetError(assetId, url, error, options?)`

Asset yükleme hatalarını yakalar.

```typescript
await simpleErrorHandler.handleAssetError(
  'model-1',
  '/models/artwork.glb',
  new Error('404 Not Found')
);
```

#### `handleNetworkError(url, error, options?)`

Network hatalarını yakalar.

```typescript
await simpleErrorHandler.handleNetworkError(
  'https://api.example.com/data',
  new Error('Timeout')
);
```

#### `handleMemoryError(currentUsage, options?)`

Memory hatalarını yakalar.

```typescript
await simpleErrorHandler.handleMemoryError(1024); // 1GB
```

#### `safeExecute(operation, fallback?, errorType?)`

Güvenli fonksiyon çalıştırma.

```typescript
const result = await simpleErrorHandler.safeExecute(
  async () => {
    // Riskli işlem
    return await fetch('/api/data').then(r => r.json());
  },
  { default: 'data' }, // fallback
  'network' // hata tipi
);
```

#### `showUserMessage(message, level?, duration?)`

Kullanıcıya toast mesajı gösterir.

```typescript
simpleErrorHandler.showUserMessage(
  'İşlem tamamlandı!',
  'info',    // 'info' | 'warning' | 'error' | 'critical'
  3000       // süre (ms)
);
```

#### `getSystemHealth()`

Sistem sağlık durumunu döndürür.

```typescript
const health = simpleErrorHandler.getSystemHealth();
console.log(health.healthy); // boolean
console.log(health.issues);  // string[]
console.log(health.recommendations); // string[]
```

### useSimpleErrorHandler Hook

React bileşenlerinde kullanım için hook.

```typescript
const {
  handleError,
  handleAssetError,
  handleNetworkError,
  handleMemoryError,
  safeExecute,
  showMessage,
  systemHealth,
  wrapAsync,
  wrapSync,
  isHandlingError,
  lastError
} = useSimpleErrorHandler();
```

#### Ek Hook Özellikleri

**`wrapAsync(fn, errorType?)`** - Async fonksiyonu güvenli hale getirir:

```typescript
const safeApiCall = wrapAsync(
  async (id: string) => {
    const response = await fetch(`/api/users/${id}`);
    return response.json();
  },
  'network'
);

const user = await safeApiCall('123'); // Hata durumunda undefined döner
```

**`wrapSync(fn, errorType?)`** - Sync fonksiyonu güvenli hale getirir:

```typescript
const safeJsonParse = wrapSync(
  (data: string) => JSON.parse(data),
  'unknown'
);

const parsed = safeJsonParse('invalid json'); // Hata durumunda undefined döner
```

## Hata Tipleri

| Tip | Açıklama | Örnek Kullanım |
|-----|----------|----------------|
| `loading` | Asset/dosya yükleme hataları | Model, texture, ses dosyası yükleme |
| `network` | Ağ bağlantı hataları | API çağrıları, fetch istekleri |
| `memory` | Bellek sorunları | Yüksek RAM kullanımı |
| `graphics` | WebGL/grafik hataları | Context loss, shader hataları |
| `performance` | Performans sorunları | Düşük FPS, donma |
| `unknown` | Bilinmeyen hatalar | Genel catch blokları |

## Hata Seviyeleri

| Seviye | Renk | Kullanım |
|--------|------|----------|
| `info` | Mavi | Bilgilendirme mesajları |
| `warning` | Turuncu | Uyarı mesajları |
| `error` | Kırmızı | Hata mesajları |
| `critical` | Koyu kırmızı | Kritik sistem hataları |

## Örnekler

### 1. Asset Yükleme ile Hata Yakalama

```typescript
import { useAssetWithErrorHandling } from '../hooks/useSimpleErrorHandler';

function ArtworkComponent({ artworkUrl }: { artworkUrl: string }) {
  const { loadAsset, loading, error } = useAssetWithErrorHandling();

  useEffect(() => {
    loadAsset('artwork-1', artworkUrl, async (url) => {
      const loader = new GLTFLoader();
      return loader.loadAsync(url);
    });
  }, [artworkUrl]);

  if (loading) return <div>Yükleniyor...</div>;
  if (error) return <div>Hata: {error}</div>;
  
  return <div>Artwork yüklendi!</div>;
}
```

### 2. Network İstekleri ile Hata Yakalama

```typescript
import { useNetworkWithErrorHandling } from '../hooks/useSimpleErrorHandler';

function DataComponent() {
  const { request, loading } = useNetworkWithErrorHandling();

  const fetchUserData = async () => {
    const userData = await request<User>('/api/user/profile');
    if (userData) {
      console.log('User data:', userData);
    }
    // Hata durumunda otomatik olarak yakalanır ve kullanıcıya gösterilir
  };

  return (
    <button onClick={fetchUserData} disabled={loading}>
      {loading ? 'Yükleniyor...' : 'Kullanıcı Verilerini Getir'}
    </button>
  );
}
```

### 3. Genel Hata Yakalama

```typescript
import { useErrorBoundary } from '../hooks/useSimpleErrorHandler';

function App() {
  useErrorBoundary(); // Global hata yakalama aktif

  return (
    <div>
      {/* Uygulamanız */}
    </div>
  );
}
```

### 4. Manuel Hata Yönetimi

```typescript
function FileUploadComponent() {
  const { handleError, showMessage } = useSimpleErrorHandler();

  const uploadFile = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      showMessage('Dosya başarıyla yüklendi!', 'info');
    } catch (error) {
      await handleError(error as Error, 'network', {
        showToUser: true,
        autoRecover: false // Upload işlemi için otomatik retry istemiyoruz
      });
    }
  };

  return (
    <input 
      type="file" 
      onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
    />
  );
}
```

## Mevcut Sistemle Entegrasyon

SimpleErrorHandler, mevcut ErrorRecoveryManager sisteminin üzerine kurulmuştur. Bu sayede:

- ✅ Mevcut error recovery stratejileri korunur
- ✅ WebGL context loss handling devam eder
- ✅ Memory management otomatik çalışır
- ✅ Fallback asset sistemi aktif kalır

## Performans

SimpleErrorHandler minimal performans etkisi yaratır:

- Singleton pattern ile tek instance
- Lazy loading ile ihtiyaç anında yükleme
- Throttled toast mesajları
- Efficient DOM manipulation

## Tarayıcı Desteği

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Gelişmiş Kullanım

### Özel Hata Tipleri

```typescript
// Özel hata tipi tanımlama
declare module '../utils/SimpleErrorHandler' {
  interface SimpleErrorType {
    'custom-api': 'custom-api';
  }
}

// Kullanım
await handleError('API hatası', 'custom-api' as any);
```

### Özel Recovery Stratejileri

```typescript
// Mevcut ErrorRecoveryManager'a özel strateji ekleme
import { errorRecoveryManager } from '../systems/error/ErrorRecoveryManager';

errorRecoveryManager.executeRecoveryStrategy = async (strategy, context) => {
  if (strategy === 'custom-recovery') {
    // Özel kurtarma mantığı
    return { success: true, strategy, message: 'Custom recovery', timestamp: new Date() };
  }
  // Varsayılan davranış
  return originalExecuteRecoveryStrategy(strategy, context);
};
```

## Sorun Giderme

### Toast Mesajları Görünmüyor

```typescript
// Toast container'ın oluşturulduğundan emin olun
const container = document.getElementById('simple-error-toasts');
if (!container) {
  console.warn('Toast container not found');
}
```

### Hata Yakalama Çalışmıyor

```typescript
// ErrorRecoveryProvider'ın App'i sardığından emin olun
function App() {
  return (
    <ErrorRecoveryProvider>
      <YourComponents />
    </ErrorRecoveryProvider>
  );
}
```

### Memory Leak Uyarıları

```typescript
// Component unmount'ta cleanup yapın
useEffect(() => {
  return () => {
    // Cleanup işlemleri
  };
}, []);
```

## Katkıda Bulunma

1. Yeni hata tipleri eklerken type safety'yi koruyun
2. User-friendly Türkçe mesajlar kullanın
3. Test coverage'ı %80'in üzerinde tutun
4. Performance impact'i minimize edin

## Lisans

Bu proje MIT lisansı altında lisanslanmıştır.