import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,  // Automatically refresh tokens
    persistSession: true,    // Keep user logged in
    detectSessionInUrl: true,
    storage: localStorage,
    flowType: 'pkce',        // Secure authentication flow
    storageKey: 'supabase.auth.token' // Custom storage key
  }
});
