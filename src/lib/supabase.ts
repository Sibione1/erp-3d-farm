import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cgancnqrvsnxjbylluvd.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_JZrKcI88vvUBBk6n8AhYVw_dXcDAT7c';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
