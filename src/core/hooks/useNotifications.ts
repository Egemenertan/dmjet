import { useEffect, useState, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { notificationService } from '../services/notifications';
import { useAuthStore } from '../../store/slices/authStore';

export interface Notification {
  id: string;
  title: string;
  body: string;
  data: any;
  type: string;
  status: string;
  read_at: string | null;
  created_at: string;
}

/**
 * Push notification yönetimi için custom hook
 */
export const useNotifications = () => {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  /**
   * Push notification sistemini başlat
   */
  const initializePushNotifications = async () => {
    if (!user?.id) {
      console.log('⚠️ Push notification: Kullanıcı yok');
      return;
    }

    try {
      console.log('🔔 Push notification başlatılıyor...');
      
      // Push token al
      const token = await notificationService.registerForPushNotifications();
      
      if (token) {
        console.log('✅ Push token alındı:', token.substring(0, 30) + '...');
        setExpoPushToken(token);
        
        // Token'ı veritabanına kaydet
        const saved = await notificationService.savePushToken(user.id, token);
        if (saved) {
          console.log('✅ Push token veritabanına kaydedildi!');
        } else {
          console.error('❌ Push token kaydedilemedi');
        }
      } else {
        console.warn('⚠️ Push token alınamadı (fiziksel cihaz gerekli)');
      }
    } catch (error) {
      console.error('❌ Push notification hatası:', error);
    }
  };

  /**
   * Bildirimleri yükle
   */
  const loadNotifications = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const data = await notificationService.getUserNotifications(user.id);
      setNotifications(data);

      // Okunmamış sayısını hesapla
      const unread = data.filter((n) => !n.read_at).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Bildirimi okundu olarak işaretle
   */
  const markAsRead = async (notificationId: string) => {
    try {
      const success = await notificationService.markAsRead(notificationId);
      
      if (success) {
        // Local state'i güncelle
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  /**
   * Tüm bildirimleri temizle
   */
  const clearAll = async () => {
    try {
      await notificationService.clearAllNotifications();
      await notificationService.setBadgeCount(0);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  /**
   * Badge sayısını güncelle
   */
  const updateBadgeCount = async (count: number) => {
    try {
      await notificationService.setBadgeCount(count);
    } catch (error) {
      console.error('Error updating badge count:', error);
    }
  };

  // Component mount olduğunda notification listener'ları ekle
  useEffect(() => {
    if (!user?.id) return;

    // Push notification sistemini başlat
    initializePushNotifications();

    // Bildirimleri yükle
    loadNotifications();

    // Uygulama açıkken gelen bildirimler için listener
    notificationListener.current = notificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        // Yeni bildirim geldiğinde listeyi yenile
        loadNotifications();
      }
    );

    // Bildirime tıklandığında
    responseListener.current = notificationService.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification response:', response);
        const notificationData = response.notification.request.content.data;
        
        // Bildirim data'sına göre yönlendirme yapılabilir
        if (notificationData?.orderId) {
          // Sipariş detay sayfasına yönlendir
          console.log('Navigate to order:', notificationData.orderId);
        }
      }
    );

    // Cleanup
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user?.id]);

  // Unread count değiştiğinde badge'i güncelle
  useEffect(() => {
    updateBadgeCount(unreadCount);
  }, [unreadCount]);

  return {
    notifications,
    unreadCount,
    isLoading,
    expoPushToken,
    loadNotifications,
    markAsRead,
    clearAll,
    initializePushNotifications,
  };
};

