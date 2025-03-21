/*
  # Add relationship between doctor_patient_connections and user_profiles

  1. Changes
    - Add foreign key constraint from doctor_patient_connections.patient_id to user_profiles.user_id
    - This creates a relationship that allows joining the tables using the patient_id

  2. Notes
    - We use the user_id column from user_profiles since that's what links to auth.users
    - The patient_id in doctor_patient_connections is already linked to auth.users
*/

-- Add foreign key constraint to link doctor_patient_connections with user_profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'doctor_patient_connections_patient_profile_fkey'
  ) THEN
    ALTER TABLE doctor_patient_connections
    ADD CONSTRAINT doctor_patient_connections_patient_profile_fkey
    FOREIGN KEY (patient_id) REFERENCES user_profiles(user_id);
  END IF;
END $$;