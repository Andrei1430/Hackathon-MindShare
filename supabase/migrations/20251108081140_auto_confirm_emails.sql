/*
  # Auto-confirm user emails

  1. Changes
    - Create a trigger function that automatically confirms user emails
    - Apply trigger to auth.users table on INSERT
    - This bypasses the need for email confirmation

  2. Security Notes
    - This removes email verification requirement
    - Only use in development or when email verification is not needed
    - In production, consider using proper email verification
*/

-- Function to auto-confirm user emails
CREATE OR REPLACE FUNCTION auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_confirmed_at = NOW();
  NEW.confirmed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-confirm on user creation
DROP TRIGGER IF EXISTS auto_confirm_user_trigger ON auth.users;
CREATE TRIGGER auto_confirm_user_trigger
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_confirm_user();