/**
 * Delivery Service
 * Handles delivery settings and fee calculations
 */

import {supabase} from '@core/services/supabase';
import {DeliverySettings, CIGARETTE_CATEGORY_ID} from '../types';
import {CartItem} from '@store/slices/cartStore';

/**
 * Fetch delivery settings from Supabase
 * Returns the first active delivery setting (distance is ignored)
 */
export const getDeliverySettings = async (): Promise<DeliverySettings | null> => {
  try {
    const {data, error} = await supabase
      .from('delivery_settings')
      .select('*')
      .eq('is_active', true)
      .order('distance_from_km', {ascending: true})
      .limit(1);

    if (error) {
      console.error('Delivery settings fetch error:', error);
      return null;
    }

    // Return first item or null if array is empty
    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Delivery settings error:', error);
    return null;
  }
};

/**
 * Calculate delivery fee based on order amount
 * @param orderAmount - Total order amount
 * @param settings - Delivery settings
 * @returns Delivery fee amount
 */
export const calculateDeliveryFee = (
  orderAmount: number,
  settings: DeliverySettings | null
): number => {
  if (!settings) {
    return 0; // No settings, no fee
  }

  // If order amount is greater than or equal to minimum for free delivery
  if (orderAmount >= settings.min_order_for_free_delivery) {
    return 0; // Free delivery
  }

  // Otherwise, charge delivery fee
  return settings.delivery_fee;
};

/**
 * Calculate delivery fee based on order amount (excluding cigarettes)
 * Sigara kategorisindeki ürünler ücretsiz teslimat tutarına dahil edilmez
 * @param items - Cart items
 * @param settings - Delivery settings
 * @returns Delivery fee amount
 */
export const calculateDeliveryFeeExcludingCigarettes = (
  items: CartItem[],
  settings: DeliverySettings | null
): number => {
  if (!settings) {
    return 0; // No settings, no fee
  }

  const amountExcludingCigarettes = calculateAmountExcludingCigarettes(items);

  // If order amount (excluding cigarettes) is greater than or equal to minimum for free delivery
  if (amountExcludingCigarettes >= settings.min_order_for_free_delivery) {
    return 0; // Free delivery
  }

  // Otherwise, charge delivery fee
  return settings.delivery_fee;
};

/**
 * Check if order meets minimum requirement
 * @param orderAmount - Total order amount
 * @param settings - Delivery settings
 * @returns true if order meets minimum, false otherwise
 */
export const meetsMinimumOrder = (
  orderAmount: number,
  settings: DeliverySettings | null
): boolean => {
  if (!settings) {
    return true; // No settings, no restriction
  }

  // Sipariş tutarı minimum tutardan büyük veya eşit olmalı
  return orderAmount >= settings.min_order_amount;
};

/**
 * Calculate order amount excluding cigarettes for minimum order check
 * Sigara kategorisindeki ürünler minimum sipariş tutarına dahil edilmez
 * @param items - Cart items
 * @returns Order amount excluding cigarettes
 */
export const calculateAmountExcludingCigarettes = (items: CartItem[]): number => {
  return items.reduce((sum, item) => {
    // Sigara kategorisindeki ürünleri hariç tut
    if (item.category_id === CIGARETTE_CATEGORY_ID) {
      return sum;
    }
    
    const itemPrice = item.discount
      ? item.price * (1 - item.discount / 100)
      : item.price;
    
    return sum + itemPrice * item.quantity;
  }, 0);
};

/**
 * Check if order meets minimum requirement (excluding cigarettes)
 * Sigara kategorisindeki ürünler minimum sipariş tutarına dahil edilmez
 * @param items - Cart items
 * @param settings - Delivery settings
 * @returns true if order meets minimum (excluding cigarettes), false otherwise
 */
export const meetsMinimumOrderExcludingCigarettes = (
  items: CartItem[],
  settings: DeliverySettings | null
): boolean => {
  if (!settings) {
    return true; // No settings, no restriction
  }

  const amountExcludingCigarettes = calculateAmountExcludingCigarettes(items);
  return amountExcludingCigarettes >= settings.min_order_amount;
};

