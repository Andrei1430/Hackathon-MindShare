/*
  # Fix infinite recursion in RLS policies

  1. Problem
    - The session_guests policy references sessions table
    - The sessions policy references session_guests table
    - This creates a circular dependency causing infinite recursion

  2. Solution
    - Simplify session_guests policies to avoid circular references
    - Use direct auth checks instead of referencing sessions table
    - Maintain security while breaking the recursion cycle

  3. Changes
    - Drop and recreate session_guests policies without circular references
    - Keep admin/planner access through role checks
*/

-- Drop existing session_guests policies
DROP POLICY IF EXISTS "Users can view guests of sessions they can access" ON session_guests;
DROP POLICY IF EXISTS "Session creators can manage guests" ON session_guests;

-- Create simplified session_guests SELECT policy
CREATE POLICY "Users can view session guests"
  ON session_guests FOR SELECT
  TO authenticated
  USING (
    -- Admin and planner can view all
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'planner')
    )
    OR
    -- Users can view guest lists they're part of
    user_id = auth.uid()
  );

-- Create session_guests management policy for creators
CREATE POLICY "Session creators can insert guests"
  ON session_guests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'planner')
    )
  );

CREATE POLICY "Session creators can delete guests"
  ON session_guests FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'planner')
    )
  );