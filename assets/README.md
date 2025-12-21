# Assets Klasörü

Bu klasör Expo uygulamanızın görsel varlıklarını içerir.

## Gerekli Dosyalar

Aşağıdaki dosyaları oluşturmanız gerekmektedir:

### 1. icon.png
- **Boyut**: 1024x1024 piksel
- **Format**: PNG
- **Açıklama**: Uygulama ikonu

### 2. adaptive-icon.png
- **Boyut**: 1024x1024 piksel
- **Format**: PNG
- **Açıklama**: Android adaptive icon

### 3. splash.png
- **Boyut**: 1284x2778 piksel (veya daha büyük)
- **Format**: PNG
- **Açıklama**: Açılış ekranı görseli

### 4. favicon.png
- **Boyut**: 48x48 piksel
- **Format**: PNG
- **Açıklama**: Web favicon

## Hızlı Çözüm

Geçici olarak test etmek için aşağıdaki komutu çalıştırabilirsiniz:

```bash
# Placeholder görseller oluştur (macOS/Linux)
convert -size 1024x1024 xc:#4A90E2 -gravity center -pointsize 200 -fill white -annotate +0+0 "D" icon.png
convert -size 1024x1024 xc:#4A90E2 -gravity center -pointsize 200 -fill white -annotate +0+0 "D" adaptive-icon.png
convert -size 1284x2778 xc:#4A90E2 -gravity center -pointsize 300 -fill white -annotate +0+0 "DmarJet" splash.png
convert -size 48x48 xc:#4A90E2 favicon.png
```

Veya online araçlar kullanabilirsiniz:
- https://www.figma.com
- https://www.canva.com
- https://appicon.co




