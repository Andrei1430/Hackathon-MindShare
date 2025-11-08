/*
  # Create default admin user

  1. New User
    - Email: admin@admin.com
    - Password: Test@1234
    - Role: admin
    - Full Name: Admin User

  2. Security
    - User is auto-confirmed
    - Profile is created with admin role
*/

DO $$
DECLARE
  new_user_id uuid;
BEGIN
  -- Check if admin user already exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@admin.com') THEN
    -- Generate a new UUID for the user
    new_user_id := gen_random_uuid();
    
    -- Insert into auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    )
    VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'admin@admin.com',
      crypt('Test@1234', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Admin User"}'::jsonb,
      NOW(),
      NOW()
    );

    -- Insert into profiles with admin role
    INSERT INTO profiles (id, email, full_name, role, created_at)
    VALUES (
      new_user_id,
      'admin@admin.com',
      'Admin User',
      'admin',
      NOW()
    );
  END IF;
END $$;