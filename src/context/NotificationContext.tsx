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
      
      // Fetch recent likes with error handling
      let likes = [];
      try {
        const { data, error: likesError } = await supabase
          .from('profile_interactions')
          .select('id, interaction_type, created_at, sender_id')
          .eq('receiver_id', user.id)
          .eq('interaction_type', 'like')
          .order('created_at', { ascending: false })
          .limit(5);
        if (!likesError) likes = data || [];
      } catch (e) {
        console.log('Profile interactions table not available');
      }

      // Fetch recent unread messages with error handling
      let messages = [];
      try {
        const { data, error: messagesError } = await supabase
          .from('messages')
          .select('id, content, read, created_at, sender_id')
          .eq('receiver_id', user.id)
          .eq('read', false)
          .order('created_at', { ascending: false })
          .limit(5);
        if (!messagesError) messages = data || [];
      } catch (e) {
        console.log('Messages table not available');
      }

      // Fetch recent profile views with error handling
      let views = [];
      try {
        const { data, error: viewsError } = await supabase
          .from('profile_views')
          .select('id, created_at, viewer_id')
          .eq('viewed_profile_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);
        if (!viewsError) views = data || [];
      } catch (e) {
        console.log('Profile views table not available');
      }

      // Fetch recent matches with error handling
      let recentMatches = [];
      try {
        const { data: matchData, error: matchesError } = await supabase
          .rpc('get_user_matches', { user_uuid: user.id });
        if (!matchesError) recentMatches = matchData?.slice(0, 5) || [];
      } catch (e) {
        console.log('Matches function not available, using fallback');
        // Fallback to direct table query
        try {
          const { data: matches1 } = await supabase
            .from('matches')
            .select('id, user2_id, created_at')
            .eq('user1_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3);
          const { data: matches2 } = await supabase
            .from('matches')
            .select('id, user1_id, created_at')
            .eq('user2_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3);
          recentMatches = [
            ...(matches1 || []).map(m => ({ match_id: m.id, other_user_id: m.user2_id, match_created_at: m.created_at })),
            ...(matches2 || []).map(m => ({ match_id: m.id, other_user_id: m.user1_id, match_created_at: m.created_at }))
          ];
        } catch (fallbackError) {
          console.log('Matches table not available');
        }
      }
      
      // Get all user IDs for profile fetching
      const allUserIds = [
        ...(likes?.map(like => like.sender_id) || []),
        ...(messages?.map(message => message.sender_id) || []),
        ...(views?.map(view => view.viewer_id) || []),
        ...recentMatches.map(match => match.other_user_id)
      ].filter((id, index, arr) => arr.indexOf(id) === index);

      // Fetch profiles for all users if we have any
      let allProfiles: any[] = [];
      if (allUserIds.length > 0) {
        try {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, name, full_name, images')
            .in('id', allUserIds);
          if (!profilesError) allProfiles = profiles || [];
        } catch (e) {
          console.log('Profiles table not available');
        }
      }
      
      // Transform notifications with profile data
      const likeNotifications = likes?.map(like => ({
        id: like.id,
        type: 'like' as const,
        read: true,
        created_at: like.created_at,
        user: {
          id: like.sender_id,
          name: allProfiles.find(p => p.id === like.sender_id)?.name || 
                allProfiles.find(p => p.id === like.sender_id)?.full_name || 'Anonymous',
          image: allProfiles.find(p => p.id === like.sender_id)?.images?.[0] || undefined
        },
        message: 'liked your profile'
      })) || [];

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

      const viewNotifications = views?.map(view => ({
        id: view.id,
        type: 'view' as const,
        read: true,
        created_at: view.created_at,
        user: {
          id: view.viewer_id,
          name: allProfiles.find(p => p.id === view.viewer_id)?.name || 
                allProfiles.find(p => p.id === view.viewer_id)?.full_name || 'Anonymous',
          image: allProfiles.find(p => p.id === view.viewer_id)?.images?.[0] || undefined
        },
        message: 'viewed your profile'
      })) || [];

      const matchNotifications = recentMatches?.map(match => ({
        id: match.match_id,
        type: 'match' as const,
        read: true,
        created_at: match.match_created_at,
        user: {
          id: match.other_user_id,
          name: match.other_user_name || 'Anonymous',
          image: match.other_user_images?.[0] || undefined
        },
        message: 'matched with you'
      })) || [];

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