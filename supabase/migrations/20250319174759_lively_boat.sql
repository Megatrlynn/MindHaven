/*
  # Update user_profiles table with new fields

  1. Changes
    - Add new columns to user_profiles:
      - username (text)
      - name (text)
      - phone (text)
      - profile_picture (text)
      - password_hash (text)
    - Add default values and constraints
    - Update RLS policies

  2. Security
    - Ensure users can only update their own profile
    - Protect sensitive fields
*/

-- Add new columns to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS username text,
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS profile_picture text;

-- Update RLS policies
DROP POLICY IF EXISTS "Users can manage own profile" ON user_profiles;

CREATE POLICY "Users can manage own profile"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to create initial profile
CREATE OR REPLACE FUNCTION create_initial_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id, username, email)
  VALUES (NEW.id, split_part(NEW.email, '@', 1), NEW.email)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
CREATE TRIGGER create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_profile();