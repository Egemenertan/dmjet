/**
 * Push Notification Test Component
 * Push notification sistemini test etmek için
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@core/constants';
import { useNotificationContext } from '@core/contexts/NotificationContext';
import { notificationService } from '@core/services/notifications';
import { sendTestNotification, checkNotificationSettings, processPendingNotificationsManually } from '@core/services/testNotification';
import { useAuthStore } from '@store/slices/authStore';

export const PushNotificationTest: React.FC = () => {
  const { expoPushToken, initializePushNotifications } = useNotificationContext();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<any>(null);

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

  // Bildirim durumunu yükle
  useEffect(() => {
    if (user?.id) {
      loadNotificationStatus();
    }
  }, [user?.id]);

  const loadNotificationStatus = async () => {
    if (!user?.id) return;
    
    try {
      const status = await checkNotificationSettings(user.id);
      setNotificationStatus(status);
    } catch (error) {
      console.error('Bildirim durumu yüklenemedi:', error);
    }
  };

  const handleSendTestNotification = async () => {
    if (!user?.id) {
      Alert.alert('Hata', 'Kullanıcı bulunamadı');
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendTestNotification({
        userId: user.id,
        title: 'Test Bildirimi 🔔',
        body: `Merhaba ${user.full_name || 'Kullanıcı'}! Bu bir test bildirimidir.`,
        type: 'promotional',
        data: { 
          test: true, 
          timestamp: new Date().toISOString(),
          source: 'manual_test'
        },
      });

      if (result.success) {
        Alert.alert('Başarılı', `Test bildirimi oluşturuldu!\nID: ${result.notificationId}\n\nBildirim 2-3 saniye içinde işlenecek.`);
        // Durumu yenile
        setTimeout(loadNotificationStatus, 3000);
      } else {
        Alert.alert('Hata', result.error || 'Bildirim gönderilemedi');
      }
    } catch (error) {
      Alert.alert('Hata', 'Bildirim gönderilemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProcessPending = async () => {
    setIsLoading(true);
    try {
      const result = await processPendingNotificationsManually();
      if (result.success) {
        Alert.alert('Başarılı', `İşleme tamamlandı!\nGönderilen: ${result.sent}\nBaşarısız: ${result.failed}`);
        // Durumu yenile
        setTimeout(loadNotificationStatus, 2000);
      } else {
        Alert.alert('Hata', result.error || 'İşleme başarısız');
      }
    } catch (error) {
      Alert.alert('Hata', 'İşleme başarısız');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔔 Push Notification Test Panel</Text>
      
      {/* Push Token Bilgisi */}
      <View style={styles.infoBox}>
        <Text style={styles.infoLabel}>Push Token:</Text>
        <Text style={styles.infoValue}>
          {expoPushToken ? `${expoPushToken.substring(0, 30)}...` : 'Yok'}
        </Text>
      </View>

      {/* Bildirim Durumu */}
      {notificationStatus && (
        <View style={styles.statusBox}>
          <Text style={styles.statusTitle}>📊 Bildirim Durumu</Text>
          <Text style={styles.statusText}>
            👤 Kullanıcı: {notificationStatus.user.name}{'\n'}
            📱 Token: {notificationStatus.user.hasPushToken ? '✅ Var' : '❌ Yok'}{'\n'}
            ⏳ Bekleyen: {notificationStatus.pendingCount}{'\n'}
            ✅ Gönderilen: {notificationStatus.recentSentCount}{'\n'}
            ❌ Başarısız: {notificationStatus.recentFailedCount}
          </Text>
        </View>
      )}

      {/* Butonlar */}
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
        <>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleSendTestNotification}
            disabled={isLoading}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              🧪 Test Bildirimi Gönder
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.warningButton]}
            onPress={handleProcessPending}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              ⚡ Pending Bildirimleri İşle
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.infoButton]}
            onPress={loadNotificationStatus}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              📊 Durumu Yenile
            </Text>
          </TouchableOpacity>
        </>
      )}

      {/* Yardım Bilgisi */}
      <View style={styles.helpBox}>
        <Text style={styles.helpTitle}>ℹ️ Kullanım Kılavuzu:</Text>
        <Text style={styles.helpText}>
          1. 📱 Önce "Token Kaydet" butonuna basın{'\n'}
          2. 🧪 "Test Bildirimi Gönder" ile test edin{'\n'}
          3. ⚡ "Pending Bildirimleri İşle" ile manuel işleyin{'\n'}
          4. 📊 "Durumu Yenile" ile güncel durumu görün{'\n\n'}
          ⚠️ Önemli: Fiziksel cihaz gereklidir!{'\n'}
          📱 Emulator'de push notification çalışmaz{'\n'}
          ⏱️ Bildirimler 2-3 saniye içinde gelir
        </Text>
      </View>
    </ScrollView>
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
  warningButton: {
    backgroundColor: colors.warning,
  },
  infoButton: {
    backgroundColor: colors.info,
  },
  statusBox: {
    backgroundColor: colors.success + '15',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  statusTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.success,
    marginBottom: spacing.sm,
  },
  statusText: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
    lineHeight: 20,
    fontFamily: 'monospace',
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








