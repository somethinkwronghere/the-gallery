# Design Document

## Overview

Mevcut dijital müze projesini basit ve etkili şekilde optimize etmek için pragmatik bir yaklaşım. Karmaşık sistemler yerine, mevcut bileşenleri iyileştirip gereksiz karmaşıklığı azaltacağız.

## Architecture

### 1. Basit Performance Yönetimi

**Mevcut Durum Analizi**
- PerformanceMonitor, FPSCounter, MemoryMonitor bileşenleri zaten mevcut
- LODMesh sistemi var ama optimize edilmeli
- Loading sistemleri çoklu ve karmaşık

**Basitleştirme Stratejisi**
```
Tek Performance Manager → Mevcut bileşenleri koordine et
Tek Loading System → Birden fazla loading bileşenini birleştir
Basit Error Handling → Try-catch blokları ve fallback'ler
```

### 2. Mevcut Bileşenlerin Optimizasyonu

**Birleştirme Gereken Bileşenler**
- Loading, LoadingScreen, LoadingTransition, LoadingIndicator → Tek Loading sistemi
- PerformanceMonitor, FPSCounter, MemoryMonitor → Tek Performance Dashboard
- Çoklu Light bileşenleri → Optimize edilmiş Lights sistemi

**Temizleme Gereken Alanlar**
- Kullanılmayan bileşenlerin tespiti
- Duplicate kod temizliği
- Gereksiz prop drilling'in azaltılması

## Components and Interfaces

### 1. Unified Performance Manager

```typescript
interface SimplePerformanceManager {
  // Basit performans izleme
  getCurrentFPS(): number
  getMemoryUsage(): number
  
  // Otomatik optimizasyon
  enableAutoOptimization(): void
  
  // Basit kalite ayarları
  setQuality(level: 'low' | 'medium' | 'high'): void
}
```

### 2. Unified Loading System

```typescript
interface SimpleLoadingManager {
  // Tek loading state
  isLoading: boolean
  progress: number
  
  // Basit loading kontrolü
  startLoading(message?: string): void
  updateProgress(progress: number): void
  finishLoading(): void
}
```

### 3. Simple Error Handler

```typescript
interface SimpleErrorHandler {
  // Basit hata yakalama
  handleError(error: Error, fallback?: () => void): void
  
  // Kullanıcı dostu mesajlar
  showUserMessage(message: string, type: 'info' | 'warning' | 'error'): void
}
```

## Data Models

### 1. Basit Konfigürasyon

```typescript
interface SimpleConfig {
  // Temel ayarlar
  quality: 'auto' | 'low' | 'medium' | 'high'
  showFPS: boolean
  enableDebug: boolean
  
  // Kullanıcı tercihleri
  userPreferences: {
    graphics: 'auto' | 'low' | 'high'
    controls: 'keyboard' | 'touch'
  }
}
```

### 2. Performance Metrics

```typescript
interface SimpleMetrics {
  fps: number
  memoryMB: number
  loadedAssets: number
  renderTime: number
}
```

## Error Handling

### 1. Basit Hata Yönetimi Stratejisi

**Asset Loading Hatası**
```typescript
// Basit fallback sistemi
const loadAssetWithFallback = async (url: string) => {
  try {
    return await loadAsset(url)
  } catch (error) {
    console.warn(`Asset yüklenemedi: ${url}`)
    return getPlaceholderAsset()
  }
}
```

**Performance Sorunları**
```typescript
// Otomatik kalite düşürme
const handleLowPerformance = () => {
  if (getCurrentFPS() < 30) {
    setQuality('low')
    showUserMessage('Performans için kalite düşürüldü', 'info')
  }
}
```

## Testing Strategy

### 1. Basit Test Yaklaşımı

**Manuel Testler**
- Farklı cihazlarda performans testi
- Loading sürelerinin kontrolü
- Hata durumlarının testi

**Otomatik Testler**
- Kritik bileşenlerin unit testleri
- Performance regression testleri
- Error handling testleri

## Implementation Plan

### 1. Mevcut Kod Temizliği

**Adım 1: Analiz**
- Kullanılmayan bileşenleri tespit et
- Duplicate kodları bul
- Performance bottleneck'leri belirle

**Adım 2: Birleştirme**
- Loading bileşenlerini tek sisteme indir
- Performance monitoring'i basitleştir
- Error handling'i standardize et

**Adım 3: Optimizasyon**
- Gereksiz render'ları önle
- Memory leak'leri düzelt
- Bundle size'ı küçült

### 2. Basit Geliştirme Süreci

```
1. Bir bileşeni al
2. Gereksiz karmaşıklığı çıkar
3. Temel işlevselliği koru
4. Test et
5. Sonraki bileşene geç
```

### 3. Kullanıcı Deneyimi İyileştirmeleri

**Basit Loading**
- Tek progress bar
- Anlaşılır mesajlar
- Hızlı yükleme

**Basit Kontroller**
- Sade arayüz
- Kolay erişim
- Otomatik ayarlar

**Basit Hata Mesajları**
- Kullanıcı dostu dil
- Çözüm önerileri
- Panik yaratmayan tonlama