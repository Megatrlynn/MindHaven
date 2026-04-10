/*
  # Add relationship between questions and user_profiles

  1. Changes
    - Add foreign key constraint between questions and user_profiles tables
    - Add policy for admins to read all questions
*/

-- Add foreign key constraint
ALTER TABLE questions
ADD CONSTRAINT questions_user_profile_fkey
FOREIGN KEY (user_id) REFERENCES user_profiles(user_id);

-- Add policy for admins to read all questions
CREATE POLICY "Admins can read all questions"
  ON questions FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid()
  ));