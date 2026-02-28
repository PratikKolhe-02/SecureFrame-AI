import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// creates a single instance of the Supabase client to use everywhere
export const supabase = createClient(supabaseUrl, supabaseAnonKey);