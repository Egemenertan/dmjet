/**
 * Cart Screen
 * Shopping cart management
 */

import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert, ActivityIndicator} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {Ionicons} from '@expo/vector-icons';
import {colors, spacing, fontSize, fontWeight, borderRadius} from '@core/constants';
import {Button} from '@shared/ui';
import {useCartStore, MAX_QUANTITY_PER_PRODUCT} from '@store/slices/cartStore';
import {useTranslation} from '@localization';
import {useTabNavigation} from '@core/navigation/TabContext';
import {useWorkingHoursContext} from '@core/contexts/WorkingHoursContext';
import {getDeliverySettings, meetsMinimumOrder, calculateDeliveryFee, meetsMinimumOrderExcludingCigarettes, calculateAmountExcludingCigarettes, calculateDeliveryFeeExcludingCigarettes} from '../services/deliveryService';
import {DeliverySettings} from '../types';
import {supabase} from '@core/services/supabase';





export const CartScreen: React.FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const {setActiveTab} = useTabNavigation();
  const {items, totalAmount, updateQuantity, removeItem} = useCartStore();
  const {isWithinWorkingHours, isEnabled: workingHoursEnabled, message: workingHoursMessage} = useWorkingHoursContext();
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [checkingStock, setCheckingStock] = useState(false);

  // Delivery settings'i her zaman çek (login olsun olmasın)
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

  const checkStockAvailability = async (): Promise<{
    available: boolean; 
    outOfStockItems: Array<{id: string; name: string; requested: number; available: number; type: 'out' | 'insufficient'}>
  }> => {
    try {
      // Sepetteki ürünlerin stock_id'lerini al
      const stockIds = items.map(item => parseInt(item.id));
      
      // Supabase'den güncel stok bilgilerini çek
      const {data: stockData, error} = await supabase
        .from('stocks')
        .select('stock_id, name, balance')
        .in('stock_id', stockIds);

      if (error) {
        console.error('Stok kontrolü hatası:', error);
        throw error;
      }

      // Stokta olmayan veya yetersiz olan ürünleri bul
      const outOfStockItems: Array<{
        id: string; 
        name: string; 
        requested: number; 
        available: number;
        type: 'out' | 'insufficient'
      }> = [];
      
      items.forEach(cartItem => {
        const stockItem = stockData?.find(s => s.stock_id === parseInt(cartItem.id));
        
        // Eğer ürün bulunamadıysa veya balance 0 veya negatifse
        if (!stockItem || stockItem.balance <= 0) {
          outOfStockItems.push({
            id: cartItem.id,
            name: cartItem.name,
            requested: cartItem.quantity,
            available: stockItem?.balance || 0,
            type: 'out',
          });
        } 
        // Eğer istenen miktar stoktan fazlaysa
        else if (stockItem.balance < cartItem.quantity) {
          outOfStockItems.push({
            id: cartItem.id,
            name: cartItem.name,
            requested: cartItem.quantity,
            available: Math.floor(stockItem.balance), // Ondalıklı balance'ı tam sayıya çevir
            type: 'insufficient',
          });
        }
      });

      return {
        available: outOfStockItems.length === 0,
        outOfStockItems,
      };
    } catch (error) {
      console.error('Stok kontrolü hatası:', error);
      // Hata durumunda güvenli tarafta kalıp devam etmeyelim
      throw error;
    }
  };

  const handleCheckout = async () => {
    // Stok kontrolü yap
    setCheckingStock(true);
    try {
      const stockCheck = await checkStockAvailability();
      
      if (!stockCheck.available) {
        // Stokta olmayan veya yetersiz olan ürünleri göster
        const stockMessages = stockCheck.outOfStockItems.map(item => {
          if (item.type === 'out') {
            return t('checkout.outOfStockItem', {productName: item.name});
          } else {
            return t('checkout.insufficientStockItem', {
              productName: item.name,
              available: item.available,
              requested: item.requested,
            });
          }
        }).join('\n');
        
        Alert.alert(
          t('checkout.outOfStockTitle'),
          `${t('checkout.outOfStockMessage')}\n\n${stockMessages}`,
          [{text: t('common.ok')}]
        );
        return;
      }
      
      // Stok kontrolü başarılı, checkout sayfasına git
      navigation.navigate('Checkout' as never);
    } catch (error) {
      console.error('Stok kontrolü hatası:', error);
      // Hata durumunda yine de checkout'a git (kullanıcı deneyimini bozmamak için)
      Alert.alert(
        t('common.error'),
        t('checkout.stockCheckError'),
        [
          {text: t('common.cancel'), style: 'cancel'},
          {text: t('common.ok'), onPress: () => navigation.navigate('Checkout' as never)}
        ]
      );
    } finally {
      setCheckingStock(false);
    }
  };

  // Check if order meets minimum requirement (excluding cigarettes)
  const meetsMinOrder = meetsMinimumOrderExcludingCigarettes(items, deliverySettings);
  
  // Calculate amount excluding cigarettes for display
  const amountExcludingCigarettes = calculateAmountExcludingCigarettes(items);
  
  // Check working hours - disable checkout if outside working hours
  const canCheckout = meetsMinOrder && (!workingHoursEnabled || isWithinWorkingHours);
  
  // Calculate delivery fee (excluding cigarettes)
  const deliveryFee = calculateDeliveryFeeExcludingCigarettes(items, deliverySettings);

  // Don't show loading screen for settings - just show cart with loading state
  // This prevents flickering and provides better UX

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
            <View style={styles.subtotalRow}>
              <Text style={styles.subtotalLabel}>{t('checkout.subtotal')}</Text>
              <Text style={styles.subtotalAmount}>{`₺${totalAmount.toFixed(2)}`}</Text>
            </View>
          
            {/* Teslimat ücreti bilgisi */}
            {deliverySettings && (
              <View style={styles.deliveryFeeRow}>
                <Text style={styles.deliveryFeeLabel}>{t('cart.deliveryFee')}</Text>
                <Text style={[styles.deliveryFeeValue, deliveryFee === 0 && styles.freeDeliveryText]}>
                  {deliveryFee === 0 ? t('cart.free') : `₺${deliveryFee.toFixed(2)}`}
                </Text>
              </View>
            )}

            {/* Toplam */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t('cart.total')}</Text>
              <Text style={styles.totalAmount}>{`₺${(totalAmount + deliveryFee).toFixed(2)}`}</Text>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Ücretsiz teslimat bilgisi - minimum tutarı karşıladıysa ve henüz ücretsiz teslimat kazanmadıysa */}
            {deliverySettings && meetsMinOrder && amountExcludingCigarettes < deliverySettings.min_order_for_free_delivery && (
              <View style={styles.infoBox}>
                <Ionicons name="information-circle" size={18} color="#0C5460" style={styles.infoIcon} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoText}>
                    {t('cart.freeDeliveryInfo', {amount: `₺${deliverySettings.min_order_for_free_delivery.toFixed(2)}`})}
                  </Text>
                  <Text style={styles.infoSubText}>
                    {`${t('cart.remaining')}: ₺${(deliverySettings.min_order_for_free_delivery - amountExcludingCigarettes).toFixed(2)}`}
                  </Text>
                  <Text style={styles.infoSubText}>
                    {t('cart.tobaccoExcluded')}
                  </Text>
                </View>
              </View>
            )}

            {/* Ücretsiz teslimat kazanıldı */}
            {deliverySettings && amountExcludingCigarettes >= deliverySettings.min_order_for_free_delivery && (
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={18} color="#155724" style={styles.successIcon} />
                <Text style={styles.successText}>
                  {t('cart.freeDeliveryEarned')}
                </Text>
              </View>
            )}

            {/* Minimum tutar uyarısı */}
            {deliverySettings && !meetsMinOrder && (
              <View style={styles.warningBox}>
                <Ionicons name="warning" size={18} color="#856404" style={styles.warningIcon} />
                <View style={styles.warningContent}>
                  <Text style={styles.warningText}>
                    {`${t('cart.minOrderAmount')}: ₺${deliverySettings.min_order_amount.toFixed(2)}`}
                  </Text>
                  <Text style={styles.warningSubText}>
                    {`${t('cart.remaining')}: ₺${(deliverySettings.min_order_amount - amountExcludingCigarettes).toFixed(2)}`}
                  </Text>
                  <Text style={styles.warningInfoText}>
                    {t('cart.tobaccoExcluded')}
                  </Text>
                </View>
              </View>
            )}

            {/* Çalışma saatleri uyarısı */}
            {workingHoursEnabled && !isWithinWorkingHours && (
              <View style={styles.workingHoursWarningBox}>
                <Ionicons name="time" size={18} color="#d63384" style={styles.workingHoursWarningIcon} />
                <View style={styles.workingHoursWarningContent}>
                  <Text style={styles.workingHoursWarningText}>
                    {t('cart.outsideWorkingHours', 'Hizmet saatleri dışında')}
                  </Text>
                  <Text style={styles.workingHoursWarningSubText}>
                    {workingHoursMessage}
                  </Text>
                </View>
              </View>
            )}

            <Button
              title={checkingStock ? t('checkout.checkingStock') : t('cart.checkout')}
              onPress={handleCheckout}
              fullWidth
              rounded
              disabled={!canCheckout || checkingStock}
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
                  onPress={() => {
                    if (item.quantity >= MAX_QUANTITY_PER_PRODUCT) {
                      Alert.alert(
                        t('cart.maxQuantityTitle'),
                        t('cart.maxQuantityMessage', {max: MAX_QUANTITY_PER_PRODUCT.toString()}),
                        [{text: t('common.ok')}]
                      );
                      return;
                    }
                    updateQuantity(item.id, item.quantity + 1);
                  }}
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
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  subtotalLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
  },
  subtotalAmount: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  deliveryFeeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    marginBottom: spacing.sm,
  },
  deliveryFeeLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
  },
  deliveryFeeValue: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  freeDeliveryText: {
    color: colors.primary,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
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
  warningInfoText: {
    fontSize: fontSize.xs,
    color: '#856404',
    marginTop: 4,
    fontStyle: 'italic',
  },
  workingHoursWarningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8D7DA',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#F5C6CB',
  },
  workingHoursWarningIcon: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  workingHoursWarningContent: {
    flex: 1,
  },
  workingHoursWarningText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    color: '#721c24',
    marginBottom: 4,
  },
  workingHoursWarningSubText: {
    fontSize: fontSize.xs,
    color: '#721c24',
    lineHeight: 16,
  },
});

