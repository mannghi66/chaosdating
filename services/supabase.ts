
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ismjmvxsusytxzhcdtrd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzbWptdnhzdXN5dHh6aGNkdHJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NTc3MjgsImV4cCI6MjA3NjAzMzcyOH0.3awT0xemc_BcRIWzlTMLgodtgHJQgA7k8Z55S8_bhgM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
