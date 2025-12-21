-- Fix INSERT policy on wishlist_matches table
-- The current policy blocks inserts from anon key

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "System can insert matches" ON wishlist_matches;

-- Create new policy that allows anon role to insert matches
CREATE POLICY "Allow inserting matches for matching system"
  ON wishlist_matches FOR INSERT
  WITH CHECK (true);

-- This allows the matching system (using anon key) to create match records
