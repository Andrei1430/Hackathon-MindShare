/*
  # Add user roles system

  1. New Types
    - `user_role` enum with values: 'admin', 'planner', 'basic'

  2. Changes
    - Add `role` column to `profiles` table with default 'basic'
    - Update existing users to have 'basic' role

  3. Security
    - Users can view their own role
    - Only admins can update roles (future implementation)
*/

-- Create user role enum type
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'planner', 'basic');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add role column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'basic' NOT NULL;
  END IF;
END $$;

-- Update existing users to have basic role
UPDATE profiles SET role = 'basic' WHERE role IS NULL;