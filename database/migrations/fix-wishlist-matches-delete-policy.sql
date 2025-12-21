-- Add DELETE policy on wishlist_matches table
-- This allows the system to delete old matches when a sale is updated

-- Drop existing DELETE policy
DROP POLICY IF EXISTS "Users can delete own matches" ON wishlist_matches;

-- Create new policy that allows anyone to delete matches
CREATE POLICY "Allow deleting matches for update operations"
  ON wishlist_matches FOR DELETE
  USING (true);

-- This allows:
-- 1. Users to delete their own matches
-- 2. The matching system to delete old matches when a sale is updated
