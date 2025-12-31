/**
 * Order Detail Screen
 * Displays detailed information about a specific order
 */

import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Image,
  Alert,
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {
  Package,
  NavArrowLeft,
  Pin,
  CreditCard,
  Cash,
  User,
  Phone,
  Xmark,
  MapPin,
} from 'iconoir-react-native';
import {colors, spacing, fontSize, fontWeight, borderRadius} from '@core/constants';
import {useAuthStore} from '@store/slices/authStore';
import {useTranslation} from '@localization';
import {supabase} from '@core/services/supabase';
import {clarityService} from '@core/services/clarity';
import {LogoLoader} from '@shared/components';
import {getProductImageUrl} from '@core/utils';
import {MainStackParamList} from '@core/navigation/types';

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
  order_notes?: string;
  customer_name?: string;
  customer_phone?: string;
  subtotal?: number;
  delivery_fee_applied?: number;
  address_details?: string;
}

type OrderDetailRouteProp = RouteProp<MainStackParamList, 'OrderDetail'>;

const getStatusConfig = (t: any) => ({
  preparing: {
    label: t('orders.preparing'),
    color: '#f59e0b',
    bgColor: '#fef3c7',
  },
  prepared: {
    label: t('orders.prepared'),
    color: '#10b981',
    bgColor: '#d1fae5',
  },
  shipping: {
    label: t('orders.shipping'),
    color: '#3b82f6',
    bgColor: '#dbeafe',
  },
  delivered: {
    label: t('orders.delivered'),
    color: colors.primary,
    bgColor: colors.primary + '20',
  },
  cancelled: {
    label: t('orders.cancelled'),
    color: '#ef4444',
    bgColor: '#fee2e2',
  },
});

export const OrderDetailScreen: React.FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<OrderDetailRouteProp>();
  const {user} = useAuthStore();
  const {orderId} = route.params;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const statusConfig = getStatusConfig(t);

  // Fetch order details
  const fetchOrderDetails = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const {data, error} = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error('Order fetch error:', error);
      Alert.alert(t('orders.errorOccurred'), t('orders.errorOccurred'));
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [orderId, user?.id, t, navigation]);

  useEffect(() => {
    fetchOrderDetails();
    
    // Log Clarity event for order view
    if (orderId) {
      clarityService.logEvent('order_detail_viewed', {
        orderId,
        userId: user?.id || 'anonymous',
      });
    }
  }, [fetchOrderDetails, orderId, user?.id]);

  // Handle cancel order
  const handleCancelOrder = useCallback(async () => {
    if (!order) return;

    setCancelling(true);
    try {
      const {data, error} = await supabase.rpc('cancel_order_user', {
        p_order_id: order.id,
        p_cancel_reason: cancelReason.trim() || null,
      });

      if (error) throw error;

      // Update local state
      setOrder(prev => prev ? {...prev, status: 'cancelled'} : null);

      // Close modal
      setCancelModalVisible(false);
      setCancelReason('');

      // Log Clarity event for order cancellation
      clarityService.logEvent('order_cancelled', {
        orderId: order.id,
        reason: cancelReason.trim() || 'no_reason',
        userId: user?.id || 'anonymous',
      });

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
  }, [order, cancelReason, t]);

  // Open directions in maps
  const openDirections = useCallback(() => {
    if (!order?.shipping_address) return;

    const {latitude, longitude} = order.shipping_address;
    const url = Platform.select({
      ios: `maps:0,0?q=${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}`,
    });

    if (url) {
      Linking.openURL(url);
    }
  }, [order]);

  // Format date
  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LogoLoader showText={false} />
      </SafeAreaView>
    );
  }

  if (!order) {
    return null;
  }

  const statusInfo = statusConfig[order.status];
  const canCancel = order.status === 'preparing' || order.status === 'prepared';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}>
          <NavArrowLeft
            width={24}
            height={24}
            color={colors.text.primary}
            strokeWidth={2}
          />
        </TouchableOpacity>
        <Text style={styles.title}>{t('admin.orderDetails')}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Info */}
        <View style={styles.section}>
          <Text style={styles.orderNumber}>
            {t('orders.orderPrefix')}{order.id.slice(0, 8).toUpperCase()}
          </Text>
          <Text style={styles.orderDate}>{formatDate(order.created_at)}</Text>
        </View>

        {/* Status Badge */}
        <View style={[styles.statusBadge, {backgroundColor: statusInfo.bgColor}]}>
          <Text style={[styles.statusText, {color: statusInfo.color}]}>
            {statusInfo.label}
          </Text>
        </View>

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('checkout.deliveryAddress')}</Text>
          <Text style={styles.addressText}>{order.shipping_address.address}</Text>
          {order.address_details && (
            <Text style={styles.addressDetails}>{order.address_details}</Text>
          )}
        </View>

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('orders.products')}</Text>
          {order.items.map((item, index) => (
            <View key={index} style={styles.productRow}>
              <View style={styles.productImageContainer}>
                {item.image_url ? (
                  <Image
                    source={{uri: getProductImageUrl(item.image_url) || undefined}}
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.productImagePlaceholder}>
                    <Package width={20} height={20} color={colors.text.tertiary} strokeWidth={2} />
                  </View>
                )}
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.productQuantity}>x{item.quantity}</Text>
              </View>
              <Text style={styles.productPrice}>₺{(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Order Notes */}
        {order.order_notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('checkout.orderNotes')}</Text>
            <Text style={styles.notesText}>{order.order_notes}</Text>
          </View>
        )}

        {/* Payment Summary */}
        <View style={styles.section}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('cart.subtotal')}</Text>
            <Text style={styles.summaryValue}>
              ₺{((order.total_amount || 0) - (order.delivery_fee_applied || 0)).toFixed(2)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{t('cart.deliveryFee')}</Text>
            <Text style={styles.summaryValue}>
              {order.delivery_fee_applied === 0 ? t('cart.free') : `₺${(order.delivery_fee_applied || 0).toFixed(2)}`}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('cart.total')}</Text>
            <Text style={styles.totalAmount}>₺{order.total_amount.toFixed(2)}</Text>
          </View>
          <View style={styles.paymentMethodRow}>
            {order.payment_method === 'card' ? (
              <CreditCard width={16} height={16} color={colors.text.tertiary} strokeWidth={2} />
            ) : (
              <Cash width={16} height={16} color={colors.text.tertiary} strokeWidth={2} />
            )}
            <Text style={styles.paymentMethodText}>
              {order.payment_method === 'card' ? t('orders.card') : t('orders.cash')}
            </Text>
          </View>
        </View>

        {/* Cancel Button */}
        {canCancel && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setCancelModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>{t('orders.cancelOrder')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Cancel Order Modal */}
      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !cancelling && setCancelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t('orders.cancelOrderTitle')}
              </Text>
              <TouchableOpacity
                onPress={() => setCancelModalVisible(false)}
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
              <View style={styles.modalOrderInfo}>
                <Text style={styles.modalOrderNumber}>
                  {t('orders.orderPrefix')}{order.id.slice(0, 8).toUpperCase()}
                </Text>
                <Text style={styles.modalOrderAmount}>
                  ₺{order.total_amount.toFixed(2)}
                </Text>
              </View>

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
                onPress={() => setCancelModalVisible(false)}
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
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  statusBadge: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: spacing.xl,
  },
  statusText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: spacing.xl,
  },
  orderNumber: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  orderDate: {
    fontSize: fontSize.md,
    color: colors.text.tertiary,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  addressText: {
    fontSize: fontSize.md,
    color: colors.text.primary,
    lineHeight: 22,
  },
  addressDetails: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  productImageContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    marginRight: spacing.md,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: fontSize.md,
    color: colors.text.primary,
    marginBottom: 2,
  },
  productQuantity: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
  },
  productPrice: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  notesText: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  summaryLabel: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: fontSize.md,
    color: colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  totalLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  totalAmount: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  paymentMethodText: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
  },
  cancelButton: {
    backgroundColor: colors.error + '15',
    paddingVertical: spacing.md,
    borderRadius: 72,
    alignItems: 'center',
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  cancelButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.regular,
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

