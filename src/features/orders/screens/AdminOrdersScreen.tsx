/**
 * Admin Orders Screen
 * Admin panel for managing pending orders
 */

import React, {useState, useEffect, useCallback} from 'react';
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
  Alert,
  Linking,
  TextInput,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import {Package, Pin, CreditCard, Cash, User, Phone, MapPin, NavArrowDown, Check} from 'iconoir-react-native';
import {colors, spacing, fontSize, fontWeight, borderRadius} from '@core/constants';
import {useAuthStore} from '@store/slices/authStore';
import {useTranslation} from '@localization';
import {
  adminOrdersService,
  AdminOrder,
} from '@features/orders/services/adminOrdersService';
import {getProductImageUrl} from '@core/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getStatusConfig = (t: any) => ({
  preparing: {
    label: t('orders.preparing'),
    color: colors.warning,
    bgColor: colors.warning + '20',
  },
  prepared: {
    label: t('orders.prepared'),
    color: '#10b981',
    bgColor: '#10b98120',
  },
  shipping: {
    label: t('orders.shipping'),
    color: colors.info,
    bgColor: colors.info + '20',
  },
  delivered: {
    label: t('orders.delivered'),
    color: colors.success,
    bgColor: colors.success + '20',
  },
  cancelled: {
    label: t('orders.cancelled'),
    color: colors.error,
    bgColor: colors.error + '20',
  },
});

const PAGE_SIZE = 20; // Her seferinde 20 sipariş yükle

export const AdminOrdersScreen: React.FC = () => {
  const {t} = useTranslation();
  const {canAccessAdminOrders, profile, isPicker} = useAuthStore();

  const [allOrders, setAllOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showDropdownForOrder, setShowDropdownForOrder] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMorePending, setHasMorePending] = useState(true);
  const [hasMoreCompleted, setHasMoreCompleted] = useState(true);
  const [pendingPage, setPendingPage] = useState(0);
  const [completedPage, setCompletedPage] = useState(0);
  // Picker için ürün sayım state'i: {orderId: {itemIndex: count}}
  const [pickerItemCounts, setPickerItemCounts] = useState<Record<string, Record<number, number>>>({});
  // Picker için ürün checked state'i: {orderId: {itemIndex: boolean}}
  const [pickerItemChecked, setPickerItemChecked] = useState<Record<string, Record<number, boolean>>>({});
  // Image gallery modal için
  const [galleryImages, setGalleryImages] = useState<Array<{url: string; name: string; quantity: number; itemIndex: number; orderId: string}>>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [currentOrderId, setCurrentOrderId] = useState<string>('');

  const statusConfig = getStatusConfig(t);

  // Filter orders based on active tab
  const orders = allOrders.filter(order => {
    if (activeTab === 'pending') {
      return order.status !== 'delivered';
    } else {
      return order.status === 'delivered';
    }
  });

  const hasMore = activeTab === 'pending' ? hasMorePending : hasMoreCompleted;

  // Load checked items from AsyncStorage
  const loadCheckedItems = async () => {
    try {
      const stored = await AsyncStorage.getItem('picker_checked_items');
      if (stored) {
        setPickerItemChecked(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Checked items yüklenemedi:', error);
    }
  };

  // Save checked items to AsyncStorage
  const saveCheckedItems = async (newChecked: Record<string, Record<number, boolean>>) => {
    try {
      await AsyncStorage.setItem('picker_checked_items', JSON.stringify(newChecked));
    } catch (error) {
      console.error('Checked items kaydedilemedi:', error);
    }
  };

  useEffect(() => {
    loadCheckedItems();
  }, []);

  useEffect(() => {
    if (canAccessAdminOrders) {
      fetchInitialOrders();
      // Subscribe to real-time updates
      const subscription = adminOrdersService.subscribeToOrders(() => {
        // Real-time update geldiğinde sadece ilk sayfayı yenile
        handleRefresh();
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      setLoading(false);
    }
  }, [canAccessAdminOrders]);

  // Tab değiştiğinde ilk sayfayı yükle
  useEffect(() => {
    if (canAccessAdminOrders) {
      const currentPage = activeTab === 'pending' ? pendingPage : completedPage;
      if (currentPage === 0) {
        fetchInitialOrders();
      }
    }
  }, [activeTab]);

  const fetchInitialOrders = async () => {
    try {
      setLoading(true);
      setAllOrders([]);
      setPendingPage(0);
      setCompletedPage(0);
      setHasMorePending(true);
      setHasMoreCompleted(true);
      
      // İlk sayfayı yükle
      await loadMoreOrders(true);
    } catch (error: any) {
      console.error('Siparişler yüklenemedi:', error);
      if (error?.message?.includes('Admin access required')) {
        Alert.alert(t('admin.unauthorized'), t('admin.unauthorizedMessage'));
      }
    } finally {
      setLoading(false);
    }
  };

  const loadMoreOrders = async (isInitial = false) => {
    if (!isInitial && (loadingMore || !hasMore)) return;

    try {
      if (!isInitial) setLoadingMore(true);

      const currentPage = activeTab === 'pending' ? pendingPage : completedPage;
      const pageToLoad = isInitial ? 0 : currentPage;

      const data = await adminOrdersService.getOrdersPaginated(
        activeTab === 'pending' ? 'pending' : 'completed',
        pageToLoad,
        PAGE_SIZE
      );

      if (isInitial) {
        setAllOrders(data);
      } else {
        // Yeni verileri mevcut verilere ekle, duplikasyonları önle
        setAllOrders(prev => {
          const existingIds = new Set(prev.map(o => o.id));
          const newOrders = data.filter(o => !existingIds.has(o.id));
          return [...prev, ...newOrders];
        });
      }

      // Daha fazla veri var mı kontrol et
      const hasMoreData = data.length === PAGE_SIZE;
      if (activeTab === 'pending') {
        setHasMorePending(hasMoreData);
        setPendingPage(pageToLoad + 1);
      } else {
        setHasMoreCompleted(hasMoreData);
        setCompletedPage(pageToLoad + 1);
      }
    } catch (error: any) {
      console.error('Daha fazla sipariş yüklenemedi:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setAllOrders([]);
    setPendingPage(0);
    setCompletedPage(0);
    setHasMorePending(true);
    setHasMoreCompleted(true);
    await loadMoreOrders(true);
    setRefreshing(false);
  };

  const handleScroll = useCallback(
    ({layoutMeasurement, contentOffset, contentSize}: any) => {
      const paddingToBottom = 20;
      const isCloseToBottom =
        layoutMeasurement.height + contentOffset.y >=
        contentSize.height - paddingToBottom;

      if (isCloseToBottom && !loadingMore && hasMore) {
        loadMoreOrders();
      }
    },
    [loadingMore, hasMore, activeTab]
  );

  const handleMarkAsShipping = async (orderId: string) => {
    try {
      setUpdating(true);
      setShowDropdownForOrder(null);
      await adminOrdersService.updateOrderStatus(orderId, 'shipping');
      Alert.alert(t('common.done'), 'Sipariş yolda olarak işaretlendi');
      await handleRefresh();
    } catch (error) {
      console.error('Durum güncellenemedi:', error);
      Alert.alert(t('common.error'), 'Sipariş durumu güncellenemedi');
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkAsDelivered = async (orderId: string) => {
    try {
      setUpdating(true);
      setShowDropdownForOrder(null);
      await adminOrdersService.updateOrderStatus(orderId, 'delivered');
      Alert.alert(t('common.done'), 'Sipariş teslim edildi olarak işaretlendi');
      await handleRefresh();
    } catch (error) {
      console.error('Durum güncellenemedi:', error);
      Alert.alert(t('common.error'), 'Sipariş durumu güncellenemedi');
    } finally {
      setUpdating(false);
    }
  };

  const handlePickerItemCountChange = (orderId: string, itemIndex: number, value: string) => {
    const numValue = parseInt(value) || 0;
    setPickerItemCounts(prev => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] || {}),
        [itemIndex]: numValue,
      },
    }));
  };

  const toggleItemChecked = (orderId: string, itemIndex: number) => {
    setPickerItemChecked(prev => {
      const newChecked = {
        ...prev,
        [orderId]: {
          ...(prev[orderId] || {}),
          [itemIndex]: !(prev[orderId]?.[itemIndex] || false),
        },
      };
      saveCheckedItems(newChecked);
      return newChecked;
    });
  };

  const validatePickerCounts = (order: AdminOrder): boolean => {
    const counts = pickerItemCounts[order.id] || {};
    let hasError = false;
    let errorMessages: string[] = [];

    order.items.forEach((item, index) => {
      const enteredCount = counts[index] || 0;
      const requiredCount = item.quantity;
      
      if (enteredCount < requiredCount) {
        hasError = true;
        const diff = requiredCount - enteredCount;
        errorMessages.push(`${item.name}: ${diff} adet daha eklenmeli`);
      } else if (enteredCount > requiredCount) {
        hasError = true;
        const diff = enteredCount - requiredCount;
        errorMessages.push(`${item.name}: ${diff} adet fazla eklenmiş`);
      }
    });

    if (hasError) {
      Alert.alert(
        'Ürün Sayısı Uyuşmuyor',
        errorMessages.join('\n'),
        [{text: 'Tamam'}]
      );
      return false;
    }

    return true;
  };

  const handleMarkAsPrepared = async (orderId: string) => {
    // Önce validasyon yap
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    if (!validatePickerCounts(order)) {
      return;
    }

    try {
      setUpdating(true);
      await adminOrdersService.updateOrderStatus(orderId, 'prepared');
      Alert.alert(t('common.done'), 'Sipariş hazırlandı olarak işaretlendi');
      
      // Sayımları temizle
      setPickerItemCounts(prev => {
        const newCounts = {...prev};
        delete newCounts[orderId];
        return newCounts;
      });
      
      // Checked durumlarını temizle ve kaydet
      setPickerItemChecked(prev => {
        const newChecked = {...prev};
        delete newChecked[orderId];
        saveCheckedItems(newChecked);
        return newChecked;
      });
      
      await handleRefresh();
    } catch (error) {
      console.error('Durum güncellenemedi:', error);
      Alert.alert(t('common.error'), 'Sipariş durumu güncellenemedi');
    } finally {
      setUpdating(false);
    }
  };

  const toggleDropdown = (orderId: string) => {
    setShowDropdownForOrder(showDropdownForOrder === orderId ? null : orderId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${t('orders.minutesAgo')}`;
    } else if (diffInHours < 24) {
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

  const openGoogleMaps = (address: string, latitude?: number, longitude?: number) => {
    try {
      let url: string;
      
      if (latitude && longitude) {
        // Koordinatlar varsa, daha doğru yol tarifi için koordinatları kullan
        if (Platform.OS === 'ios') {
          url = `maps://app?daddr=${latitude},${longitude}`;
        } else {
          url = `google.navigation:q=${latitude},${longitude}`;
        }
      } else {
        // Koordinat yoksa adres ile aç
        const encodedAddress = encodeURIComponent(address);
        if (Platform.OS === 'ios') {
          url = `maps://app?daddr=${encodedAddress}`;
        } else {
          url = `google.navigation:q=${encodedAddress}`;
        }
      }

      Linking.canOpenURL(url)
        .then((supported) => {
          if (supported) {
            return Linking.openURL(url);
          } else {
            // Fallback: Web üzerinden Google Maps aç
            const webUrl = latitude && longitude
              ? `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
              : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
            return Linking.openURL(webUrl);
          }
        })
        .catch((err) => {
          console.error('Harita açılamadı:', err);
          Alert.alert(
            t('common.error'),
            'Harita uygulaması açılamadı. Lütfen Google Maps yüklü olduğundan emin olun.'
          );
        });
    } catch (error) {
      console.error('Harita URL oluşturulamadı:', error);
      Alert.alert(t('common.error'), 'Yol tarifi alınamadı.');
    }
  };

  // Unauthorized access
  if (!canAccessAdminOrders) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('admin.orders')}</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Package width={80} height={80} color={colors.text.tertiary} />
          <Text style={styles.emptyTitle}>{t('admin.unauthorized')}</Text>
          <Text style={styles.emptyText}>{t('admin.unauthorizedMessage')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>
            {isPicker ? 'Sipariş Hazırlama' : t('admin.orders')}
          </Text>
          {profile?.role === 'courier' && (
            <Text style={styles.roleSubtitle}>Kurye Paneli</Text>
          )}
          {profile?.role === 'picker' && (
            <Text style={styles.roleSubtitle}>Hazırlama Paneli</Text>
          )}
        </View>
        {orders.length > 0 && (
          <View style={styles.orderCountBadge}>
            <Text style={styles.orderCountText}>{orders.length}</Text>
          </View>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'pending' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('pending')}
          activeOpacity={0.7}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'pending' && styles.activeTabText,
            ]}>
            Bekleyen Siparişler
          </Text>
          {allOrders.filter(o => o.status !== 'delivered').length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>
                {allOrders.filter(o => o.status !== 'delivered').length}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'completed' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('completed')}
          activeOpacity={0.7}>
          <Text
            style={[
              styles.tabText,
              activeTab === 'completed' && styles.activeTabText,
            ]}>
            Tamamlanan Siparişler
          </Text>
          {allOrders.filter(o => o.status === 'delivered').length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>
                {allOrders.filter(o => o.status === 'delivered').length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('admin.loadingOrders')}</Text>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Package width={80} height={80} color={colors.text.tertiary} />
          <Text style={styles.emptyTitle}>
            {activeTab === 'pending' ? 'Bekleyen Sipariş Yok' : 'Tamamlanan Sipariş Yok'}
          </Text>
          <Text style={styles.emptyText}>
            {activeTab === 'pending' 
              ? 'Şu anda bekleyen sipariş bulunmuyor.'
              : 'Henüz tamamlanmış sipariş bulunmuyor.'}
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRefresh}
            activeOpacity={0.7}>
            <Text style={styles.refreshButtonText}>
              {t('admin.refreshOrders')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={({nativeEvent}) => handleScroll(nativeEvent)}
          scrollEventThrottle={400}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }>
          {orders.map((order) => {
            const statusInfo = statusConfig[order.status] || statusConfig.preparing;

            // Picker için basitleştirilmiş görünüm
            if (isPicker) {
              return (
                <View key={order.id} style={styles.orderCard}>
                  {/* Status Badge */}
                  <View
                    style={[
                      styles.statusBadge,
                      {backgroundColor: statusInfo.bgColor},
                    ]}>
                    <Text style={[styles.statusText, {color: statusInfo.color}]}>
                      {statusInfo.label}
                    </Text>
                  </View>

                  {/* Order Info */}
                  <View style={styles.orderInfo}>
                    <View style={styles.orderHeader}>
                      <Text style={styles.orderNumber}>
                        {t('orders.orderPrefix')}
                        {order.id.slice(0, 8).toUpperCase()}
                      </Text>
                      <Text style={styles.orderDate}>
                        {formatDate(order.created_at)}
                      </Text>
                    </View>

                    {/* Customer Name */}
                    <View style={styles.pickerCustomerSection}>
                      <User
                        width={18}
                        height={18}
                        color={colors.text.secondary}
                        strokeWidth={2}
                      />
                      <Text style={styles.pickerCustomerName}>
                        {order.customer_name || order.user_email}
                      </Text>
                    </View>

                    {/* Delivery Note */}
                    {order.delivery_note && (
                      <View style={styles.noteContainer}>
                        <Text style={styles.noteLabel}>
                          {t('checkout.orderNote')}:
                        </Text>
                        <Text style={styles.noteText}>{order.delivery_note}</Text>
                      </View>
                    )}

                    {/* Products List - Satır Satır */}
                    <View style={styles.pickerProductsSection}>
                      <Text style={styles.productsSectionTitle}>
                        Ürünler ({order.items.length} adet)
                      </Text>
                      {order.items.map((item, index) => {
                        const imageUrl = getProductImageUrl(item.image_url);

                        const enteredCount = pickerItemCounts[order.id]?.[index] || 0;
                        const isCorrectCount = enteredCount === item.quantity && enteredCount > 0;
                        const hasError = enteredCount !== item.quantity && enteredCount > 0;
                        const isChecked = pickerItemChecked[order.id]?.[index] || false;

                        return (
                          <View key={index} style={[
                            styles.pickerProductRow,
                            isCorrectCount && styles.pickerProductRowSuccess,
                            isChecked && styles.pickerProductRowChecked,
                          ]}>
                            {/* Tıklanabilir Ürün Resmi */}
                            <TouchableOpacity
                              style={[
                                styles.pickerProductImageContainer,
                                isCorrectCount && styles.pickerProductImageSuccess,
                                isChecked && styles.pickerProductImageChecked,
                              ]}
                              onPress={() => {
                                if (imageUrl) {
                                  // Tüm ürünlerin resimlerini gallery'ye ekle
                                  const images = order.items
                                    .map((item, idx) => {
                                      const url = getProductImageUrl(item.image_url);
                                      return url ? {
                                        url,
                                        name: item.name,
                                        quantity: item.quantity,
                                        itemIndex: idx,
                                        orderId: order.id,
                                      } : null;
                                    })
                                    .filter((img): img is {url: string; name: string; quantity: number; itemIndex: number; orderId: string} => img !== null);
                                  
                                  setGalleryImages(images);
                                  setSelectedImageIndex(index);
                                  setCurrentOrderId(order.id);
                                }
                              }}
                              activeOpacity={0.7}>
                              {imageUrl ? (
                                <Image
                                  source={{uri: imageUrl}}
                                  style={styles.pickerProductImage}
                                  resizeMode="cover"
                                />
                              ) : (
                                <View style={styles.productImagePlaceholder}>
                                  <Package
                                    width={20}
                                    height={20}
                                    color={colors.text.tertiary}
                                    strokeWidth={2}
                                  />
                                </View>
                              )}
                            </TouchableOpacity>
                            <View style={styles.pickerProductInfo}>
                              <View style={styles.pickerProductNameRow}>
                                <Text style={styles.pickerProductName} numberOfLines={2}>
                                  {item.name}
                                </Text>
                                {/* Tamamlandı Badge - Miktar doğruysa göster */}
                                {isCorrectCount && (
                                  <View style={styles.completedBadge}>
                                    <Check
                                      width={14}
                                      height={14}
                                      color="#fff"
                                      strokeWidth={3}
                                    />
                                    <Text style={styles.completedBadgeText}>Tamamlandı</Text>
                                  </View>
                                )}
                              </View>
                              <View style={styles.pickerPriceRow}>
                                <Text style={styles.pickerProductPrice}>
                                  ₺{item.price.toFixed(2)}
                                </Text>
                                <View style={styles.pickerQuantityBadge}>
                                  <Text style={styles.pickerQuantityBadgeText}>
                                    {item.quantity} Adet
                                  </Text>
                                </View>
                              </View>
                            </View>
                            {/* Eklenen Adet Input */}
                            <View style={styles.pickerInputContainer}>
                              <Text style={styles.pickerInputLabel}>Eklenen:</Text>
                              <TextInput
                                style={[
                                  styles.pickerInput,
                                  hasError && styles.pickerInputError,
                                  enteredCount === item.quantity && enteredCount > 0 && styles.pickerInputSuccess,
                                ]}
                                value={enteredCount > 0 ? enteredCount.toString() : ''}
                                onChangeText={(value) => handlePickerItemCountChange(order.id, index, value)}
                                keyboardType="number-pad"
                                placeholder="0"
                                placeholderTextColor={colors.text.tertiary}
                                maxLength={3}
                              />
                            </View>
                          </View>
                        );
                      })}
                    </View>

                    {/* Hazırlandı Butonu */}
                    {order.status === 'preparing' && (
                      <TouchableOpacity
                        style={styles.pickerReadyButton}
                        onPress={() => handleMarkAsPrepared(order.id)}
                        disabled={updating}
                        activeOpacity={0.7}>
                        <Text style={styles.pickerReadyButtonText}>
                          ✓ Hazırlandı
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            }

            // Admin/Courier için tam görünüm
            return (
              <View key={order.id} style={styles.orderCard}>
                {/* Status Badge with Dropdown */}
                <TouchableOpacity
                  style={[
                    styles.statusBadge,
                    {backgroundColor: statusInfo.bgColor},
                  ]}
                  onPress={() => toggleDropdown(order.id)}
                  activeOpacity={0.7}
                  disabled={order.status === 'delivered'}>
                  <Text style={[styles.statusText, {color: statusInfo.color}]}>
                    {statusInfo.label}
                  </Text>
                  {order.status !== 'delivered' && (
                    <NavArrowDown
                      width={18}
                      height={18}
                      color={statusInfo.color}
                      strokeWidth={2.5}
                    />
                  )}
                </TouchableOpacity>

                {/* Dropdown Menu */}
                {showDropdownForOrder === order.id && order.status !== 'delivered' && (
                  <View style={styles.dropdownMenu}>
                    {/* Yolda Butonu - Sadece prepared statusunda göster */}
                    {order.status === 'prepared' && (
                      <TouchableOpacity
                        style={[styles.dropdownItem, styles.dropdownItemShipping]}
                        onPress={() => handleMarkAsShipping(order.id)}
                        disabled={updating}
                        activeOpacity={0.7}>
                        <Text style={styles.dropdownItemText}>
                          Yolda
                        </Text>
                      </TouchableOpacity>
                    )}
                    
                    {/* Teslim Edildi Butonu - Sadece shipping statusunda aktif */}
                    <TouchableOpacity
                      style={[
                        styles.dropdownItem,
                        order.status !== 'shipping' && styles.dropdownItemDisabled
                      ]}
                      onPress={() => {
                        if (order.status === 'shipping') {
                          handleMarkAsDelivered(order.id);
                        }
                      }}
                      disabled={updating || order.status !== 'shipping'}
                      activeOpacity={order.status === 'shipping' ? 0.7 : 1}>
                      <Text style={[
                        styles.dropdownItemText,
                        order.status !== 'shipping' && styles.dropdownItemTextDisabled
                      ]}>
                        ✓ Teslim Edildi
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Order Info */}
                <View style={styles.orderInfo}>
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderNumber}>
                      {t('orders.orderPrefix')}
                      {order.id.slice(0, 8).toUpperCase()}
                    </Text>
                    <Text style={styles.orderDate}>
                      {formatDate(order.created_at)}
                    </Text>
                  </View>

                  {/* Customer Info */}
                  <View style={styles.customerSection}>
                    <View style={styles.customerRow}>
                      <User
                        width={16}
                        height={16}
                        color={colors.text.secondary}
                        strokeWidth={2}
                      />
                      <Text style={styles.customerText}>
                        {order.customer_name || order.user_email}
                      </Text>
                    </View>
                    {order.customer_phone && (
                      <TouchableOpacity
                        style={styles.phoneButton}
                        onPress={() => {
                          const phoneNumber = `${order.customer_country_code || '+90'}${order.customer_phone}`;
                          Linking.openURL(`tel:${phoneNumber}`);
                        }}
                        activeOpacity={0.7}>
                        <Phone
                          width={18}
                          height={18}
                          color="#fff"
                          strokeWidth={2.5}
                        />
                        <Text style={styles.phoneButtonText}>
                          {order.customer_country_code || '+90'}{' '}
                          {order.customer_phone}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Address with Map Preview */}
                  {order.shipping_address?.address && (
                    <View style={styles.addressContainer}>
                      {/* Map Preview - Only show if coordinates exist */}
                      {order.shipping_address.latitude &&
                        order.shipping_address.longitude &&
                        order.shipping_address.latitude !== 0 &&
                        order.shipping_address.longitude !== 0 && (
                          <TouchableOpacity
                            style={styles.mapPreviewContainer}
                            onPress={() =>
                              openGoogleMaps(
                                order.shipping_address.address,
                                order.shipping_address.latitude,
                                order.shipping_address.longitude
                              )
                            }
                            activeOpacity={0.9}>
                            <MapView
                              provider={PROVIDER_GOOGLE}
                              style={styles.mapPreview}
                              initialRegion={{
                                latitude: order.shipping_address.latitude,
                                longitude: order.shipping_address.longitude,
                                latitudeDelta: 0.01,
                                longitudeDelta: 0.01,
                              }}
                              scrollEnabled={false}
                              zoomEnabled={false}
                              pitchEnabled={false}
                              rotateEnabled={false}
                              pointerEvents="none">
                              <Marker
                                coordinate={{
                                  latitude: order.shipping_address.latitude,
                                  longitude: order.shipping_address.longitude,
                                }}
                                pinColor={colors.primary}
                              />
                            </MapView>
                            {/* Overlay for tap indication */}
                            
                          </TouchableOpacity>
                        )}

                      {/* Address Info */}
                      <View style={styles.addressInfoContainer}>
                        <View style={styles.addressRow}>
                          <Pin
                            width={16}
                            height={16}
                            color={colors.text.secondary}
                            strokeWidth={2}
                          />
                          <Text style={styles.addressText} numberOfLines={3}>
                            {order.shipping_address.address}
                          </Text>
                        </View>

                        {/* Get Directions Button */}
                        <TouchableOpacity
                          style={styles.mapButton}
                          onPress={() =>
                            openGoogleMaps(
                              order.shipping_address.address,
                              order.shipping_address.latitude,
                              order.shipping_address.longitude
                            )
                          }
                          activeOpacity={0.7}>
                          <MapPin
                            width={18}
                            height={18}
                            color="#fff"
                            strokeWidth={2.5}
                          />
                          <Text style={styles.mapButtonText}>
                            {t('admin.getDirections')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Customer Address Details */}
                  {order.customer_address_details && (
                    <View style={styles.addressDetailsContainer}>
                      <Text style={styles.addressDetailsLabel}>
                        {t('profile.addressDescription')}:
                      </Text>
                      <Text style={styles.addressDetailsText}>
                        {order.customer_address_details}
                      </Text>
                    </View>
                  )}

                  {/* Delivery Note */}
                  {order.delivery_note && (
                    <View style={styles.noteContainer}>
                      <Text style={styles.noteLabel}>
                        {t('checkout.orderNote')}:
                      </Text>
                      <Text style={styles.noteText}>{order.delivery_note}</Text>
                    </View>
                  )}

                  {/* Divider */}
                  <View style={styles.divider} />

                  {/* Products List */}
                  <View style={styles.productsSection}>
                    <Text style={styles.productsSectionTitle}>
                      {t('orders.products')}
                    </Text>
                    <View style={styles.productsList}>
                      {order.items.map((item, index) => {
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
                              <View style={styles.quantityBadge}>
                                <Text style={styles.quantityText}>
                                  {item.quantity}
                                </Text>
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
                        {order.payment_method === 'card'
                          ? t('orders.card')
                          : t('orders.cash')}
                      </Text>
                    </View>
                    <Text style={styles.totalAmount}>
                      ₺{order.total_amount.toFixed(2)}
                    </Text>
                  </View>

                </View>
              </View>
            );
          })}

          {/* Loading More Indicator */}
          {loadingMore && (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingMoreText}>Daha fazla yükleniyor...</Text>
            </View>
          )}

          {/* End of List Message */}
          {!hasMore && orders.length > 0 && (
            <View style={styles.endOfListContainer}>
              <Text style={styles.endOfListText}>
                Tüm siparişler yüklendi
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Image Gallery Modal */}
      <Modal
        visible={galleryImages.length > 0}
        transparent
        animationType="fade"
        onRequestClose={() => setGalleryImages([])}>
        <View style={styles.imageModalOverlay}>
          {/* Header with product info */}
          <View style={styles.galleryHeader}>
            <View style={styles.galleryHeaderInfo}>
              <Text style={styles.galleryProductName}>
                {galleryImages[selectedImageIndex]?.name}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.imageModalCloseButton}
              onPress={() => setGalleryImages([])}
              activeOpacity={0.7}>
              <Text style={styles.imageModalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Swipeable Image Gallery */}
          <FlatList
            data={galleryImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={selectedImageIndex}
            getItemLayout={(data, index) => ({
              length: Dimensions.get('window').width,
              offset: Dimensions.get('window').width * index,
              index,
            })}
            onMomentumScrollEnd={(event) => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x / Dimensions.get('window').width
              );
              setSelectedImageIndex(index);
            }}
            keyExtractor={(item, index) => `${item.url}-${index}`}
            renderItem={({item}) => (
              <View style={styles.galleryImageContainer}>
                <Image
                  source={{uri: item.url}}
                  style={styles.imageModalImage}
                  resizeMode="contain"
                />
                {/* Quantity Badge - Resmin altında ortada */}
                <View style={styles.galleryQuantityBadge}>
                  <Text style={styles.galleryQuantityBadgeText}>
                    {item.quantity} Adet
                  </Text>
                </View>
              </View>
            )}
          />

          {/* Page Indicator */}
          {galleryImages.length > 1 && (
            <View style={styles.galleryIndicator}>
              <Text style={styles.galleryIndicatorText}>
                {selectedImageIndex + 1} / {galleryImages.length}
              </Text>
            </View>
          )}
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
    justifyContent: 'space-between',
    padding: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  roleSubtitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  orderCountBadge: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    minWidth: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  orderCountText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.text.secondary,
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
    marginBottom: spacing.lg,
  },
  refreshButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  refreshButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 120,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    borderRadius: borderRadius.xl,
    margin: spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statusText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    flex: 1,
  },
  dropdownMenu: {
    marginHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  dropdownItem: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  dropdownItemShipping: {
    backgroundColor: '#9333ea', // Mor renk
  },
  dropdownItemDisabled: {
    backgroundColor: colors.text.tertiary,
    opacity: 0.5,
  },
  dropdownItemText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: '#fff',
    textAlign: 'center',
  },
  dropdownItemTextDisabled: {
    color: '#ccc',
  },
  orderInfo: {
    padding: spacing.xs,
    
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
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
  customerSection: {
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  customerText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: 'black',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs
    ,
    borderRadius: borderRadius.lg,
    marginTop: spacing.xs,
    ...Platform.select({
      ios: {
        shadowColor: colors.success,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  phoneButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: '#fff',
  },
  addressContainer: {
    marginBottom: spacing.md,
    backgroundColor: '#fff',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapPreviewContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
    backgroundColor: colors.surface,
  },
  mapPreview: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapOverlayIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  addressInfoContainer: {
    padding: spacing.xs,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  addressText: {
    flex: 1,
    fontSize: fontSize.xs,
    color: colors.text.primary,
    lineHeight: 20,
    fontWeight: fontWeight.medium,
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  mapButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: '#fff',
  },
  addressDetailsContainer: {
    backgroundColor: colors.info + '08',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
   
   
  },
  addressDetailsLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
   
    marginBottom: spacing.xs,
    
    letterSpacing: 0.5,
  },
  addressDetailsText: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
    lineHeight: 20,
    fontWeight: fontWeight.medium,
  },
  noteContainer: {
    backgroundColor: colors.warning + '10',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  noteLabel: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  noteText: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
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
    marginBottom: spacing.md,
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
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  activeTab: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    fontSize: fontSize.xs,

    color: colors.text.secondary,
  },
  activeTabText: {
    color: '#fff',
  },
  tabBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: borderRadius.full,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  tabBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: '#fff',
  },
  loadingMoreContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  loadingMoreText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  endOfListContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  endOfListText: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  // Picker Styles
  pickerCustomerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.primary + '10',
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  pickerCustomerName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    flex: 1,
  },
  pickerProductsSection: {
    marginBottom: spacing.md,
  },
  pickerProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerProductRowSuccess: {
    borderColor: colors.success,
    borderWidth: 2,
    backgroundColor: colors.success + '08',
  },
  pickerProductRowChecked: {
    borderColor: colors.success,
    borderWidth: 2,
    backgroundColor: colors.success + '15',
  },
  pickerProductImageContainer: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.background,
    marginRight: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary + '40',
    position: 'relative',
  },
  pickerProductImageSuccess: {
    borderColor: colors.success,
    borderWidth: 3,
  },
  pickerProductImageChecked: {
    borderColor: colors.success,
    borderWidth: 3,
  },
  pickerProductImage: {
    width: '100%',
    height: '100%',
  },
  pickerProductInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  pickerProductNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
    flexWrap: 'wrap',
  },
  pickerProductName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    flex: 1,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    ...Platform.select({
      ios: {
        shadowColor: colors.success,
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  completedBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: '#fff',
  },
  pickerPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pickerProductPrice: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
  pickerQuantityBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
  },
  pickerQuantityBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: '#fff',
  },
  pickerInputContainer: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  pickerInputLabel: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
  pickerInput: {
    width: 60,
    height: 44,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    textAlign: 'center',
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    backgroundColor: '#fff',
  },
  pickerInputError: {
    borderColor: colors.error,
    backgroundColor: colors.error + '10',
  },
  pickerInputSuccess: {
    borderColor: colors.success,
    backgroundColor: colors.success + '10',
  },
  pickerReadyButton: {
    backgroundColor: colors.success,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: colors.success,
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  pickerReadyButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: '#fff',
  },
  // Image Gallery Modal Styles
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl,
    paddingBottom: spacing.md,
    marginTop: spacing.lg,
  },
  galleryHeaderInfo: {
    flex: 1,
  },
  galleryProductName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: '#fff',
    marginBottom: spacing.xs,
  },
  galleryProductQuantity: {
    fontSize: fontSize.md,
    color: colors.primary,
    fontWeight: fontWeight.semibold,
  },
  imageModalCloseButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.md,
  },
  imageModalCloseText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: fontWeight.bold,
    lineHeight: 28,
  },
  galleryImageContainer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height - 200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imageModalImage: {
    width: '100%',
    height: '100%',
  },
  galleryQuantityBadge: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.5,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  galleryQuantityBadgeText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: '#fff',
    letterSpacing: 0.5,
  },
  galleryIndicator: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  galleryIndicatorText: {
    fontSize: fontSize.md,
    color: '#fff',
    fontWeight: fontWeight.semibold,
  },
});

