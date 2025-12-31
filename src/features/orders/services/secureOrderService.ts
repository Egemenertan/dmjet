/**
 * Secure Order Service
 * 
 * Bu servis güvenli sipariş oluşturma işlemlerini yönetir.
 * Tüm fiyat hesaplamaları backend'de yapılır.
 * Frontend sadece product_id + quantity gönderir.
 */

import {supabase} from '@core/services/supabase';

// ============================================================================
// Types
// ============================================================================

export interface SecureOrderItem {
  product_id: string;
  quantity: number;
}

export interface ShippingAddress {
  address?: string;
  addressDetails?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  countryCode?: string;
  full_name?: string;
}

export interface CreateOrderParams {
  items: SecureOrderItem[];
  payment_method: 'cash' | 'card';
  shipping_address: ShippingAddress;
  delivery_note?: string;
  coupon_code?: string;
}

export interface OrderPreviewItem {
  product_id: number;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  in_stock: boolean;
  available_stock: number;
}

export interface OrderPreview {
  subtotal: number;
  delivery_fee: number;
  coupon_discount: number;
  total_amount: number;
  items: OrderPreviewItem[];
  minimum_order_check: {
    meets_minimum: boolean;
    current_amount: number;
    minimum_required: number;
    remaining: number;
  };
  profit_margin: number;
}

export interface CreateOrderResult {
  success: boolean;
  order_id?: string;
  total_amount?: number;
  subtotal?: number;
  delivery_fee?: number;
  coupon_discount?: number;
  items_count?: number;
  message?: string;
  error?: string;
  details?: any;
}

// ============================================================================
// Service Class
// ============================================================================

class SecureOrderService {
  /**
   * Sipariş önizlemesi al (Fiyat hesaplama - sipariş vermeden)
   * Frontend sepet toplamını göstermek için kullanılır
   */
  async previewOrderPricing(
    items: SecureOrderItem[],
    userLocation?: ShippingAddress,
    couponCode?: string
  ): Promise<OrderPreview> {
    try {
      const {data, error} = await supabase.rpc('preview_order_pricing', {
        p_items: items,
        p_user_location: userLocation || null,
        p_coupon_code: couponCode || null,
      });

      if (error) {
        console.error('Preview order pricing error:', error);
        throw error;
      }

      return data as OrderPreview;
    } catch (error) {
      console.error('Failed to preview order pricing:', error);
      throw error;
    }
  }

  /**
   * Güvenli sipariş oluştur
   * Tüm fiyat hesaplamaları backend'de yapılır
   */
  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    try {
      const {data, error} = await supabase.rpc('create_order_secure', {
        p_items: params.items,
        p_payment_method: params.payment_method,
        p_shipping_address: params.shipping_address,
        p_delivery_note: params.delivery_note || null,
        p_coupon_code: params.coupon_code || null,
      });

      if (error) {
        console.error('Create order error:', error);
        throw error;
      }

      return data as CreateOrderResult;
    } catch (error) {
      console.error('Failed to create order:', error);
      throw error;
    }
  }

  /**
   * Minimum sipariş kontrolü
   */
  async checkMinimumOrder(items: SecureOrderItem[]): Promise<{
    meets_minimum: boolean;
    current_amount: number;
    minimum_required: number;
    remaining: number;
  }> {
    try {
      const {data, error} = await supabase.rpc('check_minimum_order_backend', {
        p_items: items,
      });

      if (error) {
        console.error('Check minimum order error:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to check minimum order:', error);
      throw error;
    }
  }

  /**
   * Teslimat ücreti hesapla
   */
  async calculateDeliveryFee(
    items: SecureOrderItem[],
    userLocation: ShippingAddress
  ): Promise<number> {
    try {
      const {data, error} = await supabase.rpc('calculate_delivery_fee_backend', {
        p_items: items,
        p_user_location: userLocation,
      });

      if (error) {
        console.error('Calculate delivery fee error:', error);
        throw error;
      }

      return data as number;
    } catch (error) {
      console.error('Failed to calculate delivery fee:', error);
      throw error;
    }
  }

  /**
   * İlk sipariş limit kontrolü (5000 TL)
   */
  async checkFirstOrderLimit(totalAmount: number): Promise<{
    is_first_order: boolean;
    limit_exceeded: boolean;
    max_amount: number;
    current_amount: number;
    exceeded_by?: number;
    remaining?: number;
  }> {
    try {
      const {data: {user}} = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const {data, error} = await supabase.rpc('check_first_order_limit', {
        p_user_id: user.id,
        p_total_amount: totalAmount,
      });

      if (error) {
        console.error('Check first order limit error:', error);
        throw error;
      }

      return data as any;
    } catch (error) {
      console.error('Failed to check first order limit:', error);
      throw error;
    }
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const secureOrderService = new SecureOrderService();

