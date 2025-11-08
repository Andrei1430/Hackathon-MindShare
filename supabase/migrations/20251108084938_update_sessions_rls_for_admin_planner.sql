/*
  # Update sessions RLS policies for admin and planner access

  1. Changes
    - Drop existing session SELECT policies
    - Create new comprehensive SELECT policy that allows:
      * All authenticated users to view public sessions
      * Users to view their own sessions (public or private)
      * Users to view private sessions they're invited to
      * Admin and planner users to view ALL sessions without constraints
    
  2. Security Notes
    - Maintains data security for basic users
    - Grants full visibility to admin and planner roles
    - No changes to INSERT, UPDATE, DELETE policies
*/

-- Drop existing SELECT policies for sessions
DROP POLICY IF EXISTS "Users can view public sessions" ON sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can view private sessions they're invited to" ON sessions;

-- Create comprehensive SELECT policy with admin/planner access
CREATE POLICY "Users can view sessions based on role and access"
  ON sessions FOR SELECT
  TO authenticated
  USING (
    -- Admin and planner can view all sessions
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'planner')
    )
    OR
    -- Public sessions visible to all
    visibility = 'public'
    OR
    -- Users can view their own sessions
    created_by = auth.uid()
    OR
    -- Users can view private sessions they're invited to
    (
      visibility = 'private' 
      AND EXISTS (
        SELECT 1 FROM session_guests 
        WHERE session_guests.session_id = sessions.id 
        AND session_guests.user_id = auth.uid()
      )
    )
  );