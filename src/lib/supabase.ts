import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserRole = 'admin' | 'planner' | 'basic';

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  bio: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
};
