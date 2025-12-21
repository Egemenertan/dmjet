# ✅ Expo Go Test Kontrol Listesi

Uygulamayı Expo Go ile test etmeden önce bu kontrol listesini tamamlayın.

## 📦 Kurulum

- [ ] Node.js 18+ yüklü
- [ ] `npm install` çalıştırıldı
- [ ] Telefonunuzda Expo Go yüklü

## 🔐 Environment Yapılandırması

- [ ] Supabase projesi oluşturuldu
- [ ] `.env` dosyası oluşturuldu
- [ ] `.env` içinde `SUPABASE_URL` eklendi
- [ ] `.env` içinde `SUPABASE_ANON_KEY` eklendi
- [ ] `app.json` içinde `extra.supabaseUrl` güncellendi
- [ ] `app.json` içinde `extra.supabaseAnonKey` güncellendi

## 🎨 Asset Dosyaları

- [ ] `assets/icon.png` mevcut (1024x1024)
- [ ] `assets/adaptive-icon.png` mevcut (1024x1024)
- [ ] `assets/splash.png` mevcut (1284x2778)
- [ ] `assets/favicon.png` mevcut (48x48)

**Hızlı çözüm:** `bash scripts/create-placeholder-assets.sh`

## 🗄️ Supabase Database

### Gerekli Tablolar

- [ ] `profiles` tablosu
- [ ] `products` tablosu
- [ ] `product_translations` tablosu
- [ ] `categories` tablosu
- [ ] `category_translations` tablosu
- [ ] `orders` tablosu
- [ ] `order_items` tablosu
- [ ] `user_coupons` tablosu

### RLS (Row Level Security)

- [ ] `profiles` için RLS politikaları
- [ ] `orders` için RLS politikaları
- [ ] `user_coupons` için RLS politikaları

## 🚀 Başlatma

- [ ] `npm start` çalıştırıldı
- [ ] QR kod görünüyor
- [ ] Metro bundler çalışıyor
- [ ] Hata yok

## 📱 Expo Go'da Test

- [ ] Telefon ve bilgisayar aynı WiFi'da
- [ ] QR kod tarandı
- [ ] Uygulama Expo Go'da açıldı
- [ ] Splash screen göründü
- [ ] Welcome screen yüklendi

## 🧪 Temel Fonksiyonlar

### Authentication
- [ ] Register sayfası açılıyor
- [ ] Login sayfası açılıyor
- [ ] Email/password ile kayıt olunabiliyor
- [ ] Login yapılabiliyor
- [ ] Logout yapılabiliyor

### Navigation
- [ ] Bottom tabs görünüyor
- [ ] Home tab açılıyor
- [ ] Cart tab açılıyor
- [ ] Orders tab açılıyor
- [ ] Profile tab açılıyor

### Localization
- [ ] Dil değiştirme çalışıyor
- [ ] TR çevirileri görünüyor
- [ ] EN çevirileri görünüyor
- [ ] RU çevirileri görünüyor

## 🐛 Bilinen Sorunlar ve Çözümler

### Problem: "Cannot connect to Metro"
**Çözüm:**
```bash
npm run start:clear
```

### Problem: "Module not found"
**Çözüm:**
```bash
rm -rf node_modules
npm install
npm start
```

### Problem: Beyaz ekran
**Çözüm:**
1. Telefonu sallayın
2. "Reload" seçin
3. Hala çalışmıyorsa: `npm run doctor`

### Problem: Environment değişkenleri çalışmıyor
**Çözüm:**
1. `.env` dosyasını kontrol edin
2. `app.json` içindeki `extra` bölümünü kontrol edin
3. Uygulamayı yeniden başlatın: `npm run start:clear`

## 📊 Test Sonuçları

### iOS
- [ ] iPhone'da test edildi
- [ ] iPad'de test edildi (opsiyonel)
- [ ] iOS versiyonu: _______

### Android
- [ ] Android telefonda test edildi
- [ ] Android versiyonu: _______

## 🎯 Performans

- [ ] Uygulama hızlı açılıyor (< 3 saniye)
- [ ] Navigasyon akıcı
- [ ] Hot reload çalışıyor
- [ ] Console'da kritik hata yok

## 📝 Notlar

Karşılaşılan sorunlar ve çözümler:

```
1. 

2. 

3. 
```

## ✅ Final Kontrol

- [ ] Tüm özellikler çalışıyor
- [ ] Kritik bug yok
- [ ] UI düzgün görünüyor
- [ ] Performans kabul edilebilir
- [ ] Ready for development! 🎉

---

**Tarih:** _______________
**Test Eden:** _______________
**Cihaz:** _______________
**Expo Go Versiyonu:** _______________





