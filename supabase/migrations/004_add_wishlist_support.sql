-- Migration: Add Wishlist Support
-- Description: Adds wishlist items and automatic matching with notifications
-- Dependencies: Requires add_user_features.sql (auth, user profiles)

-- ============================================================================
-- 1. USER WISHLISTS TABLE
-- ============================================================================
CREATE TABLE user_wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Full-text search support
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(item_name, '') || ' ' || coalesce(description, ''))
  ) STORED
);

-- Indexes for performance
CREATE INDEX idx_user_wishlists_user_id ON user_wishlists(user_id);
CREATE INDEX idx_user_wishlists_active ON user_wishlists(is_active) WHERE is_active = true;
CREATE INDEX idx_user_wishlists_search ON user_wishlists USING GIN(search_vector);
CREATE INDEX idx_user_wishlists_category ON user_wishlists(category) WHERE category IS NOT NULL;

-- Auto-update timestamp trigger
CREATE TRIGGER user_wishlists_updated_at
  BEFORE UPDATE ON user_wishlists
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profile_updated_at();

-- RLS Policies
ALTER TABLE user_wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wishlists"
  ON user_wishlists FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wishlists"
  ON user_wishlists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wishlists"
  ON user_wishlists FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wishlists"
  ON user_wishlists FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================================
-- 2. WISHLIST MATCHES TABLE
-- ============================================================================
CREATE TABLE wishlist_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wishlist_item_id UUID NOT NULL REFERENCES user_wishlists(id) ON DELETE CASCADE,
  garage_sale_id UUID NOT NULL REFERENCES garage_sales(id) ON DELETE CASCADE,
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  notification_sent BOOLEAN DEFAULT FALSE,
  notification_sent_at TIMESTAMPTZ,
  match_confidence TEXT CHECK (match_confidence IN ('high', 'medium', 'verified')),
  match_reason TEXT,

  -- Prevent duplicate matches
  UNIQUE(wishlist_item_id, garage_sale_id)
);

-- Indexes for performance
CREATE INDEX idx_wishlist_matches_user_id ON wishlist_matches(user_id);
CREATE INDEX idx_wishlist_matches_wishlist_item ON wishlist_matches(wishlist_item_id);
CREATE INDEX idx_wishlist_matches_garage_sale ON wishlist_matches(garage_sale_id);
CREATE INDEX idx_wishlist_matches_notification ON wishlist_matches(notification_sent) WHERE notification_sent = false;
CREATE INDEX idx_wishlist_matches_matched_at ON wishlist_matches(matched_at DESC);

-- RLS Policies
ALTER TABLE wishlist_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own matches"
  ON wishlist_matches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own matches"
  ON wishlist_matches FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert matches"
  ON wishlist_matches FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. Wishlist items use full-text search for efficient keyword matching
-- 2. Matches table tracks confidence level and reasoning
-- 3. Automatic cleanup when users, wishlists, or sales are deleted (CASCADE)
-- 4. RLS policies ensure users can only access their own data
-- 5. Unique constraint prevents duplicate matches
-- 6. Notification tracking prevents duplicate notifications
