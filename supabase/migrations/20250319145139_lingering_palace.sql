/*
  # Add relationship between doctor_patient_chats and doctors

  1. Changes
    - Add a foreign key constraint to link doctor_patient_chats with doctors through sender_id
    - Add a function to get doctor's name for chat messages
    - Update RLS policies to allow proper access

  2. Security
    - Maintain existing RLS policies
    - Ensure data access is properly restricted
*/

-- Create function to get doctor's user_id from doctor_id
CREATE OR REPLACE FUNCTION get_doctor_user_id(doctor_id uuid)
RETURNS uuid AS $$
BEGIN
  RETURN (
    SELECT user_id
    FROM doctors
    WHERE id = doctor_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add foreign key relationship between doctor_patient_chats and doctors
ALTER TABLE doctor_patient_chats
ADD CONSTRAINT doctor_patient_chats_doctor_sender_fkey
FOREIGN KEY (sender_id) 
REFERENCES doctors(user_id)
ON DELETE CASCADE;

-- Update the existing policy to handle the new relationship
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