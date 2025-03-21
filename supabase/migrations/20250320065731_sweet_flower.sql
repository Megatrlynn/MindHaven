/*
  # Add relationship between questions and user_profiles

  1. Changes
    - Add foreign key constraint between questions and user_profiles tables (if not exists)
    - Add policy for admins to read all questions
    - Add policy for public access to answered questions
    
  2. Notes
    - Uses DO block to check for existing constraint
    - Adds policies for proper access control
*/

-- Add foreign key constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'questions_user_profile_fkey'
    AND table_name = 'questions'
  ) THEN
    ALTER TABLE questions
    ADD CONSTRAINT questions_user_profile_fkey
    FOREIGN KEY (user_id) REFERENCES user_profiles(user_id);
  END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can read all questions" ON questions;
DROP POLICY IF EXISTS "Anyone can read answered questions" ON questions;

-- Add policy for admins to read all questions
CREATE POLICY "Admins can read all questions"
  ON questions FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid()
  ));

-- Add policy for public access to answered questions
CREATE POLICY "Anyone can read answered questions"
  ON questions FOR SELECT
  USING (status = 'answered');