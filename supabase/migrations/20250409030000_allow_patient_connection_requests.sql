/*
  # Allow patients to request therapist connections

  Patients need insert access to doctor_patient_connections so they can start a
  connection request from the chat page.
*/

DROP POLICY IF EXISTS "Patients can request connections" ON public.doctor_patient_connections;

CREATE POLICY "Patients can request connections"
  ON public.doctor_patient_connections
  FOR INSERT
  TO authenticated
  WITH CHECK (
    patient_id = auth.uid()
    AND doctor_id IN (SELECT id FROM public.doctors)
    AND status = 'pending'
  );