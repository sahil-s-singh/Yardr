-- Migration: Add User Features (Authentication, Favorites, Reminders, History)
-- Description: Adds user profiles, favorites, reminders, and view history tracking
-- while maintaining anonymous posting capability

-- ============================================================================
-- 1. USER PROFILES TABLE
-- ============================================================================
CREATE TABLE user_profiles (
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

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profile_updated_at();

-- RLS Policies for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- 2. USER FAVORITES TABLE
-- ============================================================================
CREATE TABLE user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  garage_sale_id UUID NOT NULL REFERENCES garage_sales(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, garage_sale_id)
);

-- Indexes for performance
CREATE INDEX idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX idx_user_favorites_garage_sale_id ON user_favorites(garage_sale_id);

-- RLS Policies for user_favorites
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON user_favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON user_favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON user_favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 3. USER REMINDERS TABLE
-- ============================================================================
CREATE TABLE user_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  garage_sale_id UUID NOT NULL REFERENCES garage_sales(id) ON DELETE CASCADE,
  reminder_time TIMESTAMPTZ NOT NULL,
  notification_sent BOOLEAN DEFAULT FALSE,
  expo_push_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, garage_sale_id)
);

-- Indexes for performance
CREATE INDEX idx_user_reminders_user_id ON user_reminders(user_id);
CREATE INDEX idx_user_reminders_garage_sale_id ON user_reminders(garage_sale_id);
CREATE INDEX idx_user_reminders_time ON user_reminders(reminder_time);

-- RLS Policies for user_reminders
ALTER TABLE user_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reminders"
  ON user_reminders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders"
  ON user_reminders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
  ON user_reminders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders"
  ON user_reminders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. USER SALE VIEWS TABLE (History Tracking)
-- ============================================================================
CREATE TABLE user_sale_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  garage_sale_id UUID NOT NULL REFERENCES garage_sales(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, garage_sale_id)
);

-- Indexes for performance
CREATE INDEX idx_user_sale_views_user_id ON user_sale_views(user_id);
CREATE INDEX idx_user_sale_views_viewed_at ON user_sale_views(viewed_at DESC);

-- RLS Policies for user_sale_views
ALTER TABLE user_sale_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own history"
  ON user_sale_views FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own views"
  ON user_sale_views FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own views"
  ON user_sale_views FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 5. UPDATE GARAGE_SALES TABLE
-- ============================================================================
-- Add user_id column to track authenticated users who created sales
-- NULL means anonymous posting (preserves existing behavior)
ALTER TABLE garage_sales ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_garage_sales_user_id ON garage_sales(user_id);

-- Update RLS policies to allow authenticated users to update their own sales
CREATE POLICY "Authenticated users can update own sales"
  ON garage_sales FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. Anonymous posting is preserved - garage_sales.user_id can be NULL
-- 2. All user-specific tables (favorites, reminders, views) require authentication
-- 3. RLS policies ensure users can only access their own data
-- 4. Existing garage_sales rows will have user_id = NULL (anonymous)
-- 5. CASCADE delete ensures cleanup when user account is deleted
