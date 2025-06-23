import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  is_active: boolean;
}

interface UseRealtimeMatchesProps {
  onNewMatch?: (match: Match) => void;
  onMatchUpdate?: (match: Match) => void;
}

export function useRealtimeMatches({ 
  onNewMatch, 
  onMatchUpdate 
}: UseRealtimeMatchesProps = {}) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!user) return;

    // Create realtime subscription for matches
    const channel = supabase
      .channel('matches_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `user1_id=eq.${user.id}`
        },
        (payload) => {
          const newMatch = payload.new as Match;
          console.log('🎉 Realtime: New match (as user1):', newMatch);
          onNewMatch?.(newMatch);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `user2_id=eq.${user.id}`
        },
        (payload) => {
          const newMatch = payload.new as Match;
          console.log('🎉 Realtime: New match (as user2):', newMatch);
          onNewMatch?.(newMatch);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches'
        },
        (payload) => {
          const updatedMatch = payload.new as Match;
          
          // Only handle updates for matches involving the current user
          if (updatedMatch.user1_id === user.id || updatedMatch.user2_id === user.id) {
            console.log('🔄 Realtime: Match updated:', updatedMatch);
            onMatchUpdate?.(updatedMatch);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Matches realtime subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    subscriptionRef.current = channel;

    return () => {
      console.log('🔌 Cleaning up matches realtime subscription');
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current);
      }
    };
  }, [user, onNewMatch, onMatchUpdate]);

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