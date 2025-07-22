import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = https://oypsqjayvadqtbikoaiu.supabase.co;
const supabaseAnonKey =eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95cHNxamF5dmFkcXRiaWtvYWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExOTkzMDAsImV4cCI6MjA2Njc3NTMwMH0.R7Io37hTFwzwJFbgkrttGnYXI7gvSrAJ-jW2s-BeRmI;

// Check if we have placeholder values - only check for actual placeholder strings
const hasPlaceholderValues = 
  !supabaseUrl || 
  !supabaseAnonKey || 
  supabaseUrl === 'https://your-project-ref.supabase.co' ||
  supabaseAnonKey === 'your-anon-key-here' ||
  supabaseUrl.includes('your-project-ref') ||
  supabaseAnonKey.includes('your-anon-key');

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase environment variables not found');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
} else if (hasPlaceholderValues) {
  console.error('❌ Supabase not configured properly - placeholder values detected');
  console.error('Please click the "Connect to Supabase" button in the top right to set up your Supabase project.');
  console.error('Current values:');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '[SET]' : '[NOT SET]');
}

// Helper function to check if error is CORS related
const isCorsError = (error: any): boolean => {
  return error?.name === 'CorsConfigurationError' ||
         error?.message?.includes('Failed to fetch') || 
         error?.message?.includes('CORS') ||
         (error?.name === 'TypeError' && error?.message === 'Failed to fetch');
};

// Helper function to create error with CORS guidance
const createCorsError = (originalError: any) => {
  const corsError = new Error(
    'Network request failed. This is likely a CORS configuration issue. ' +
    'Please add your development server URL to the CORS settings in your Supabase project dashboard. ' +
    'Go to Project Settings > API > CORS Origins and add your current domain.'
  );
  corsError.name = 'CorsConfigurationError';
  corsError.cause = originalError;
  return corsError;
};

// Create mock query builder that supports method chaining
const createMockQueryBuilder = () => {
  const mockError = new Error('Supabase not configured. Please set proper environment variables.');
  
  const mockQueryBuilder = {
    // Query methods that return the builder for chaining
    select: () => mockQueryBuilder,
    insert: () => mockQueryBuilder,
    update: () => mockQueryBuilder,
    upsert: () => mockQueryBuilder,
    delete: () => mockQueryBuilder,
    
    // Filter methods that return the builder for chaining
    eq: () => mockQueryBuilder,
    neq: () => mockQueryBuilder,
    gt: () => mockQueryBuilder,
    gte: () => mockQueryBuilder,
    lt: () => mockQueryBuilder,
    lte: () => mockQueryBuilder,
    like: () => mockQueryBuilder,
    ilike: () => mockQueryBuilder,
    is: () => mockQueryBuilder,
    in: () => mockQueryBuilder,
    contains: () => mockQueryBuilder,
    containedBy: () => mockQueryBuilder,
    rangeGt: () => mockQueryBuilder,
    rangeGte: () => mockQueryBuilder,
    rangeLt: () => mockQueryBuilder,
    rangeLte: () => mockQueryBuilder,
    rangeAdjacent: () => mockQueryBuilder,
    overlaps: () => mockQueryBuilder,
    textSearch: () => mockQueryBuilder,
    match: () => mockQueryBuilder,
    not: () => mockQueryBuilder,
    or: () => mockQueryBuilder,
    filter: () => mockQueryBuilder,
    
    // Modifier methods that return the builder for chaining
    order: () => mockQueryBuilder,
    limit: () => mockQueryBuilder,
    range: () => mockQueryBuilder,
    abortSignal: () => mockQueryBuilder,
    
    // Terminal methods that return promises
    then: () => Promise.reject(mockError),
    catch: () => Promise.reject(mockError),
    finally: () => Promise.reject(mockError),
    
    // Execution methods that return promises
    single: () => Promise.reject(mockError),
    maybeSingle: () => Promise.reject(mockError),
    head: () => Promise.reject(mockError),
    count: () => Promise.reject(mockError),
    csv: () => Promise.reject(mockError),
    geojson: () => Promise.reject(mockError),
    explain: () => Promise.reject(mockError),
  };
  
  return mockQueryBuilder;
};

// Declare supabase variable at top level
let supabaseClient: any;

// Create a mock client if not properly configured
if (!supabaseUrl || !supabaseAnonKey || hasPlaceholderValues) {
  console.warn('⚠️ Using mock Supabase client - please configure your Supabase connection');
  
  supabaseClient = {
    auth: {
      signUp: () => Promise.reject(new Error('Supabase not configured. Please set proper environment variables.')),
      signInWithPassword: () => Promise.reject(new Error('Supabase not configured. Please set proper environment variables.')),
      signOut: () => Promise.reject(new Error('Supabase not configured. Please set proper environment variables.')),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    from: () => createMockQueryBuilder(),
    rpc: () => createMockQueryBuilder(),
    channel: () => ({
      on: () => ({ subscribe: () => {} }),
      subscribe: () => {}
    }),
    removeChannel: () => {}
  };
} else {
  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch (error) {
    console.error('Invalid Supabase URL format:', supabaseUrl);
    throw new Error('Invalid Supabase URL format');
  }

  console.log('✅ Initializing Supabase client with valid credentials...');

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'X-Client-Info': 'mallu-matrimony-web'
      }
    }
  });

  // Test connection
  supabaseClient.auth.getSession().then(({ error }) => {
    if (error) {
      if (isCorsError(error)) {
        console.error('❌ CORS Configuration Error:', error);
        console.error('🔧 To fix this:');
        console.error('1. Go to your Supabase project dashboard');
        console.error('2. Navigate to Project Settings > API');
        console.error('3. Add your development server URL to CORS Origins');
        console.error('4. Current URL:', window.location.origin);
      } else {
        console.error('Supabase connection test failed:', error);
      }
    } else {
      console.log('✅ Supabase connection successful');
    }
  }).catch((error) => {
    if (isCorsError(error)) {
      console.error('❌ CORS Configuration Error:', error);
      console.error('🔧 To fix this:');
      console.error('1. Go to your Supabase project dashboard');
      console.error('2. Navigate to Project Settings > API');
      console.error('3. Add your development server URL to CORS Origins');
      console.error('4. Current URL:', window.location.origin);
    } else {
      console.error('❌ Supabase connection error:', error);
    }
  });
}

// Wrapper to handle CORS errors gracefully
const withCorsErrorHandling = async (operation: () => Promise<any>) => {
  try {
    return await operation();
  } catch (error) {
    if (isCorsError(error)) {
      throw createCorsError(error);
    }
    throw error;
  }
};

// List of methods that return promises and should be wrapped with CORS error handling
const PROMISE_METHODS = new Set([
  'then', 'catch', 'finally'
]);

// List of methods that execute the query and return promises
const EXECUTION_METHODS = new Set([
  'execute', 'single', 'maybeSingle', 'csv', 'geojson', 'explain'
]);

// Create a recursive proxy for query builder chaining
const createQueryBuilderProxy = (target: any): any => {
  return new Proxy(target, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      
      // If it's a function, we need to handle it
      if (typeof value === 'function') {
        return function (...args: any[]) {
          const result = value.apply(target, args);
          
          // If this is a promise method or execution method, wrap with CORS error handling
          if (PROMISE_METHODS.has(prop as string) || EXECUTION_METHODS.has(prop as string)) {
            return withCorsErrorHandling(() => result);
          }
          
          // If the result has a 'then' method (is thenable), wrap with CORS error handling
          if (result && typeof result.then === 'function') {
            return withCorsErrorHandling(() => result);
          }
          
          // If the result is an object (likely another query builder), create a proxy for it
          if (result && typeof result === 'object') {
            return createQueryBuilderProxy(result);
          }
          
          // Otherwise, return the result as-is
          return result;
        };
      }
      
      // For non-function properties, return as-is
      return value;
    }
  });
};

// Enhanced client with error-handling wrappers
const enhancedSupabase = {
  ...supabaseClient,
  auth: {
    ...supabaseClient.auth,
    signUp: (credentials: any) => withCorsErrorHandling(() => supabaseClient.auth.signUp(credentials)),
    signInWithPassword: (credentials: any) => withCorsErrorHandling(() => supabaseClient.auth.signInWithPassword(credentials)),
    signOut: (options?: any) => withCorsErrorHandling(() => supabaseClient.auth.signOut(options)),
    getSession: () => withCorsErrorHandling(() => supabaseClient.auth.getSession()),
    onAuthStateChange: supabaseClient.auth.onAuthStateChange.bind(supabaseClient.auth),
  },
  from: (table: string) => {
    const queryBuilder = supabaseClient.from(table);
    return createQueryBuilderProxy(queryBuilder);
  },
  // Add real-time methods
  channel: supabaseClient.channel?.bind(supabaseClient),
  removeChannel: supabaseClient.removeChannel?.bind(supabaseClient),
  // Add RPC method with proper proxy handling
  rpc: (fn: string, args?: any) => {
    const rpcBuilder = supabaseClient.rpc(fn, args);
    return createQueryBuilderProxy(rpcBuilder);
  }
};

// ✅ Final Export: Only one named export for `supabase`
export { enhancedSupabase as supabase, isCorsError, createCorsError };