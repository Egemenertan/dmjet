# DmarJet Mobile - Expo Go Kurulum Rehberi

Bu rehber, uygulamayı Expo Go ile test etmek için gerekli adımları içerir.

## Ön Gereksinimler

- Node.js 18 veya üzeri
- npm veya yarn
- Expo Go uygulaması (iOS App Store veya Google Play Store'dan indirin)

## Kurulum Adımları

### 1. Bağımlılıkları Yükleyin

```bash
npm install
# veya
yarn install
```

### 2. Environment Değişkenlerini Ayarlayın

Projenin kök dizininde `.env` dosyası oluşturun (zaten varsa düzenleyin):

```bash
# .env dosyası
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

**ÖNEMLİ:** Gerçek Supabase bilgilerinizi buraya eklemelisiniz.

### 3. app.json'da Environment Değişkenlerini Ayarlayın

`app.json` dosyasını açın ve `extra` bölümünü Supabase bilgilerinizle güncelleyin:

```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "https://your-project.supabase.co",
      "supabaseAnonKey": "your-anon-key-here"
    }
  }
}
```

### 4. Asset Dosyalarını Oluşturun

`assets` klasöründe aşağıdaki dosyaları oluşturmanız gerekiyor:

- **icon.png** (1024x1024 px)
- **adaptive-icon.png** (1024x1024 px)
- **splash.png** (1284x2778 px)
- **favicon.png** (48x48 px)

Geçici olarak test etmek için basit renkli görseller kullanabilirsiniz.

#### macOS/Linux için Hızlı Çözüm (ImageMagick gerektirir):

```bash
cd assets

# Mavi arka planlı basit ikonlar oluştur
convert -size 1024x1024 xc:#4A90E2 -gravity center -pointsize 200 -fill white -annotate +0+0 "D" icon.png
convert -size 1024x1024 xc:#4A90E2 -gravity center -pointsize 200 -fill white -annotate +0+0 "D" adaptive-icon.png
convert -size 1284x2778 xc:#4A90E2 -gravity center -pointsize 300 -fill white -annotate +0+0 "DmarJet" splash.png
convert -size 48x48 xc:#4A90E2 favicon.png
```

### 5. Uygulamayı Başlatın

```bash
npm start
# veya
npx expo start
```

### 6. Expo Go ile Bağlanın

1. Telefonunuzda Expo Go uygulamasını açın
2. QR kodu tarayın (iOS için Camera uygulaması, Android için Expo Go içindeki tarayıcı)
3. Uygulama yüklenecek ve çalışmaya başlayacak

## Sorun Giderme

### Cache Sorunları

Eğer sorun yaşıyorsanız, cache'i temizleyin:

```bash
npx expo start --clear
```

### Metro Bundler Sorunları

```bash
# node_modules ve cache'i temizle
rm -rf node_modules
npm install
npx expo start --clear
```

### iOS'ta Çalışmıyor

- iOS 13.4 veya üzeri gereklidir
- Expo Go uygulamasının güncel olduğundan emin olun
- Telefon ve bilgisayarınızın aynı WiFi ağında olduğundan emin olun

### Android'de Çalışmıyor

- Android 5.0 veya üzeri gereklidir
- Expo Go uygulamasının güncel olduğundan emin olun
- Güvenlik duvarı ayarlarınızı kontrol edin

## Önemli Notlar

### Expo Go Sınırlamaları

Expo Go bazı native modülleri desteklemez. Eğer custom native kod kullanmanız gerekiyorsa:

1. **Development Build** oluşturun:
   ```bash
   npx expo install expo-dev-client
   npx expo run:ios
   # veya
   npx expo run:android
   ```

2. **EAS Build** kullanın (önerilir):
   ```bash
   npm install -g eas-cli
   eas build --profile development --platform ios
   ```

### Kullanılan Paketler

Tüm paketler Expo Go ile uyumludur:
- ✅ @react-navigation
- ✅ @supabase/supabase-js
- ✅ @tanstack/react-query
- ✅ zustand
- ✅ react-native-safe-area-context
- ✅ react-native-screens
- ✅ react-native-gesture-handler
- ✅ react-native-reanimated

## Geliştirme İpuçları

### Hot Reload

Kod değişiklikleriniz otomatik olarak uygulamaya yansır. Eğer yansımıyorsa:
- Telefonunuzu sallayın (shake)
- "Reload" seçeneğini seçin

### Debug Menu

- iOS: Cmd+D (simulator) veya telefonu sallayın
- Android: Cmd+M (emulator) veya telefonu sallayın

### Console Logs

Terminal'de logları görebilirsiniz veya:
```bash
npx expo start --dev-client
```

## Daha Fazla Bilgi

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Go](https://expo.dev/client)
- [Supabase Documentation](https://supabase.com/docs)
- [React Navigation](https://reactnavigation.org/)

## Destek

Sorun yaşıyorsanız:
1. `npx expo-doctor` komutunu çalıştırın
2. Hata mesajlarını kontrol edin
3. Expo ve paket versiyonlarının uyumlu olduğundan emin olun




