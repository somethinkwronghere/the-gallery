# SimpleMobileControls

Basitleştirilmiş ve optimize edilmiş mobil kontrol bileşeni.

## Özellikler

- **Performans Odaklı**: Minimum gecikme ile dokunmatik kontroller
- **Basit Tasarım**: Sadece gerekli kontroller (hareket, bakış, zıplama, menü)
- **Optimize Edilmiş Touch Handling**: Geliştirilmiş dokunmatik yanıt süresi
- **Responsive**: Farklı ekran boyutları ve yönlendirmeler için optimize
- **Accessibility**: Yüksek kontrast ve azaltılmış hareket desteği

## Kullanım

```tsx
import { SimpleMobileControls } from './components/SimpleMobileControls';

function App() {
  const handleMove = (direction: { x: number; z: number }) => {
    // Hareket işleme
  };

  const handleLook = (rotation: { x: number; y: number }) => {
    // Bakış işleme
  };

  const handleAction = (action: 'jump' | 'menu') => {
    // Aksiyon işleme
  };

  return (
    <SimpleMobileControls
      enabled={true}
      onMove={handleMove}
      onLook={handleLook}
      onAction={handleAction}
      sensitivity={0.8}
    />
  );
}
```

## Props

| Prop | Tip | Varsayılan | Açıklama |
|------|-----|------------|----------|
| `enabled` | `boolean` | - | Kontrollerin aktif olup olmadığı |
| `onMove` | `(direction: { x: number; z: number }) => void` | - | Hareket callback'i |
| `onLook` | `(rotation: { x: number; y: number }) => void` | - | Bakış callback'i |
| `onAction` | `(action: 'jump' \| 'menu') => void` | - | Aksiyon callback'i |
| `sensitivity` | `number` | `1` | Kontrol hassasiyeti |
| `className` | `string` | `''` | Ek CSS sınıfı |

## Optimizasyonlar

### Touch Handling
- Passive event listener'lar kullanılmaz (daha düşük gecikme için)
- Optimized touch event processing
- Circular joystick constraint
- Deadzone implementation

### Performance
- CSS transitions kaldırıldı (daha iyi performans)
- Will-change CSS property'si kullanıldı
- Minimal DOM manipülasyonu
- Efficient event handling

### Responsive Design
- Mobile-first yaklaşım
- Landscape/portrait optimizasyonları
- Farklı ekran boyutları için uyarlanabilir boyutlar
- Safe area desteği

## CSS Sınıfları

- `.simple-mobile-controls`: Ana konteyner
- `.joystick-container`: Joystick wrapper'ları
- `.simple-joystick`: Joystick bileşeni
- `.action-buttons`: Aksiyon butonları konteyneri
- `.action-btn`: Aksiyon butonları

## Browser Desteği

- iOS Safari 12+
- Chrome Mobile 70+
- Firefox Mobile 68+
- Samsung Internet 10+

## Performans Notları

- 60 FPS hedeflenir
- Touch latency < 16ms
- Memory usage < 5MB
- CPU usage minimal