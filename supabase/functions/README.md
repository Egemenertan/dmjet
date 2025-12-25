# Supabase Edge Functions

Bu klasör Supabase Edge Functions'ları içerir.

## 📦 Mevcut Functions

### `google-places-proxy`

Google Places API için güvenli proxy. API key'i client-side'da expose etmeden Google Maps API'lerini kullanmanızı sağlar.

**Endpoints:**
- `/autocomplete` - Places Autocomplete
- `/details` - Place Details

**Avantajları:**
- ✅ API key güvenliği
- ✅ IP kısıtlaması sorunu yok
- ✅ Rate limiting eklenebilir
- ✅ Production-ready

## 🚀 Deployment

### 1. Supabase CLI Kurulumu

```bash
npm install -g supabase
```

### 2. Supabase'e Login

```bash
supabase login
```

### 3. Project ID'yi Bul

```bash
supabase projects list
```

veya Supabase Dashboard'dan Project Settings > General > Reference ID

### 4. Google Maps API Key'i Secret Olarak Ekle

```bash
# Project ID'nizi kullanın
supabase secrets set GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here --project-ref your-project-id
```

**Önemli:** Google Cloud Console'da bu API key için:
- Places API (New) aktif olmalı
- Geocoding API aktif olmalı
- **Application restrictions:** None (Supabase Edge Functions IP'lerinden gelecek)
- **API restrictions:** Sadece Places API ve Geocoding API

### 5. Function'ı Deploy Et

```bash
# Tek function deploy
supabase functions deploy google-places-proxy --project-ref your-project-id

# Tüm functions'ları deploy
supabase functions deploy --project-ref your-project-id
```

### 6. Function URL'ini Al

Deploy sonrası URL şu formatta olacak:
```
https://[project-ref].supabase.co/functions/v1/google-places-proxy
```

Bu URL otomatik olarak Supabase client tarafından kullanılacak.

## 🧪 Test Etme

### Autocomplete Test

```bash
curl -X POST 'https://[project-ref].supabase.co/functions/v1/google-places-proxy/autocomplete' \
  -H 'Authorization: Bearer [anon-key]' \
  -H 'Content-Type: application/json' \
  -d '{
    "input": "Lefkoşa",
    "location": "35.185566,33.382276",
    "radius": 80000,
    "language": "tr"
  }'
```

### Place Details Test

```bash
curl -X POST 'https://[project-ref].supabase.co/functions/v1/google-places-proxy/details' \
  -H 'Authorization: Bearer [anon-key]' \
  -H 'Content-Type: application/json' \
  -d '{
    "placeId": "ChIJxxxx",
    "language": "tr"
  }'
```

## 📝 Notlar

- Edge Functions Deno runtime kullanır
- TypeScript desteği built-in
- CORS otomatik olarak handle edilir
- Function loglarını `supabase functions logs google-places-proxy` ile görebilirsiniz

## 🔒 Güvenlik

- API key asla client-side'a expose edilmez
- Sadece Supabase authenticated istekler kabul edilir
- Rate limiting eklenebilir (opsiyonel)

## 💰 Maliyet

Supabase Edge Functions:
- İlk 500,000 istek/ay ücretsiz
- Sonrası $2 per 1M istek

Google Maps API:
- Places Autocomplete: $2.83 per 1,000 requests (ilk $200 ücretsiz)
- Place Details: $17 per 1,000 requests (ilk $200 ücretsiz)

## 🐛 Sorun Giderme

### "Function not found" hatası
```bash
# Function'ı tekrar deploy edin
supabase functions deploy google-places-proxy --project-ref your-project-id
```

### "GOOGLE_MAPS_API_KEY not configured" hatası
```bash
# Secret'ı kontrol edin
supabase secrets list --project-ref your-project-id

# Eksikse ekleyin
supabase secrets set GOOGLE_MAPS_API_KEY=your_key --project-ref your-project-id
```

### CORS hatası
- `_shared/cors.ts` dosyasında CORS headers doğru ayarlanmış
- Function'ı tekrar deploy edin

## 📚 Daha Fazla Bilgi

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [Google Places API Docs](https://developers.google.com/maps/documentation/places/web-service)




