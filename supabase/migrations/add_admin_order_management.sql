-- Admin Order Management Migration
-- Adds RPC functions and RLS policies for admin order management

-- ============================================================================
-- 1. RPC Function: Get Pending Orders (Admin Only)
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
-- 2. RPC Function: Update Order Status (Admin Only)
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
  
  -- Validate status
  IF p_new_status NOT IN ('pending', 'processing', 'shipping', 'delivered', 'cancelled') THEN
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
-- 3. RPC Function: Cancel Order (Admin Only)
-- ============================================================================
CREATE OR REPLACE FUNCTION cancel_order_admin(
  p_order_id uuid,
  p_cancel_reason text
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
  
  -- Validate cancel reason
  IF p_cancel_reason IS NULL OR LENGTH(TRIM(p_cancel_reason)) = 0 THEN
    RAISE EXCEPTION 'Cancel reason is required';
  END IF;
  
  -- Get old status
  SELECT status INTO v_old_status FROM orders WHERE id = p_order_id;
  
  IF v_old_status IS NULL THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;
  
  -- Check if order can be cancelled
  IF v_old_status IN ('delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot cancel order with status: %', v_old_status;
  END IF;
  
  -- Update order status to cancelled
  UPDATE orders
  SET 
    status = 'cancelled',
    updated_at = NOW()
  WHERE id = p_order_id;
  
  -- Update order statistics with cancellation reason
  UPDATE order_statistics
  SET 
    cancellation_reason = p_cancel_reason,
    updated_at = NOW()
  WHERE order_id = p_order_id;
  
  -- Log the action in security_logs
  INSERT INTO security_logs (event_type, user_id, details)
  VALUES (
    'admin_order_cancelled',
    v_admin_id,
    jsonb_build_object(
      'order_id', p_order_id,
      'old_status', v_old_status,
      'cancel_reason', p_cancel_reason,
      'timestamp', NOW()
    )
  );
  
  -- Return success response
  v_result := jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'old_status', v_old_status,
    'new_status', 'cancelled',
    'cancel_reason', p_cancel_reason,
    'updated_at', NOW()
  );
  
  RETURN v_result;
END;
$$;

-- ============================================================================
-- 4. RPC Function: Get Order Details (Admin Only)
-- ============================================================================
CREATE OR REPLACE FUNCTION get_order_details_admin(p_order_id uuid)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_result jsonb;
BEGIN
  -- Check if the calling user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  -- Get order details with customer information
  SELECT jsonb_build_object(
    'order', row_to_json(o.*),
    'customer', jsonb_build_object(
      'id', p.id,
      'full_name', p.full_name,
      'email', p.email,
      'phone', p.phone,
      'country_code', p.country_code,
      'address', p.address,
      'address_details', p.address_details
    ),
    'statistics', row_to_json(os.*)
  )
  INTO v_result
  FROM orders o
  LEFT JOIN profiles p ON o.user_id = p.id
  LEFT JOIN order_statistics os ON o.id = os.order_id
  WHERE o.id = p_order_id;
  
  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;
  
  RETURN v_result;
END;
$$;

-- ============================================================================
-- 5. RLS Policy: Admin can view all orders
-- ============================================================================
-- Drop existing policy if exists
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;

-- Create new policy for admin access
CREATE POLICY "Admins can view all orders"
ON orders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
  OR user_id = auth.uid()
);

-- ============================================================================
-- 6. RLS Policy: Admin can update order status
-- ============================================================================
-- Drop existing policy if exists
DROP POLICY IF EXISTS "Admins can update orders" ON orders;

-- Create new policy for admin updates
CREATE POLICY "Admins can update orders"
ON orders
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- ============================================================================
-- 7. Grant execute permissions on RPC functions
-- ============================================================================
GRANT EXECUTE ON FUNCTION get_pending_orders_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION update_order_status_admin(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_order_admin(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_order_details_admin(uuid) TO authenticated;

-- ============================================================================
-- 8. Create index for better performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_orders_status_created 
ON orders(status, created_at DESC) 
WHERE status != 'delivered';

CREATE INDEX IF NOT EXISTS idx_profiles_is_admin 
ON profiles(is_admin) 
WHERE is_admin = true;

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON FUNCTION get_pending_orders_admin() IS 
'Returns all orders except delivered ones with customer information. Admin only.';

COMMENT ON FUNCTION update_order_status_admin(uuid, text, text) IS 
'Updates order status and logs the action. Admin only.';

COMMENT ON FUNCTION cancel_order_admin(uuid, text) IS 
'Cancels an order with a reason and logs the action. Admin only.';

COMMENT ON FUNCTION get_order_details_admin(uuid) IS 
'Returns detailed order information including customer and statistics. Admin only.';

