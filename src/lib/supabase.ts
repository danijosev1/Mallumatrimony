// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// Use hardcoded values since your .env might not be loading properly
const supabaseUrl = 'https://oypsqjayvadqtbikoaiu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cHNxamF5dmFkcXRiaWtvYWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExOTkzMDAsImV4cCI6MjA2Njc3NTMwMH0.R7Io37hTFwzwJFbgkrttGnYXI7gvSrAJ-jW2s-BeRmI'

// Create the client with minimal configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Simple test to verify the client works
console.log('🔧 Supabase client created:', {
  hasClient: !!supabase,
  hasFrom: typeof supabase.from === 'function',
  hasAuth: typeof supabase.auth === 'object'
})

// Test basic functionality
supabase.from('profiles').select('count').limit(0)
  .then(({ error }) => {
    if (error) {
      console.error('❌ Supabase test failed:', error.message)
    } else {
      console.log('✅ Supabase client test successful')
    }
  })
  .catch(err => {
    console.error('❌ Supabase connection error:', err)
  })

// Export helper functions that other files might be importing
export const isCorsError = (error: any): boolean => {
  return error?.name === 'CorsConfigurationError' ||
         error?.message?.includes('Failed to fetch') || 
         error?.message?.includes('CORS') ||
         (error?.name === 'TypeError' && error?.message === 'Failed to fetch');
};

export const createCorsError = (originalError: any) => {
  const corsError = new Error(
    'Network request failed. This is likely a CORS configuration issue.'
  );
  corsError.name = 'CorsConfigurationError';
  corsError.cause = originalError;
  return corsError;
};

export default supabase