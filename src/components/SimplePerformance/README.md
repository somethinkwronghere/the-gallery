# SimplePerformance Component

Basit ve kullanıcı dostu performance monitoring bileşeni. Mevcut PerformanceMonitor, FPSCounter ve MemoryMonitor bileşenlerini tek bir bileşende birleştirir.

## Özellikler

- **İki mod**: Minimal (küçük gösterge) ve Dashboard (detaylı panel)
- **Temel metrikler**: FPS, Memory Usage, Render Time
- **Renk kodlaması**: Performance durumuna göre otomatik renk değişimi
- **Responsive tasarım**: Mobile ve desktop uyumlu
- **Konum seçenekleri**: 4 farklı köşe pozisyonu

## Kullanım

### Minimal Mod (Varsayılan)
```tsx
import { SimplePerformance } from '../SimplePerformance';

// Basit FPS ve memory göstergesi
<SimplePerformance />

// Farklı pozisyon
<SimplePerformance position="top-right" />
```

### Dashboard Mod
```tsx
// Detaylı performance paneli
<SimplePerformance mode="dashboard" />

// Gizlenebilir dashboard
<SimplePerformance 
  mode="dashboard" 
  visible={showPerformancePanel} 
/>
```

## Props

| Prop | Tip | Varsayılan | Açıklama |
|------|-----|------------|----------|
| `visible` | `boolean` | `true` | Bileşenin görünürlüğü |
| `mode` | `'minimal' \| 'dashboard'` | `'minimal'` | Görüntüleme modu |
| `position` | `'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right'` | `'top-left'` | Ekrandaki konum (sadece minimal mod) |

## Metrikler

### FPS (Frame Rate)
- **Yeşil** (55+ FPS): Mükemmel performans
- **Sarı** (35-54 FPS): Orta performans  
- **Kırmızı** (<35 FPS): Düşük performans

### Memory Usage
- **Yeşil** (<200 MB): Normal kullanım
- **Sarı** (200-400 MB): Orta kullanım
- **Kırmızı** (>400 MB): Yüksek kullanım

### Performance Level
- **YÜKSEK**: Optimal ayarlar
- **ORTA**: Dengeli ayarlar
- **DÜŞÜK**: Performans odaklı ayarlar

## Eski Bileşenlerden Farklar

### PerformanceMonitor'dan
- Gereksiz metrikler çıkarıldı (draw calls, triangles)
- Daha basit ve anlaşılır arayüz
- Kullanıcı dostu renk kodlaması

### FPSCounter'dan  
- Memory bilgisi dahil edildi
- Dashboard modu eklendi
- Daha esnek pozisyonlama

### MemoryMonitor (yeni)
- Memory tracking SimplePerformance'a entegre edildi
- Otomatik renk kodlaması
- Basit threshold sistemi

## CSS Sınıfları

```css
.simple-performance                    /* Ana container */
.simple-performance--minimal           /* Minimal mod */
.simple-performance--dashboard         /* Dashboard mod */
.simple-performance--top-left          /* Pozisyon sınıfları */
.simple-performance__fps               /* FPS göstergesi */
.simple-performance__memory            /* Memory göstergesi */
.simple-performance__level             /* Performance level */
.simple-performance__metric            /* Dashboard metrik satırı */
```

## Migration Guide

### PerformanceMonitor'dan geçiş
```tsx
// Eski
<PerformanceMonitor visible={showStats} />

// Yeni  
<SimplePerformance mode="dashboard" visible={showStats} />
```

### FPSCounter'dan geçiş
```tsx
// Eski
<FPSCounter visible={showFPS} position="top-left" />

// Yeni
<SimplePerformance visible={showFPS} position="top-left" />
```