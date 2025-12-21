/**
 * Push Notification Test Component
 * Push notification sistemini test etmek için
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@core/constants';
import { useNotificationContext } from '@core/contexts/NotificationContext';
import { notificationService } from '@core/services/notifications';
import { useAuthStore } from '@store/slices/authStore';

export const PushNotificationTest: React.FC = () => {
  const { expoPushToken, initializePushNotifications } = useNotificationContext();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const handleRegisterToken = async () => {
    setIsLoading(true);
    try {
      await initializePushNotifications();
      Alert.alert('Başarılı', 'Push token kaydedildi!');
    } catch (error) {
      Alert.alert('Hata', 'Push token kaydedilemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendTestNotification = async () => {
    if (!user?.id) {
      Alert.alert('Hata', 'Kullanıcı bulunamadı');
      return;
    }

    setIsLoading(true);
    try {
      await notificationService.sendNotification({
        userId: user.id,
        title: 'Test Bildirimi 🔔',
        body: 'Bu bir test bildirimidir',
        type: 'promotional',
        data: { test: true },
      });
      Alert.alert('Başarılı', 'Test bildirimi gönderildi!');
    } catch (error) {
      Alert.alert('Hata', 'Bildirim gönderilemedi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔔 Push Notification Test</Text>
      
      <View style={styles.infoBox}>
        <Text style={styles.infoLabel}>Push Token:</Text>
        <Text style={styles.infoValue}>
          {expoPushToken ? `${expoPushToken.substring(0, 20)}...` : 'Yok'}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, styles.primaryButton]}
        onPress={handleRegisterToken}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {expoPushToken ? '🔄 Token Yenile' : '📱 Token Kaydet'}
        </Text>
      </TouchableOpacity>

      {expoPushToken && (
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleSendTestNotification}
          disabled={isLoading}
        >
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>
            🧪 Test Bildirimi Gönder
          </Text>
        </TouchableOpacity>
      )}

      <View style={styles.helpBox}>
        <Text style={styles.helpTitle}>ℹ️ Bilgi:</Text>
        <Text style={styles.helpText}>
          • Push notification çalışması için token gereklidir{'\n'}
          • Token fiziksel cihazda otomatik alınır{'\n'}
          • Emulator'de push notification çalışmaz{'\n'}
          • Test bildirimi 30 saniye içinde gelecektir
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    gap: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  infoBox: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  infoValue: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
    fontFamily: 'monospace',
  },
  button: {
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  buttonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  secondaryButtonText: {
    color: colors.primary,
  },
  helpBox: {
    backgroundColor: colors.info + '15',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.info + '30',
    marginTop: spacing.sm,
  },
  helpTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.info,
    marginBottom: spacing.sm,
  },
  helpText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});

