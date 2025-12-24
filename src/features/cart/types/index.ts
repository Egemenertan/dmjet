/**
 * Cart and Delivery Types
 */

// Sigara kategorisi ID'si - minimum sipariş tutarına dahil edilmez
export const CIGARETTE_CATEGORY_ID = '6125aa3c-a457-4b2a-bf67-916d21c08eee';

export interface DeliverySettings {
  id: string;
  min_order_amount: number; // Minimum sipariş tutarı (örn: 200 TL)
  min_order_for_free_delivery: number; // Ücretsiz teslimat için minimum tutar (örn: 400 TL)
  delivery_fee: number; // Teslimat ücreti (örn: 100 TL)
  profit_margin: number; // Kar marjı yüzdesi (0-100)
  max_delivery_distance_km?: number;
  working_hours_start?: string; // Hizmet başlangıç saati (HH:MM:SS)
  working_hours_end?: string; // Hizmet bitiş saati (HH:MM:SS)
  is_working_hours_enabled?: boolean; // Hizmet saatleri kontrolü aktif mi?
  working_hours_message_tr?: string; // Türkçe mesaj
  working_hours_message_en?: string; // İngilizce mesaj
  working_hours_message_ru?: string; // Rusça mesaj
  created_at?: string;
  updated_at?: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  category_id?: string | null;
}

