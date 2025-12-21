-- Check all policies on wishlist_matches table
SELECT
  policyname,
  cmd,
  roles,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'wishlist_matches'
ORDER BY cmd, policyname;
