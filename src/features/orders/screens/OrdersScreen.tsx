/**
 * Orders Screen
 * Modern Apple-style orders list with status indicators
 */

import React, {useState, useEffect, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Image,
  Modal,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {Package, NavArrowLeft, Pin, CreditCard, Cash, Xmark, NavArrowDown} from 'iconoir-react-native';
import {colors, spacing, fontSize, fontWeight, borderRadius} from '@core/constants';
import {useAuthStore} from '@store/slices/authStore';
import {useTranslation} from '@localization';
import {supabase} from '@core/services/supabase';
import {useTabNavigation} from '@core/navigation/TabContext';
import {LogoLoader} from '@shared/components';
import {getProductImageUrl} from '@core/utils';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  barcode?: number | null;
}

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: 'preparing' | 'prepared' | 'shipping' | 'delivered' | 'cancelled';
  payment_method: 'card' | 'cash';
  items: OrderItem[];
  shipping_address: {
    address: string;
    latitude: number;
    longitude: number;
  };
}

const getStatusConfig = (t: any) => ({
  preparing: {
    label: t('orders.preparing'),
    color: '#f59e0b', // Amber/Turuncu
    bgColor: '#fef3c7', // Açık sarı
  },
  prepared: {
    label: t('orders.prepared'),
    color: '#10b981', // Yeşil
    bgColor: '#d1fae5', // Açık yeşil
  },
  shipping: {
    label: t('orders.shipping'),
    color: '#3b82f6', // Mavi
    bgColor: '#dbeafe', // Açık mavi
  },
  delivered: {
    label: t('orders.delivered'),
    color: colors.primary, // Primary color
    bgColor: colors.primary + '20', // Açık primary
  },
  cancelled: {
    label: t('orders.cancelled'),
    color: '#ef4444', // Kırmızı
    bgColor: '#fee2e2', // Açık kırmızı
  },
});

// Memoized Product Item Component
const ProductItem = React.memo<{item: OrderItem; index: number}>(({item, index}) => {
  const imageUrl = useMemo(() => getProductImageUrl(item.image_url), [item.image_url]);
  
  return (
    <View key={index} style={styles.productItem}>
      <View style={styles.productImageWrapper}>
        <View style={styles.productImageContainer}>
          {imageUrl ? (
            <Image
              source={{uri: imageUrl}}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Package
                width={16}
                height={16}
                color={colors.text.tertiary}
                strokeWidth={2}
              />
            </View>
          )}
        </View>
        {/* Quantity Badge - Sağ üst köşe */}
        <View style={styles.quantityBadge}>
          <Text style={styles.quantityText}>{item.quantity}</Text>
        </View>
      </View>
      <Text style={styles.productName} numberOfLines={2}>
        {item.name}
      </Text>
    </View>
  );
});

// Expandable Cancel Button Component
const ExpandableCancelButton = React.memo<{
  isExpanded: boolean;
  onPress: () => void;
  label: string;
}>(({isExpanded, onPress, label}) => {
  const animatedHeight = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: isExpanded ? 1 : 0,
      duration: 250,
      useNativeDriver: false, // Height animasyonu için false olmalı
    }).start();
  }, [isExpanded, animatedHeight]);

  const heightInterpolate = animatedHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 56],
  });

  const opacityInterpolate = animatedHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Don't render if not expanded and animation is complete
  const [shouldRender, setShouldRender] = React.useState(isExpanded);
  
  React.useEffect(() => {
    if (isExpanded) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 250);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  if (!shouldRender) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.cancelButtonContainer,
        {
          height: heightInterpolate,
          opacity: opacityInterpolate,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={styles.cancelButtonText}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

const ORDERS_PER_PAGE = 7;

export const OrdersScreen: React.FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const {user, isAuthenticated} = useAuthStore();
  const {setActiveTab: setBottomTab} = useTabNavigation();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  
  // Cancel order modal states
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  
  // Expanded order states (for showing cancel button)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  
  // Memoize status config
  const statusConfig = useMemo(() => getStatusConfig(t), [t]);

  // Memoize fetch function - Initial load
  const fetchOrders = useCallback(async (reset: boolean = false) => {
    if (!user?.id) return;
    
    try {
      if (reset) {
        setLoading(true);
        setPage(0);
        setHasMore(true);
      }

      const currentPage = reset ? 0 : page;
      const from = currentPage * ORDERS_PER_PAGE;
      const to = from + ORDERS_PER_PAGE - 1;

      const {data, error, count} = await supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', {ascending: false})
        .range(from, to);

      if (error) throw error;

      const newOrders = data || [];
      
      if (reset) {
        setOrders(newOrders);
      } else {
        setOrders(prev => [...prev, ...newOrders]);
      }

      // Check if there are more orders
      const totalFetched = reset ? newOrders.length : orders.length + newOrders.length;
      setHasMore(count ? totalFetched < count : false);
      
      if (!reset) {
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Siparişler yüklenemedi:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [user?.id, page, orders.length]);

  // Load more orders
  const loadMoreOrders = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return;
    
    setLoadingMore(true);
    await fetchOrders(false);
  }, [loadingMore, hasMore, loading, fetchOrders]);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchOrders(true);
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Sayfa focus olduğunda siparişleri yeniden yükle
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (isAuthenticated && user) {
        setPage(0);
        fetchOrders(true);
      }
    });
    return unsubscribe;
  }, [navigation, isAuthenticated, user]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(0);
    await fetchOrders(true);
    setRefreshing(false);
  }, [fetchOrders]);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

    // İlk 60 dakika için dakika göster
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${t('orders.minutesAgo')}`;
    }
    // 60 dakika sonrası için saat göster
    else if (diffInHours < 24) {
      return `${diffInHours} ${t('orders.hoursAgo')}`;
    } else if (diffInHours < 48) {
      return t('orders.yesterday');
    } else {
      return date.toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  }, [t]);

  // Handle cancel order
  const handleCancelOrder = useCallback(async () => {
    if (!selectedOrderId) return;

    setCancelling(true);
    try {
      const {data, error} = await supabase.rpc('cancel_order_user', {
        p_order_id: selectedOrderId,
        p_cancel_reason: cancelReason.trim() || null,
      });

      if (error) throw error;

      // Update local state
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === selectedOrderId
            ? {...order, status: 'cancelled'}
            : order
        )
      );

      // Close modal and reset
      setCancelModalVisible(false);
      setSelectedOrderId(null);
      setSelectedOrder(null);
      setCancelReason('');

      // Show success message
      Alert.alert(
        t('orders.orderCancelled'),
        t('orders.orderCancelledMessage')
      );
    } catch (error: any) {
      console.error('Cancel order error:', error);
      Alert.alert(
        t('orders.cancelError'),
        error.message || t('orders.cancelErrorMessage')
      );
    } finally {
      setCancelling(false);
    }
  }, [selectedOrderId, cancelReason, t]);

  // Toggle expanded order
  const toggleExpandOrder = useCallback((orderId: string) => {
    setExpandedOrderId(prev => prev === orderId ? null : orderId);
  }, []);

  // Open cancel modal
  const openCancelModal = useCallback((orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    setSelectedOrderId(orderId);
    setSelectedOrder(order || null);
    setCancelReason('');
    setCancelModalVisible(true);
    setExpandedOrderId(null); // Close expanded state when opening modal
  }, [orders]);

  // Close cancel modal
  const closeCancelModal = useCallback(() => {
    if (!cancelling) {
      setCancelModalVisible(false);
      setSelectedOrderId(null);
      setSelectedOrder(null);
      setCancelReason('');
    }
  }, [cancelling]);

  // Render order card
  const renderOrderCard = useCallback(({item: order}: {item: Order}) => {
    const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || {
      label: order.status,
      color: colors.text.secondary,
      bgColor: colors.background,
    };

    // Check if order can be cancelled
    const canCancel = order.status === 'preparing' || order.status === 'prepared';
    const isExpanded = expandedOrderId === order.id;

    return (
      <TouchableOpacity
        style={styles.orderCard}
        activeOpacity={0.7}
        onPress={() => {
          // @ts-ignore
          navigation.navigate('OrderDetail', {orderId: order.id});
        }}
      >
        {/* Status Badge - Tıklanabilir (sadece iptal edilebilir siparişler için) */}
        <TouchableOpacity
          style={[
            styles.statusBadge,
            {backgroundColor: statusInfo.bgColor},
            canCancel && styles.statusBadgeClickable,
          ]}
          onPress={(e) => {
            if (canCancel) {
              e.stopPropagation();
              toggleExpandOrder(order.id);
            }
          }}
          disabled={!canCancel}
          activeOpacity={canCancel ? 0.7 : 1}
        >
          <Text
            style={[styles.statusText, {color: statusInfo.color}]}
          >
            {statusInfo.label}
          </Text>
          {canCancel && (
            <View
              style={{
                transform: [{
                  rotate: isExpanded ? '180deg' : '0deg'
                }],
              }}
            >
              <NavArrowDown
                width={18}
                height={18}
                color={statusInfo.color}
                strokeWidth={2.5}
                style={styles.statusChevron}
              />
            </View>
          )}
        </TouchableOpacity>

        {/* Cancel Button - Hemen status altında */}
        {canCancel && (
          <ExpandableCancelButton
            isExpanded={isExpanded}
            onPress={() => openCancelModal(order.id)}
            label={t('orders.cancelOrder')}
          />
        )}

        {/* Order Info */}
        <View style={styles.orderInfo}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderNumber}>
              {t('orders.orderPrefix')}{order.id.slice(0, 8).toUpperCase()}
            </Text>
            <Text style={styles.orderDate}>
              {formatDate(order.created_at)}
            </Text>
          </View>

          {/* Address */}
          {order.shipping_address?.address && (
            <View style={styles.addressRow}>
              <Pin
                width={16}
                height={16}
                color={colors.text.secondary}
                strokeWidth={2}
              />
              <Text style={styles.addressText} numberOfLines={2}>
                {order.shipping_address.address}
              </Text>
            </View>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Products List - Küçük resimlerle */}
          <View style={styles.productsSection}>
            <Text style={styles.productsSectionTitle}>{t('orders.products')}</Text>
            <View style={styles.productsList}>
              {order.items.map((item, index) => (
                <ProductItem key={`${order.id}-${index}`} item={item} index={index} />
              ))}
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Footer */}
          <View style={styles.orderFooter}>
            <View style={styles.paymentMethod}>
              {order.payment_method === 'card' ? (
                <CreditCard
                  width={18}
                  height={18}
                  color={colors.text.secondary}
                  strokeWidth={2}
                />
              ) : (
                <Cash
                  width={18}
                  height={18}
                  color={colors.text.secondary}
                  strokeWidth={2}
                />
              )}
              <Text style={styles.paymentLabel}>
                {order.payment_method === 'card' ? t('orders.card') : t('orders.cash')}
              </Text>
            </View>
            <Text style={styles.totalAmount}>
              ₺{order.total_amount.toFixed(2)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [statusConfig, formatDate, t, openCancelModal, expandedOrderId, toggleExpandOrder, navigation]);

  // Footer component for loading more
  const renderFooter = useCallback(() => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }, [loadingMore]);

  // Empty component
  const renderEmpty = useCallback(() => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Package width={80} height={80} color={colors.text.tertiary} />
        <Text style={styles.emptyTitle}>{t('orders.noOrders')}</Text>
        <Text style={styles.emptyText}>
          {t('orders.noOrdersText')}
        </Text>
      </View>
    );
  }, [loading, t]);

  // Kullanıcı giriş yapmamışsa
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('orders.title')}</Text>
        </View>

        <View style={styles.emptyContainer}>
          <Package width={80} height={80} color={colors.text.tertiary} />
          <Text style={styles.emptyTitle}>{t('orders.loginRequired')}</Text>
          <Text style={styles.emptyText}>
            {t('orders.loginRequiredText')}
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => {
              // @ts-ignore - Navigation type issue
              navigation.navigate('Auth', {
                screen: 'Login',
                params: { returnTo: 'MainTabs' }
              });
            }}
          >
            <Text style={styles.loginButtonText}>{t('auth.login')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header - Profile gibi sola dayalı */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setBottomTab('Home')}
          activeOpacity={0.7}>
          <NavArrowLeft
            width={24}
            height={24}
            color={colors.text.primary}
            strokeWidth={2}
          />
        </TouchableOpacity>
        <Text style={styles.title}>{t('orders.title')}</Text>
      </View>

      {/* Orders List */}
      {loading ? (
        <LogoLoader showText={false} />
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          onEndReached={loadMoreOrders}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
        />
      )}

      {/* Cancel Order Modal */}
      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeCancelModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t('orders.cancelOrderTitle')}
              </Text>
              <TouchableOpacity
                onPress={closeCancelModal}
                disabled={cancelling}
                style={styles.modalCloseButton}
              >
                <Xmark
                  width={24}
                  height={24}
                  color={colors.text.secondary}
                  strokeWidth={2}
                />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <View style={styles.modalBody}>
              {/* Order Info */}
              {selectedOrder && (
                <View style={styles.modalOrderInfo}>
                  <Text style={styles.modalOrderNumber}>
                    {t('orders.orderPrefix')}{selectedOrder.id.slice(0, 8).toUpperCase()}
                  </Text>
                  <Text style={styles.modalOrderAmount}>
                    ₺{selectedOrder.total_amount.toFixed(2)}
                  </Text>
                </View>
              )}
              
              <Text style={styles.modalMessage}>
                {t('orders.cancelOrderMessage')}
              </Text>

              {/* Cancel Reason Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>
                  {t('orders.cancelReason')}
                </Text>
                <TextInput
                  style={styles.textArea}
                  placeholder={t('orders.cancelReasonPlaceholder')}
                  placeholderTextColor={colors.text.tertiary}
                  value={cancelReason}
                  onChangeText={setCancelReason}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  editable={!cancelling}
                />
              </View>
            </View>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={closeCancelModal}
                disabled={cancelling}
              >
                <Text style={styles.modalCancelButtonText}>
                  {t('common.no')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={handleCancelOrder}
                disabled={cancelling}
              >
                {cancelling ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmButtonText}>
                    {t('orders.confirmCancel')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    padding: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    marginRight: spacing.md,
    ...Platform.select({
      android: {
        elevation: 0,
        borderWidth: 0,
      },
    }),
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    ...Platform.select({
      android: {
        elevation: 0,
        borderWidth: 0,
      },
    }),
  },
  loginButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.inverse,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 120, // Bottom bar için alan
  },
  footerLoader: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statusBadgeClickable: {
    paddingRight: spacing.md,
  },
  statusText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.8,
    flex: 1,
  },
  statusChevron: {
    marginLeft: spacing.xs,
    opacity: 0.8,
  },
  orderInfo: {
    padding: spacing.lg,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  orderNumber: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  orderDate: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  addressText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  productsSection: {
    marginBottom: spacing.sm,
  },
  productsSectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  productsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  productItem: {
    width: 70,
    alignItems: 'center',
  },
  productImageWrapper: {
    width: 60,
    height: 60,
    position: 'relative',
    marginBottom: spacing.xs,
  },
  productImageContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  productImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  quantityBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  quantityText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: '#fff',
  },
  productName: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 14,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  paymentLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
  totalAmount: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  cancelButtonContainer: {
    overflow: 'hidden',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    backgroundColor: colors.error + '10',
    borderRadius: borderRadius.md,
  },
  cancelButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.error,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.xl,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    flex: 1,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  modalBody: {
    padding: spacing.lg,
  },
  modalOrderInfo: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalOrderNumber: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  modalOrderAmount: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  modalMessage: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  inputContainer: {
    marginBottom: spacing.sm,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  textArea: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text.primary,
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  modalCancelButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalCancelButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  modalConfirmButton: {
    backgroundColor: colors.error,
  },
  modalConfirmButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: '#fff',
  },
});
