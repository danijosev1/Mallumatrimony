import { createClient } from '@supabase/supabase-js'

// Placeholder values - will be replaced when you connect to Supabase
const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase