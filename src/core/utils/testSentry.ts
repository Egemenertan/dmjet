/**
 * Sentry Test Utility
 * Bu dosyayı kullanarak Sentry'nin çalışıp çalışmadığını test edebilirsiniz
 */

import * as Sentry from '@sentry/react-native';

/**
 * Test mesajı gönder
 */
export const testSentryMessage = () => {
  console.log('📤 Sentry test mesajı gönderiliyor...');
  Sentry.captureMessage('Sentry Test Mesajı - DmarJet Mobile', 'info');
  console.log('✅ Test mesajı gönderildi! Sentry dashboard\'ınızı kontrol edin.');
};

/**
 * Test hatası gönder
 */
export const testSentryError = () => {
  console.log('📤 Sentry test hatası gönderiliyor...');
  try {
    throw new Error('Sentry Test Hatası - Bu bir test hatasıdır');
  } catch (error) {
    Sentry.captureException(error);
    console.log('✅ Test hatası gönderildi! Sentry dashboard\'ınızı kontrol edin.');
  }
};

/**
 * Test breadcrumb ekle
 */
export const testSentryBreadcrumb = () => {
  console.log('📤 Sentry breadcrumb ekleniyor...');
  Sentry.addBreadcrumb({
    message: 'Test Breadcrumb',
    category: 'test',
    level: 'info',
    data: {
      testData: 'Bu bir test breadcrumb\'dur',
      timestamp: new Date().toISOString(),
    },
  });
  console.log('✅ Breadcrumb eklendi!');
};

/**
 * Tüm testleri çalıştır
 */
export const runAllSentryTests = () => {
  console.log('🧪 Sentry testleri başlatılıyor...\n');
  
  testSentryBreadcrumb();
  setTimeout(() => {
    testSentryMessage();
  }, 1000);
  
  setTimeout(() => {
    testSentryError();
  }, 2000);
  
  console.log('\n✅ Tüm testler tamamlandı!');
  console.log('📊 Sentry dashboard\'ınızı kontrol edin: https://sentry.io/');
  console.log('⏱️  Sonuçların görünmesi birkaç saniye sürebilir.');
};






