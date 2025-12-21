-- Fix SELECT policy on wishlist_matches table
-- The INSERT works, but the .select() after insert fails because
-- the SELECT policy only allows authenticated users

-- Drop existing SELECT policy
DROP POLICY "Users can view own matches" ON wishlist_matches;

-- Create new policy that allows anyone to read matches
CREATE POLICY "Allow reading matches"
  ON wishlist_matches FOR SELECT
  USING (true);

-- This allows:
-- 1. Users to view their matches in the app
-- 2. The matching system to read back inserted matches
