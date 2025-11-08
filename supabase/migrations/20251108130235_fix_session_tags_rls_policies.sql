/*
  # Fix Session Tags RLS Policies

  1. Changes
    - Drop existing overly restrictive policy on session_tags
    - Create separate policies for INSERT, UPDATE, and DELETE operations
    - Allow admin and planner roles to manage session tags
    - Allow session creators to manage their own session tags

  2. Security
    - INSERT: Allowed for session creators, admins, and planners
    - UPDATE: Not needed for junction table (delete and re-insert instead)
    - DELETE: Allowed for session creators, admins, and planners
    - SELECT: All authenticated users can read (already exists)
*/

-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "Session creators can manage their session tags" ON session_tags;

-- Allow authenticated users to insert tags for sessions they created or if they are admin/planner
CREATE POLICY "Session creators and managers can insert tags"
  ON session_tags
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE sessions.id = session_tags.session_id 
      AND (
        sessions.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'planner')
        )
      )
    )
  );

-- Allow session creators, admins, and planners to delete tags
CREATE POLICY "Session creators and managers can delete tags"
  ON session_tags
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE sessions.id = session_tags.session_id 
      AND (
        sessions.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'planner')
        )
      )
    )
  );
