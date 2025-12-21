# Google OAuth Kurulum Talimatları

## ⚠️ ÖNEMLİ: Cypjet Projesi Kullanılıyor!

**app.json** dosyası "Cypjet" projesine geri döndürüldü:
- ✅ Proje: jcnlqzuakjdwzqtdixgt (Cypjet)
- ✅ Bu projede Google OAuth zaten çalışıyor!

## ✅ Yapılması Gerekenler

### 1. Supabase Dashboard Ayarları

#### A. Redirect URLs Ekleyin
URL: https://supabase.com/dashboard/project/jcnlqzuakjdwzqtdixgt/auth/url-configuration

**Redirect URLs** bölümüne şunları ekleyin:
```
dmarjetmobile://google-auth
exp://**
dmarjetmobile://**
```

**ÖNEMLİ**: İlk sırada `dmarjetmobile://google-auth` olmalı!

#### B. Google Provider'ı Kontrol Edin
URL: https://supabase.com/dashboard/project/jcnlqzuakjdwzqtdixgt/auth/providers

1. **Google** provider'ını açın
2. **Enable** yapın
3. Google Cloud Console'dan alacağınız bilgileri girin:
   - **Client ID**: (Google Cloud Console'dan)
   - **Client Secret**: (Google Cloud Console'dan)
4. **Save** edin

### 2. Google Cloud Console Ayarları

#### A. OAuth 2.0 Client ID Oluşturun
URL: https://console.cloud.google.com/apis/credentials

1. **Create Credentials** > **OAuth Client ID** seçin
2. **Application type**: Web application
3. **Name**: DmarJet Mobile (veya istediğiniz isim)
4. **Authorized JavaScript origins**: (Boş bırakabilirsiniz)
5. **Authorized redirect URIs**: 
   ```
   https://jcnlqzuakjdwzqtdixgt.supabase.co/auth/v1/callback
   ```
6. **Create** edin
7. **Client ID** ve **Client Secret**'i kopyalayın

#### B. OAuth Consent Screen Yapılandırın
URL: https://console.cloud.google.com/apis/credentials/consent

1. **User Type**: External (veya Internal - organizasyon içiyse)
2. **App name**: DmarJet Mobile
3. **User support email**: Sizin email'iniz
4. **Developer contact information**: Sizin email'iniz
5. **Scopes**: 
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
6. **Save and Continue**

### 3. Test

```bash
# Uygulamayı başlatın
npx expo start --clear

# QR kodu okutun veya:
# - iOS için: i
# - Android için: a
```

### 4. Debug Log'ları

Terminal'de şunları göreceksiniz:
```
LOG  Redirect URL: exp://192.168.1.4:8081/--/auth/callback
LOG  Opening OAuth URL: https://accounts.google.com/...
LOG  OAuth Result: {type: "success", url: "exp://..."}
LOG  Tokens found: {accessToken: true, refreshToken: true}
LOG  Session created successfully
```

## ⚠️ Sorun Giderme

### Sorun: "OAuth authentication failed - no tokens received"
**Çözüm**: 
- Supabase Dashboard'da `exp://**` wildcard'ının eklendiğinden emin olun
- Google Cloud Console'da redirect URI'nin doğru olduğundan emin olun

### Sorun: Browser'dan geri dönmüyor
**Çözüm**:
- `useProxy: true` yapın (Expo Go için)
- `useProxy: false` yapın (Development build için)

### Sorun: "Invalid redirect URL"
**Çözüm**:
- Supabase Dashboard > URL Configuration'da wildcard ekleyin
- App'i yeniden başlatın

## 📱 Production Build İçin

Production build'de (`eas build` ile) şunları kullanın:

**Supabase Redirect URLs:**
```
dmarjetmobile://auth/callback
```

**authService.ts:**
```typescript
const redirectUrl = makeRedirectUri({
  scheme: 'dmarjetmobile',
  path: 'auth/callback',
  useProxy: false, // Production'da false
});
```

## 🔗 Faydalı Linkler

- Supabase Dashboard: https://supabase.com/dashboard/project/jcnlqzuakjdwzqtdixgt
- Google Cloud Console: https://console.cloud.google.com/apis/credentials
- Expo Documentation: https://docs.expo.dev/guides/authentication/

