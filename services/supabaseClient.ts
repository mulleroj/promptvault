import { createClient } from '@supabase/supabase-js';

// Use environment variables if available, otherwise fall back to default values
// This allows the app to work locally and be configured via Netlify env vars
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ukrwqmaiddvmvkmeqzcv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrcndxbWFpZGR2bXZrbWVxemN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MTI3MDQsImV4cCI6MjA4MTQ4ODcwNH0.uYsPfhSY3Ib2lIpPu8nj8E8Zr4tz1Cgq0Xaom3I4bWU';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('⚠️ Supabase credentials not configured properly');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
