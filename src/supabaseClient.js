import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ojhawyxyezlckstcmydx.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qaGF3eXh5ZXpsY2tzdGNteWR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0MjI0NjAsImV4cCI6MjEwNTk5ODQ2MH0.BlpZhvKrfj_tc7JoQAAZaTT2zCykXzgvip9rwxUibys';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
