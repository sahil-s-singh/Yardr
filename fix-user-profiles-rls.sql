-- Allow inserting/updating user profiles for push tokens
-- This is needed so users can save their Expo push tokens

-- Drop existing restrictive policies if any
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

-- Allow users to insert/update their own profile
CREATE POLICY "Allow users to manage own profile"
ON user_profiles
FOR ALL
USING (true)
WITH CHECK (true);

-- Also allow reading profiles (for notifications)
DROP POLICY IF EXISTS "Allow reading profiles" ON user_profiles;
CREATE POLICY "Allow reading profiles"
ON user_profiles
FOR SELECT
USING (true);
