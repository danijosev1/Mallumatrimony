import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase, isCorsError } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  connectionError: string | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  // Track if we've completed initial auth check
  const initialLoadComplete = useRef(false);
  // Track if we should redirect on auth changes
  const shouldRedirect = useRef(false);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        console.log('🔍 Checking for existing session...');
        setConnectionError(null);
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Session check error:', error);
          if (isCorsError(error)) {
            setConnectionError('Connection failed. Please check your network connection and CORS configuration.');
          }
        } else if (session?.user) {
          console.log('✅ Found existing session for:', session.user.email);
          setUser(session.user);
        } else {
          console.log('ℹ️ No existing session found');
        }
      } catch (error) {
        console.error('❌ Session check failed:', error);
        if (isCorsError(error)) {
          setConnectionError('Connection failed. Please check your network connection and CORS configuration.');
        }
      } finally {
        setIsLoading(false);
        initialLoadComplete.current = true;
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email || 'No user');
      
      setUser(session?.user ?? null);
      setConnectionError(null);
      
      // Only handle redirects for explicit auth events, not initial load
      if (initialLoadComplete.current) {
        if (event === 'SIGNED_IN' && session?.user && shouldRedirect.current) {
          console.log('✅ User signed in, redirecting to home');
          
          // Only redirect if we're on login/register pages or if explicitly triggered by login
          const currentPath = window.location.pathname;
          const authPages = ['/login', '/register', '/create-profile', '/forgot-password', '/reset-password'];
          
          if (authPages.includes(currentPath) || shouldRedirect.current) {
            setTimeout(() => {
              window.location.href = '/';
            }, 500);
          }
          
          // Reset redirect flag
          shouldRedirect.current = false;
          
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          setUser(null);
          
          // Only redirect to home if we're on protected pages
          const currentPath = window.location.pathname;
          const protectedPages = ['/profile', '/messages', '/settings', '/favorites', '/complete-profile'];
          
          if (protectedPages.some(page => currentPath.startsWith(page))) {
            setTimeout(() => {
              window.location.href = '/';
            }, 100);
          }
        }
      }
      
      // Always set loading to false after auth state change
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setConnectionError(null);
      console.log('🔐 Attempting login for:', email);
      
      // Set redirect flag before login attempt
      shouldRedirect.current = true;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error('❌ Login error:', error);
        shouldRedirect.current = false; // Reset on error
        if (isCorsError(error)) {
          setConnectionError('Connection failed. Please check your network connection and CORS configuration.');
        }
        throw error;
      }

      if (data.user) {
        console.log('✅ Login successful for:', data.user.email);
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
      shouldRedirect.current = false; // Reset on error
      if (isCorsError(error)) {
        setConnectionError('Connection failed. Please check your network connection and CORS configuration.');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      setConnectionError(null);
      console.log('🚪 Starting logout...');
      
      // Set user to null immediately for better UX
      setUser(null);
      
      const { error } = await supabase.auth.signOut({
        scope: 'global'
      });
      
      if (error) {
        console.error('❌ Logout error:', error);
        if (isCorsError(error)) {
          setConnectionError('Connection failed during logout. You have been logged out locally.');
        }
      } else {
        console.log('✅ Logout successful');
      }
      
      // Always redirect to home after logout
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
      
    } catch (error) {
      console.error('❌ Logout failed:', error);
      if (isCorsError(error)) {
        setConnectionError('Connection failed during logout. You have been logged out locally.');
      }
      setUser(null);
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
    connectionError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};