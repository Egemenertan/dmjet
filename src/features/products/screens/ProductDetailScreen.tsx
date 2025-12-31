/**
 * Product Detail Screen
 * Detailed product information and purchase options
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {useQuery} from '@tanstack/react-query';
import {ArrowLeft, ShoppingBag, Trash} from 'iconoir-react-native';
import {colors, spacing, fontSize, fontWeight, borderRadius} from '@core/constants';
import {Button} from '@shared/ui';
import {useCartStore, MAX_QUANTITY_PER_PRODUCT} from '@store/slices/cartStore';
import {useAppStore} from '@store/slices/appStore';
import {productsService} from '../services/productsService';
import {MainStackParamList} from '@core/navigation/types';
import {OptimizedImage} from '@shared/components/OptimizedImage';
import {useTranslation} from '@localization';

type ProductDetailScreenRouteProp = RouteProp<MainStackParamList, 'ProductDetail'>;

const {width: SCREEN_WIDTH} = Dimensions.get('window');

export const ProductDetailScreen: React.FC = () => {
  const {t} = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<ProductDetailScreenRouteProp>();
  const {productId} = route.params;
  
  const {items, addItem, updateQuantity, removeItem} = useCartStore();
  const {language} = useAppStore();
  
  const [imageScale] = useState(new Animated.Value(1));
  
  // Ürün detaylarını çek
  const {data: product, isLoading, error} = useQuery({
    queryKey: ['product', productId, language],
    queryFn: async () => {
      const foundProduct = await productsService.getProductById(productId, language);
      if (!foundProduct) {
        throw new Error('Ürün bulunamadı');
      }
      return foundProduct;
    },
  });

  // Sepetteki ürün miktarını bul
  const cartItem = items.find(item => item.id === productId);
  const quantity = cartItem?.quantity || 0;
  const isInCart = quantity > 0;

  // Görsel zoom animasyonu
  const handleImagePressIn = () => {
    Animated.spring(imageScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handleImagePressOut = () => {
    Animated.spring(imageScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    const translation = product.product_translations?.[0];
    addItem({
      id: product.id,
      name: translation?.name || product.name,
      price: product.price,
      image_url: product.image_url,
      discount: product.discount,
      barcode: product.barcode || null,
      category_id: product.category_id || null,
    });
  };

  const handleIncrement = () => {
    // Check if we're at the limit
    if (quantity >= MAX_QUANTITY_PER_PRODUCT) {
      Alert.alert(
        t('cart.maxQuantityTitle'),
        t('cart.maxQuantityMessage', {max: MAX_QUANTITY_PER_PRODUCT.toString()}),
        [{text: t('common.ok')}]
      );
      return;
    }
    updateQuantity(productId, quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity === 1) {
      // Miktar 1 ise sepetten tamamen kaldır
      removeItem(productId);
    } else {
      // Miktar 1'den fazla ise sadece azalt
      updateQuantity(productId, quantity - 1);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <ArrowLeft width={24} height={24} color={colors.text.primary} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ürün Detayı</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Ürün bulunamadı</Text>
          <Button
            title="Geri Dön"
            onPress={() => navigation.goBack()}
            variant="primary"
            style={styles.errorButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  const translation = product.product_translations?.[0];
  const productName = translation?.name || product.name || 'Ürün';
  const finalPrice = (product.discount && product.discount > 0)
    ? product.price * (1 - product.discount / 100) 
    : product.price;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowLeft width={24} height={24} color={colors.text.primary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ürün Detayı</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Image */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPressIn={handleImagePressIn}
          onPressOut={handleImagePressOut}
        >
          <Animated.View 
            style={[
              styles.imageContainer,
              {
                transform: [{scale: imageScale}],
              }
            ]}
          >
            {product.image_url && product.image_url.trim() !== '' ? (
              <OptimizedImage 
                source={{uri: product.image_url}} 
                style={styles.productImage}
                contentFit="cover"
                showLoader
              />
            ) : (
              <View style={styles.placeholderImage}>
                <ShoppingBag width={80} height={80} color={colors.text.tertiary} />
              </View>
            )}
            
            {product.discount != null && product.discount > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{`-${Math.round(product.discount)}%`}</Text>
              </View>
            )}
          </Animated.View>
        </TouchableOpacity>

        {/* Product Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.productName}>{productName}</Text>
          
          <View style={styles.priceRow}>
            {product.discount != null && product.discount > 0 && (
              <Text style={styles.originalPrice}>{`₺${product.price.toFixed(2)}`}</Text>
            )}
            <Text style={styles.price}>{`₺${finalPrice.toFixed(2)}`}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        {!isInCart ? (
          <Button
            title="Sepete Ekle"
            onPress={handleAddToCart}
            fullWidth
            size="lg"
            rounded
            icon={<ShoppingBag width={20} height={20} color={colors.text.inverse} />}
          />
        ) : (
          <View style={styles.quantityControls}>
            <TouchableOpacity 
              style={styles.decrementButton}
              onPress={handleDecrement}
              activeOpacity={0.7}
            >
              {quantity === 1 ? (
                <Trash width={24} height={24} color={colors.text.inverse} strokeWidth={2} />
              ) : (
                <Text style={styles.quantityButtonText}>−</Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.quantityDisplay}>
              <Text style={styles.quantityText}>{quantity}</Text>
              <Text style={styles.quantityLabel}>Sepette</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.incrementButton}
              onPress={handleIncrement}
              activeOpacity={0.7}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    fontSize: fontSize.xl,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  errorButton: {
    minWidth: 200,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: colors.surface,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  discountBadge: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  discountText: {
    color: colors.text.inverse,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  infoContainer: {
    padding: spacing.lg,
  },
  productName: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  originalPrice: {
    fontSize: fontSize.lg,
    color: colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  price: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
  },
  decrementButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.error,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  incrementButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  quantityButtonText: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text.inverse,
    lineHeight: fontSize.xxl,
  },
  quantityDisplay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    height: 56,
    borderWidth: 2,
    borderColor: colors.border,
  },
  quantityText: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  quantityLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
});

