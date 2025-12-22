/**
 * Push Token Test Script
 * Supabase'deki push token'ları kontrol eder ve test bildirimi gönderir
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://jcnlqzuakjdwzqtdixgt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjbmxxenVha2pkd3pxdGRpeGd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MzI2MjIsImV4cCI6MjA2NTMwODYyMn0.QJPNQf_fThoRHs7z6HWn7L03BkUeNr-ljNwjkDW-55Y';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkPushTokens() {
  console.log('🔍 Push token durumu kontrol ediliyor...\n');

  // Tüm kullanıcıları kontrol et
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, push_token, push_token_updated_at, role')
    .order('push_token_updated_at', { ascending: false, nullsFirst: false });

  if (error) {
    console.error('❌ Hata:', error);
    return;
  }

  console.log(`📊 Toplam kullanıcı: ${profiles.length}`);
  
  const withToken = profiles.filter(p => p.push_token);
  const withoutToken = profiles.filter(p => !p.push_token);
  
  console.log(`✅ Push token olan: ${withToken.length}`);
  console.log(`❌ Push token olmayan: ${withoutToken.length}\n`);

  if (withToken.length > 0) {
    console.log('📱 Push token olan kullanıcılar:');
    withToken.slice(0, 5).forEach((p, i) => {
      console.log(`\n${i + 1}. ${p.full_name || p.email}`);
      console.log(`   Email: ${p.email}`);
      console.log(`   Role: ${p.role || 'user'}`);
      console.log(`   Token: ${p.push_token.substring(0, 40)}...`);
      console.log(`   Güncelleme: ${p.push_token_updated_at}`);
    });
  }

  if (withoutToken.length > 0) {
    console.log('\n\n⚠️ Push token olmayan kullanıcılar (ilk 5):');
    withoutToken.slice(0, 5).forEach((p, i) => {
      console.log(`${i + 1}. ${p.full_name || p.email} (${p.email})`);
    });
  }

  // Bildirim istatistikleri
  console.log('\n\n📬 Bildirim İstatistikleri:');
  const { data: notifications } = await supabase
    .from('notifications')
    .select('status, count')
    .order('created_at', { ascending: false })
    .limit(100);

  if (notifications && notifications.length > 0) {
    const statusCounts = {};
    notifications.forEach(n => {
      statusCounts[n.status] = (statusCounts[n.status] || 0) + 1;
    });
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      const emoji = status === 'sent' ? '✅' : status === 'failed' ? '❌' : '⏳';
      console.log(`${emoji} ${status}: ${count}`);
    });
  }

  // Son başarısız bildirimi göster
  const { data: failedNotif } = await supabase
    .from('notifications')
    .select('*')
    .eq('status', 'failed')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (failedNotif) {
    console.log('\n\n❌ Son başarısız bildirim:');
    console.log(`   Başlık: ${failedNotif.title}`);
    console.log(`   Hata: ${failedNotif.failed_reason}`);
    console.log(`   Tarih: ${failedNotif.created_at}`);
  }
}

// Script'i çalıştır
checkPushTokens()
  .then(() => {
    console.log('\n\n✅ Kontrol tamamlandı!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n\n❌ Hata:', error);
    process.exit(1);
  });







