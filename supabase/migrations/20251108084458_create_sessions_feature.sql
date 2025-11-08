/*
  # Create sessions feature

  1. New Tables
    - `sessions`
      - `id` (uuid, primary key)
      - `title` (text, required)
      - `description` (text)
      - `datetime` (timestamptz, required)
      - `presentation_url` (text, file URL)
      - `recording_url` (text, file URL)
      - `visibility` (enum: public/private, default public)
      - `created_by` (uuid, foreign key to profiles)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `tags`
      - `id` (uuid, primary key)
      - `name` (text, unique, required)
      - `color` (text, hex color code)
      - `created_at` (timestamptz)
    
    - `session_tags`
      - `session_id` (uuid, foreign key to sessions)
      - `tag_id` (uuid, foreign key to tags)
      - Primary key on (session_id, tag_id)
    
    - `session_guests`
      - `session_id` (uuid, foreign key to sessions)
      - `user_id` (uuid, foreign key to profiles)
      - `invited_at` (timestamptz)
      - Primary key on (session_id, user_id)

  2. Security
    - Enable RLS on all tables
    - Public sessions: visible to all authenticated users
    - Private sessions: visible only to creator and invited guests
    - Tags: readable by all, writable by authenticated users
    - Session guests: manageable by session creator
*/

-- Create visibility enum
DO $$ BEGIN
  CREATE TYPE session_visibility AS ENUM ('public', 'private');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  datetime timestamptz NOT NULL,
  presentation_url text,
  recording_url text,
  visibility session_visibility DEFAULT 'public' NOT NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  color text DEFAULT '#27A4F6' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create session_tags junction table
CREATE TABLE IF NOT EXISTS session_tags (
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  tag_id uuid REFERENCES tags(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (session_id, tag_id)
);

-- Create session_guests junction table
CREATE TABLE IF NOT EXISTS session_guests (
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  invited_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (session_id, user_id)
);

-- Enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_guests ENABLE ROW LEVEL SECURITY;

-- Sessions policies
CREATE POLICY "Users can view public sessions"
  ON sessions FOR SELECT
  TO authenticated
  USING (visibility = 'public');

CREATE POLICY "Users can view their own sessions"
  ON sessions FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Users can view private sessions they're invited to"
  ON sessions FOR SELECT
  TO authenticated
  USING (
    visibility = 'private' 
    AND EXISTS (
      SELECT 1 FROM session_guests 
      WHERE session_guests.session_id = sessions.id 
      AND session_guests.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create sessions"
  ON sessions FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own sessions"
  ON sessions FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own sessions"
  ON sessions FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Tags policies
CREATE POLICY "Anyone can view tags"
  ON tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create tags"
  ON tags FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Session tags policies
CREATE POLICY "Anyone can view session tags"
  ON session_tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Session creators can manage their session tags"
  ON session_tags FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE sessions.id = session_tags.session_id 
      AND sessions.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE sessions.id = session_tags.session_id 
      AND sessions.created_by = auth.uid()
    )
  );

-- Session guests policies
CREATE POLICY "Users can view guests of sessions they can access"
  ON session_guests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE sessions.id = session_guests.session_id 
      AND (
        sessions.created_by = auth.uid()
        OR sessions.visibility = 'public'
        OR EXISTS (
          SELECT 1 FROM session_guests sg2
          WHERE sg2.session_id = sessions.id 
          AND sg2.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Session creators can manage guests"
  ON session_guests FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE sessions.id = session_guests.session_id 
      AND sessions.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE sessions.id = session_guests.session_id 
      AND sessions.created_by = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_created_by ON sessions(created_by);
CREATE INDEX IF NOT EXISTS idx_sessions_datetime ON sessions(datetime);
CREATE INDEX IF NOT EXISTS idx_sessions_visibility ON sessions(visibility);
CREATE INDEX IF NOT EXISTS idx_session_guests_user_id ON session_guests(user_id);
CREATE INDEX IF NOT EXISTS idx_session_tags_tag_id ON session_tags(tag_id);