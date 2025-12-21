/**
 * Delivery Service
 * Handles delivery settings and fee calculations
 */

import {supabase} from '@core/services/supabase';
import {DeliverySettings} from '../types';

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

