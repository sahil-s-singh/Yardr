-- ============================================================================
-- CONSOLIDATED MIGRATION - Run this in Supabase SQL Editor
-- This combines all necessary migrations for the Yardr app
-- ============================================================================

-- ============================================================================
-- 1. ADD MULTI-DAY SUPPORT (if not already added)
-- ============================================================================
ALTER TABLE garage_sales
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE;

-- Copy existing date to start_date for backward compatibility
UPDATE garage_sales
SET start_date = date
WHERE start_date IS NULL;

-- Set end_date same as start_date for existing single-day events
UPDATE garage_sales
SET end_date = date
WHERE end_date IS NULL;

-- Add index for date range queries
CREATE INDEX IF NOT EXISTS idx_garage_sales_date_range ON garage_sales(start_date, end_date);

-- Add check constraint to ensure end_date is not before start_date
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_date_range'
  ) THEN
    ALTER TABLE garage_sales ADD CONSTRAINT check_date_range CHECK (end_date >= start_date);
  END IF;
END $$;

-- ============================================================================
-- 2. ADD DEVICE TRACKING (if not already added)
-- ============================================================================
ALTER TABLE garage_sales
ADD COLUMN IF NOT EXISTS device_id TEXT;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_garage_sales_device_id ON garage_sales(device_id);
CREATE INDEX IF NOT EXISTS idx_garage_sales_device_created ON garage_sales(device_id, created_at);

-- ============================================================================
-- 3. ADD VIDEO SUPPORT (if not already added)
-- ============================================================================
ALTER TABLE garage_sales
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- ============================================================================
-- 4. ADD USER FEATURES
-- ============================================================================

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_user_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_profiles_updated_at ON user_profiles;
CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profile_updated_at();

-- RLS Policies for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
CREATE POLICY "Users can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- User Favorites Table
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  garage_sale_id UUID NOT NULL REFERENCES garage_sales(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, garage_sale_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_garage_sale_id ON user_favorites(garage_sale_id);

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own favorites" ON user_favorites;
CREATE POLICY "Users can view own favorites"
  ON user_favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own favorites" ON user_favorites;
CREATE POLICY "Users can insert own favorites"
  ON user_favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own favorites" ON user_favorites;
CREATE POLICY "Users can delete own favorites"
  ON user_favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- User Reminders Table
CREATE TABLE IF NOT EXISTS user_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  garage_sale_id UUID NOT NULL REFERENCES garage_sales(id) ON DELETE CASCADE,
  reminder_time TIMESTAMPTZ NOT NULL,
  notification_sent BOOLEAN DEFAULT FALSE,
  expo_push_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, garage_sale_id)
);

CREATE INDEX IF NOT EXISTS idx_user_reminders_user_id ON user_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reminders_garage_sale_id ON user_reminders(garage_sale_id);
CREATE INDEX IF NOT EXISTS idx_user_reminders_time ON user_reminders(reminder_time);

ALTER TABLE user_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reminders" ON user_reminders;
CREATE POLICY "Users can view own reminders"
  ON user_reminders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own reminders" ON user_reminders;
CREATE POLICY "Users can insert own reminders"
  ON user_reminders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reminders" ON user_reminders;
CREATE POLICY "Users can update own reminders"
  ON user_reminders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reminders" ON user_reminders;
CREATE POLICY "Users can delete own reminders"
  ON user_reminders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- User Sale Views Table (History)
CREATE TABLE IF NOT EXISTS user_sale_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  garage_sale_id UUID NOT NULL REFERENCES garage_sales(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, garage_sale_id)
);

CREATE INDEX IF NOT EXISTS idx_user_sale_views_user_id ON user_sale_views(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sale_views_viewed_at ON user_sale_views(viewed_at DESC);

ALTER TABLE user_sale_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own history" ON user_sale_views;
CREATE POLICY "Users can view own history"
  ON user_sale_views FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own views" ON user_sale_views;
CREATE POLICY "Users can insert own views"
  ON user_sale_views FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own views" ON user_sale_views;
CREATE POLICY "Users can delete own views"
  ON user_sale_views FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add user_id to garage_sales
ALTER TABLE garage_sales ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_garage_sales_user_id ON garage_sales(user_id);

-- Update RLS policy for authenticated users
DROP POLICY IF EXISTS "Authenticated users can update own sales" ON garage_sales;
CREATE POLICY "Authenticated users can update own sales"
  ON garage_sales FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow anyone to update garage sales (they can only update ones they have access to via app logic)
-- This is needed for anonymous users to update their device-created sales
DROP POLICY IF EXISTS "Anyone can update garage sales" ON garage_sales;
CREATE POLICY "Anyone can update garage sales"
  ON garage_sales FOR UPDATE
  TO anon, public
  USING (true);

-- ============================================================================
-- 5. CLAIM DEVICE SALES FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION claim_device_sales(p_device_id TEXT)
RETURNS INTEGER AS $$
DECLARE
  claimed_count INTEGER;
BEGIN
  UPDATE garage_sales
  SET user_id = auth.uid()
  WHERE device_id = p_device_id
    AND user_id IS NULL;

  GET DIAGNOSTICS claimed_count = ROW_COUNT;
  RETURN claimed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION claim_device_sales(TEXT) TO authenticated;

-- ============================================================================
-- DONE! All migrations applied
-- ============================================================================
