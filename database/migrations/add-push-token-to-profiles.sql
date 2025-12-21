-- Add expo_push_token to user_profiles table
-- This allows us to send push notifications for wishlist matches

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_push_token
ON user_profiles(expo_push_token)
WHERE expo_push_token IS NOT NULL;
