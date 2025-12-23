/**
 * Notifications Screen
 * Kullanıcının bildirimlerini gösterir
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NavArrowLeft, Bell, BellOff } from 'iconoir-react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@core/constants';
import { useNotificationContext } from '@core/contexts/NotificationContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface NotificationItemProps {
  notification: any;
  onPress: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onPress }) => {
  const isUnread = !notification.read_at;
  
  // Bildirim türüne göre emoji seç
  const getTypeEmoji = (type: string) => {
    switch (type) {
      case 'order_created':
        return '🎉';
      case 'order_status':
        return '📦';
      case 'delivery':
        return '🚚';
      case 'promotional':
        return '🎁';
      case 'coupon':
        return '🎫';
      case 'achievement':
        return '🏆';
      case 'welcome':
        return '👋';
      default:
        return '🔔';
    }
  };

  return (
    <TouchableOpacity
      style={[styles.notificationItem, isUnread && styles.unreadItem]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.notificationIcon}>
        <Text style={styles.notificationEmoji}>{getTypeEmoji(notification.type)}</Text>
      </View>
      
      <View style={styles.notificationContent}>
        <Text style={[styles.notificationTitle, isUnread && styles.unreadText]}>
          {notification.title}
        </Text>
        <Text style={styles.notificationBody} numberOfLines={2}>
          {notification.body}
        </Text>
        <Text style={styles.notificationTime}>
          {format(new Date(notification.created_at), 'dd MMM yyyy, HH:mm', { locale: tr })}
        </Text>
      </View>

      {isUnread && <View style={styles.unreadBadge} />}
    </TouchableOpacity>
  );
};

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation();
  const {
    notifications,
    unreadCount,
    isLoading,
    loadNotifications,
    markAsRead,
    clearAll,
  } = useNotificationContext();

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleNotificationPress = async (notification: any) => {
    // Okunmamışsa okundu olarak işaretle
    if (!notification.read_at) {
      await markAsRead(notification.id);
    }

    // Bildirim data'sına göre yönlendirme yap
    if (notification.data?.orderId) {
      // Sipariş detay sayfasına git
      navigation.navigate('OrderDetail' as never, { orderId: notification.data.orderId } as never);
    }
  };

  const handleClearAll = async () => {
    await clearAll();
    await loadNotifications();
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <BellOff
        width={80}
        height={80}
        color={colors.text.secondary}
        strokeWidth={1.5}
      />
      <Text style={styles.emptyText}>Henüz bildiriminiz yok</Text>
      <Text style={styles.emptySubtext}>
        Siparişleriniz ve özel teklifler hakkında bildirimler burada görünecek
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <NavArrowLeft
            width={24}
            height={24}
            color={colors.text.primary}
            strokeWidth={2}
          />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Bildirimler</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>

        {notifications.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Temizle</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onPress={() => handleNotificationPress(item)}
          />
        )}
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadNotifications}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
    marginLeft: -spacing.xs,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  headerBadge: {
    backgroundColor: colors.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  headerBadgeText: {
    color: colors.white,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  clearButton: {
    padding: spacing.xs,
  },
  clearButtonText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  listContent: {
    paddingVertical: spacing.sm,
  },
  emptyListContent: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  unreadItem: {
    backgroundColor: colors.primaryLight,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationEmoji: {
    fontSize: 24,
  },
  notificationContent: {
    flex: 1,
    gap: spacing.xs,
  },
  notificationTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  unreadText: {
    fontWeight: fontWeight.bold,
  },
  notificationBody: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
  },
  unreadBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});









