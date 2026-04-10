/*
  # Add missing app tables

  1. New Tables
    - `health_articles`
    - `chat_history`
    - `ai_question_counter`

  2. Security
    - Allow public read access to health articles
    - Allow authenticated users to manage their own chat history and AI counters
    - Allow admins to manage health articles
*/

CREATE TABLE IF NOT EXISTS public.health_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  excerpt text NOT NULL,
  image_url text,
  category text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  summary text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ai_question_counter (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  question_count integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.health_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_question_counter ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can read health articles" ON public.health_articles;
CREATE POLICY "Everyone can read health articles"
  ON public.health_articles
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Admins can manage health articles" ON public.health_articles;
CREATE POLICY "Admins can manage health articles"
  ON public.health_articles
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can read own chat history" ON public.chat_history;
CREATE POLICY "Users can read own chat history"
  ON public.chat_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create chat history" ON public.chat_history;
CREATE POLICY "Users can create chat history"
  ON public.chat_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own AI counter" ON public.ai_question_counter;
CREATE POLICY "Users can manage own AI counter"
  ON public.ai_question_counter
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

INSERT INTO public.health_articles (title, content, excerpt, image_url, category)
VALUES
  (
    'Managing Stress in Daily Life',
    'Stress is part of life, but small routines can make it easier to handle. Start with sleep, movement, and clear boundaries.',
    'Practical ways to reduce stress with simple daily habits.',
    'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?q=80&w=1200&auto=format&fit=crop',
    'Mental Health'
  ),
  (
    'Nutrition Basics for Better Energy',
    'Balanced meals help maintain energy, focus, and mood. Aim for protein, fiber, healthy fats, and hydration throughout the day.',
    'Learn the basics of nutrition that support energy and mood.',
    'https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=1200&auto=format&fit=crop',
    'Nutrition'
  ),
  (
    'Starting a Gentle Exercise Routine',
    'Exercise does not need to be intense to help. A short walk, stretching, or light strength training can build consistency.',
    'A simple way to begin moving more without burnout.',
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1200&auto=format&fit=crop',
    'Exercise'
  );
