/**
 * Test Notification Service
 * Push notification sistemini test etmek için yardımcı fonksiyonlar
 */

import { supabase } from './supabase';
import { notificationProcessor } from './notificationProcessor';

export interface TestNotificationParams {
  userId: string;
  title: string;
  body: string;
  type?: 'order_status' | 'order_created' | 'promotional' | 'coupon' | 'delivery' | 'reminder' | 'welcome' | 'achievement';
  data?: any;
}

/**
 * Test bildirimi gönder
 */
export async function sendTestNotification(params: TestNotificationParams): Promise<{
  success: boolean;
  notificationId?: string;
  error?: string;
}> {
  try {
    // Kullanıcının push token'ını kontrol et
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('push_token, full_name')
      .eq('id', params.userId)
      .single();

    if (profileError || !profile) {
      return { success: false, error: 'Kullanıcı bulunamadı' };
    }

    if (!profile.push_token) {
      return { success: false, error: 'Push token bulunamadı' };
    }

    // Test bildirimi oluştur
    const { data: notification, error: insertError } = await supabase
      .from('notifications')
      .insert({
        user_id: params.userId,
        title: params.title,
        body: params.body,
        data: params.data || { test: true, timestamp: new Date().toISOString() },
        type: params.type || 'reminder',
        status: 'pending',
        expo_push_token: profile.push_token,
      })
      .select()
      .single();

    if (insertError) {
      return { success: false, error: insertError.message };
    }

    // Hemen işlemeye al (3 saniye bekle)
    setTimeout(async () => {
      await notificationProcessor.processPendingNotifications();
    }, 3000);

    return {
      success: true,
      notificationId: notification.id,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Kullanıcının bildirim ayarlarını kontrol et
 */
export async function checkNotificationSettings(userId: string) {
  try {

    // Kullanıcı profili ve push token
    const { data: profile } = await supabase
      .from('profiles')
      .select('push_token, push_token_updated_at, full_name')
      .eq('id', userId)
      .single();

    // Bildirim ayarları
    const { data: settings } = await supabase
      .from('user_notification_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Pending bildirimler
    const { data: pendingNotifications } = await supabase
      .from('notifications')
      .select('id, title, status, created_at')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(5);

    // Son gönderilen bildirimler
    const { data: recentNotifications } = await supabase
      .from('notifications')
      .select('id, title, status, sent_at, failed_reason')
      .eq('user_id', userId)
      .in('status', ['sent', 'failed'])
      .order('created_at', { ascending: false })
      .limit(5);

    const report = {
      user: {
        name: profile?.full_name || 'Bilinmiyor',
        hasPushToken: !!profile?.push_token,
        pushTokenUpdated: profile?.push_token_updated_at,
        pushTokenPreview: profile?.push_token ? profile.push_token.substring(0, 30) + '...' : 'YOK',
      },
      settings: settings || 'Varsayılan ayarlar',
      pendingCount: pendingNotifications?.length || 0,
      recentSentCount: recentNotifications?.filter(n => n.status === 'sent').length || 0,
      recentFailedCount: recentNotifications?.filter(n => n.status === 'failed').length || 0,
      pendingNotifications: pendingNotifications || [],
      recentNotifications: recentNotifications || [],
    };

    return report;
  } catch (error) {
    return null;
  }
}

/**
 * Tüm pending bildirimleri manuel olarak işle
 */
export async function processPendingNotificationsManually() {
  try {
    const result = await notificationProcessor.processPendingNotifications();
    
    if (result.success && result.sent > 0) {
      console.log(`✅ ${result.sent} bildirim gönderildi`);
    }
    
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}
