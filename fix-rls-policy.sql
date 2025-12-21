-- Fix missing INSERT policy for wishlist_matches table
-- This allows the system to create match records when wishlists match sales

CREATE POLICY "System can insert matches"
  ON wishlist_matches FOR INSERT
  TO authenticated
  WITH CHECK (true);
