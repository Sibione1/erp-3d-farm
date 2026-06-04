import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cgancnqrvsnxjbylluvd.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'cole_aqui_a_sua_anon_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
