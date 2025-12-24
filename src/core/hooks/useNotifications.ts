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
  const { user, profile } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  /**
   * Push notification sistemini başlat
   * Waits for profile to be loaded before saving push token
   */
  const initializePushNotifications = async () => {
    if (!user?.id) return;

    try {
      // Push token al
      const token = await notificationService.registerForPushNotifications();
      
      if (token) {
        setExpoPushToken(token);
        
        // Wait for profile to be available before saving token
        // Retry up to 5 times with 1 second delay
        let retryCount = 0;
        const maxRetries = 5;
        const retryDelay = 1000;

        const saveToken = async (): Promise<void> => {
          const currentProfile = useAuthStore.getState().profile;
          
          if (!currentProfile && retryCount < maxRetries) {
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            return saveToken();
          }

          if (currentProfile) {
            const saved = await notificationService.savePushToken(user.id, token);
            if (!saved && retryCount < maxRetries) {
              retryCount++;
              await new Promise(resolve => setTimeout(resolve, retryDelay));
              return saveToken();
            }
          } else {
            console.warn('⚠️ Profil yüklenmedi, push token kaydedilemedi');
          }
        };

        await saveToken();
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

    // Push notification sistemini başlat (profil yüklendikten sonra)
    // Small delay to ensure profile is loaded
    const timer = setTimeout(() => {
      initializePushNotifications();
    }, 500);

    // Bildirimleri yükle
    loadNotifications();

    return () => {
      clearTimeout(timer);
    };

    // Uygulama açıkken gelen bildirimler için listener
    notificationListener.current = notificationService.addNotificationReceivedListener(
      (notification) => {
        // Yeni bildirim geldiğinde listeyi yenile
        loadNotifications();
      }
    );

    // Bildirime tıklandığında
    responseListener.current = notificationService.addNotificationResponseReceivedListener(
      (response) => {
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
  }, [user?.id, profile?.id]); // Also depend on profile to retry when profile loads

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

