#!/bin/bash

# DmarJet Mobile - Placeholder Asset Oluşturma Scripti
# Bu script, test için geçici asset dosyaları oluşturur

echo "🎨 Placeholder asset dosyaları oluşturuluyor..."

# Assets klasörünü oluştur
mkdir -p assets

# ImageMagick kontrolü
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick bulunamadı!"
    echo "📦 ImageMagick kurulumu:"
    echo "   macOS: brew install imagemagick"
    echo "   Ubuntu: sudo apt-get install imagemagick"
    echo ""
    echo "💡 Alternatif: Online araçlar kullanarak manuel olarak oluşturabilirsiniz:"
    echo "   - https://www.figma.com"
    echo "   - https://www.canva.com"
    echo "   - https://appicon.co"
    exit 1
fi

cd assets

# Renk tanımla
COLOR="#4A90E2"  # Mavi

echo "📱 icon.png oluşturuluyor (1024x1024)..."
convert -size 1024x1024 xc:$COLOR -gravity center -pointsize 200 -fill white -annotate +0+0 "D" icon.png

echo "🤖 adaptive-icon.png oluşturuluyor (1024x1024)..."
convert -size 1024x1024 xc:$COLOR -gravity center -pointsize 200 -fill white -annotate +0+0 "D" adaptive-icon.png

echo "🌟 splash.png oluşturuluyor (1284x2778)..."
convert -size 1284x2778 xc:$COLOR -gravity center -pointsize 300 -fill white -annotate +0+0 "DmarJet" splash.png

echo "🌐 favicon.png oluşturuluyor (48x48)..."
convert -size 48x48 xc:$COLOR favicon.png

echo "✅ Tüm placeholder asset dosyaları oluşturuldu!"
echo ""
echo "⚠️  NOT: Bunlar sadece test için placeholder dosyalardır."
echo "📝 Production için profesyonel tasarım kullanmanız önerilir."





