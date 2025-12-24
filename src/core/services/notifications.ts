import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

// Notification handler configuration - Bildirimlerin nasıl gösterileceğini belirler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  orderId?: string;
  orderStatus?: string;
  type: 'order_status' | 'order_created' | 'promotional' | 'coupon' | 'delivery' | 'reminder' | 'welcome' | 'achievement';
  [key: string]: any;
}

export interface SendNotificationParams {
  userId: string;
  title: string;
  body: string;
  data?: NotificationData;
  type: NotificationData['type'];
}

/**
 * Push notification servisi
 * Expo push notification sistemi kullanarak bildirim gönderir
 */
class NotificationService {
  /**
   * Push notification izni iste ve token al
   * Yeniden tasarlanmış ve geliştirilmiş versiyon
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      // Fiziksel cihaz kontrolü
      if (!Device.isDevice) {
        console.warn('⚠️ Push notification: Emulator kullanımı - fiziksel cihaz gerekli');
        return 'simulator-token-placeholder';
      }

      // Mevcut izin durumunu kontrol et
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // İzin yoksa iste
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
            allowDisplayInCarPlay: true,
            allowCriticalAlerts: false,
            provideAppNotificationSettings: true,
            allowProvisional: false,
            allowAnnouncements: false,
          },
        });
        finalStatus = status;
      }

      // İzin verilmediyse null dön
      if (finalStatus !== 'granted') {
        console.warn('❌ Push notification izni verilmedi - Ayarlar > Bildirimler > DmarJet');
        return null;
      }

      // Android icin notification channellari olustur (iOS'ta otomatik)
      if (Platform.OS === 'android') {
        // Siparis bildirimleri icin yuksek oncelikli kanal
        await Notifications.setNotificationChannelAsync('orders', {
          name: 'Siparis Bildirimleri',
          description: 'Siparis durumu ve teslimat bildirimleri',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF6B35',
          sound: 'default',
          enableLights: true,
          enableVibrate: true,
          showBadge: true,
        });

        // Genel bildirimler icin normal oncelikli kanal
        await Notifications.setNotificationChannelAsync('general', {
          name: 'Genel Bildirimler',
          description: 'Promosyonlar ve genel bilgilendirmeler',
          importance: Notifications.AndroidImportance.DEFAULT,
          sound: 'default',
          enableLights: true,
          enableVibrate: true,
          showBadge: true,
        });

        // Kupon ve firsatlar icin ozel kanal
        await Notifications.setNotificationChannelAsync('promotions', {
          name: 'Kupon ve Firsatlar',
          description: 'Indirim kuponlari ve ozel firsatlar',
          importance: Notifications.AndroidImportance.HIGH,
          sound: 'default',
          enableLights: true,
          enableVibrate: false,
          showBadge: true,
        });
      }

      // Expo push token al
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      let tokenData;
      try {
        if (projectId) {
          tokenData = await Notifications.getExpoPushTokenAsync({ 
            projectId: projectId 
          });
        } else {
          tokenData = await Notifications.getExpoPushTokenAsync();
        }
        
        return tokenData.data;
      } catch (tokenError: any) {
        console.error('❌ Push token alma hatası:', tokenError.message);
        
        // Fallback: ProjectId olmadan dene
        if (projectId) {
          try {
            tokenData = await Notifications.getExpoPushTokenAsync();
            return tokenData.data;
          } catch (fallbackError) {
            throw fallbackError;
          }
        } else {
          throw tokenError;
        }
      }
    } catch (error) {
      console.error('❌ Push notification kayıt hatası:', error);
      return null;
    }
  }

  /**
   * Push token'ı kullanıcı profiline kaydet
   * Retry logic for OAuth session initialization
   */
  async savePushToken(userId: string, pushToken: string, retryCount: number = 0): Promise<boolean> {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1 second

    try {
      // First check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) {
        // If RLS error (profile might exist but RLS blocking), retry
        if (profileError.code === 'PGRST116' && retryCount < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          return this.savePushToken(userId, pushToken, retryCount + 1);
        }
        console.error('❌ Profil kontrolü hatası:', profileError.message);
        return false;
      }

      if (!profile) {
        // Profile doesn't exist yet, retry after delay
        if (retryCount < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          return this.savePushToken(userId, pushToken, retryCount + 1);
        }
        console.warn('⚠️ Profil henüz oluşturulmadı, push token kaydedilemedi:', userId);
        return false;
      }

      // Profile exists, update push token
      const { data, error } = await supabase
        .from('profiles')
        .update({
          push_token: pushToken,
          push_token_updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select();

      if (error) {
        // If RLS error, retry
        if ((error.code === 'PGRST116' || error.code === '42501') && retryCount < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          return this.savePushToken(userId, pushToken, retryCount + 1);
        }
        console.error('❌ Push token kaydetme hatası:', error.message);
        return false;
      }

      if (!data || data.length === 0) {
        if (retryCount < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          return this.savePushToken(userId, pushToken, retryCount + 1);
        }
        console.error('❌ Kullanıcı bulunamadı:', userId);
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ Push token kaydetme hatası:', error);
      return false;
    }
  }

  /**
   * Push token'ı sil (logout durumunda)
   */
  async removePushToken(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          push_token: null,
        })
        .eq('id', userId);

      if (error) {
        console.error('Error removing push token:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error removing push token:', error);
      return false;
    }
  }

  /**
   * Bildirim gönder (Supabase üzerinden)
   */
  async sendNotification(params: SendNotificationParams): Promise<boolean> {
    try {
      const { userId, title, body, data, type } = params;

      // Kullanıcının push token'ını al
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('push_token')
        .eq('id', userId)
        .single();

      if (profileError || !profile?.push_token) {
        console.warn('User has no push token:', userId);
        return false;
      }

      // Kullanıcının bildirim ayarlarını kontrol et
      const { data: settings } = await supabase
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Bildirim türüne göre ayarları kontrol et
      if (settings) {
        if (!settings.push_notifications) {
          console.log('User has disabled push notifications');
          return false;
        }

        // Sipariş bildirimleri kontrolü
        if (type === 'order_status' && !settings.order_status_updates) {
          return false;
        }
        if (type === 'order_created' && !settings.order_confirmations) {
          return false;
        }
        if (type === 'delivery' && !settings.delivery_notifications) {
          return false;
        }
        if (type === 'promotional' && !settings.promotional_offers) {
          return false;
        }
      }

      // Notification kaydı oluştur
      const { error: insertError } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          body,
          data: data || {},
          type,
          status: 'pending',
          expo_push_token: profile.push_token,
        });

      if (insertError) {
        console.error('Error inserting notification:', insertError);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  /**
   * Toplu bildirim gönder (courier ve picker'lara)
   */
  async sendBulkNotification(
    role: 'courier' | 'picker' | 'admin',
    title: string,
    body: string,
    data?: NotificationData
  ): Promise<number> {
    try {
      // Belirtilen role sahip kullanıcıları al
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, push_token')
        .eq('role', role)
        .not('push_token', 'is', null);

      if (error || !users || users.length === 0) {
        console.warn('No users found with role:', role);
        return 0;
      }

      let successCount = 0;

      // Her kullanıcıya bildirim gönder
      for (const user of users) {
        const success = await this.sendNotification({
          userId: user.id,
          title,
          body,
          data: data || { type: 'order_created' },
          type: data?.type || 'order_created',
        });

        if (success) successCount++;
      }

      return successCount;
    } catch (error) {
      console.error('Error sending bulk notification:', error);
      return 0;
    }
  }

  /**
   * Okunmamış bildirim sayısını al
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('get_unread_notification_count')
        .eq('user_id', userId);

      if (error) {
        console.error('Error getting unread count:', error);
        return 0;
      }

      return data || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  /**
   * Bildirimi okundu olarak işaretle
   */
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .rpc('mark_notification_read', { notification_id: notificationId });

      if (error) {
        console.error('Error marking notification as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  /**
   * Kullanıcının tüm bildirimlerini al
   */
  async getUserNotifications(userId: string, limit: number = 50) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error getting notifications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting notifications:', error);
      return [];
    }
  }

  /**
   * Notification listener ekle
   */
  addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  /**
   * Notification response listener ekle (bildirime tıklandığında)
   */
  addNotificationResponseReceivedListener(
    callback: (response: Notifications.NotificationResponse) => void
  ) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  /**
   * Tüm bildirimleri temizle
   */
  async clearAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
  }

  /**
   * Badge sayısını ayarla
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }
}

export const notificationService = new NotificationService();

