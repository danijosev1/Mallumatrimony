import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { supabase, isCorsError } from '../lib/supabase';

export interface Notification {
  id: string;
  type: 'like' | 'message' | 'view' | 'match';
  read: boolean;
  created_at: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
  message: string;
  content?: string;
}

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => void;
  addNotification: (notification: Notification) => void;
  isLoading: boolean;
  connectionError: string | null;
  connectionStatus: ConnectionStatus;
  realtimeEnabled: boolean;
  toggleRealtime: () => void;
  reconnect: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  
  const channelRef = useRef<any>(null);
  const profileCacheRef = useRef<Map<string, any>>(new Map());
  const fetchTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounced profile fetching to reduce API calls
  const debouncedProfileFetch = useCallback(async (userIds: string[]) => {
    // Clear existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    return new Promise<any[]>((resolve) => {
      fetchTimeoutRef.current = setTimeout(async () => {
        try {
          // Check cache first
          const uncachedIds = userIds.filter(id => !profileCacheRef.current.has(id));
          
          if (uncachedIds.length === 0) {
            // All profiles cached
            resolve(userIds.map(id => profileCacheRef.current.get(id)).filter(Boolean));
            return;
          }

          // Fetch uncached profiles
          const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, name, full_name, images')
            .in('id', uncachedIds);

          if (!error && profiles) {
            // Cache new profiles
            profiles.forEach(profile => {
              profileCacheRef.current.set(profile.id, profile);
            });
          }

          // Return all requested profiles from cache
          resolve(userIds.map(id => profileCacheRef.current.get(id)).filter(Boolean));
        } catch (error) {
          console.error('Error fetching profiles:', error);
          resolve([]);
        }
      }, 100); // 100ms debounce
    });
  }, []);

  // Helper function to get user info with caching
  const getUserInfo = useCallback(async (userId: string) => {
    const profiles = await debouncedProfileFetch([userId]);
    const profile = profiles[0];
    
    return {
      id: userId,
      name: profile?.name || profile?.full_name || 'Anonymous',
      image: profile?.images?.[0] || undefined
    };
  }, [debouncedProfileFetch]);

  // OPTIMIZED REALTIME SETUP - Single consolidated subscription
  const setupRealtimeSubscription = useCallback(() => {
    if (!user || !realtimeEnabled) {
      setConnectionStatus('disconnected');
      return;
    }

    // Cleanup previous subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    try {
      setConnectionStatus('connecting');
      console.log('🔌 Setting up optimized notification realtime for user:', user.id);

      // Single channel with consolidated event handling
      const channel = supabase
        .channel(`user_notifications_${user.id}_${Date.now()}`)
        
        // High-priority: New messages (most important for UX)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${user.id}`
          },
          async (payload) => {
            console.log('📧 New message notification');
            await handleNewMessage(payload);
          }
        )
        
        // Medium-priority: New matches (important but less frequent)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'matches',
            filter: `user2_id=eq.${user.id}` // Only new match requests
          },
          async (payload) => {
            console.log('💕 New match notification');
            await handleNewMatch(payload);
          }
        )
        
        // Low-priority: Profile interactions (batched)
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events but filter efficiently
            schema: 'public',
            table: 'profile_interactions',
            filter: `receiver_id=eq.${user.id}`
          },
          async (payload) => {
            if (payload.new?.interaction_type === 'like') {
              console.log('❤️ New like notification');
              await handleNewInteraction(payload);
            }
          }
        )
        
        .subscribe((status) => {
          console.log('📡 Notification subscription status:', status);
          
          switch (status) {
            case 'SUBSCRIBED':
              setConnectionStatus('connected');
              setConnectionError(null);
              break;
            case 'CHANNEL_ERROR':
            case 'TIMED_OUT':
              setConnectionStatus('error');
              setConnectionError('Real-time connection failed. Notifications may be delayed.');
              break;
            case 'CLOSED':
              setConnectionStatus('disconnected');
              break;
            default:
              setConnectionStatus('connecting');
          }
        });

      channelRef.current = channel;

    } catch (error) {
      console.error('Failed to setup realtime subscription:', error);
      setConnectionStatus('error');
      if (isCorsError(error)) {
        setConnectionError('Real-time updates unavailable due to connection issues.');
      }
    }
  }, [user?.id, realtimeEnabled]);

  // Optimized notification handlers with minimal API calls
  const handleNewMessage = async (payload: any) => {
    try {
      const userInfo = await getUserInfo(payload.new.sender_id);
      
      const newNotification: Notification = {
        id: payload.new.id,
        type: 'message',
        read: payload.new.read,
        created_at: payload.new.created_at,
        user: userInfo,
        message: 'sent you a message',
        content: payload.new.content
      };

      addNotification(newNotification);
      
      if (!payload.new.read) {
        setUnreadCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error handling new message:', error);
    }
  };

  const handleNewMatch = async (payload: any) => {
    try {
      // Determine the other user ID
      const otherUserId = payload.new.user1_id === user?.id 
        ? payload.new.user2_id 
        : payload.new.user1_id;

      const userInfo = await getUserInfo(otherUserId);

      const newNotification: Notification = {
        id: payload.new.id,
        type: 'match',
        read: false,
        created_at: payload.new.created_at,
        user: userInfo,
        message: 'sent you a match request'
      };

      addNotification(newNotification);
      setUnreadCount(prev => prev + 1);
    } catch (error) {
      console.error('Error handling new match:', error);
    }
  };

  const handleNewInteraction = async (payload: any) => {
    try {
      if (payload.new.interaction_type === 'like') {
        const userInfo = await getUserInfo(payload.new.sender_id);

        const newNotification: Notification = {
          id: payload.new.id,
          type: 'like',
          read: false,
          created_at: payload.new.created_at,
          user: userInfo,
          message: 'liked your profile'
        };

        addNotification(newNotification);
      }
    } catch (error) {
      console.error('Error handling new interaction:', error);
    }
  };

  // Optimized fetch with parallel queries and caching
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setConnectionError(null);
      
      // Parallel fetch with Promise.allSettled for better performance
      const [likesResult, messagesResult, viewsResult, matchesResult] = await Promise.allSettled([
        // Likes
        supabase
          .from('profile_interactions')
          .select('id, interaction_type, created_at, sender_id')
          .eq('receiver_id', user.id)
          .eq('interaction_type', 'like')
          .order('created_at', { ascending: false })
          .limit(5),
        
        // Messages  
        supabase
          .from('messages')
          .select('id, content, read, created_at, sender_id')
          .eq('receiver_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10),
        
        // Views
        supabase
          .from('profile_views')
          .select('id, created_at, viewer_id')
          .eq('viewed_profile_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
        
        // Matches - optimized with single OR query
        supabase
          .from('matches')
          .select('id, created_at, user1_id, user2_id')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      // Extract successful results
      const likes = likesResult.status === 'fulfilled' && likesResult.value.data ? likesResult.value.data : [];
      const messages = messagesResult.status === 'fulfilled' && messagesResult.value.data ? messagesResult.value.data : [];
      const views = viewsResult.status === 'fulfilled' && viewsResult.value.data ? viewsResult.value.data : [];
      const matches = matchesResult.status === 'fulfilled' && matchesResult.value.data ? matchesResult.value.data : [];

      // Collect all unique user IDs
      const userIds = [
        ...likes.map(like => like.sender_id),
        ...messages.map(message => message.sender_id),
        ...views.map(view => view.viewer_id),
        ...matches.map(match => match.user1_id === user.id ? match.user2_id : match.user1_id)
      ].filter((id, index, arr) => arr.indexOf(id) === index && id);

      // Batch fetch profiles with caching
      const profiles = await debouncedProfileFetch(userIds);
      
      // Helper to get profile from fetched data
      const getProfile = (userId: string) => {
        return profiles.find(p => p.id === userId);
      };

      // Transform notifications efficiently
      const allNotifications = [
        ...likes.map(like => ({
          id: like.id,
          type: 'like' as const,
          read: true,
          created_at: like.created_at,
          user: {
            id: like.sender_id,
            name: getProfile(like.sender_id)?.name || getProfile(like.sender_id)?.full_name || 'Anonymous',
            image: getProfile(like.sender_id)?.images?.[0] || undefined
          },
          message: 'liked your profile'
        })),
        
        ...messages.map(message => ({
          id: message.id,
          type: 'message' as const,
          read: message.read,
          created_at: message.created_at,
          user: {
            id: message.sender_id,
            name: getProfile(message.sender_id)?.name || getProfile(message.sender_id)?.full_name || 'Anonymous',
            image: getProfile(message.sender_id)?.images?.[0] || undefined
          },
          message: 'sent you a message',
          content: message.content
        })),
        
        ...views.map(view => ({
          id: view.id,
          type: 'view' as const,
          read: true,
          created_at: view.created_at,
          user: {
            id: view.viewer_id,
            name: getProfile(view.viewer_id)?.name || getProfile(view.viewer_id)?.full_name || 'Anonymous',
            image: getProfile(view.viewer_id)?.images?.[0] || undefined
          },
          message: 'viewed your profile'
        })),
        
        ...matches.map(match => {
          const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
          const isNewMatchRequest = match.user2_id === user.id;
          
          return {
            id: match.id,
            type: 'match' as const,
            read: true,
            created_at: match.created_at,
            user: {
              id: otherUserId,
              name: getProfile(otherUserId)?.name || getProfile(otherUserId)?.full_name || 'Anonymous',
              image: getProfile(otherUserId)?.images?.[0] || undefined
            },
            message: isNewMatchRequest ? 'sent you a match request' : 'matched with you'
          };
        })
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(allNotifications);
      setUnreadCount(messages.filter(m => !m.read).length);

    } catch (error) {
      console.error('Error fetching notifications:', error);
      setConnectionStatus('error');
      if (isCorsError(error)) {
        setConnectionError('Unable to load notifications due to connection issues.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, debouncedProfileFetch]);

  // Setup realtime when user changes or realtime is toggled
  useEffect(() => {
    if (user && realtimeEnabled) {
      fetchNotifications();
      setupRealtimeSubscription();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setConnectionError(null);
      setConnectionStatus('disconnected');
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [user, realtimeEnabled, setupRealtimeSubscription, fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      setConnectionError(null);
      
      const notification = notifications.find(n => n.id === id);
      if (notification?.type === 'message') {
        await supabase
          .from('messages')
          .update({ read: true })
          .eq('id', id);
      }

      setNotifications(prev => 
        prev.map(n => 
          n.id === id ? { ...n, read: true } : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      if (isCorsError(error)) {
        setConnectionError('Unable to update notification due to connection issues.');
      }
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      setConnectionError(null);
      
      const unreadMessageIds = notifications
        .filter(n => n.type === 'message' && !n.read)
        .map(n => n.id);

      if (unreadMessageIds.length > 0) {
        await supabase
          .from('messages')
          .update({ read: true })
          .in('id', unreadMessageIds);
      }

      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      if (isCorsError(error)) {
        setConnectionError('Unable to update notifications due to connection issues.');
      }
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    setConnectionError(null);
    profileCacheRef.current.clear();
  };

  const addNotification = (notification: Notification) => {
    setNotifications(prev => {
      const exists = prev.some(n => n.id === notification.id);
      if (exists) return prev;
      return [notification, ...prev].slice(0, 50); // Limit to 50 notifications
    });

    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
    }
  };

  const toggleRealtime = () => {
    setRealtimeEnabled(prev => !prev);
  };

  const reconnect = () => {
    if (user) {
      setConnectionError(null);
      setupRealtimeSubscription();
    }
  };

  const value = {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    addNotification,
    isLoading,
    connectionError,
    connectionStatus,
    realtimeEnabled,
    toggleRealtime,
    reconnect
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};