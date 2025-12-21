/**
 * Admin Orders Service
 * Handles admin order management operations via Supabase RPC functions
 */

import {supabase} from '@core/services/supabase';

export interface AdminOrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
}

export interface AdminOrder {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  user_email: string;
  total_amount: number;
  original_amount: number;
  status: 'preparing' | 'prepared' | 'shipping' | 'delivered' | 'cancelled';
  payment_method: 'card' | 'cash';
  items: AdminOrderItem[];
  shipping_address: {
    address: string;
    latitude: number;
    longitude: number;
    addressDetails?: string;
  };
  delivery_note: string | null;
  coupon_code: string | null;
  coupon_discount: number | null;
  delivery_fee_free: boolean | null;
  expense_amount: number | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_country_code: string | null;
  customer_address_details: string | null;
}

export interface OrderDetails {
  order: AdminOrder;
  customer: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    country_code: string | null;
    address: string | null;
    address_details: string | null;
  };
  statistics: {
    revenue: number | null;
    expense: number | null;
    profit: number | null;
    cancellation_reason: string | null;
  } | null;
}

export interface StatusUpdateResult {
  success: boolean;
  order_id: string;
  old_status: string;
  new_status: string;
  updated_at: string;
}

export interface CancelOrderResult {
  success: boolean;
  order_id: string;
  old_status: string;
  new_status: string;
  cancel_reason: string;
  updated_at: string;
}

class AdminOrdersService {
  /**
   * Get orders with pagination (Admin only)
   * @param type - 'pending' or 'completed'
   * @param page - Page number (0-indexed)
   * @param pageSize - Number of orders per page
   */
  async getOrdersPaginated(
    type: 'pending' | 'completed',
    page: number = 0,
    pageSize: number = 20
  ): Promise<AdminOrder[]> {
    try {
      const from = page * pageSize;
      const to = from + pageSize - 1;

      // Build query based on type
      let query = supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (type === 'pending') {
        query = query.neq('status', 'delivered');
      } else {
        query = query.eq('status', 'delivered');
      }

      const { data: ordersData, error: ordersError } = await query;

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        throw ordersError;
      }

      if (!ordersData || ordersData.length === 0) {
        return [];
      }

      // Get unique user IDs
      const userIds = [...new Set(ordersData.map(order => order.user_id).filter(Boolean))];

      // Fetch profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, phone, country_code, address_details')
        .in('id', userIds);

      if (profilesError) {
        console.warn('Error fetching profiles:', profilesError);
      }

      // Create a map of profiles by user_id
      const profilesMap = new Map(
        (profilesData || []).map(profile => [profile.id, profile])
      );

      // Transform data to match AdminOrder interface
      const orders: AdminOrder[] = ordersData.map((order: any) => {
        const profile = order.user_id ? profilesMap.get(order.user_id) : null;

        return {
          id: order.id,
          created_at: order.created_at,
          updated_at: order.updated_at,
          user_id: order.user_id,
          user_email: order.user_email,
          total_amount: order.total_amount,
          original_amount: order.original_amount,
          status: order.status,
          payment_method: order.payment_method,
          items: order.items,
          shipping_address: order.shipping_address,
          delivery_note: order.delivery_note,
          coupon_code: order.coupon_code,
          coupon_discount: order.coupon_discount,
          delivery_fee_free: order.delivery_fee_free,
          expense_amount: order.expense_amount,
          customer_name: profile?.full_name || null,
          customer_phone: profile?.phone || null,
          customer_country_code: profile?.country_code || null,
          customer_address_details: profile?.address_details || null,
        };
      });

      return orders;
    } catch (error: any) {
      console.error('Error in getOrdersPaginated:', error);
      throw error;
    }
  }

  /**
   * Get all orders including delivered ones (Admin only)
   * Fetches directly from orders table, then enriches with profile data
   */
  async getAllOrders(): Promise<AdminOrder[]> {
    try {
      // Get all orders
      const {data: ordersData, error: ordersError} = await supabase
        .from('orders')
        .select('*')
        .order('created_at', {ascending: false});

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        throw ordersError;
      }

      if (!ordersData || ordersData.length === 0) {
        return [];
      }

      // Get unique user IDs
      const userIds = [...new Set(ordersData.map(order => order.user_id).filter(Boolean))];

      // Fetch profiles for these users
      const {data: profilesData, error: profilesError} = await supabase
        .from('profiles')
        .select('id, full_name, phone, country_code, address_details')
        .in('id', userIds);

      if (profilesError) {
        console.warn('Error fetching profiles:', profilesError);
      }

      // Create a map of profiles by user_id
      const profilesMap = new Map(
        (profilesData || []).map(profile => [profile.id, profile])
      );

      // Transform data to match AdminOrder interface
      const orders: AdminOrder[] = ordersData.map((order: any) => {
        const profile = order.user_id ? profilesMap.get(order.user_id) : null;
        
        return {
          id: order.id,
          created_at: order.created_at,
          updated_at: order.updated_at,
          user_id: order.user_id,
          user_email: order.user_email,
          total_amount: order.total_amount,
          original_amount: order.original_amount,
          status: order.status,
          payment_method: order.payment_method,
          items: order.items,
          shipping_address: order.shipping_address,
          delivery_note: order.delivery_note,
          coupon_code: order.coupon_code,
          coupon_discount: order.coupon_discount,
          delivery_fee_free: order.delivery_fee_free,
          expense_amount: order.expense_amount,
          customer_name: profile?.full_name || null,
          customer_phone: profile?.phone || null,
          customer_country_code: profile?.country_code || null,
          customer_address_details: profile?.address_details || null,
        };
      });

      return orders;
    } catch (error: any) {
      console.error('Error in getAllOrders:', error);
      throw error;
    }
  }

  /**
   * Get all orders except delivered ones (Admin only)
   * Fetches directly from orders table, then enriches with profile data
   */
  async getPendingOrders(): Promise<AdminOrder[]> {
    try {
      // First, get all orders except delivered
      const {data: ordersData, error: ordersError} = await supabase
        .from('orders')
        .select('*')
        .neq('status', 'delivered')
        .order('created_at', {ascending: false});

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        throw ordersError;
      }

      if (!ordersData || ordersData.length === 0) {
        return [];
      }

      // Get unique user IDs
      const userIds = [...new Set(ordersData.map(order => order.user_id).filter(Boolean))];

      // Fetch profiles for these users
      const {data: profilesData, error: profilesError} = await supabase
        .from('profiles')
        .select('id, full_name, phone, country_code, address_details')
        .in('id', userIds);

      if (profilesError) {
        console.warn('Error fetching profiles:', profilesError);
      }

      // Create a map of profiles by user_id
      const profilesMap = new Map(
        (profilesData || []).map(profile => [profile.id, profile])
      );

      // Transform data to match AdminOrder interface
      const orders: AdminOrder[] = ordersData.map((order: any) => {
        const profile = order.user_id ? profilesMap.get(order.user_id) : null;
        
        return {
          id: order.id,
          created_at: order.created_at,
          updated_at: order.updated_at,
          user_id: order.user_id,
          user_email: order.user_email,
          total_amount: order.total_amount,
          original_amount: order.original_amount,
          status: order.status,
          payment_method: order.payment_method,
          items: order.items,
          shipping_address: order.shipping_address,
          delivery_note: order.delivery_note,
          coupon_code: order.coupon_code,
          coupon_discount: order.coupon_discount,
          delivery_fee_free: order.delivery_fee_free,
          expense_amount: order.expense_amount,
          customer_name: profile?.full_name || null,
          customer_phone: profile?.phone || null,
          customer_country_code: profile?.country_code || null,
          customer_address_details: profile?.address_details || null,
        };
      });

      return orders;
    } catch (error: any) {
      console.error('Error in getPendingOrders:', error);
      throw error;
    }
  }

  /**
   * Update order status (Admin only)
   * Updates order status directly in the database
   */
  async updateOrderStatus(
    orderId: string,
    newStatus: 'preparing' | 'prepared' | 'shipping' | 'delivered' | 'cancelled',
    adminNotes?: string
  ): Promise<StatusUpdateResult> {
    try {
      // Get old status first
      const {data: oldOrder, error: fetchError} = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;

      // Update status
      const {error: updateError} = await supabase
        .from('orders')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      return {
        success: true,
        order_id: orderId,
        old_status: oldOrder.status,
        new_status: newStatus,
        updated_at: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('Error in updateOrderStatus:', error);
      throw error;
    }
  }

  /**
   * Cancel order with reason (Admin only)
   * Updates order status to cancelled and stores reason
   */
  async cancelOrder(
    orderId: string,
    cancelReason: string
  ): Promise<CancelOrderResult> {
    try {
      if (!cancelReason || cancelReason.trim().length === 0) {
        throw new Error('Cancel reason is required');
      }

      // Get old status first
      const {data: oldOrder, error: fetchError} = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single();

      if (fetchError) throw fetchError;

      // Update order status to cancelled
      const {error: updateError} = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // Update order statistics with cancellation reason
      const {error: statsError} = await supabase
        .from('order_statistics')
        .update({
          cancellation_reason: cancelReason,
          updated_at: new Date().toISOString(),
        })
        .eq('order_id', orderId);

      // Stats error is not critical, just log it
      if (statsError) {
        console.warn('Error updating order statistics:', statsError);
      }

      return {
        success: true,
        order_id: orderId,
        old_status: oldOrder.status,
        new_status: 'cancelled',
        cancel_reason: cancelReason,
        updated_at: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('Error in cancelOrder:', error);
      throw error;
    }
  }

  /**
   * Get detailed order information (Admin only)
   * Fetches order with customer and statistics information
   */
  async getOrderDetails(orderId: string): Promise<OrderDetails> {
    try {
      // Fetch order
      const {data: order, error: orderError} = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      // Fetch customer profile
      const {data: profile, error: profileError} = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, country_code, address, address_details')
        .eq('id', order.user_id)
        .single();

      if (profileError) {
        console.warn('Error fetching profile:', profileError);
      }

      // Fetch order statistics
      const {data: statistics, error: statsError} = await supabase
        .from('order_statistics')
        .select('revenue, expense, profit, cancellation_reason')
        .eq('order_id', orderId)
        .single();

      if (statsError) {
        console.warn('Error fetching statistics:', statsError);
      }

      return {
        order: {
          ...order,
          customer_name: profile?.full_name || null,
          customer_phone: profile?.phone || null,
          customer_country_code: profile?.country_code || null,
        },
        customer: {
          id: profile?.id || order.user_id,
          full_name: profile?.full_name || null,
          email: profile?.email || order.user_email,
          phone: profile?.phone || null,
          country_code: profile?.country_code || null,
          address: profile?.address || null,
          address_details: profile?.address_details || null,
        },
        statistics: statistics || null,
      } as OrderDetails;
    } catch (error: any) {
      console.error('Error in getOrderDetails:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time order updates (Admin only)
   * Returns a subscription that can be unsubscribed
   */
  subscribeToOrders(
    callback: (payload: any) => void
  ): {unsubscribe: () => void} {
    const subscription = supabase
      .channel('admin-orders-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('Order change received:', payload);
          callback(payload);
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        subscription.unsubscribe();
      },
    };
  }
}

export const adminOrdersService = new AdminOrdersService();

