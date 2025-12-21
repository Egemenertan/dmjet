# DmarJet Mobile - Supermarket Delivery App

Modern, ölçeklenebilir ve çok dilli React Native supermarket delivery uygulaması.

## 🚀 Özellikler

- ✅ **React Native 0.76.5** - Expo ile entegre
- ✅ **Expo SDK 52** - Expo Go ile test edilebilir
- ✅ **TypeScript** - Tip güvenli kod
- ✅ **Supabase** - Backend ve authentication
- ✅ **React Navigation 7.x** - Stack ve Bottom Tabs
- ✅ **Zustand** - Hafif state management
- ✅ **React Query** - Server state yönetimi
- ✅ **i18next** - Çok dilli destek (TR/EN/RU)
- ✅ **Apple Design** - Shadow-free, modern UI

## 📁 Proje Yapısı

```
src/
├── core/              # Çekirdek katman
│   ├── config/        # Konfigürasyonlar
│   ├── constants/     # Sabitler (colors, spacing, typography)
│   ├── navigation/    # Navigation yapısı
│   ├── services/      # API servisleri (Supabase)
│   └── types/         # TypeScript tipleri
├── features/          # Feature modülleri
│   ├── auth/          # Authentication
│   ├── products/      # Ürün yönetimi
│   ├── cart/          # Sepet
│   ├── orders/        # Siparişler
│   └── profile/       # Profil
├── shared/            # Paylaşılan bileşenler
│   └── ui/            # UI bileşenleri (Button, Input, Card)
├── localization/      # Çok dilli destek
├── store/             # Zustand stores
└── theme/             # Tema yönetimi
```

## 🎨 Design System

### Renkler
- **Primary**: `#2A6D3E` (Yeşil)
- **Background**: `#FFFFFF`
- **Surface**: `#F8F9FA`
- **Text**: `#1A1A1A`, `#6B7280`, `#9CA3AF`

### Spacing
- xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, xxl: 48px

### Border Radius
- sm: 8px, md: 12px, lg: 16px, xl: 24px

## 🔧 Kurulum

### Gereksinimler
- Node.js >= 18
- npm veya yarn
- Telefonunuzda **Expo Go** uygulaması (iOS App Store veya Google Play Store'dan indirin)

### Hızlı Başlangıç

1. **Otomatik kurulum (Önerilen)**
```bash
npm run setup
```

Bu komut:
- Bağımlılıkları yükler
- Environment dosyalarını kontrol eder
- Asset dosyalarını oluşturur (opsiyonel)
- Expo doctor kontrollerini yapar

2. **Manuel kurulum**

```bash
# Bağımlılıkları yükle
npm install

# .env dosyası oluştur
cp .env.example .env
# .env dosyasını Supabase credentials ile güncelle

# app.json'da extra.supabaseUrl ve extra.supabaseAnonKey değerlerini güncelle
```

3. **Asset dosyalarını oluştur**

Placeholder görseller için (ImageMagick gerektirir):
```bash
bash scripts/create-placeholder-assets.sh
```

Veya manuel olarak `assets/` klasörüne şu dosyaları ekleyin:
- icon.png (1024x1024)
- adaptive-icon.png (1024x1024)
- splash.png (1284x2778)
- favicon.png (48x48)

4. **Uygulamayı başlat**

```bash
npm start
# veya
npx expo start
```

5. **Expo Go ile test et**
- Telefonunuzda Expo Go uygulamasını açın
- QR kodu tarayın
- Uygulama yüklenecek ve çalışmaya başlayacak

### 📖 Detaylı Kurulum Rehberi

Expo Go ile ilgili detaylı bilgi için: [EXPO_SETUP.md](./EXPO_SETUP.md)

### 🏗️ Development Build (Opsiyonel)

Expo Go'nun desteklemediği native modüller için:

```bash
# Development client yükle
npx expo install expo-dev-client

# iOS için build
npx expo run:ios

# Android için build
npx expo run:android
```

## 🔐 Environment Variables

**Önemli:** Expo Go ile çalışırken environment değişkenleri iki yerde tanımlanmalıdır:

### 1. .env dosyası (Development için)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

### 2. app.json (Expo Go için)
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

**Not:** Uygulama, Expo Constants üzerinden environment değişkenlerine erişir.

## 📦 Tamamlanan Özellikler

### ✅ Temel Altyapı
- [x] React Native bare proje kurulumu
- [x] TypeScript konfigürasyonu
- [x] Path aliases (@core, @features, @shared, etc.)
- [x] Modüler klasör yapısı

### ✅ Design System
- [x] Color constants
- [x] Spacing system
- [x] Typography system
- [x] Button component (4 variants, 3 sizes)
- [x] Input component (error states, icons)
- [x] Card component

### ✅ Navigation
- [x] React Navigation setup
- [x] Auth Navigator (Welcome, Login, Register)
- [x] Main Navigator (Tabs + Screens)
- [x] Bottom Tabs (Home, Cart, Orders, Profile)
- [x] Type-safe navigation

### ✅ State Management
- [x] Zustand stores (auth, cart, app)
- [x] React Query setup
- [x] Auth state management
- [x] Cart state management

### ✅ Backend Integration
- [x] Supabase client setup
- [x] Database types generation
- [x] Auth service
- [x] Session management

### ✅ Localization
- [x] i18next setup
- [x] TR/EN/RU translations
- [x] Device language detection
- [x] Translation hook

### ✅ Authentication
- [x] Welcome screen
- [x] Login screen
- [x] Register screen
- [x] Auth service integration

## 🚧 Devam Eden Geliştirmeler

### Products Feature
- [ ] Home screen
- [ ] Product list
- [ ] Product detail
- [ ] Category filtering
- [ ] Search functionality

### Cart & Checkout
- [x] Cart screen
- [x] Checkout flow ✨ **YENİ!**
- [x] Address management (Map integration)
- [x] Order creation
- [x] Payment method selection (Card/Cash)

### Orders & Profile
- [x] Orders list ✨ **YENİ!**
- [x] Order status indicators (Iconoir icons)
- [x] Active/History tabs
- [x] Pull-to-refresh
- [ ] Order detail
- [ ] Realtime order tracking
- [x] Profile management
- [ ] Coupons

### Polish & Optimization
- [ ] Animasyonlar (Reanimated)
- [ ] Loading states
- [ ] Error handling
- [ ] Performance optimization
- [ ] Google Maps integration

## 🎯 Mimari Prensipler

1. **Feature-Based Architecture**: Her feature bağımsız çalışabilir
2. **Type Safety**: TypeScript ile tam tip güvenliği
3. **Separation of Concerns**: UI, business logic ve data ayrımı
4. **Reusability**: Paylaşılabilir bileşenler ve utilities
5. **Scalability**: Farklı sektörlere kolayca adapte edilebilir

## 📱 Ekranlar

### Auth Flow
- Welcome → Login/Register → Main App

### Main App
- Home (Ürünler, kategoriler, özel teklifler)
- Cart (Sepet yönetimi, kupon)
- Orders (Aktif ve geçmiş siparişler)
- Profile (Kullanıcı bilgileri, ayarlar)

## 🔄 Supabase Database

### Ana Tablolar
- `products` - Ürünler
- `product_translations` - Ürün çevirileri (TR/EN/RU)
- `categories` - Kategoriler
- `category_translations` - Kategori çevirileri
- `orders` - Siparişler
- `profiles` - Kullanıcı profilleri
- `user_coupons` - Kuponlar

## 🛠️ Geliştirme Komutları

```bash
# Expo development server başlat
npm start

# Cache'i temizleyerek başlat
npm run start:clear

# iOS simulator (Development build gerektirir)
npm run ios

# Android emulator (Development build gerektirir)
npm run android

# Proje kurulumu
npm run setup

# Expo doctor (sorun tespiti)
npm run doctor

# Linting
npm run lint

# Type checking
npx tsc --noEmit

# Prebuild (native klasörleri oluştur)
npm run prebuild

# Prebuild clean (native klasörleri sıfırdan oluştur)
npm run prebuild:clean
```

## 🐛 Sorun Giderme

### Cache Sorunları
```bash
npm run start:clear
```

### Metro Bundler Sorunları
```bash
rm -rf node_modules
npm install
npm run start:clear
```

### Expo Go'da Çalışmıyor
- Telefon ve bilgisayarınızın aynı WiFi ağında olduğundan emin olun
- Expo Go uygulamasının güncel olduğunu kontrol edin
- `npm run doctor` komutunu çalıştırın

### Asset Dosyaları Eksik
```bash
bash scripts/create-placeholder-assets.sh
```

### Environment Değişkenleri Çalışmıyor
- `.env` dosyasının var olduğundan emin olun
- `app.json` içinde `extra` bölümünü kontrol edin
- Uygulamayı yeniden başlatın: `npm run start:clear`

## 📝 Notlar

- Bu proje Apple Design prensiplerine uygun olarak tasarlanmıştır
- Shadow/elevation kullanılmamıştır, sadece border ve background color
- Tüm UI bileşenleri tutarlı spacing ve border radius kullanır
- Çok dilli destek için Supabase'deki translation tabloları kullanılır

## 🤝 Katkıda Bulunma

1. Feature branch oluşturun
2. Değişikliklerinizi commit edin
3. Branch'inizi push edin
4. Pull request açın

## 📄 Lisans

Özel proje - Tüm hakları saklıdır.
