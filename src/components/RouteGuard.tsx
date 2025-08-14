import React, { ReactNode, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface RouteGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

/**
 * Component to guard routes and prevent unwanted redirects during tab switches
 */
export const RouteGuard: React.FC<RouteGuardProps> = ({ 
  children, 
  requireAuth = false, 
  redirectTo = '/login' 
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const hasRedirected = useRef(false);
  const initialCheckDone = useRef(false);

  useEffect(() => {
    // Only perform auth check after initial loading is complete
    if (isLoading) return;

    // Mark initial check as complete
    if (!initialCheckDone.current) {
      initialCheckDone.current = true;
      
      // If auth is required but user is not authenticated
      if (requireAuth && !user && !hasRedirected.current) {
        console.log(`🔒 Route ${location.pathname} requires authentication, redirecting to ${redirectTo}`);
        hasRedirected.current = true;
        navigate(redirectTo, { replace: true });
        return;
      }

      // Reset redirect flag if user is authenticated
      if (user) {
        hasRedirected.current = false;
      }
    }
  }, [user, isLoading, requireAuth, redirectTo, navigate, location.pathname]);

  // Reset redirect flag when user changes
  useEffect(() => {
    if (user) {
      hasRedirected.current = false;
    }
  }, [user]);

  // Show loading state during auth check
  if (isLoading && !initialCheckDone.current) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text/70">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if we're redirecting
  if (requireAuth && !user && hasRedirected.current) {
    return null;
  }

  return <>{children}</>;
};

/**
 * Higher-order component to wrap routes that require authentication
 */
export const withAuthGuard = (Component: React.ComponentType, redirectTo = '/login') => {
  return (props: any) => (
    <RouteGuard requireAuth={true} redirectTo={redirectTo}>
      <Component {...props} />
    </RouteGuard>
  );
};

/**
 * Higher-order component to wrap routes that should redirect authenticated users
 */
export const withGuestGuard = (Component: React.ComponentType, redirectTo = '/') => {
  const GuardedComponent = (props: any) => {
    const { user, isLoading } = useAuth();
    const navigate = useNavigate();
    const hasRedirected = useRef(false);

    useEffect(() => {
      if (!isLoading && user && !hasRedirected.current) {
        console.log('👤 User is authenticated, redirecting guest-only route');
        hasRedirected.current = true;
        navigate(redirectTo, { replace: true });
      }
    }, [user, isLoading, navigate]);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-text/70">Loading...</p>
          </div>
        </div>
      );
    }

    if (user && hasRedirected.current) {
      return null;
    }

    return <Component {...props} />;
  };

  return GuardedComponent;
};