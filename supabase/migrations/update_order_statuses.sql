-- Update Order Statuses Migration
-- Removes 'pending' status and adds 'preparing' and 'prepared' statuses

-- ============================================================================
-- 1. Update existing 'pending' orders to 'preparing'
-- ============================================================================
UPDATE orders
SET status = 'preparing'
WHERE status = 'pending';

-- ============================================================================
-- 2. Update RPC function: get_pending_orders_admin
-- Now returns orders that are not 'delivered' (includes preparing, prepared, shipping)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_pending_orders_admin()
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  user_id uuid,
  user_email text,
  total_amount numeric,
  original_amount numeric,
  status text,
  payment_method text,
  items jsonb,
  shipping_address jsonb,
  delivery_note text,
  coupon_code text,
  coupon_discount numeric,
  delivery_fee_free boolean,
  expense_amount numeric,
  -- User profile information
  customer_name text,
  customer_phone text,
  customer_country_code text
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the calling user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  -- Return all orders except delivered ones with customer information
  RETURN QUERY
  SELECT 
    o.id,
    o.created_at,
    o.updated_at,
    o.user_id,
    o.user_email,
    o.total_amount,
    o.original_amount,
    o.status,
    o.payment_method,
    o.items,
    o.shipping_address,
    o.delivery_note,
    o.coupon_code,
    o.coupon_discount,
    o.delivery_fee_free,
    o.expense_amount,
    p.full_name as customer_name,
    p.phone as customer_phone,
    p.country_code as customer_country_code
  FROM orders o
  LEFT JOIN profiles p ON o.user_id = p.id
  WHERE o.status != 'delivered'
  ORDER BY o.created_at DESC;
END;
$$;

-- ============================================================================
-- 3. Update RPC function: update_order_status_admin
-- Add new statuses to validation
-- ============================================================================
CREATE OR REPLACE FUNCTION update_order_status_admin(
  p_order_id uuid,
  p_new_status text,
  p_admin_notes text DEFAULT NULL
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_admin_id uuid;
  v_old_status text;
  v_result jsonb;
BEGIN
  -- Get admin user ID
  v_admin_id := auth.uid();
  
  -- Check if the calling user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = v_admin_id AND profiles.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  -- Validate status - Updated to include new statuses
  IF p_new_status NOT IN ('preparing', 'prepared', 'shipping', 'delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid status: %', p_new_status;
  END IF;
  
  -- Get old status
  SELECT status INTO v_old_status FROM orders WHERE id = p_order_id;
  
  IF v_old_status IS NULL THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;
  
  -- Update order status
  UPDATE orders
  SET 
    status = p_new_status,
    updated_at = NOW()
  WHERE id = p_order_id;
  
  -- Log the action in security_logs
  INSERT INTO security_logs (event_type, user_id, details)
  VALUES (
    'admin_order_status_update',
    v_admin_id,
    jsonb_build_object(
      'order_id', p_order_id,
      'old_status', v_old_status,
      'new_status', p_new_status,
      'admin_notes', p_admin_notes,
      'timestamp', NOW()
    )
  );
  
  -- Return success response
  v_result := jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'old_status', v_old_status,
    'new_status', p_new_status,
    'updated_at', NOW()
  );
  
  RETURN v_result;
END;
$$;

-- ============================================================================
-- 4. Add comment to explain new status flow
-- ============================================================================
COMMENT ON COLUMN orders.status IS 'Order status: preparing (hazırlanıyor) -> prepared (hazırlandı) -> shipping (yolda) -> delivered (teslim edildi) or cancelled (iptal)';







