/*
  # Fix chat foreign key constraints

  1. Changes
    - Drop the existing doctor sender foreign key constraint
    - Update RLS policies to maintain security

  2. Security
    - Maintain existing RLS policies
    - Ensure data access is properly restricted
*/

-- Drop the existing doctor-specific constraint
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'doctor_patient_chats_doctor_sender_fkey'
    AND table_name = 'doctor_patient_chats'
  ) THEN
    ALTER TABLE doctor_patient_chats
    DROP CONSTRAINT doctor_patient_chats_doctor_sender_fkey;
  END IF;
END $$;

-- Update the policy to ensure proper access control
DROP POLICY IF EXISTS "Connection participants can manage chats" ON doctor_patient_chats;

CREATE POLICY "Connection participants can manage chats"
  ON doctor_patient_chats
  TO authenticated
  USING (
    connection_id IN (
      SELECT id FROM doctor_patient_connections
      WHERE patient_id = auth.uid()
      OR doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    )
  )
  WITH CHECK (
    connection_id IN (
      SELECT id FROM doctor_patient_connections
      WHERE patient_id = auth.uid()
      OR doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid())
    )
  );