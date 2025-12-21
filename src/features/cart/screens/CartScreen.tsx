/**
 * Cart Screen
 * Shopping cart management
 */

import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, FlatList, Image, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {Ionicons} from '@expo/vector-icons';
import {colors, spacing, fontSize, fontWeight, borderRadius} from '@core/constants';
import {Button} from '@shared/ui';
import {useCartStore} from '@store/slices/cartStore';
import {useTranslation} from '@localization';
import {useTabNavigation} from '@core/navigation/TabContext';
import {getDeliverySettings, meetsMinimumOrder, calculateDeliveryFee} from '../services/deliveryService';
import {DeliverySettings} from '../types';

export const CartScreen: React.FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const {setActiveTab} = useTabNavigation();
  const {items, totalAmount, updateQuantity, removeItem} = useCartStore();
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    fetchDeliverySettings();
  }, []);

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

  const handleCheckout = () => {
    // Giriş kontrolü yapmadan direkt checkout sayfasına yönlendir
    navigation.navigate('Checkout' as never);
  };

  // Check if order meets minimum requirement
  const canCheckout = meetsMinimumOrder(totalAmount, deliverySettings);
  
  // Calculate delivery fee
  const deliveryFee = calculateDeliveryFee(totalAmount, deliverySettings);

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('cart.title')}</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color={colors.text.secondary} />
          <Text style={styles.emptyText}>{t('cart.empty')}</Text>
          <Button
            title={t('cart.startShopping')}
            onPress={() => setActiveTab('Home')}
            fullWidth={false}
            rounded
            style={styles.startShoppingButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('cart.title')}</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListFooterComponent={
          <View style={styles.footer}>
            {/* Ara Toplam */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t('checkout.subtotal')}</Text>
              <Text style={styles.totalAmount}>₺{totalAmount.toFixed(2)}</Text>
            </View>

            {/* Teslimat ücreti bilgisi */}
            {deliverySettings && canCheckout && (
              <View style={styles.deliveryFeeRow}>
                <Text style={styles.deliveryFeeLabel}>Teslimat Ücreti</Text>
                <Text style={[styles.deliveryFeeValue, deliveryFee === 0 && styles.freeDeliveryText]}>
                  {deliveryFee === 0 ? 'Ücretsiz' : `₺${deliveryFee.toFixed(2)}`}
                </Text>
              </View>
            )}

            {/* Ücretsiz teslimat bilgisi */}
            {deliverySettings && totalAmount < deliverySettings.min_order_for_free_delivery && canCheckout && (
              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={18} color="#0C5460" style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoText}>
                    ₺{deliverySettings.min_order_for_free_delivery.toFixed(2)} ve üzeri ücretsiz teslimat
                  </Text>
                  <Text style={styles.infoSubText}>
                    Kalan: ₺{(deliverySettings.min_order_for_free_delivery - totalAmount).toFixed(2)}
                  </Text>
                </View>
              </View>
            )}

            {/* Ücretsiz teslimat kazanıldı */}
            {deliverySettings && totalAmount >= deliverySettings.min_order_for_free_delivery && (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={18} color="#155724" style={styles.successIcon} />
                <Text style={styles.successText}>
                  Ücretsiz teslimat kazandınız!
                </Text>
              </View>
            )}

            {/* Minimum tutar uyarısı */}
            {deliverySettings && !canCheckout && (
              <View style={styles.warningBox}>
                <Ionicons name="warning" size={18} color="#856404" style={styles.warningIcon} />
                <View style={styles.warningContent}>
                  <Text style={styles.warningText}>
                    Minimum sipariş tutarı: ₺{deliverySettings.min_order_amount.toFixed(2)}
                  </Text>
                  <Text style={styles.warningSubText}>
                    Kalan: ₺{(deliverySettings.min_order_amount - totalAmount).toFixed(2)}
                  </Text>
                </View>
              </View>
            )}

            <Button
              title={t('cart.checkout')}
              onPress={handleCheckout}
              fullWidth
              rounded
              disabled={!canCheckout}
            />
          </View>
        }
        renderItem={({item}) => (
          <View style={styles.cartItem}>
            <Image
              source={{uri: item.image_url || 'https://via.placeholder.com/80'}}
              style={styles.itemImage}
            />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.itemPrice}>₺{item.price.toFixed(2)}</Text>
              
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={styles.decrementButton}
                  onPress={() => {
                    if (item.quantity === 1) {
                      removeItem(item.id);
                    } else {
                      updateQuantity(item.id, item.quantity - 1);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  {item.quantity === 1 ? (
                    <Ionicons name="trash-outline" size={18} color={colors.text.inverse} />
                  ) : (
                    <Text style={styles.quantityButtonText}>−</Text>
                  )}
                </TouchableOpacity>
                
                <View style={styles.quantityDisplay}>
                  <Text style={styles.quantity}>{item.quantity}</Text>
                </View>
                
                <TouchableOpacity
                  style={styles.incrementButton}
                  onPress={() => updateQuantity(item.id, item.quantity + 1)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
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
    padding: spacing.lg,

  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    fontSize: fontSize.lg,
    color: colors.text.secondary,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  startShoppingButton: {
    paddingHorizontal: spacing.xl,
  },
  list: {
    padding: spacing.md,
    paddingBottom: 110, // Modern bottom bar için alan (70px bar + 40px spacing)
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    backgroundColor: colors.border,
  },
  itemInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  itemName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  itemPrice: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  decrementButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.error,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  incrementButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quantityButtonText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.inverse,
    lineHeight: fontSize.xl,
  },
  quantityDisplay: {
    minWidth: 40,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
  },
  quantity: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  footer: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    marginTop: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  totalLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  totalAmount: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  deliveryFeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  deliveryFeeLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
  },
  deliveryFeeValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  freeDeliveryText: {
    color: colors.primary,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#D1ECF1',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#BEE5EB',
  },
  infoIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: '#0C5460',
    marginBottom: 4,
  },
  infoSubText: {
    fontSize: fontSize.xs,
    color: '#0C5460',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D4EDDA',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#C3E6CB',
  },
  successIcon: {
    marginRight: spacing.sm,
  },
  successText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: '#155724',
    flex: 1,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF3CD',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#FFE69C',
  },
  warningIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  warningContent: {
    flex: 1,
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
});

