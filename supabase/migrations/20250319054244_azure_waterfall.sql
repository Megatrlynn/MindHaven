/*
  # Create AI chat history tables

  1. New Tables
    - `ai_chats`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `message` (text, user's message)
      - `response` (text, AI's response)
      - `created_at` (timestamp with timezone)

  2. Security
    - Enable RLS on `ai_chats` table
    - Add policies for users to:
      - Read their own chat history
      - Create new chat entries
*/

CREATE TABLE IF NOT EXISTS ai_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  message text NOT NULL,
  response text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own chat history"
  ON ai_chats
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create chat entries"
  ON ai_chats
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);