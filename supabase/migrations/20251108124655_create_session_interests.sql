/*
  # Create Session Interests Feature

  1. New Tables
    - `session_interests`
      - `id` (uuid, primary key) - Unique identifier for each interest record
      - `session_id` (uuid, foreign key) - References the session
      - `user_id` (uuid, foreign key) - References the user showing interest
      - `created_at` (timestamptz) - When the interest was expressed
      - Unique constraint on (session_id, user_id) to prevent duplicate interests

  2. Security
    - Enable RLS on `session_interests` table
    - Add policy for authenticated users to read all interests
    - Add policy for authenticated users to create their own interest
    - Add policy for users to delete their own interest

  3. Indexes
    - Add index on `session_id` for efficient interest queries per session
    - Add index on `user_id` for efficient user interest queries
*/

-- Create session_interests table
CREATE TABLE IF NOT EXISTS session_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_session_interests_session_id ON session_interests(session_id);
CREATE INDEX IF NOT EXISTS idx_session_interests_user_id ON session_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_session_interests_created_at ON session_interests(created_at DESC);

-- Enable RLS
ALTER TABLE session_interests ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all interests
CREATE POLICY "Authenticated users can read all interests"
  ON session_interests
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can create their own interest
CREATE POLICY "Users can create own interest"
  ON session_interests
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own interest
CREATE POLICY "Users can delete own interest"
  ON session_interests
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
