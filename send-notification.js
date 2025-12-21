const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jcnlqzuakjdwzqtdixgt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjbmxxenVha2pkd3pxdGRpeGd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MzI2MjIsImV4cCI6MjA2NTMwODYyMn0.QJPNQf_fThoRHs7z6HWn7L03BkUeNr-ljNwjkDW-55Y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function sendNotification() {
  console.log('🔔 Bildirim gönderiliyor...\n');
  
  try {
    const { data, error } = await supabase.functions.invoke('send-push-notifications', {
      body: {}
    });

    if (error) {
      console.error('❌ Hata:', error);
      return;
    }

    console.log('✅ Sonuç:');
    console.log('  - Gönderilen:', data.sent);
    console.log('  - Başarısız:', data.failed);
    console.log('  - Toplam:', data.total);
    console.log('\n📱 30 saniye içinde telefonda bildirim gelecek!');
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }
}

sendNotification();

