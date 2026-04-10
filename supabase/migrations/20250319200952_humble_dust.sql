/*
  # Add foreign key between reviews and user_profiles

  1. Changes
    - Add foreign key constraint between reviews and user_profiles tables
*/

-- Add foreign key constraint
ALTER TABLE reviews
ADD CONSTRAINT reviews_user_profile_fkey
FOREIGN KEY (user_id) REFERENCES user_profiles(user_id);