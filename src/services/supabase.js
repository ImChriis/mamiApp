// src/services/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

// Reemplaza estas constantes con las llaves de tu proyecto en Supabase
const SUPABASE_URL = 'https://milfegkequkslrcpcxmu.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pbGZlZ2tlcXVrc2xyY3BjeG11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzMDI0MTcsImV4cCI6MjEwMTg3ODQxN30.UqY6rYAw9MRJPD41dU3GE7cLmN_Fzo0vWBxYD2iwHb8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});