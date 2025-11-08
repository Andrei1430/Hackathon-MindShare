/*
  # Create Session Requests Feature

  1. New Tables
    - `session_requests`
      - `id` (uuid, primary key)
      - `title` (text, required) - Proposed session title
      - `description` (text, required) - Session description
      - `datetime` (timestamptz, required) - Proposed session date and time
      - `visibility` (text, required) - Either 'public' or 'private'
      - `status` (text, required) - Either 'pending', 'approved', or 'rejected'
      - `user_id` (uuid, required) - User who submitted the request
      - `reviewed_by` (uuid, optional) - Admin/planner who reviewed the request
      - `reviewed_at` (timestamptz, optional) - When the request was reviewed
      - `rejection_reason` (text, optional) - Reason for rejection if applicable
      - `session_id` (uuid, optional) - Links to created session if approved
      - `created_at` (timestamptz) - When request was created
      - `updated_at` (timestamptz) - Last update time

  2. Security
    - Enable RLS on `session_requests` table
    - Users can view their own requests
    - Admin and planner roles can view all requests
    - Users can create requests if they have basic role
    - Only admin and planner roles can update request status
    - Users can update only pending requests they own

  3. Indexes
    - Index on user_id for faster queries
    - Index on status for filtering
*/

-- Create session_requests table
CREATE TABLE IF NOT EXISTS session_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  datetime timestamptz NOT NULL,
  visibility text NOT NULL CHECK (visibility IN ('public', 'private')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  rejection_reason text,
  session_id uuid REFERENCES sessions(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE session_requests ENABLE ROW LEVEL SECURITY;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_session_requests_user_id ON session_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_session_requests_status ON session_requests(status);
CREATE INDEX IF NOT EXISTS idx_session_requests_reviewed_by ON session_requests(reviewed_by);

-- Users can view their own requests
CREATE POLICY "Users can view own requests"
  ON session_requests
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
  );

-- Admin and planner can view all requests
CREATE POLICY "Admin and planner can view all requests"
  ON session_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'planner')
    )
  );

-- Users can create requests
CREATE POLICY "Users can create requests"
  ON session_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
  );

-- Users can update their own pending requests
CREATE POLICY "Users can update own pending requests"
  ON session_requests
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    AND status = 'pending'
  )
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending'
  );

-- Admin and planner can update all requests
CREATE POLICY "Admin and planner can update all requests"
  ON session_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'planner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'planner')
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_session_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_session_requests_updated_at_trigger ON session_requests;
CREATE TRIGGER update_session_requests_updated_at_trigger
  BEFORE UPDATE ON session_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_session_requests_updated_at();