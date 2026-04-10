/*
  # Allow deleting auth users without FK failures

  This migration updates foreign keys so deleting a user from Supabase Auth
  also removes the related app records that reference that user.
*/

ALTER TABLE IF EXISTS public.admins
  DROP CONSTRAINT IF EXISTS admins_user_id_fkey,
  ADD CONSTRAINT admins_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.doctors
  DROP CONSTRAINT IF EXISTS doctors_user_id_fkey,
  ADD CONSTRAINT doctors_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey,
  ADD CONSTRAINT user_profiles_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.chat_history
  DROP CONSTRAINT IF EXISTS chat_history_user_id_fkey,
  ADD CONSTRAINT chat_history_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.ai_question_counter
  DROP CONSTRAINT IF EXISTS ai_question_counter_user_id_fkey,
  ADD CONSTRAINT ai_question_counter_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.doctor_patient_connections
  DROP CONSTRAINT IF EXISTS doctor_patient_connections_doctor_id_fkey,
  ADD CONSTRAINT doctor_patient_connections_doctor_id_fkey
    FOREIGN KEY (doctor_id)
    REFERENCES public.doctors(id)
    ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.doctor_patient_connections
  DROP CONSTRAINT IF EXISTS doctor_patient_connections_patient_id_fkey,
  ADD CONSTRAINT doctor_patient_connections_patient_id_fkey
    FOREIGN KEY (patient_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.doctor_patient_chats
  DROP CONSTRAINT IF EXISTS doctor_patient_chats_connection_id_fkey,
  ADD CONSTRAINT doctor_patient_chats_connection_id_fkey
    FOREIGN KEY (connection_id)
    REFERENCES public.doctor_patient_connections(id)
    ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.doctor_patient_chats
  DROP CONSTRAINT IF EXISTS doctor_patient_chats_doctor_sender_fkey,
  ADD CONSTRAINT doctor_patient_chats_doctor_sender_fkey
    FOREIGN KEY (sender_id)
    REFERENCES public.doctors(user_id)
    ON DELETE CASCADE;