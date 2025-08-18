# The Gallery - 3D Art Gallery Experience

Bu proje, modern web teknolojileri kullanılarak geliştirilmiş interaktif 3D sanat galerisi deneyimidir.

## 🚀 Gereksinimler

- **Node.js**: 18.0.0 veya üzeri
- **npm**: 8.0.0 veya üzeri

## 📦 Kurulum

1. Projeyi klonlayın:
```bash
git clone <repository-url>
cd the-gallery
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

## 🎮 Çalıştırma

### Geliştirme Modu
```bash
npm start
```
Proje http://localhost:3000 adresinde açılacaktır.

### Production Build
```bash
npm run build
```

### Test
```bash
npm test
```

## 🎯 Özellikler

- **3D Ortam**: Three.js ve React Three Fiber ile geliştirilmiş
- **Fizik Motoru**: @react-three/cannon ile gerçekçi fizik simülasyonu
- **Performans**: Modern React 18 ve optimize edilmiş render sistemi
- **Responsive**: Tüm cihazlarda uyumlu tasarım

## 🎮 Kontroller

- **Hareket**: WASD tuşları
- **Zıplama**: SPACE
- **Koşma**: SHIFT
- **Bakış**: Mouse
- **Gece Modu**: N tuşu
- **Performans Modu**: P tuşu

## 🛠️ Teknolojiler

- **React 18**: Modern React hooks ve concurrent features
- **Three.js**: 3D grafik kütüphanesi
- **@react-three/fiber**: React için Three.js renderer
- **@react-three/drei**: Three.js için yardımcı bileşenler
- **@react-three/cannon**: Fizik motoru
- **React Spring**: Animasyon kütüphanesi

## 📁 Proje Yapısı

```
src/
├── components/          # React bileşenleri
│   ├── App/            # Ana uygulama
│   ├── Art/            # Sanat eserleri
│   ├── Building/       # Bina yapıları
│   ├── Camera/         # Kamera kontrolleri
│   ├── Player/         # Oyuncu karakteri
│   └── ...             # Diğer bileşenler
├── style/              # CSS stilleri
└── public/             # Statik dosyalar ve 3D modeller
```

## 🔧 Güncellemeler

Bu proje Node.js 16'dan modern Node.js 18+ versiyonuna güncellenmiştir:

- React 17 → React 18
- react-three-fiber → @react-three/fiber
- use-cannon → @react-three/cannon
- Three.js 0.122 → 0.161
- Eski BufferGeometry → Yeni Geometry API

## 🐛 Bilinen Sorunlar

- Bazı 3D modeller eski formatlarda olabilir
- Performance optimizasyonları devam etmektedir

## 📝 Lisans

Bu proje özel kullanım için geliştirilmiştir.

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Commit yapın (`git commit -m 'Add some AmazingFeature'`)
4. Push yapın (`git push origin feature/AmazingFeature`)
5. Pull Request oluşturun

## 📞 İletişim

Proje hakkında sorularınız için issue açabilirsiniz.
