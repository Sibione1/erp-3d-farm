import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://suqbmvhxiojyvbmyzlfm.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1cWJtdmh4aW9qeXZibXl6bGZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMzY2MDMsImV4cCI6MjA5NjgxMjYwM30.-_b6PHndg1w-MFCQXWVckHJqRGVBhYqDF4fTgXZYWkM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
