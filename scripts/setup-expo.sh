#!/bin/bash

# DmarJet Mobile - Expo Go Kurulum Scripti
# Bu script, projeyi Expo Go ile test etmek için hazırlar

echo "🚀 DmarJet Mobile - Expo Go Kurulum"
echo "===================================="
echo ""

# Node.js versiyonu kontrolü
echo "📦 Node.js versiyonu kontrol ediliyor..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18 veya üzeri gerekli! Mevcut versiyon: $(node -v)"
    exit 1
fi
echo "✅ Node.js versiyonu uygun: $(node -v)"
echo ""

# .env dosyası kontrolü
echo "🔐 Environment değişkenleri kontrol ediliyor..."
if [ ! -f ".env" ]; then
    echo "⚠️  .env dosyası bulunamadı!"
    echo "📝 .env.example dosyasından kopyalanıyor..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ .env dosyası oluşturuldu"
        echo "⚠️  LÜTFEN .env dosyasını düzenleyip Supabase bilgilerinizi ekleyin!"
    else
        echo "❌ .env.example dosyası da bulunamadı!"
        echo "📝 Lütfen manuel olarak .env dosyası oluşturun"
    fi
else
    echo "✅ .env dosyası mevcut"
fi
echo ""

# Asset dosyaları kontrolü
echo "🎨 Asset dosyaları kontrol ediliyor..."
ASSETS_MISSING=false

if [ ! -f "assets/icon.png" ]; then
    echo "⚠️  assets/icon.png bulunamadı"
    ASSETS_MISSING=true
fi

if [ ! -f "assets/adaptive-icon.png" ]; then
    echo "⚠️  assets/adaptive-icon.png bulunamadı"
    ASSETS_MISSING=true
fi

if [ ! -f "assets/splash.png" ]; then
    echo "⚠️  assets/splash.png bulunamadı"
    ASSETS_MISSING=true
fi

if [ ! -f "assets/favicon.png" ]; then
    echo "⚠️  assets/favicon.png bulunamadı"
    ASSETS_MISSING=true
fi

if [ "$ASSETS_MISSING" = true ]; then
    echo ""
    echo "💡 Placeholder asset dosyaları oluşturmak ister misiniz? (y/n)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        if [ -f "scripts/create-placeholder-assets.sh" ]; then
            bash scripts/create-placeholder-assets.sh
        else
            echo "❌ scripts/create-placeholder-assets.sh bulunamadı"
        fi
    else
        echo "⚠️  Lütfen manuel olarak asset dosyalarını oluşturun"
        echo "📖 Detaylar için assets/README.md dosyasına bakın"
    fi
else
    echo "✅ Tüm asset dosyaları mevcut"
fi
echo ""

# Bağımlılıkları yükle
echo "📦 Bağımlılıklar yükleniyor..."
if [ -f "package-lock.json" ]; then
    npm install
elif [ -f "yarn.lock" ]; then
    yarn install
else
    npm install
fi

if [ $? -eq 0 ]; then
    echo "✅ Bağımlılıklar başarıyla yüklendi"
else
    echo "❌ Bağımlılık yüklemesi başarısız!"
    exit 1
fi
echo ""

# Expo doctor çalıştır
echo "🔍 Expo doctor kontrolleri yapılıyor..."
npx expo-doctor || true
echo ""

# Özet
echo "===================================="
echo "✅ Kurulum tamamlandı!"
echo ""
echo "📱 Uygulamayı başlatmak için:"
echo "   npm start"
echo "   # veya"
echo "   npx expo start"
echo ""
echo "📖 Detaylı bilgi için EXPO_SETUP.md dosyasına bakın"
echo ""
echo "⚠️  ÖNEMLİ:"
echo "   1. .env dosyasını düzenleyip Supabase bilgilerinizi ekleyin"
echo "   2. app.json'da extra.supabaseUrl ve extra.supabaseAnonKey değerlerini güncelleyin"
echo "   3. Telefonunuzda Expo Go uygulamasını indirin"
echo ""





