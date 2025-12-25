-- Migration: Add Role System to Profiles
-- Description: Adds secure role-based access control with ENUM type and RLS policies
-- Created: 2025-12-20

-- ============================================================================
-- 1. ENUM TYPE: Add 'picker' role to existing user_role enum
-- ============================================================================

-- Check if picker value exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'picker' 
        AND enumtypid = 'user_role'::regtype
    ) THEN
        ALTER TYPE user_role ADD VALUE 'picker';
    END IF;
END $$;

-- ============================================================================
-- 2. ADD ROLE COLUMN: Add role column to profiles table
-- ============================================================================

-- Add role column with default value 'user'
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'user' NOT NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- ============================================================================
-- 3. MIGRATE EXISTING DATA: Update existing users based on is_admin
-- ============================================================================

-- Set role to 'admin' for users where is_admin = true
UPDATE profiles 
SET role = 'admin' 
WHERE is_admin = true AND role = 'user';

-- ============================================================================
-- 4. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view own profile, admins can view all" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile except role" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Enable RLS on profiles table (if not already enabled)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT Policy: Users can view their own profile, admins can view all
-- ============================================================================
CREATE POLICY "Users can view own profile, admins can view all"
ON profiles FOR SELECT
USING (
  -- User can see their own profile
  auth.uid() = id 
  OR 
  -- OR user is an admin (can see all profiles)
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- ============================================================================
-- UPDATE Policy: Users can update own profile, but only admins can change roles
-- ============================================================================
CREATE POLICY "Users can update own profile except role"
ON profiles FOR UPDATE
USING (
  -- User must be updating their own profile
  auth.uid() = id
)
WITH CHECK (
  auth.uid() = id 
  AND (
    -- Either role is not changing
    role = (SELECT role FROM profiles WHERE id = auth.uid())
    OR
    -- OR user is an admin (can change roles)
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  )
);

-- ============================================================================
-- INSERT Policy: Allow users to insert their own profile on signup
-- ============================================================================
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (
  auth.uid() = id
  AND role = 'user' -- New users must start as 'user' role
);

-- ============================================================================
-- 5. HELPER FUNCTIONS: Update existing functions to support role-based access
-- ============================================================================

-- Update check_admin_access function to also check for courier role
CREATE OR REPLACE FUNCTION check_admin_or_courier_access()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'courier')
  );
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION check_admin_or_courier_access() IS 
'Checks if the current user has admin or courier role for order management access';

-- ============================================================================
-- 6. SECURITY LOGGING: Log role changes for audit trail
-- ============================================================================

-- Create trigger function to log role changes
CREATE OR REPLACE FUNCTION log_role_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only log if role actually changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO security_logs (event_type, user_id, details)
    VALUES (
      'role_changed',
      NEW.id,
      jsonb_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role,
        'changed_by', auth.uid(),
        'changed_at', NOW()
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for role changes
DROP TRIGGER IF EXISTS trigger_log_role_changes ON profiles;
CREATE TRIGGER trigger_log_role_changes
  AFTER UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION log_role_changes();

-- ============================================================================
-- 7. GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permission on the new function to authenticated users
GRANT EXECUTE ON FUNCTION check_admin_or_courier_access() TO authenticated;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================
-- To rollback this migration, run:
-- 
-- DROP TRIGGER IF EXISTS trigger_log_role_changes ON profiles;
-- DROP FUNCTION IF EXISTS log_role_changes();
-- DROP FUNCTION IF EXISTS check_admin_or_courier_access();
-- DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
-- DROP POLICY IF EXISTS "Users can update own profile except role" ON profiles;
-- DROP POLICY IF EXISTS "Users can view own profile, admins can view all" ON profiles;
-- DROP INDEX IF EXISTS idx_profiles_role;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS role;
-- -- Note: Cannot remove ENUM value 'picker' once added in PostgreSQL











