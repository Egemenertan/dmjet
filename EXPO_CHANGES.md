# 📝 Expo Go İçin Yapılan Değişiklikler

Bu dosya, projenin Expo Go ile test edilebilir hale getirilmesi için yapılan tüm değişiklikleri listeler.

## 🔧 Yapılandırma Değişiklikleri

### 1. Environment Değişkenleri
**Değişiklik:** `react-native-dotenv` yerine `expo-constants` kullanımı

**Dosya:** `src/core/config/env.ts`
```typescript
// ÖNCE (react-native-dotenv)
import {SUPABASE_URL, SUPABASE_ANON_KEY} from '@env';

// SONRA (expo-constants)
import Constants from 'expo-constants';
const extra = Constants.expoConfig?.extra || {};
```

**Neden:** Expo Go, `react-native-dotenv` ile çalışmaz. Environment değişkenleri `app.json` üzerinden `expo-constants` ile okunmalıdır.

### 2. app.json Güncellemeleri
**Eklenenler:**
- `scheme`: Deep linking için
- `extra`: Environment değişkenleri için
- iOS `infoPlist`: Kamera, galeri, konum izinleri
- Android `permissions`: Gerekli izinler
- `plugins`: Boş array (Expo Go uyumluluğu için)

### 3. package.json
**Eklenen Bağımlılıklar:**
- `expo-crypto`: Supabase için gerekli
- `expo-secure-store`: Güvenli depolama
- `react-native-gesture-handler`: Navigation için
- `react-native-reanimated`: Animasyonlar için

**Kaldırılan:**
- `react-native-dotenv`: Artık kullanılmıyor

**Yeni Scriptler:**
- `start:clear`: Cache'i temizleyerek başlat
- `setup`: Otomatik kurulum scripti
- `doctor`: Expo doctor kontrolleri
- `prebuild`: Native klasörleri oluştur

### 4. babel.config.js
**Değişiklikler:**
- `react-native-dotenv` plugin'i kaldırıldı
- `react-native-reanimated/plugin` eklendi

### 5. App.tsx
**Eklenen:**
```typescript
import 'react-native-gesture-handler';
```
**Neden:** React Navigation için gerekli, dosyanın en üstünde olmalı.

### 6. .gitignore
**Eklenenler:**
```
# Environment variables
.env
.env.local
.env.*.local

# Expo
.expo/
.expo-shared/
dist/
web-build/
```

## 📁 Yeni Dosyalar

### Dokümantasyon
1. **EXPO_SETUP.md** - Detaylı Expo Go kurulum rehberi
2. **QUICK_START.md** - 5 dakikada başlangıç rehberi
3. **CHECKLIST.md** - Test kontrol listesi
4. **EXPO_CHANGES.md** - Bu dosya

### Scripts
1. **scripts/setup-expo.sh** - Otomatik kurulum scripti
2. **scripts/create-placeholder-assets.sh** - Asset oluşturma scripti

### Assets
1. **assets/README.md** - Asset dosyaları hakkında bilgi

## 🎯 Expo Go Uyumluluğu

### ✅ Uyumlu Paketler
Tüm kullanılan paketler Expo Go ile uyumludur:
- `@react-navigation/*` - Navigation
- `@supabase/supabase-js` - Backend
- `@tanstack/react-query` - Data fetching
- `zustand` - State management
- `react-native-safe-area-context` - Safe area
- `react-native-screens` - Native screens
- `react-native-gesture-handler` - Gestures
- `react-native-reanimated` - Animations
- `react-native-localize` - Localization
- `expo-constants` - Environment variables
- `expo-crypto` - Cryptography
- `expo-secure-store` - Secure storage

### ⚠️ Sınırlamalar
Expo Go'nun desteklemediği özellikler:
- Custom native modules
- Native code değişiklikleri
- Bazı third-party native kütüphaneler

**Çözüm:** Bu özelliklere ihtiyaç duyulursa **Development Build** kullanılmalıdır:
```bash
npx expo install expo-dev-client
npx expo run:ios
```

## 🔄 Geçiş Adımları

Eğer başka bir geliştiricinin bu değişiklikleri uygulaması gerekiyorsa:

### 1. Kodu Çek
```bash
git pull origin main
```

### 2. Bağımlılıkları Yükle
```bash
npm install
```

### 3. Environment Ayarla
```bash
# .env oluştur ve düzenle
cp .env.example .env

# app.json'da extra bölümünü güncelle
```

### 4. Asset Oluştur
```bash
bash scripts/create-placeholder-assets.sh
```

### 5. Başlat
```bash
npm start
```

## 📊 Karşılaştırma

### Önceki Yapı (Bare React Native)
- ❌ Sadece native build ile test
- ❌ iOS için Xcode gerekli
- ❌ Android için Android Studio gerekli
- ❌ Build süresi: 5-10 dakika
- ❌ react-native-dotenv bağımlılığı

### Yeni Yapı (Expo Go Uyumlu)
- ✅ Expo Go ile anında test
- ✅ Xcode/Android Studio gerekmez
- ✅ Build süresi: 30 saniye
- ✅ QR kod ile kolay paylaşım
- ✅ expo-constants ile environment
- ✅ Native build hala mümkün (opsiyonel)

## 🚀 Avantajlar

1. **Hızlı Geliştirme**
   - Değişiklikler anında görünür
   - Native build beklemeye gerek yok

2. **Kolay Test**
   - QR kod ile paylaşım
   - Birden fazla cihazda aynı anda test

3. **Düşük Sistem Gereksinimleri**
   - Xcode/Android Studio gerekmez
   - Daha az disk alanı

4. **Ekip İşbirliği**
   - Tasarımcılar ve PM'ler kolayca test edebilir
   - QR kod ile anında paylaşım

## 📝 Notlar

### Development Build Ne Zaman Gerekir?
- Custom native module eklendiğinde
- Native kod değişikliği gerektiğinde
- Expo Go'nun desteklemediği bir paket kullanıldığında

### Environment Değişkenleri
- Development: `.env` dosyası
- Expo Go: `app.json` > `extra`
- Production: EAS Build secrets

### Asset Dosyaları
- Placeholder görseller test için yeterli
- Production için profesyonel tasarım kullanın

## 🆘 Sorun Giderme

### "Cannot find module '@env'"
**Çözüm:** Eski import'ları temizleyin, `expo-constants` kullanın

### "Metro bundler error"
**Çözüm:** 
```bash
npm run start:clear
```

### "Module not found"
**Çözüm:**
```bash
rm -rf node_modules
npm install
```

### Environment değişkenleri undefined
**Çözüm:**
1. `app.json` içinde `extra` bölümünü kontrol edin
2. Uygulamayı yeniden başlatın

## ✅ Kontrol Listesi

Değişiklikler tamamlandıktan sonra:

- [x] Environment yapılandırması güncellendi
- [x] package.json bağımlılıkları güncellendi
- [x] babel.config.js güncellendi
- [x] App.tsx güncellendi
- [x] app.json Expo Go için optimize edildi
- [x] .gitignore güncellendi
- [x] Dokümantasyon oluşturuldu
- [x] Setup scriptleri eklendi
- [ ] Supabase bilgileri eklendi (.env ve app.json)
- [ ] Asset dosyaları oluşturuldu
- [ ] Expo Go'da test edildi

## 📚 Referanslar

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Go](https://expo.dev/client)
- [Expo Constants](https://docs.expo.dev/versions/latest/sdk/constants/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)

---

**Son Güncelleme:** Aralık 2024
**Expo SDK:** 52.0.0
**React Native:** 0.76.5





