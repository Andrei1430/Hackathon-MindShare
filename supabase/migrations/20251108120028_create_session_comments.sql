/*
  # Create Session Comments Feature

  1. New Tables
    - `session_comments`
      - `id` (uuid, primary key) - Unique identifier for each comment
      - `session_id` (uuid, foreign key) - References the session this comment belongs to
      - `user_id` (uuid, foreign key) - References the user who created the comment
      - `content` (text) - The comment text content
      - `created_at` (timestamptz) - When the comment was created
      - `updated_at` (timestamptz) - When the comment was last updated

  2. Security
    - Enable RLS on `session_comments` table
    - Add policy for authenticated users to read all comments
    - Add policy for authenticated users to create their own comments
    - Add policy for users to update their own comments
    - Add policy for users to delete their own comments

  3. Indexes
    - Add index on `session_id` for efficient comment queries per session
    - Add index on `user_id` for efficient user comment queries
*/

-- Create session_comments table
CREATE TABLE IF NOT EXISTS session_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_session_comments_session_id ON session_comments(session_id);
CREATE INDEX IF NOT EXISTS idx_session_comments_user_id ON session_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_session_comments_created_at ON session_comments(created_at DESC);

-- Enable RLS
ALTER TABLE session_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all comments
CREATE POLICY "Authenticated users can read all comments"
  ON session_comments
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can create their own comments
CREATE POLICY "Users can create own comments"
  ON session_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON session_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON session_comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_session_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_session_comments_updated_at_trigger ON session_comments;
CREATE TRIGGER update_session_comments_updated_at_trigger
  BEFORE UPDATE ON session_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_session_comments_updated_at();
