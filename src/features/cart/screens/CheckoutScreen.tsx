/**
 * Checkout Screen
 * Modern Apple-style checkout with map preview and payment selection
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  TextInput,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import {
  NavArrowLeft,
  Pin,
  Lock,
  CreditCard,
  Cash,
  ShoppingBag,
  EditPencil,
  ChatLines,
} from 'iconoir-react-native';
import {colors, spacing, fontSize, fontWeight, borderRadius} from '@core/constants';
import {Button} from '@shared/ui';
import {useCartStore} from '@store/slices/cartStore';
import {useAuthStore} from '@store/slices/authStore';
import {useTranslation} from '@localization';
import {supabase} from '@core/services/supabase';
import {
  getDeliverySettings,
  calculateDeliveryFee,
  meetsMinimumOrder,
} from '../services/deliveryService';
import {DeliverySettings} from '../types';
import {isInDeliveryArea} from '@core/utils/polygon';

interface UserLocation {
  latitude: number;
  longitude: number;
  address?: string;
  addressDetails?: string;
  phone?: string;
  countryCode?: string;
}

type PaymentMethod = 'card' | 'cash';

export const CheckoutScreen: React.FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const {items, totalAmount, clearCart} = useCartStore();
  const {user, isAuthenticated} = useAuthStore();
  
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderNote, setOrderNote] = useState('');
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [isLocationInDeliveryArea, setIsLocationInDeliveryArea] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserLocation();
    } else {
      setLoadingLocation(false);
    }
    // Fetch delivery settings on mount
    fetchDeliverySettings();
  }, [isAuthenticated]);

  const fetchDeliverySettings = async () => {
    try {
      setLoadingSettings(true);
      const settings = await getDeliverySettings();
      setDeliverySettings(settings);
    } catch (error) {
      console.error('Delivery settings yüklenemedi:', error);
    } finally {
      setLoadingSettings(false);
    }
  };

  // Sayfa focus olduğunda konumu yeniden yükle
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (isAuthenticated) {
        fetchUserLocation();
      }
    });
    return unsubscribe;
  }, [navigation, isAuthenticated]);

  const fetchUserLocation = async () => {
    try {
      setLoadingLocation(true);
      const {data, error} = await supabase
        .from('profiles')
        .select('location_lat, location_lng, address, address_details, phone, country_code')
        .eq('id', user?.id)
        .single();

      if (error) {
        console.error('Konum yükleme hatası:', error);
        // Hata olsa bile loading'i kapat
        setLoadingLocation(false);
        return;
      }

      if (data?.location_lat && data?.location_lng) {
        const location = {
          latitude: data.location_lat,
          longitude: data.location_lng,
          address: data.address || undefined,
          addressDetails: data.address_details || undefined,
          phone: data.phone || undefined,
          countryCode: data.country_code || '+90',
        };
        
        // Teslimat alanı kontrolü
        const inDeliveryArea = isInDeliveryArea(location);
        setIsLocationInDeliveryArea(inDeliveryArea);
        
        setUserLocation(location);
      } else {
        // Konum bilgisi yoksa null olarak bırak
        setUserLocation(null);
      }
    } catch (error) {
      console.error('Konum yüklenemedi:', error);
    } finally {
      // Her durumda loading'i kapat
      setLoadingLocation(false);
    }
  };

  const handleSelectLocation = () => {
    if (!isAuthenticated) {
      // Login sayfasına yönlendir ve geri dönüşte Checkout'a yönlendir
      (navigation as any).navigate('Auth', {
        screen: 'Login',
        params: { returnTo: 'Checkout' }
      });
      return;
    }
    
    (navigation as any).navigate('MapSelection', {
      currentLocation: userLocation,
      onLocationSelect: (location: UserLocation) => {
        // Teslimat alanı kontrolü
        const inDeliveryArea = isInDeliveryArea(location);
        setIsLocationInDeliveryArea(inDeliveryArea);
        
        setUserLocation(location);
      },
    });
  };

  const handlePlaceOrder = async () => {
    if (!userLocation) {
      Alert.alert(
        t('checkout.selectAddressError'),
        t('checkout.selectAddressMessage'),
        [{text: t('common.ok')}]
      );
      return;
    }

    // Check minimum order requirement
    if (!canPlaceOrder) {
      const minAmount = deliverySettings?.min_order_amount || 0;
      Alert.alert(
        'Minimum Sipariş Tutarı',
        `Sipariş verebilmek için minimum ₺${minAmount.toFixed(2)} tutarında alışveriş yapmalısınız.`,
        [{text: t('common.ok')}]
      );
      return;
    }

    setIsPlacingOrder(true);
    try {
      // Sipariş verilerini hazırla
      const orderItems = items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image_url: item.image_url,
        barcode: item.barcode || null,
      }));

      const shippingAddress = {
        address: userLocation.address,
        addressDetails: userLocation.addressDetails,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        phone: userLocation.phone ? `${userLocation.countryCode} ${userLocation.phone}` : undefined,
        full_name: 'Teslimat Adresi',
      };

      // Sipariş oluştur
      const {data: order, error: orderError} = await supabase
        .from('orders')
        .insert({
          user_id: user?.id,
          user_email: user?.email || '',
          total_amount: finalTotal,
          original_amount: totalAmount,
          payment_method: paymentMethod,
          shipping_address: shippingAddress,
          items: orderItems,
          status: 'preparing',
          delivery_note: orderNote.trim() || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Sepeti temizle
      clearCart();

      // Başarı mesajı ve Orders tab'ına yönlendirme
      Alert.alert(
        t('checkout.orderSuccess'),
        t('checkout.orderSuccessMessage'),
        [
          {
            text: t('common.ok'),
            onPress: async () => {
              // Orders tab'ına gitmek istediğimizi kaydet
              await AsyncStorage.setItem('navigateToOrders', 'true');
              // MainTabs'a geri dön
              navigation.navigate('MainTabs' as never);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Sipariş oluşturulamadı:', error);
      Alert.alert(
        t('checkout.orderError'),
        error.message || t('orders.errorOccurred'),
        [{text: t('common.ok')}]
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Calculate delivery fee based on settings
  const deliveryFee = calculateDeliveryFee(totalAmount, deliverySettings);
  const finalTotal = totalAmount + deliveryFee;
  
  // Check if order meets minimum requirement (from Supabase)
  const canPlaceOrder = meetsMinimumOrder(totalAmount, deliverySettings);

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
        <Text style={styles.title}>{t('checkout.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Teslimat Adresi Bölümü */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Pin
              width={22}
              height={22}
              color={colors.primary}
              strokeWidth={2}
              style={styles.sectionIconComponent}
            />
            <Text style={styles.sectionTitle}>{t('checkout.deliveryAddress')}</Text>
          </View>

          {!isAuthenticated ? (
            <TouchableOpacity
              style={styles.addLocationCard}
              onPress={handleSelectLocation}
            >
              <Lock
                width={48}
                height={48}
                color={colors.text.secondary}
                strokeWidth={1.5}
                style={styles.addLocationIconComponent}
              />
              <Text style={styles.addLocationTitle}>{t('checkout.loginToCheckout')}</Text>
              <Text style={styles.addLocationText}>
                {t('checkout.loginToCheckoutMessage')}
              </Text>
            </TouchableOpacity>
          ) : loadingLocation ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : userLocation ? (
            <TouchableOpacity
              style={styles.locationCard}
              onPress={handleSelectLocation}
              activeOpacity={0.8}
            >
              {/* Mini Map Preview */}
              <View style={styles.mapContainer}>
                <MapView
                  provider={PROVIDER_GOOGLE}
                  style={styles.map}
                  initialRegion={{
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                  mapType="standard"
                  scrollEnabled={false}
                  zoomEnabled={false}
                  pitchEnabled={false}
                  rotateEnabled={false}
                  pointerEvents="none"
                  loadingEnabled={true}
                  loadingIndicatorColor={colors.primary}
                  loadingBackgroundColor={colors.background}
                >
                  <Marker
                    coordinate={{
                      latitude: userLocation.latitude,
                      longitude: userLocation.longitude,
                    }}
                    pinColor={colors.primary}
                  />
                </MapView>
                {/* Edit Button */}
                <View style={styles.editButtonContainer}>
                  <View style={styles.editButton}>
                    <EditPencil
                      width={18}
                      height={18}
                      color={colors.text.primary}
                      strokeWidth={2}
                    />
                    <Text style={styles.editButtonText}>{t('common.edit')}</Text>
                  </View>
                </View>
              </View>

              {/* Address Info */}
              <View style={styles.addressInfo}>
                <Text style={styles.addressText} numberOfLines={2}>
                  {userLocation.address ||
                    `${userLocation.latitude.toFixed(6)}, ${userLocation.longitude.toFixed(6)}`}
                </Text>
                
                {/* Address Details */}
                {userLocation.addressDetails && (
                  <View style={styles.addressDetailsContainer}>
                    <Text style={styles.addressDetailsLabel}>{t('checkout.addressDetails')}:</Text>
                    <Text style={styles.addressDetailsText} numberOfLines={3}>
                      {userLocation.addressDetails}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.addLocationCard}
              onPress={handleSelectLocation}
            >
              <Pin
                width={48}
                height={48}
                color={colors.primary}
                strokeWidth={1.5}
                style={styles.addLocationIconComponent}
              />
              <Text style={styles.addLocationTitle}>{t('checkout.addNewAddress')}</Text>
              <Text style={styles.addLocationText}>
                {t('checkout.pleaseSelectAddress')}
              </Text>
            </TouchableOpacity>
          )}
          
          {/* Teslimat Alanı Uyarısı */}
          {userLocation && !isLocationInDeliveryArea && (
            <View style={styles.deliveryWarningContainer}>
              <Text style={styles.deliveryWarningTitle}>⚠️ Teslimat Alanı Dışında</Text>
              <Text style={styles.deliveryWarningText}>
                Seçtiğiniz adres teslimat alanımız dışında kalmaktadır. Lütfen teslimat alanımız içerisinden bir adres seçiniz.
              </Text>
            </View>
          )}
        </View>

        {/* Ödeme Yöntemi Bölümü */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CreditCard
              width={22}
              height={22}
              color={colors.primary}
              strokeWidth={2}
              style={styles.sectionIconComponent}
            />
            <Text style={styles.sectionTitle}>{t('checkout.paymentMethod')}</Text>
          </View>

          <View style={styles.paymentMethods}>
            {/* Kredi Kartı */}
            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === 'card' && styles.paymentOptionActive,
              ]}
              onPress={() => setPaymentMethod('card')}
              activeOpacity={0.7}
            >
              <View style={styles.radioButton}>
                {paymentMethod === 'card' && <View style={styles.radioButtonInner} />}
              </View>
              <CreditCard
                width={24}
                height={24}
                color={paymentMethod === 'card' ? colors.primary : colors.text.secondary}
                strokeWidth={2}
                style={styles.paymentIcon}
              />
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentTitle}>{t('checkout.creditCard')}</Text>
                <Text style={styles.paymentDescription}>
                  {t('checkout.creditCard')}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Nakit */}
            <TouchableOpacity
              style={[
                styles.paymentOption,
                paymentMethod === 'cash' && styles.paymentOptionActive,
              ]}
              onPress={() => setPaymentMethod('cash')}
              activeOpacity={0.7}
            >
              <View style={styles.radioButton}>
                {paymentMethod === 'cash' && <View style={styles.radioButtonInner} />}
              </View>
              <Cash
                width={24}
                height={24}
                color={paymentMethod === 'cash' ? colors.primary : colors.text.secondary}
                strokeWidth={2}
                style={styles.paymentIcon}
              />
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentTitle}>{t('checkout.cashOnDelivery')}</Text>
                <Text style={styles.paymentDescription}>
                  {t('checkout.cashOnDelivery')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sipariş Notu Bölümü */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ChatLines
              width={22}
              height={22}
              color={colors.primary}
              strokeWidth={2}
              style={styles.sectionIconComponent}
            />
            <Text style={styles.sectionTitle}>{t('checkout.orderNote')}</Text>
            <Text style={styles.optionalLabel}>{t('checkout.optional')}</Text>
          </View>

          <View style={styles.noteCard}>
            <TextInput
              style={styles.noteInput}
              placeholder={t('checkout.orderNotePlaceholder')}
              placeholderTextColor={colors.text.secondary}
              value={orderNote}
              onChangeText={setOrderNote}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>
              {orderNote.length}/500
            </Text>
          </View>
        </View>

        {/* Sipariş Özeti Bölümü */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ShoppingBag
              width={22}
              height={22}
              color={colors.primary}
              strokeWidth={2}
              style={styles.sectionIconComponent}
            />
            <Text style={styles.sectionTitle}>{t('checkout.orderSummary')}</Text>
          </View>

          <View style={styles.summaryCard}>
            {/* Ürünler */}
            <View style={styles.summaryItems}>
              {items.map((item, index) => (
                <View key={item.id} style={styles.summaryItem}>
                  {/* Ürün Resmi */}
                  <View style={styles.summaryItemImageContainer}>
                    {item.image_url ? (
                      <Image 
                        source={{uri: item.image_url}} 
                        style={styles.summaryItemImage}
                      />
                    ) : (
                      <View style={styles.summaryItemImagePlaceholder}>
                        <ShoppingBag
                          width={20}
                          height={20}
                          color={colors.text.tertiary}
                          strokeWidth={1.5}
                        />
                      </View>
                    )}
                  </View>
                  
                  {/* Ürün Bilgileri */}
                  <View style={styles.summaryItemInfo}>
                    <Text style={styles.summaryItemName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.summaryItemQuantity}>
                      {t('cart.quantity')}: {item.quantity}
                    </Text>
                  </View>
                  
                  {/* Fiyat */}
                  <Text style={styles.summaryItemPrice}>
                    ₺{(item.price * item.quantity).toFixed(2)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Divider */}
            <View style={styles.summaryDivider} />

            {/* Ara Toplam */}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('checkout.subtotal')}</Text>
              <Text style={styles.summaryValue}>₺{totalAmount.toFixed(2)}</Text>
            </View>

            {/* Teslimat Ücreti */}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('checkout.deliveryFee')}</Text>
              <Text style={[styles.summaryValue, deliveryFee === 0 && styles.freeText]}>
                {deliveryFee === 0 ? t('checkout.free') : `₺${deliveryFee.toFixed(2)}`}
              </Text>
            </View>

            {/* Minimum Order Warning */}
            {deliverySettings && !canPlaceOrder && (
              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  Minimum sipariş tutarı: ₺{deliverySettings.min_order_amount.toFixed(2)}
                </Text>
                <Text style={styles.warningSubText}>
                  Kalan: ₺{(deliverySettings.min_order_amount - totalAmount).toFixed(2)}
                </Text>
              </View>
            )}

            {/* Free Delivery Info */}
            {deliverySettings && deliveryFee > 0 && canPlaceOrder && (
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  ₺{deliverySettings.min_order_for_free_delivery.toFixed(2)} ve üzeri siparişlerde ücretsiz teslimat!
                </Text>
              </View>
            )}

            {/* Divider */}
            <View style={styles.summaryDivider} />

            {/* Toplam */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t('checkout.total')}</Text>
              <Text style={styles.totalAmount}>₺{finalTotal.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer - Sipariş Ver / Giriş Yap Butonu */}
      <View style={styles.footer}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>{t('checkout.total')}</Text>
          <Text style={styles.footerTotalAmount}>₺{finalTotal.toFixed(2)}</Text>
        </View>
        {!isAuthenticated ? (
          <Button
            title={t('auth.login')}
            onPress={() => (navigation as any).navigate('Auth', {
              screen: 'Login',
              params: { returnTo: 'Checkout' }
            })}
            fullWidth
            rounded
          />
        ) : (
          <Button
            title={isPlacingOrder ? t('common.loading') : t('checkout.placeOrder')}
            onPress={handlePlaceOrder}
            fullWidth
            rounded
            disabled={isPlacingOrder || !userLocation || !canPlaceOrder || !isLocationInDeliveryArea}
          />
        )}
      </View>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
   
    ...Platform.select({
      android: {
        elevation: 0,
      },
    }),
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionIconComponent: {
    marginRight: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  optionalLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginLeft: spacing.xs,
    fontStyle: 'italic',
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  locationCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      android: {
        elevation: 0,
      },
    }),
  },
  mapContainer: {
    height: 160,
    width: '100%',
    position: 'relative',
    backgroundColor: colors.background,
  },
  map: {
    flex: 1,
    backgroundColor: colors.background,
  },
  editButtonContainer: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    ...Platform.select({
      android: {
        elevation: 0,
        borderWidth: 0,
      },
    }),
  },
  editButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  addressInfo: {
    padding: spacing.md,
  },
  addressText: {
    fontSize: fontSize.md,
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
    lineHeight: 20,
  },
  addressDetailsContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addressDetailsLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: 4,
    fontWeight: fontWeight.medium,
  },
  addressDetailsText: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  addLocationCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addLocationIconComponent: {
    marginBottom: spacing.md,
  },
  addLocationTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  addLocationText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  paymentMethods: {
    gap: spacing.md,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.border,
    ...Platform.select({
      android: {
        elevation: 0,
      },
    }),
  },
  paymentOptionActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  paymentIcon: {
    marginRight: spacing.sm,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  paymentDescription: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  noteCard: {
    // Note card container styles if needed
  },
  noteInput: {
    fontSize: fontSize.md,
    color: colors.text.primary,
    minHeight: 120,
    maxHeight: 180,
    padding: spacing.md,
    backgroundColor: '#F5F5F7',
    borderRadius: borderRadius.lg,
    borderWidth: 0,
    marginBottom: spacing.sm,
    lineHeight: 22,
    ...Platform.select({
      android: {
        elevation: 0,
      },
    }),
  },
  characterCount: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    textAlign: 'right',
    fontWeight: fontWeight.medium,
    marginTop: spacing.xs,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...Platform.select({
      android: {
        elevation: 0,
      },
    }),
  },
  summaryItems: {
    gap: spacing.md,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  summaryItemImageContainer: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryItemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  summaryItemImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F7',
  },
  summaryItemInfo: {
    flex: 1,
    marginRight: spacing.xs,
    minWidth: 0, // Flex shrink için gerekli
  },
  summaryItemName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    marginBottom: 2,
    flexShrink: 1, // Text'in küçülmesine izin ver
  },
  summaryItemQuantity: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
  },
  summaryItemPrice: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    minWidth: 70, // Fiyat için minimum genişlik
    textAlign: 'right', // Fiyatı sağa hizala
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  freeText: {
    color: colors.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  totalAmount: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...Platform.select({
      android: {
        elevation: 0,
      },
    }),
  },
  footerTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  footerTotalLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
  },
  footerTotalAmount: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  warningBox: {
    backgroundColor: '#FFF3CD',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: '#FFE69C',
  },
  warningText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: '#856404',
    marginBottom: 4,
  },
  warningSubText: {
    fontSize: fontSize.xs,
    color: '#856404',
  },
  infoBox: {
    backgroundColor: '#D1ECF1',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: '#BEE5EB',
  },
  infoText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: '#0C5460',
    textAlign: 'center',
  },
  deliveryWarningContainer: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFEAA7',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  deliveryWarningTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: '#856404',
    marginBottom: spacing.xs,
  },
  deliveryWarningText: {
    fontSize: fontSize.sm,
    color: '#856404',
    lineHeight: 20,
  },
});

