/*
  # Add admin and doctor system

  1. New Tables
    - `doctors`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `profession` (text)
      - `phone` (text)
      - `profile_picture` (text, URL)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `user_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `age` (integer)
      - `medical_history` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `doctor_patient_connections`
      - `id` (uuid, primary key)
      - `doctor_id` (uuid, references doctors)
      - `patient_id` (uuid, references auth.users)
      - `status` (text, enum: 'pending', 'connected')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `doctor_patient_chats`
      - `id` (uuid, primary key)
      - `connection_id` (uuid, references doctor_patient_connections)
      - `sender_id` (uuid, references auth.users)
      - `message` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for admins, doctors, and patients
*/

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'patient');
CREATE TYPE connection_status AS ENUM ('pending', 'connected');

-- Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  profession text NOT NULL,
  phone text,
  profile_picture text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  age integer,
  medical_history text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create doctor_patient_connections table
CREATE TABLE IF NOT EXISTS doctor_patient_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES doctors NOT NULL,
  patient_id uuid REFERENCES auth.users NOT NULL,
  status connection_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(doctor_id, patient_id)
);

-- Create doctor_patient_chats table
CREATE TABLE IF NOT EXISTS doctor_patient_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid REFERENCES doctor_patient_connections NOT NULL,
  sender_id uuid REFERENCES auth.users NOT NULL,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_patient_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_patient_chats ENABLE ROW LEVEL SECURITY;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(check_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = check_user_id
    AND email LIKE '%@admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is doctor
CREATE OR REPLACE FUNCTION is_doctor(check_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM doctors
    WHERE user_id = check_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for doctors table
CREATE POLICY "Admins can manage doctors"
  ON doctors
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Doctors can view own profile"
  ON doctors
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policies for user_profiles table
CREATE POLICY "Admins can manage user profiles"
  ON user_profiles
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users can manage own profile"
  ON user_profiles
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policies for doctor_patient_connections
CREATE POLICY "Doctors can manage their connections"
  ON doctor_patient_connections
  TO authenticated
  USING (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()))
  WITH CHECK (doctor_id IN (SELECT id FROM doctors WHERE user_id = auth.uid()));

CREATE POLICY "Patients can view their connections"
  ON doctor_patient_connections
  FOR SELECT
  TO authenticated
  USING (patient_id = auth.uid());

-- Policies for doctor_patient_chats
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