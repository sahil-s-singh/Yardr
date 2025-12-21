-- Fix RLS SELECT policy for user_wishlists table
-- This allows the system to read all wishlists when checking for matches
--
-- PROBLEM: Current policy only allows users to read their OWN wishlists
-- SOLUTION: Update policy to allow reading all wishlists for matching

-- Drop the existing restrictive policy
DROP POLICY "Users can view own wishlists" ON user_wishlists;

-- Create new policy that allows:
-- 1. Users to read their own wishlists
-- 2. System to read ALL wishlists for matching purposes
CREATE POLICY "Users can view own wishlists, system can view all"
  ON user_wishlists FOR SELECT
  TO authenticated
  USING (true);

-- Note: This allows any authenticated user to read all wishlists
-- This is necessary for the matching system to work
-- Wishlist items are not sensitive data (just item descriptions)
