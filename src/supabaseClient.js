import { createClient } from '@supabase/supabase-js';

// Values come from environment variables (see .env.example).
// The anon key is a public browser key, but keeping it out of the source
// avoids Netlify's secret scanner flagging the repo.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Add them to a local .env file or to your host environment variables.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);