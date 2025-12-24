# Supabase Migrations

Bu klasör Supabase veritabanı migration'larını içerir.

## Migration'ları Çalıştırma

### Manuel Olarak (Supabase Dashboard)

1. [Supabase Dashboard](https://app.supabase.com) üzerinden projenize giriş yapın
2. Sol menüden **SQL Editor** seçeneğine tıklayın
3. Migration dosyasını (`migrations/add_aile_karti_to_profiles.sql`) açın
4. SQL kodunu kopyalayıp SQL Editor'e yapıştırın
5. **Run** butonuna tıklayın

### Supabase CLI ile

```bash
# Supabase CLI kurulu değilse:
npm install -g supabase

# Migration'ı çalıştır:
supabase db push
```

## Son Eklenen Migration

### `add_aile_karti_to_profiles.sql`

**Tarih:** 2025-12-20

**Açıklama:**

- `profiles` tablosuna `aile_karti` (TEXT) kolonu eklendi
- Bu kolon kullanıcıların aile kartı numaralarını saklamak için kullanılacak

**Değişiklikler:**

- ✅ `profiles` tablosuna `aile_karti` kolonu eklendi
- ✅ TypeScript tipleri güncellendi
- ✅ Profile service oluşturuldu
- ✅ ProfileScreen'e UI eklendi
- ✅ Çeviri dosyaları güncellendi (TR, EN, RU)

## Kullanım

Kullanıcılar artık profil sayfasından aile kartı numaralarını ekleyebilir ve güncelleyebilir.

```typescript
// Aile kartı güncelleme
await profileService.updateFamilyCard(userId, '1234567890');

// Profil bilgilerini çekme
const profile = await profileService.getProfile(userId);
console.log(profile.aile_karti); // '1234567890'
```


