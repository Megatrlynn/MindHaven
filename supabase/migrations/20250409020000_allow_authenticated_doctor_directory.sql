/*
  # Allow authenticated users to view the doctors directory

  Patients need read access to the doctors table so they can browse and connect
  with therapists from the chat page.
*/

DROP POLICY IF EXISTS "Authenticated users can view doctors directory" ON public.doctors;

CREATE POLICY "Authenticated users can view doctors directory"
  ON public.doctors
  FOR SELECT
  TO authenticated
  USING (true);