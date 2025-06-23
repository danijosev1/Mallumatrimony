import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

interface UseRealtimeMessagesProps {
  conversationId?: string;
  onNewMessage?: (message: Message) => void;
  onMessageRead?: (messageId: string) => void;
}

export function useRealtimeMessages({ 
  conversationId, 
  onNewMessage, 
  onMessageRead 
}: UseRealtimeMessagesProps = {}) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;

    // Create realtime subscription for messages
    const channel = supabase
      .channel('messages_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          console.log('📨 Realtime: New message received:', newMessage);
          
          // Only trigger callback if it's for the current conversation or no specific conversation
          if (!conversationId || newMessage.sender_id === conversationId) {
            onNewMessage?.(newMessage);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${user.id}`
        },
        (payload) => {
          const sentMessage = payload.new as Message;
          console.log('📤 Realtime: Message sent confirmation:', sentMessage);
          
          // Handle sent message confirmation if needed
          if (!conversationId || sentMessage.receiver_id === conversationId) {
            onNewMessage?.(sentMessage);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${user.id}`
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          console.log('✅ Realtime: Message read receipt:', updatedMessage);
          
          // Handle read receipts
          if (updatedMessage.read && onMessageRead) {
            onMessageRead(updatedMessage.id);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    subscriptionRef.current = channel;

    return () => {
      console.log('🔌 Cleaning up realtime subscription');
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [user, conversationId, onNewMessage, onMessageRead]);

  return {
    isConnected,
    disconnect: () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
        setIsConnected(false);
      }
    }
  };
}