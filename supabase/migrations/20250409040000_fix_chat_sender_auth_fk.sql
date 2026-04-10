/*
  # Fix chat sender foreign key

  Chat messages are sent by both patients and therapists, so sender_id must
  reference auth.users rather than doctors(user_id).
*/

ALTER TABLE IF EXISTS public.doctor_patient_chats
  DROP CONSTRAINT IF EXISTS doctor_patient_chats_doctor_sender_fkey,
  DROP CONSTRAINT IF EXISTS doctor_patient_chats_sender_id_fkey;

ALTER TABLE IF EXISTS public.doctor_patient_chats
  ADD CONSTRAINT doctor_patient_chats_sender_id_fkey
    FOREIGN KEY (sender_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;