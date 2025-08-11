// Instead of useRealtimeInteractions, use this approach:

import { useEffect } from 'react';
import { useNotifications } from '../context/NotificationContext';

interface UseInteractionListenerProps {
  onNewLike?: (notification: any) => void;
  onNewInteraction?: (notification: any) => void;
}

// Lightweight hook that listens to NotificationContext changes
export function useInteractionListener({ 
  onNewLike, 
  onNewInteraction 
}: UseInteractionListenerProps = {}) {
  const { notifications, connectionStatus } = useNotifications();

  // Listen for new like notifications
  useEffect(() => {
    if (!onNewLike) return;

    // Get the latest like notification
    const latestLike = notifications
      .filter(n => n.type === 'like')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    if (latestLike) {
      // Convert notification back to interaction format if needed
      const interaction = {
        id: latestLike.id,
        sender_id: latestLike.user.id,
        receiver_id: 'current_user', // You have the current user context
        interaction_type: 'like' as const,
        created_at: latestLike.created_at
      };
      
      onNewLike(interaction);
    }
  }, [notifications, onNewLike]);

  // Listen for any new interaction notifications
  useEffect(() => {
    if (!onNewInteraction) return;

    const latestInteraction = notifications
      .filter(n => ['like', 'view'].includes(n.type))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    if (latestInteraction) {
      const interaction = {
        id: latestInteraction.id,
        sender_id: latestInteraction.user.id,
        receiver_id: 'current_user',
        interaction_type: latestInteraction.type === 'like' ? 'like' : 'view',
        created_at: latestInteraction.created_at
      };
      
      onNewInteraction(interaction);
    }
  }, [notifications, onNewInteraction]);

  return {
    isConnected: connectionStatus === 'connected',
    connectionStatus,
    // No disconnect/reconnect needed - handled by NotificationContext
  };
}

// Example usage in components:
/*
// Replace this:
const { isConnected } = useRealtimeInteractions({
  onNewLike: (interaction) => {
    console.log('New like!', interaction);
  }
});

// With this:
const { isConnected } = useInteractionListener({
  onNewLike: (interaction) => {
    console.log('New like!', interaction);
  }
});
*/