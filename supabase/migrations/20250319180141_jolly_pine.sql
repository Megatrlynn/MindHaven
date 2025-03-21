/*
  # Fix user profile trigger function

  1. Changes
    - Drop existing trigger and function
    - Create consolidated trigger function that handles all fields
    - Re-create trigger with proper error handling
*/

-- Drop existing trigger first
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;

-- Drop existing function
DROP FUNCTION IF EXISTS create_initial_profile();

-- Create consolidated trigger function
CREATE OR REPLACE FUNCTION create_initial_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new profile with all necessary fields
  INSERT INTO user_profiles (
    user_id,
    username,
    email,
    name,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    split_part(NEW.email, '@', 1),
    NEW.email,
    split_part(NEW.email, '@', 1),
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    email = EXCLUDED.email,
    updated_at = now()
  WHERE user_profiles.user_id = EXCLUDED.user_id;

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error (will appear in Supabase logs)
    RAISE LOG 'Error in create_initial_profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create trigger
CREATE TRIGGER create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_initial_profile();