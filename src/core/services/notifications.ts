import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

// Notification handler configuration
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
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      console.log('📱 Cihaz kontrolü yapılıyor...');
      
      // Fiziksel cihaz kontrolü
      if (!Device.isDevice) {
        console.warn('⚠️ UYARI: Push notification sadece fiziksel cihazlarda çalışır!');
        console.warn('⚠️ Şu anda emulator/simulator kullanıyorsunuz');
        return null;
      }
      
      console.log('✅ Fiziksel cihaz tespit edildi');

      // Mevcut izin durumunu kontrol et
      console.log('🔐 Bildirim izni kontrol ediliyor...');
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // İzin yoksa iste
      if (existingStatus !== 'granted') {
        console.log('❓ İzin isteniyor...');
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // İzin verilmediyse null dön
      if (finalStatus !== 'granted') {
        console.warn('❌ Bildirim izni verilmedi!');
        console.warn('💡 Ayarlar > Bildirimler > DmarJet > İzin Ver');
        return null;
      }
      
      console.log('✅ Bildirim izni var');

      // Expo push token al
      console.log('🎫 Expo push token alınıyor...');
      
      // EAS projectId varsa kullan, yoksa boş bırak (Expo Go için)
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      console.log('📋 Project ID:', projectId || 'YOK (Expo Go modu)');
      
      let tokenData;
      try {
        if (projectId) {
          // ProjectId varsa kullan (EAS Build)
          console.log('📋 EAS Build modu - Project ID kullanılıyor');
          tokenData = await Notifications.getExpoPushTokenAsync({ 
            projectId: projectId 
          });
        } else {
          // Expo Go modu - parametresiz çağır
          console.log('📋 Expo Go modu - projectId olmadan token alınıyor');
          tokenData = await Notifications.getExpoPushTokenAsync();
        }
        
        console.log('✅ Token alındı:', tokenData.data);
      } catch (tokenError: any) {
        console.error('❌ Token alma hatası:', tokenError);
        console.error('   Error message:', tokenError.message);
        
        // Hata durumunda Expo Go modu ile tekrar dene
        if (projectId) {
          console.log('🔄 ProjectId olmadan tekrar deneniyor...');
          try {
            tokenData = await Notifications.getExpoPushTokenAsync();
            console.log('✅ Token alındı (fallback):', tokenData.data);
          } catch (fallbackError) {
            console.error('❌ Fallback de başarısız:', fallbackError);
            throw fallbackError;
          }
        } else {
          throw tokenError;
        }
      }

      // Android için notification channel oluştur
      if (Platform.OS === 'android') {
        console.log('📢 Android notification channel oluşturuluyor...');
        await Notifications.setNotificationChannelAsync('orders', {
          name: 'Sipariş Bildirimleri',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('general', {
          name: 'Genel Bildirimler',
          importance: Notifications.AndroidImportance.DEFAULT,
          sound: 'default',
        });
      }

      return tokenData.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Push token'ı kullanıcı profiline kaydet
   */
  async savePushToken(userId: string, pushToken: string): Promise<boolean> {
    try {
      console.log('💾 Push token kaydediliyor...');
      console.log('   User ID:', userId);
      console.log('   Token:', pushToken.substring(0, 30) + '...');
      
      const { data, error } = await supabase
        .from('profiles')
        .update({
          push_token: pushToken,
          push_token_updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select();

      if (error) {
        console.error('❌ Push token kaydetme hatası:', error);
        console.error('   Error code:', error.code);
        console.error('   Error message:', error.message);
        console.error('   Error details:', error.details);
        return false;
      }

      if (!data || data.length === 0) {
        console.error('❌ Kullanıcı bulunamadı! User ID:', userId);
        return false;
      }

      console.log('✅ Push token başarıyla kaydedildi!');
      console.log('   Güncellenen kayıt:', data[0]);
      return true;
    } catch (error) {
      console.error('❌ Push token kaydetme exception:', error);
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

