/**
 * Product Card Component
 * Displays product information in a card
 */

import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Animated} from 'react-native';
import { Trash } from 'iconoir-react-native';
import {colors, spacing, borderRadius, fontSize, fontWeight} from '@core/constants';
import {Button} from '@shared/ui';
import {useCartStore} from '@store/slices/cartStore';
import {useTranslation} from '@localization';
import {OptimizedImage} from '@shared/components/OptimizedImage';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  discount?: number;
  onPress: () => void;
  onAddToCart: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  price,
  image_url,
  discount,
  onPress,
  onAddToCart,
}) => {
  const {t} = useTranslation();
  const finalPrice = discount ? price * (1 - discount / 100) : price;
  const {items, updateQuantity, removeItem} = useCartStore();
  
  // Sepetteki ürün miktarını bul
  const cartItem = items.find(item => item.id === id);
  const quantity = cartItem?.quantity || 0;
  const isInCart = quantity > 0;

  // Animasyon değerleri
  const [animatedValue] = useState(new Animated.Value(isInCart ? 1 : 0));

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: isInCart ? 1 : 0,
      useNativeDriver: false,
      tension: 50,
      friction: 7,
    }).start();
  }, [isInCart]);

  const handleAddToCart = () => {
    onAddToCart();
  };

  const handleIncrement = () => {
    updateQuantity(id, quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity === 1) {
      // Miktar 1 ise sepetten tamamen kaldır
      removeItem(id);
    } else {
      // Miktar 1'den fazla ise sadece azalt
      updateQuantity(id, quantity - 1);
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        {image_url ? (
          <OptimizedImage 
            source={{uri: image_url}} 
            style={styles.image}
            contentFit="cover"
            showLoader
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
        {discount && discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discount}%</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>

        <View style={styles.priceContainer}>
          {discount && discount > 0 && (
            <Text style={styles.originalPrice}>₺{price.toFixed(2)}</Text>
          )}
          <Text style={styles.price}>₺{finalPrice.toFixed(2)}</Text>
        </View>

        {!isInCart ? (
          <Button
            title={t('products.addToCart')}
            onPress={handleAddToCart}
            size="sm"
            fullWidth
            rounded
          />
        ) : (
          <Animated.View 
            style={[
              styles.quantityControls,
              {
                opacity: animatedValue,
                transform: [{
                  scale: animatedValue,
                }],
              }
            ]}
          >
            <TouchableOpacity 
              style={styles.decrementButton}
              onPress={handleDecrement}
              activeOpacity={0.7}
            >
              {quantity === 1 ? (
                <Trash width={18} height={18} color={colors.text.inverse} strokeWidth={2} />
              ) : (
                <Text style={styles.quantityButtonText}>−</Text>
              )}
            </TouchableOpacity>
            
            <View style={styles.quantityDisplay}>
              <Text style={styles.quantityText}>{quantity}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.incrementButton}
              onPress={handleIncrement}
              activeOpacity={0.7}
            >
              <Text style={styles.quantityButtonText}>+</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    margin: spacing.xs,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: colors.text.tertiary,
    fontSize: fontSize.sm,
  },
  discountBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  discountText: {
    color: colors.text.inverse,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  content: {
    padding: spacing.md,
  },
  name: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing.sm,
    minHeight: 40,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  originalPrice: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    textDecorationLine: 'line-through',
  },
  price: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 40,
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.md,
    height: 36,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quantityText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
});

