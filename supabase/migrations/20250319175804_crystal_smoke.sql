/*
  # Fix user profiles table and trigger

  1. Changes
    - Add email column to user_profiles table
    - Update create_initial_profile trigger function
*/

-- Add email column to user_profiles if it doesn't exist
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS email text;

-- Update the trigger function to handle the email field correctly
CREATE OR REPLACE FUNCTION create_initial_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (
    user_id,
    username,
    email
  )
  VALUES (
    NEW.id,
    split_part(NEW.email, '@', 1),
    NEW.email
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    username = EXCLUDED.username,
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;