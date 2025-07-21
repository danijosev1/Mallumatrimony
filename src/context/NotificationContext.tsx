import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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

  useEffect(() => {
    if (user) {
      fetchNotifications();
      setupRealtimeSubscription();
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setConnectionError(null);
    }
  }, [user]);

  const setupRealtimeSubscription = () => {
    if (!user) return;

    try {
      const channel = supabase
        .channel('notifications_channel')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'profile_interactions',
          filter: `receiver_id=eq.${user.id}`
        }, handleNewInteraction)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        }, handleNewMessage)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'profile_views',
          filter: `viewed_profile_id=eq.${user.id}`
        }, handleProfileView)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `user1_id=eq.${user.id}`
        }, handleNewMatch)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `user2_id=eq.${user.id}`
        }, handleNewMatch)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.error('Failed to setup realtime subscription:', error);
      if (isCorsError(error)) {
        setConnectionError('Real-time updates unavailable due to connection issues.');
      }
    }
  };

  const handleNewInteraction = async (payload: any) => {
    try {
      if (payload.new.interaction_type === 'like') {
        // Fetch user details
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, name, full_name, images')
          .eq('id', payload.new.sender_id)
          .single();

        if (profile) {
          const newNotification: Notification = {
            id: payload.new.id,
            type: 'like',
            read: false,
            created_at: payload.new.created_at,
            user: {
              id: profile.id,
              name: profile.name || profile.full_name || 'Anonymous',
              image: profile.images?.[0] || undefined
            },
            message: 'liked your profile'
          };

          addNotification(newNotification);
        }
      }
    } catch (error) {
      console.error('Error handling new interaction:', error);
    }
  };

  const handleNewMessage = async (payload: any) => {
    try {
      // Fetch user details
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, name, full_name, images')
        .eq('id', payload.new.sender_id)
        .single();

      if (profile) {
        const newNotification: Notification = {
          id: payload.new.id,
          type: 'message',
          read: payload.new.read,
          created_at: payload.new.created_at,
          user: {
            id: profile.id,
            name: profile.name || profile.full_name || 'Anonymous',
            image: profile.images?.[0] || undefined
          },
          message: 'sent you a message',
          content: payload.new.content
        };

        addNotification(newNotification);
        if (!payload.new.read) {
          setUnreadCount(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error('Error handling new message:', error);
    }
  };

  const handleProfileView = async (payload: any) => {
    try {
      // Fetch user details
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, name, full_name, images')
        .eq('id', payload.new.viewer_id)
        .single();

      if (profile) {
        const newNotification: Notification = {
          id: payload.new.id,
          type: 'view',
          read: true, // Views are always considered read
          created_at: payload.new.created_at,
          user: {
            id: profile.id,
            name: profile.name || profile.full_name || 'Anonymous',
            image: profile.images?.[0] || undefined
          },
          message: 'viewed your profile'
        };

        addNotification(newNotification);
      }
    } catch (error) {
      console.error('Error handling profile view:', error);
    }
  };

  const handleNewMatch = async (payload: any) => {
    try {
      // Determine the other user ID
      const otherUserId = payload.new.user1_id === user?.id 
        ? payload.new.user2_id 
        : payload.new.user1_id;

      // Fetch user details
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, name, full_name, images')
        .eq('id', otherUserId)
        .single();

      if (profile) {
        const newNotification: Notification = {
          id: payload.new.id,
          type: 'match',
          read: false,
          created_at: payload.new.created_at,
          user: {
            id: profile.id,
            name: profile.name || profile.full_name || 'Anonymous',
            image: profile.images?.[0] || undefined
          },
          message: 'matched with you'
        };

        addNotification(newNotification);
        setUnreadCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error handling new match:', error);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setConnectionError(null);
      
      // Fetch recent likes
      const { data: likes, error: likesError } = await supabase
        .from('profile_interactions')
        .select('id, interaction_type, created_at, sender_id')
        .eq('receiver_id', user.id)
        .eq('interaction_type', 'like')
        .order('created_at', { ascending: false })
        .limit(5);

      if (likesError) {
        if (isCorsError(likesError)) {
          setConnectionError('Unable to load notifications due to connection issues.');
          return;
        }
        throw likesError;
      }

      // Fetch recent messages
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('id, content, read, created_at, sender_id')
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (messagesError) {
        if (isCorsError(messagesError)) {
          setConnectionError('Unable to load notifications due to connection issues.');
          return;
        }
        throw messagesError;
      }

      // Fetch recent profile views
      const { data: views, error: viewsError } = await supabase
        .from('profile_views')
        .select('id, created_at, viewer_id')
        .eq('viewed_profile_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (viewsError) {
        if (isCorsError(viewsError)) {
          setConnectionError('Unable to load notifications due to connection issues.');
          return;
        }
        throw viewsError;
      }

      // Fetch recent matches - simplified query
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select('id, created_at, user1_id, user2_id')
        .eq('user1_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (matchesError) {
        if (isCorsError(matchesError)) {
          setConnectionError('Unable to load notifications due to connection issues.');
          return;
        }
        throw matchesError;
      }

      const { data: matches2, error: matchesError2 } = await supabase
        .from('matches')
        .select('id, created_at, user1_id, user2_id')
        .eq('user2_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (matchesError2) {
        if (isCorsError(matchesError2)) {
          setConnectionError('Unable to load match profiles due to connection issues.');
        } else {
          throw matchesError2;
        }
      }

      const allMatches = [...(matches || []), ...(matches2 || [])];

      // Get other user IDs from matches
      const otherUserIds = allMatches?.map(match => 
        match.user1_id === user.id ? match.user2_id : match.user1_id
      ).filter(Boolean) || [];

      // Get all unique user IDs from likes, messages, views, and matches
      const allUserIds = [
        ...(likes?.map(like => like.sender_id) || []),
        ...(messages?.map(message => message.sender_id) || []),
        ...(views?.map(view => view.viewer_id) || []),
        ...otherUserIds
      ].filter((id, index, arr) => arr.indexOf(id) === index);

      // Fetch profiles for other users if we have any matches
      let matchProfiles: any[] = [];
      let allProfiles: any[] = [];
      if (allUserIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, full_name, images')
          .in('id', allUserIds);

        if (profilesError) {
          if (isCorsError(profilesError)) {
            setConnectionError('Unable to load profiles due to connection issues.');
          } else {
            throw profilesError;
          }
        } else {
          allProfiles = profiles || [];
          matchProfiles = allProfiles.filter(profile => otherUserIds.includes(profile.id));
        }
      }

      // Transform likes
      const likeNotifications = likes?.map(like => ({
        id: like.id,
        type: 'like' as const,
        read: true, // Likes are always considered read
        created_at: like.created_at,
        user: {
          id: like.sender_id,
          name: allProfiles.find(p => p.id === like.sender_id)?.name || 
                allProfiles.find(p => p.id === like.sender_id)?.full_name || 'Anonymous',
          image: allProfiles.find(p => p.id === like.sender_id)?.images?.[0] || undefined
        },
        message: 'liked your profile'
      })) || [];

      // Transform messages
      const messageNotifications = messages?.map(message => ({
        id: message.id,
        type: 'message' as const,
        read: message.read,
        created_at: message.created_at,
        user: {
          id: message.sender_id,
          name: allProfiles.find(p => p.id === message.sender_id)?.name || 
                allProfiles.find(p => p.id === message.sender_id)?.full_name || 'Anonymous',
          image: allProfiles.find(p => p.id === message.sender_id)?.images?.[0] || undefined
        },
        message: 'sent you a message',
        content: message.content
      })) || [];

      // Transform views
      const viewNotifications = views?.map(view => ({
        id: view.id,
        type: 'view' as const,
        read: true, // Views are always considered read
        created_at: view.created_at,
        user: {
          id: view.viewer_id,
          name: allProfiles.find(p => p.id === view.viewer_id)?.name || 
                allProfiles.find(p => p.id === view.viewer_id)?.full_name || 'Anonymous',
          image: allProfiles.find(p => p.id === view.viewer_id)?.images?.[0] || undefined
        },
        message: 'viewed your profile'
      })) || [];

      // Transform matches with fetched profiles
      const matchNotifications = allMatches?.map(match => {
        const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
        const otherUserProfile = allProfiles.find(profile => profile.id === otherUserId);
        
        return {
          id: match.id,
          type: 'match' as const,
          read: true, // Matches are always considered read for now
          created_at: match.created_at,
          user: {
            id: otherUserId,
            name: otherUserProfile?.name || otherUserProfile?.full_name || 'Anonymous',
            image: otherUserProfile?.images?.[0] || undefined
          },
          message: 'matched with you'
        };
      }) || [];

      // Combine and sort all notifications
      const allNotifications = [
        ...likeNotifications,
        ...messageNotifications,
        ...viewNotifications,
        ...matchNotifications
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(allNotifications);
      setUnreadCount(messageNotifications.filter(n => !n.read).length);

    } catch (error) {
      console.error('Error fetching notifications:', error);
      if (isCorsError(error)) {
        setConnectionError('Unable to load notifications due to connection issues.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      setConnectionError(null);
      
      // Check if it's a message notification
      const notification = notifications.find(n => n.id === id);
      if (notification?.type === 'message') {
        // Update in database
        await supabase
          .from('messages')
          .update({ read: true })
          .eq('id', id);
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === id ? { ...n, read: true } : n
        )
      );
      
      // Recalculate unread count
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
      
      // Get all unread message IDs
      const unreadMessageIds = notifications
        .filter(n => n.type === 'message' && !n.read)
        .map(n => n.id);

      if (unreadMessageIds.length > 0) {
        // Update in database
        await supabase
          .from('messages')
          .update({ read: true })
          .in('id', unreadMessageIds);
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      
      // Reset unread count
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
  };

  const addNotification = (notification: Notification) => {
    // Check if notification already exists
    setNotifications(prev => {
      const exists = prev.some(n => n.id === notification.id);
      if (exists) return prev;
      return [notification, ...prev];
    });

    // Update unread count if needed
    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
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
    connectionError
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};