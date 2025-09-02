# Simple Settings Panel

Basit ve kullanıcı dostu ayarlar paneli. Karmaşık ayarlar yerine temel kalite seviyeleri ve önemli seçenekleri sunar.

## Özellikler

### 🎮 Kalite Ayarları
- **Düşük**: Eski cihazlar için optimize edilmiş (30 FPS, gölgeler kapalı)
- **Orta**: Çoğu cihaz için dengeli ayarlar (60 FPS, orta gölgeler)
- **Yüksek**: Güçlü cihazlar için maksimum kalite (60 FPS, yüksek gölgeler)

### 🖥️ Görüntü Ayarları
- FPS göstergesi açma/kapama
- Performans istatistikleri açma/kapama

### 🔊 Ses Ayarları
- Ana ses seviyesi kontrolü (0-100%)

### ♿ Erişilebilirlik
- Yazı boyutu seçimi (Küçük/Orta/Büyük)

### 💾 Yedekleme
- Ayarları panoya kopyalama
- Ayarları geri yükleme

## Kullanım

```tsx
import { SimpleSettingsPanel } from './components/SimpleSettingsPanel'

function App() {
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div>
      <button onClick={() => setShowSettings(true)}>
        Ayarlar
      </button>
      
      <SimpleSettingsPanel
        visible={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  )
}
```

## Hook Kullanımı

```tsx
import { useSimplePreferences } from './hooks/useSimplePreferences'

function MyComponent() {
  const { preferences, setQuality, updatePreferences } = useSimplePreferences()

  return (
    <div>
      <p>Mevcut kalite: {preferences.quality}</p>
      <button onClick={() => setQuality('high')}>
        Yüksek Kalite
      </button>
    </div>
  )
}
```

## Veri Yapısı

```typescript
interface SimpleUserPreferences {
  quality: 'low' | 'medium' | 'high'
  showFPS: boolean
  showPerformanceStats: boolean
  masterVolume: number
  fontSize: 'small' | 'medium' | 'large'
  lastUpdated: string
}
```

## LocalStorage

Ayarlar otomatik olarak `museum-simple-preferences` anahtarı ile localStorage'da saklanır.

## Mevcut Sistemle Entegrasyon

`useSimpleSettingsIntegration` hook'u ile mevcut performans sistemi ile entegre olur:

```tsx
import { useSimpleSettingsIntegration } from './hooks/useSimpleSettingsIntegration'

function PerformanceComponent() {
  const { preferences, qualitySettings } = useSimpleSettingsIntegration()
  
  // Kalite ayarları otomatik olarak performans sistemine uygulanır
}
```