-- Check what RLS policies exist on user_wishlists table
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_wishlists';
