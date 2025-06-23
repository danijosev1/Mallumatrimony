import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface ProfileInteraction {
  id: string;
  sender_id: string;
  receiver_id: string;
  interaction_type: 'like' | 'pass' | 'super_like';
  created_at: string;
}

interface UseRealtimeInteractionsProps {
  onNewLike?: (interaction: ProfileInteraction) => void;
  onNewInteraction?: (interaction: ProfileInteraction) => void;
}

export function useRealtimeInteractions({ 
  onNewLike, 
  onNewInteraction 
}: UseRealtimeInteractionsProps = {}) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;

    // Create realtime subscription for profile interactions
    const channel = supabase
      .channel('interactions_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'profile_interactions',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          const newInteraction = payload.new as ProfileInteraction;
          console.log('💝 Realtime: New interaction received:', newInteraction);
          
          onNewInteraction?.(newInteraction);
          
          // Specifically handle likes
          if (newInteraction.interaction_type === 'like') {
            onNewLike?.(newInteraction);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Interactions realtime subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    subscriptionRef.current = channel;

    return () => {
      console.log('🔌 Cleaning up interactions realtime subscription');
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [user, onNewLike, onNewInteraction]);

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