/**
 * Cart and Delivery Types
 */

export interface DeliverySettings {
  id: string;
  min_order_amount: number; // Minimum sipariş tutarı (örn: 200 TL)
  min_order_for_free_delivery: number; // Ücretsiz teslimat için minimum tutar (örn: 400 TL)
  delivery_fee: number; // Teslimat ücreti (örn: 100 TL)
  max_delivery_distance_km?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

