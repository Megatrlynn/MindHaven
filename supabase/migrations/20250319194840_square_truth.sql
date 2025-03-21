/*
  # Update age field to date of birth
  
  1. Changes
    - Add date_of_birth column to user_profiles
    - Copy existing age data to date_of_birth (approximate)
    - Drop age column
    
  2. Security
    - Maintain existing RLS policies
*/

-- First add the new column
ALTER TABLE user_profiles
ADD COLUMN date_of_birth DATE;

-- Create a function to convert age to approximate date of birth
CREATE OR REPLACE FUNCTION approximate_dob(age_in_years INTEGER)
RETURNS DATE AS $$
BEGIN
  -- If age is null, return null
  IF age_in_years IS NULL THEN
    RETURN NULL;
  END IF;
  -- Calculate approximate date of birth (January 1st of the year)
  RETURN (date_trunc('year', CURRENT_DATE) - (age_in_years || ' years')::INTERVAL)::DATE;
END;
$$ LANGUAGE plpgsql;

-- Update existing records
UPDATE user_profiles
SET date_of_birth = approximate_dob(age)
WHERE age IS NOT NULL;

-- Drop the temporary function
DROP FUNCTION approximate_dob(INTEGER);

-- Drop the old column
ALTER TABLE user_profiles
DROP COLUMN age;