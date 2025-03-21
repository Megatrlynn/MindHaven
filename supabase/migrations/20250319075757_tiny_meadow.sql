/*
  # Update doctor policies to allow admin creation

  1. Changes
    - Update the "Admins can manage doctors" policy to allow INSERT
    - Add explicit policy for admins to create doctors
*/

DROP POLICY IF EXISTS "Admins can manage doctors" ON doctors;

CREATE POLICY "Admins can manage doctors"
  ON doctors
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));