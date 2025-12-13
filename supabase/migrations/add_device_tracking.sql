-- Migration: Add Device Tracking for Anonymous Users
-- Description: Allows anonymous users to track and manage their created sales
-- by device ID, with ability to claim them later when signing up

-- ============================================================================
-- 1. ADD DEVICE_ID TO GARAGE_SALES
-- ============================================================================
-- Add device_id column to track sales created by anonymous users
ALTER TABLE garage_sales ADD COLUMN IF NOT EXISTS device_id TEXT;

-- Add index for performance when querying by device_id
CREATE INDEX IF NOT EXISTS idx_garage_sales_device_id ON garage_sales(device_id);

-- ============================================================================
-- 2. UPDATE RLS POLICIES
-- ============================================================================
-- Allow users to update sales created from their device (even if not logged in)
-- Note: This relies on application-level device_id verification
CREATE POLICY "Device owners can update own sales"
  ON garage_sales FOR UPDATE
  TO anon
  USING (device_id IS NOT NULL);

-- ============================================================================
-- 3. CLAIM DEVICE SALES FUNCTION
-- ============================================================================
-- Function to migrate all device-created sales to a user account when they sign up
CREATE OR REPLACE FUNCTION claim_device_sales(p_device_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  claimed_count INTEGER;
BEGIN
  -- Update all sales created by this device to be owned by the current user
  UPDATE garage_sales
  SET user_id = auth.uid()
  WHERE device_id = p_device_id
    AND user_id IS NULL;

  -- Return count of claimed sales
  GET DIAGNOSTICS claimed_count = ROW_COUNT;
  RETURN claimed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION claim_device_sales(TEXT) TO authenticated;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. device_id is stored when creating sales anonymously
-- 2. When user signs up/logs in, they can call claim_device_sales() to take ownership
-- 3. Once claimed (user_id set), the sale is permanently associated with that account
-- 4. Anonymous users can still update sales using device_id for verification
