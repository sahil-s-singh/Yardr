-- Fix: Allow anon role to read wishlists for matching
-- The current policy only works for authenticated users
-- But the matching system uses the anon key

-- Drop existing policy
DROP POLICY "Users can view own wishlists, system can view all" ON user_wishlists;

-- Create new policy that allows BOTH authenticated and anon to read all wishlists
CREATE POLICY "Allow reading all wishlists for matching"
  ON user_wishlists FOR SELECT
  USING (true);

-- This allows:
-- 1. Authenticated users to read all wishlists
-- 2. Anon role (matching system) to read all wishlists
-- Note: Wishlists are not sensitive - they're just item descriptions
