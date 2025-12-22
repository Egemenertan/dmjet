# 🚀 DmarJet Mobile - Hızlı Başlangıç

Bu rehber, uygulamayı 5 dakikada Expo Go ile çalıştırmanızı sağlar.

## 📋 Ön Hazırlık

1. **Telefonunuza Expo Go indirin:**
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

2. **Node.js 18+ yüklü olduğundan emin olun:**
   ```bash
   node -v  # 18 veya üzeri olmalı
   ```

## ⚡ 3 Adımda Başlat

### 1️⃣ Kurulum
```bash
npm run setup
```

Bu komut her şeyi otomatik olarak yapacak:
- ✅ Bağımlılıkları yükler
- ✅ Environment dosyalarını kontrol eder
- ✅ Gerekli kontrolleri yapar

### 2️⃣ Supabase Bilgilerini Ekle

#### a) `.env` dosyasını düzenle:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

#### b) `app.json` dosyasını düzenle:
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

**Supabase bilgileriniz yok mu?**
- [Supabase](https://supabase.com) üzerinden ücretsiz bir proje oluşturun
- Project Settings > API'den URL ve anon key'i alın

### 3️⃣ Başlat
```bash
npm start
```

Ardından:
1. Terminal'de QR kod görünecek
2. Telefonunuzda Expo Go'yu açın
3. QR kodu tarayın
4. Uygulama yüklenecek! 🎉

## 🎨 Asset Dosyaları (Opsiyonel)

Eğer asset dosyaları eksikse, placeholder görseller oluşturabilirsiniz:

```bash
bash scripts/create-placeholder-assets.sh
```

Veya manuel olarak `assets/` klasörüne şu dosyaları ekleyin:
- icon.png (1024x1024 px)
- adaptive-icon.png (1024x1024 px)
- splash.png (1284x2778 px)
- favicon.png (48x48 px)

## ❓ Sorun mu Yaşıyorsunuz?

### "Cannot connect to Metro" hatası
```bash
# Cache'i temizle ve yeniden başlat
npm run start:clear
```

### QR kod çalışmıyor
- Telefon ve bilgisayarınızın **aynı WiFi ağında** olduğundan emin olun
- VPN kullanıyorsanız kapatın
- Güvenlik duvarı ayarlarını kontrol edin

### "Module not found" hatası
```bash
# node_modules'u sil ve yeniden yükle
rm -rf node_modules
npm install
npm start
```

### Expo Go'da beyaz ekran
```bash
# Expo doctor çalıştır
npm run doctor

# Sorunları düzelt ve yeniden başlat
npm run start:clear
```

## 📱 Test Etme İpuçları

### Hot Reload
- Kod değişiklikleriniz otomatik olarak yansır
- Yansımıyorsa telefonu sallayın ve "Reload" seçin

### Debug Menu
- **iOS**: Telefonu sallayın
- **Android**: Telefonu sallayın veya cihazı çalkalayın

### Console Logs
Terminal'de tüm console.log çıktılarını görebilirsiniz.

## 🎯 Sonraki Adımlar

1. **Supabase Database Kurulumu**
   - Gerekli tabloları oluşturun
   - RLS (Row Level Security) politikalarını ayarlayın

2. **Özelleştirme**
   - `src/core/constants/colors.ts` - Renkleri değiştirin
   - `src/localization/translations/` - Çevirileri düzenleyin

3. **Geliştirme**
   - Detaylı bilgi için [README.md](./README.md)
   - Expo Go detayları için [EXPO_SETUP.md](./EXPO_SETUP.md)

## 🆘 Yardım

Sorun yaşıyorsanız:
1. `npm run doctor` çalıştırın
2. [EXPO_SETUP.md](./EXPO_SETUP.md) dosyasına bakın
3. [Expo Documentation](https://docs.expo.dev/)

---

**Tebrikler! 🎉** Artık uygulamanız Expo Go'da çalışıyor.










