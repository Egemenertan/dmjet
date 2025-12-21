/**
 * Orders Screen
 * Modern Apple-style orders list with status indicators
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {Package, NavArrowLeft, Pin, CreditCard, Cash} from 'iconoir-react-native';
import {colors, spacing, fontSize, fontWeight, borderRadius} from '@core/constants';
import {useAuthStore} from '@store/slices/authStore';
import {useTranslation} from '@localization';
import {supabase} from '@core/services/supabase';
import {useTabNavigation} from '@core/navigation/TabContext';
import {getProductImageUrl} from '@core/utils';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: 'pending' | 'processing' | 'shipping' | 'delivered' | 'cancelled';
  payment_method: 'card' | 'cash';
  items: OrderItem[];
  shipping_address: {
    address: string;
    latitude: number;
    longitude: number;
  };
}

const getStatusConfig = (t: any) => ({
  pending: {
    label: t('orders.pending'),
    color: colors.warning,
    bgColor: colors.warning + '15',
  },
  processing: {
    label: t('orders.processing'),
    color: colors.info,
    bgColor: colors.info + '15',
  },
  shipping: {
    label: t('orders.shipping'),
    color: colors.info,
    bgColor: colors.info + '15',
  },
  delivered: {
    label: t('orders.delivered'),
    color: colors.success,
    bgColor: colors.success + '15',
  },
  cancelled: {
    label: t('orders.cancelled'),
    color: colors.error,
    bgColor: colors.error + '15',
  },
});

export const OrdersScreen: React.FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const {user, isAuthenticated} = useAuthStore();
  const {setActiveTab: setBottomTab} = useTabNavigation();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const statusConfig = getStatusConfig(t);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchOrders();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  // Sayfa focus olduğunda siparişleri yeniden yükle
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (isAuthenticated && user) {
        fetchOrders();
      }
    });
    return unsubscribe;
  }, [navigation, isAuthenticated, user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const {data, error} = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', {ascending: false});

      if (error) throw error;

      setOrders(data || []);
    } catch (error) {
      console.error('Siparişler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const getItemCount = (items: OrderItem[]) => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const formatDate = (dateString: string) => {
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
  };

  const displayOrders = orders;

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
            onPress={() => navigation.navigate('Auth' as never, {screen: 'Login'} as never)}
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : displayOrders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Package width={80} height={80} color={colors.text.tertiary} />
          <Text style={styles.emptyTitle}>{t('orders.noOrders')}</Text>
          <Text style={styles.emptyText}>
            {t('orders.noOrdersText')}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {displayOrders.map((order) => {
            const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || {
              label: order.status,
              color: colors.text.secondary,
              bgColor: colors.background,
            };

            return (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                activeOpacity={0.7}
                onPress={() => {
                  // Show order detail with all information
                  Alert.alert(
                    t('orders.orderDetail'),
                    `${t('orders.orderId')}: ${order.id}\n${t('orders.status')}: ${statusInfo.label}\n${t('orders.total')}: ₺${order.total_amount.toFixed(2)}`,
                    [{text: t('common.ok'), style: 'default'}]
                  );
                }}
              >
                {/* Status Badge - Arka plan rengi ile */}
                <View
                  style={[
                    styles.statusBadge,
                    {backgroundColor: statusInfo.bgColor},
                  ]}
                >
                  <Text
                    style={[styles.statusText, {color: statusInfo.color}]}
                  >
                    {statusInfo.label}
                  </Text>
                </View>

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
                      {order.items.map((item, index) => {
                        // Image URL'yi tam URL'ye dönüştür
                        const imageUrl = getProductImageUrl(item.image_url);
                        
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
                      })}
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
          })}
        </ScrollView>
      )}
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
  },
  loginButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.inverse,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 120, // Bottom bar için alan
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  statusText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
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
});
