# Android Build Düzeltmeleri

## Yapılan Değişiklikler

### 1. Gradle Versiyonu Güncellendi
**Dosya:** `android/gradle/wrapper/gradle-wrapper.properties`
- **Eski:** `gradle-8.10.2-all.zip`
- **Yeni:** `gradle-8.13-all.zip`
- **Sebep:** Android Gradle Plugin 8.7.3 minimum Gradle 8.13 gerektiriyor

### 2. Android Gradle Plugin (AGP) Versiyonu Eklendi
**Dosya:** `android/build.gradle`
```gradle
ext {
    androidGradlePluginVersion = "8.7.3"
}
dependencies {
    classpath("com.android.tools.build:gradle:$androidGradlePluginVersion")
    classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlinVersion")
}
```
- **Sebep:** AGP versiyonu açıkça belirtilmediğinde uyumsuzluk sorunları oluşuyor

### 3. EAS Build Yapılandırması İyileştirildi
**Dosya:** `eas.json`
- Her build profili için explicit Gradle komutları eklendi
- Cache ayarları yapılandırıldı
- iOS build configuration eklendi

## Versiyon Uyumluluğu

| Bileşen | Versiyon | Notlar |
|---------|----------|--------|
| React Native | 0.81.5 | Mevcut versiyon |
| Gradle | 8.13 | AGP 8.7.3 için minimum |
| Android Gradle Plugin | 8.7.3 | Gradle 8.13+ gerektirir |
| Kotlin | 2.1.0 | Expo modules ile uyumlu |
| Java | 17 | Kotlin 2.1.0 için gerekli |
| Build Tools | 35.0.0 | En güncel |
| Compile SDK | 35 | Android 15 |
| Target SDK | 34 | Android 14 |
| Min SDK | 24 | Android 7.0 |

## Build Komutları

### Local Build Test
```bash
cd android
./gradlew clean
./gradlew assembleRelease
```

### EAS Build

**ÖNEMLİ:** İlk build için mutlaka `production-clean` profilini kullanın:

```bash
# İLK BUILD - Cache temizleyerek (ÖNERİLEN)
eas build --platform android --profile production-clean

# Normal production build (sonraki buildler için)
eas build --platform android --profile production

# Preview build (APK)
eas build --platform android --profile preview

# Manuel cache temizleme
eas build --platform android --profile production --clear-cache
```

**Neden production-clean?**
- Gradle cache'i tamamen temizler
- Kotlin versiyon çakışmalarını önler
- Tüm bağımlılıkları sıfırdan indirir
- İlk build için en güvenli seçenek

## Sorun Giderme

### Hata: "Minimum supported Gradle version is 8.13"
**Çözüm:** `android/gradle/wrapper/gradle-wrapper.properties` dosyasında Gradle versiyonunu kontrol edin.

### Hata: "Failed to apply plugin 'com.android.internal.version-check'"
**Çözüm:** 
1. AGP versiyonunun `android/build.gradle` dosyasında açıkça belirtildiğinden emin olun
2. Gradle versiyonunun AGP versiyonu ile uyumlu olduğunu kontrol edin

### Build Cache Sorunları
```bash
# Local cache temizleme
cd android
./gradlew clean
rm -rf .gradle build app/build

# EAS cache temizleme
eas build --platform android --clear-cache
```

## Gelecek Güncellemeler İçin Kontrol Listesi

- [ ] React Native güncellenmeden önce AGP ve Gradle uyumluluğunu kontrol et
- [ ] AGP güncellendiğinde Gradle versiyonunu kontrol et
- [ ] Gradle güncellendiğinde AGP uyumluluğunu kontrol et
- [ ] Her zaman [AGP Release Notes](https://developer.android.com/studio/releases/gradle-plugin) kontrol et
- [ ] [Gradle Compatibility Matrix](https://developer.android.com/studio/releases/gradle-plugin#updating-gradle) kontrol et

## Önemli Notlar

1. **Gradle ve AGP Versiyonları Birbirine Bağlıdır:** AGP her versiyonu belirli bir Gradle versiyon aralığı gerektirir.

2. **React Native Uyumluluğu:** React Native versiyonunu değiştirmeden AGP/Gradle güncellemesi yapmak güvenlidir, ancak test edilmelidir.

3. **EAS Build:** EAS build sunucusu her zaman repository'deki en son commit'i kullanır. Local değişiklikler push edilmeden build'e yansımaz.

4. **Cache:** Build sorunları yaşandığında ilk adım cache temizlemek olmalıdır.

## Yapılan Tüm Düzeltmeler

### 1. Gradle Versiyon Uyumsuzluğu
**Hata:** `Minimum supported Gradle version is 8.13. Current version is 8.10.2`
**Çözüm:** `gradle-wrapper.properties` dosyasında Gradle 8.13'e güncelleme

### 2. Android Gradle Plugin Eksikliği
**Hata:** Version check hatası
**Çözüm:** `android/build.gradle` dosyasına AGP 8.7.3 versiyonu eklendi

### 3. Expo Modules Entegrasyonu Eksikliği
**Hata:** `unable to resolve class expo.modules.plugin.gradle.ExpoModuleExtension`
**Çözüm:** 
- `expo-modules-core` paketi eklendi
- `android/settings.gradle` dosyasına Expo autolinking eklendi
- `android/build.gradle` dosyasına Expo maven repository eklendi
- `MainApplication.kt` dosyasına `ReactNativeHostWrapper` ve `ApplicationLifecycleDispatcher` eklendi
- `MainActivity.kt` dosyasına `ReactActivityDelegateWrapper` eklendi

### 4. Kotlin Versiyon Uyumsuzluğu
**Hata:** `Module was compiled with an incompatible version of Kotlin. The binary version of its metadata is 2.1.0, expected version is 1.9.0`
**Çözüm:**
- Kotlin versiyonu 1.9.24 → 2.1.0'a güncellendi
- `android/gradle.properties` dosyasına Kotlin konfigürasyonu eklendi
- `android/app/build.gradle` dosyasına Java 17 compile options ve Kotlin JVM target eklendi
- **Resolution Strategy:** Tüm modüllerde Kotlin 2.1.0 zorlaması eklendi
- **EAS Config:** `production-clean` profili eklendi (cache temizleme + clean build)
- **Environment Variables:** Kotlin versiyon env variable eklendi
- `.easignore` dosyası oluşturuldu

## Commit Geçmişi

- `affa8e9`: Gradle 8.13'e güncelleme
- `02f9f32`: AGP 8.7.3 ekleme ve EAS yapılandırması
- `95a2224`: Expo modules entegrasyonu ve native configuration
- `c42f131`: Dokümantasyon güncelleme
- `7d46f41`: Kotlin 2.1.0 + Java 17 güncelleme
- `c8ed7e0`: Dokümantasyon güncelleme
- `155a54a`: **Kotlin resolution strategy + production-clean profili (KRİTİK)**

## Referanslar

- [Android Gradle Plugin Release Notes](https://developer.android.com/studio/releases/gradle-plugin)
- [Gradle Compatibility Matrix](https://developer.android.com/studio/releases/gradle-plugin#updating-gradle)
- [React Native Android Setup](https://reactnative.dev/docs/environment-setup)
- [EAS Build Configuration](https://docs.expo.dev/build/eas-json/)


