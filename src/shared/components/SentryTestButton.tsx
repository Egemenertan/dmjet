/**
 * Sentry Test Button Component
 * Test butonu - Sentry'nin çalışıp çalışmadığını test etmek için
 */

import React from 'react';
import {TouchableOpacity, Text, StyleSheet, Alert} from 'react-native';
import * as Sentry from '@sentry/react-native';
import {colors, spacing, fontSize, fontWeight, borderRadius} from '@core/constants';

export const SentryTestButton: React.FC = () => {
  const handleTest = () => {
    console.log('🧪 Sentry testi başlatılıyor...');

    // Test 1: Breadcrumb ekle
    Sentry.addBreadcrumb({
      message: 'Test butonu tıklandı',
      category: 'user-action',
      level: 'info',
      data: {
        timestamp: new Date().toISOString(),
      },
    });

    // Test 2: Test mesajı gönder
    Sentry.captureMessage('Sentry Test Mesajı - Kurulum Başarılı! 🎉', 'info');

    // Test 3: Test hatası gönder
    Sentry.captureException(new Error('Sentry Test Hatası - Her şey çalışıyor!'));

    console.log('✅ Test mesajları gönderildi!');

    Alert.alert(
      'Sentry Test',
      'Test mesajları gönderildi!\n\nSentry dashboard\'ınızı kontrol edin:\nhttps://sentry.io/\n\nSonuçların görünmesi 10-30 saniye sürebilir.',
      [{text: 'Tamam'}]
    );
  };

  return (
    <TouchableOpacity style={styles.button} onPress={handleTest}>
      <Text style={styles.buttonText}>🧪 Sentry'yi Test Et</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#7B61FF',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginVertical: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
});







