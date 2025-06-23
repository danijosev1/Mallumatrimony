import React, { createContext, useContext, useState, useEffect } from 'react';
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
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state changed:', event, session?.user?.email || 'No user');
      
      setUser(session?.user ?? null);
      setIsLoading(false);
      setConnectionError(null);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ User signed in:', session.user.email);
        
        // Always redirect to home page after successful login/signup
        // The home page will handle showing the appropriate dashboard or onboarding
        setTimeout(() => {
          if (window.location.pathname !== '/') {
            window.location.href = '/';
          }
        }, 500);
        
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        setUser(null);
        // Only redirect to home if not already there
        if (window.location.pathname !== '/') {
          setTimeout(() => {
            window.location.href = '/';
          }, 100);
        }
      }
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
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        console.error('❌ Login error:', error);
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