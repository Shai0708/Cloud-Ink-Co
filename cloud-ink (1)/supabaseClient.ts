import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase credentials to resolve environment variable loading issue.
const supabaseUrl = 'https://mklwnsgaatyizyvfxonb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rbHduc2dhYXR5aXp5dmZ4b25iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5Nzc4NjYsImV4cCI6MjA3MjU1Mzg2Nn0.CaATUJS5y4l3fEc_qy9rH85hdK0g1pCbm0uQswYwuWU';

if (!supabaseUrl || !supabaseAnonKey) {
  // This check is kept as a safeguard, but should not be triggered with hardcoded values.
  throw new Error('Supabase URL and Anon Key are missing.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
