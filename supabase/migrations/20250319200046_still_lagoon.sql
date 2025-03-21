/*
  # Add reviews and questions tables
  
  1. New Tables
    - `reviews`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `rating` (integer, 1-5)
      - `review_text` (text)
      - `created_at` (timestamp)
    - `questions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `question` (text)
      - `answer` (text, nullable)
      - `status` (text, default 'pending')
      - `created_at` (timestamp)
      
  2. Security
    - Enable RLS on both tables
    - Add policies for user access
*/

-- Create reviews table
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT one_review_per_user UNIQUE (user_id)
);

-- Create questions table
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  question text NOT NULL,
  answer text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'answered')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Policies for reviews
CREATE POLICY "Users can create their own review"
  ON reviews FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own review"
  ON reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can read reviews"
  ON reviews FOR SELECT
  TO authenticated
  USING (true);

-- Policies for questions
CREATE POLICY "Users can create questions"
  ON questions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own questions"
  ON questions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can answer questions"
  ON questions FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid()
  ));