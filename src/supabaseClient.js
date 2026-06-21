import { createClient } from "@supabase/supabase-js";

// These two values come from your Supabase project settings (Settings > API).
// They are safe to expose publicly — the anon key only allows what your
// Row Level Security rules permit (set up in the SQL step).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
