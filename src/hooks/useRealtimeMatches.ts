import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

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
  enabled?: boolean;
}

export function useRealtimeMatches({ 
  onNewMatch, 
  onMatchUpdate,
  enabled = true 
}: UseRealtimeMatchesProps = {}) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<any>(null);

  // Memoize callbacks to prevent unnecessary re-subscriptions
  const handleNewMatch = useCallback((match: Match) => {
    console.log('🎉 Realtime: New match:', match);
    onNewMatch?.(match);
  }, [onNewMatch]);

  const handleMatchUpdate = useCallback((match: Match) => {
    console.log('🔄 Realtime: Match updated:', match);
    onMatchUpdate?.(match);
  }, [onMatchUpdate]);

  useEffect(() => {
    // Don't subscribe if disabled or no user
    if (!user || !enabled) {
      setIsConnected(false);
      return;
    }

    // Cleanup previous subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    console.log('🔌 Setting up single optimized matches subscription for user:', user.id);

    // Single channel with multiple event listeners
    const channel = supabase
      .channel(`user_matches_${user.id}_${Date.now()}`) // Unique channel name
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events
          schema: 'public',
          table: 'matches',
          // Single filter for both user positions
          filter: `or(user1_id.eq.${user.id},user2_id.eq.${user.id})`
        },
        (payload) => {
          const match = payload.new as Match;
          
          switch (payload.eventType) {
            case 'INSERT':
              handleNewMatch(match);
              break;
            case 'UPDATE':
              handleMatchUpdate(match);
              break;
            default:
              console.log('📝 Other match event:', payload.eventType, match);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Matches subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    channelRef.current = channel;

    return () => {
      console.log('🔌 Cleaning up matches subscription');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      setIsConnected(false);
    };
  }, [user?.id, enabled, handleNewMatch, handleMatchUpdate]);

  const disconnect = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      setIsConnected(false);
    }
  }, []);

  return {
    isConnected,
    disconnect
  };
}