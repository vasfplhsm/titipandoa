import { createClient } from '@supabase/supabase-js';

// Values come from environment variables (see .env.example).
// The anon key is a public browser key, but keeping it out of the source
// avoids Netlify's secret scanner flagging the repo.
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
// Public/offline features still start when a deployment has no Supabase settings.
export const supabase = supabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : null;
