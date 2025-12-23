import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useAuthStore } from '../../store/slices/authStore';
import { notificationProcessor } from '../services/notificationProcessor';

interface NotificationContextType {
  notifications: any[];
  unreadCount: number;
  isLoading: boolean;
  expoPushToken: string | null;
  loadNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  initializePushNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

/**
 * Notification Context Provider
 * Uygulama genelinde push notification yönetimi sağlar
 */
export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuthStore();
  const notificationHook = useNotifications();

  // Kullanıcı giriş yaptığında notification sistemini başlat
  useEffect(() => {
    if (user?.id) {
      notificationHook.initializePushNotifications();
    }
  }, [user?.id]);

  // Otomatik notification işlemeyi başlat
  useEffect(() => {
    if (user?.id) {
      // Uygulama açıldığında notification processor'ı başlat
      // Her 1 saniyede bir pending bildirimleri kontrol eder (anlık bildirim için)
      notificationProcessor.startAutoProcessing(1000);

      // Cleanup: Component unmount olduğunda durdur
      return () => {
        notificationProcessor.stopAutoProcessing();
      };
    }
  }, [user?.id]);

  return (
    <NotificationContext.Provider value={notificationHook}>
      {children}
    </NotificationContext.Provider>
  );
};

/**
 * Notification Context Hook
 */
export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

