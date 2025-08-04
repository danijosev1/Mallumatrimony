import { createClient } from '@supabase/supabase-js'

// Get Supabase URL and anon key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate that environment variables are present
if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable')
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Helper function to check if an error is a CORS error
export const isCorsError = (error: any): boolean => {
  return (
    error?.name === 'CorsConfigurationError' ||
    error?.message?.includes('Failed to fetch') ||
    error?.message?.includes('CORS') ||
    error?.message?.includes('Network request failed')
  )
}

// Helper function to handle Supabase errors gracefully
export const handleSupabaseError = (error: any, context: string = '') => {
  console.error(`Supabase error${context ? ` in ${context}` : ''}:`, error)
  
  if (isCorsError(error)) {
    console.error('CORS Configuration needed:')
    console.error('1. Go to your Supabase project dashboard')
    console.error('2. Navigate to Project Settings → API → CORS Origins')
    console.error('3. Add http://localhost:5173 to the allowed origins')
    console.error('4. Refresh this page after making changes')
  }
  
  return error
}

export default supabase