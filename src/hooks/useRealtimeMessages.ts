import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

interface UseSmartMessagesProps {
  conversationId?: string; // If provided, creates conversation-specific subscription
  onNewMessage?: (message: Message) => void;
  onMessageRead?: (messageId: string) => void;
  enabled?: boolean;
}

export function useSmartMessages({ 
  conversationId, 
  onNewMessage, 
  onMessageRead,
  enabled = true
}: UseSmartMessagesProps = {}) {
  const { user } = useAuth();
  const { notifications, connectionStatus: notificationConnectionStatus } = useNotifications();
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const channelRef = useRef<any>(null);

  // Memoize callbacks
  const handleNewMessage = useCallback((message: Message) => {
    onNewMessage?.(message);
  }, [onNewMessage]);

  const handleMessageRead = useCallback((messageId: string) => {
    onMessageRead?.(messageId);
  }, [onMessageRead]);

  // Use NotificationContext for general message notifications
  useEffect(() => {
    if (!conversationId && onNewMessage) {
      // Listen to notifications context for general message updates
      const messageNotifications = notifications.filter(n => n.type === 'message');
      const latestMessage = messageNotifications[0]; // Most recent
      
      if (latestMessage) {
        // Convert notification to message format
        const message: Message = {
          id: latestMessage.id,
          sender_id: latestMessage.user.id,
          receiver_id: user?.id || '',
          content: latestMessage.content || '',
          read: latestMessage.read,
          created_at: latestMessage.created_at
        };
        
        handleNewMessage(message);
      }
    }
  }, [notifications, conversationId, onNewMessage, handleNewMessage, user?.id]);

  // Create conversation-specific subscription only when needed
  useEffect(() => {
    // Only create specific subscription for:
    // 1. Conversation-specific messages
    // 2. Read receipt handling
    // 3. When NotificationContext isn't sufficient
    if (!user || !enabled || (!conversationId && !onMessageRead)) {
      // Use NotificationContext connection status for general cases
      setIsConnected(notificationConnectionStatus === 'connected');
      setConnectionStatus(notificationConnectionStatus);
      return;
    }

    // Cleanup previous subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    console.log('🔌 Setting up conversation-specific messages subscription:', conversationId);
    setConnectionStatus('connecting');

    try {
      // Highly specific filter for conversation
      const conversationFilter = `or(and(sender_id.eq.${conversationId},receiver_id.eq.${user.id}),and(sender_id.eq.${user.id},receiver_id.eq.${conversationId}))`;

      const channel = supabase
        .channel(`conversation_${conversationId}_${user.id}_${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: conversationFilter
          },
          (payload) => {
            const message = payload.new as Message;
            
            switch (payload.eventType) {
              case 'INSERT':
                console.log('📨 Conversation message:', message);
                handleNewMessage(message);
                break;
                
              case 'UPDATE':
                if (message.read && onMessageRead) {
                  console.log('✅ Conversation message read:', message.id);
                  handleMessageRead(message.id);
                }
                break;
            }
          }
        )
        .subscribe((status) => {
          console.log('📡 Conversation subscription status:', status);
          
          switch (status) {
            case 'SUBSCRIBED':
              setIsConnected(true);
              setConnectionStatus('connected');
              break;
            case 'CHANNEL_ERROR':
            case 'TIMED_OUT':
              setIsConnected(false);
              setConnectionStatus('error');
              break;
            case 'CLOSED':
              setIsConnected(false);
              setConnectionStatus('disconnected');
              break;
            default:
              setConnectionStatus('connecting');
          }
        });

      channelRef.current = channel;

    } catch (error) {
      console.error('Failed to setup conversation subscription:', error);
      setConnectionStatus('error');
      setIsConnected(false);
    }

    return () => {
      console.log('🔌 Cleaning up conversation subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, conversationId, enabled, onMessageRead, handleNewMessage, handleMessageRead, notificationConnectionStatus]);

  const disconnect = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      setIsConnected(false);
      setConnectionStatus('disconnected');
    }
  }, []);

  return {
    isConnected,
    connectionStatus,
    disconnect
  };
}

// Usage examples:
/*
// For general message notifications (uses NotificationContext):
const { isConnected } = useSmartMessages({
  onNewMessage: (message) => {
    console.log('New message anywhere:', message);
  }
});

// For conversation-specific features (creates dedicated subscription):
const { isConnected } = useSmartMessages({
  conversationId: 'user123',
  onNewMessage: (message) => {
    console.log('New message in conversation:', message);
  },
  onMessageRead: (messageId) => {
    console.log('Message read in conversation:', messageId);
  }
});
*/