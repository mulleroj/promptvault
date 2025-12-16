import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ukrwqmaiddvmvkmeqzcv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrcndxbWFpZGR2bXZrbWVxemN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MTI3MDQsImV4cCI6MjA4MTQ4ODcwNH0.uYsPfhSY3Ib2lIpPu8nj8E8Zr4tz1Cgq0Xaom3I4bWU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
