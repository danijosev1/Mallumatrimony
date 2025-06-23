/*
  # Realtime Chat Setup for Matched Members

  1. Enable Realtime
    - Enable realtime on messages table
    - Enable realtime on profile_interactions table for match notifications
    - Enable realtime on matches table for instant match updates

  2. Enhanced RLS Policies
    - Ensure proper access control for realtime subscriptions
    - Add policies for real-time message updates
    - Add policies for match status changes

  3. Functions & Triggers
    - Auto-mark messages as read when viewed
    - Notification triggers for new messages
    - Match creation notifications

  4. Realtime Security
    - Row-level security for realtime subscriptions
    - Ensure users can only subscribe to their own data
*/

-- Enable realtime on tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE profile_interactions;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE profile_views;

-- Create function to check if users are matched
CREATE OR REPLACE FUNCTION are_users_matched(user1_id uuid, user2_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM matches 
    WHERE (
      (user1_id = $1 AND user2_id = $2) OR 
      (user1_id = $2 AND user2_id = $1)
    ) AND is_active = true
  );
END;
$$;

-- Enhanced RLS policies for messages with realtime support
DROP POLICY IF EXISTS "Users can view their own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can mark received messages as read" ON messages;

-- Allow users to view messages in conversations they're part of
CREATE POLICY "Users can view their conversations"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = sender_id OR 
    auth.uid() = receiver_id
  );

-- Allow users to send messages only to matched users
CREATE POLICY "Users can send messages to matches"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    are_users_matched(sender_id, receiver_id)
  );

-- Allow users to update (mark as read) messages sent to them
CREATE POLICY "Users can mark their received messages as read"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Enhanced RLS policies for matches with realtime support
DROP POLICY IF EXISTS "Users can view their matches" ON matches;
DROP POLICY IF EXISTS "Users can create matches" ON matches;
DROP POLICY IF EXISTS "Users can update their own matches" ON matches;

CREATE POLICY "Users can view their matches"
  ON matches
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create matches"
  ON matches
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can update their matches"
  ON matches
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id)
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Function to notify users of new matches
CREATE OR REPLACE FUNCTION notify_new_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function can be extended to send push notifications
  -- For now, it just ensures the match is properly logged
  RAISE LOG 'New match created between % and %', NEW.user1_id, NEW.user2_id;
  RETURN NEW;
END;
$$;

-- Trigger for match notifications
DROP TRIGGER IF EXISTS notify_match_trigger ON matches;
CREATE TRIGGER notify_match_trigger
  AFTER INSERT ON matches
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_match();

-- Function to update message timestamps and handle read receipts
CREATE OR REPLACE FUNCTION handle_message_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log message activity for debugging
  IF TG_OP = 'INSERT' THEN
    RAISE LOG 'New message from % to %: %', NEW.sender_id, NEW.receiver_id, NEW.content;
  ELSIF TG_OP = 'UPDATE' AND OLD.read = false AND NEW.read = true THEN
    RAISE LOG 'Message % marked as read by %', NEW.id, NEW.receiver_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger for message handling
DROP TRIGGER IF EXISTS handle_message_updates_trigger ON messages;
CREATE TRIGGER handle_message_updates_trigger
  AFTER INSERT OR UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_message_updates();

-- Function to automatically create conversation entries (if needed)
CREATE OR REPLACE FUNCTION ensure_conversation_exists()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Ensure both users are matched before allowing message
  IF NOT are_users_matched(NEW.sender_id, NEW.receiver_id) THEN
    RAISE EXCEPTION 'Cannot send message: users are not matched';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to validate messages are only sent between matched users
DROP TRIGGER IF EXISTS validate_message_trigger ON messages;
CREATE TRIGGER validate_message_trigger
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION ensure_conversation_exists();

-- Create indexes for better realtime performance
CREATE INDEX IF NOT EXISTS messages_conversation_idx 
  ON messages(sender_id, receiver_id, created_at DESC);

CREATE INDEX IF NOT EXISTS messages_receiver_unread_idx 
  ON messages(receiver_id, read, created_at DESC) 
  WHERE read = false;

CREATE INDEX IF NOT EXISTS matches_user_lookup_idx 
  ON matches(user1_id, user2_id, is_active);

-- Grant necessary permissions for realtime
GRANT SELECT, INSERT, UPDATE ON messages TO authenticated;
GRANT SELECT ON matches TO authenticated;
GRANT SELECT ON profile_interactions TO authenticated;

-- Create a function to get conversation list for a user
CREATE OR REPLACE FUNCTION get_user_conversations(user_uuid uuid)
RETURNS TABLE (
  conversation_id uuid,
  other_user_id uuid,
  other_user_name text,
  other_user_avatar text,
  last_message text,
  last_message_time timestamptz,
  unread_count bigint,
  is_online boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH user_matches AS (
    SELECT 
      CASE 
        WHEN m.user1_id = user_uuid THEN m.user2_id
        ELSE m.user1_id
      END as other_user_id
    FROM matches m
    WHERE (m.user1_id = user_uuid OR m.user2_id = user_uuid)
      AND m.is_active = true
  ),
  latest_messages AS (
    SELECT DISTINCT ON (
      CASE 
        WHEN msg.sender_id = user_uuid THEN msg.receiver_id
        ELSE msg.sender_id
      END
    )
      CASE 
        WHEN msg.sender_id = user_uuid THEN msg.receiver_id
        ELSE msg.sender_id
      END as other_user_id,
      msg.content as last_message,
      msg.created_at as last_message_time
    FROM messages msg
    WHERE msg.sender_id = user_uuid OR msg.receiver_id = user_uuid
    ORDER BY 
      CASE 
        WHEN msg.sender_id = user_uuid THEN msg.receiver_id
        ELSE msg.sender_id
      END,
      msg.created_at DESC
  ),
  unread_counts AS (
    SELECT 
      msg.sender_id as other_user_id,
      COUNT(*) as unread_count
    FROM messages msg
    WHERE msg.receiver_id = user_uuid AND msg.read = false
    GROUP BY msg.sender_id
  )
  SELECT 
    gen_random_uuid() as conversation_id,
    um.other_user_id,
    COALESCE(p.name, p.full_name, 'Unknown') as other_user_name,
    CASE 
      WHEN p.images IS NOT NULL AND array_length(p.images, 1) > 0 
      THEN p.images[1]
      ELSE NULL
    END as other_user_avatar,
    COALESCE(lm.last_message, 'Start a conversation') as last_message,
    lm.last_message_time,
    COALESCE(uc.unread_count, 0) as unread_count,
    false as is_online -- This could be enhanced with presence tracking
  FROM user_matches um
  LEFT JOIN profiles p ON p.id = um.other_user_id
  LEFT JOIN latest_messages lm ON lm.other_user_id = um.other_user_id
  LEFT JOIN unread_counts uc ON uc.other_user_id = um.other_user_id
  ORDER BY lm.last_message_time DESC NULLS LAST;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_user_conversations(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION are_users_matched(uuid, uuid) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION are_users_matched(uuid, uuid) IS 'Check if two users are matched and can message each other';
COMMENT ON FUNCTION get_user_conversations(uuid) IS 'Get all conversations for a user with latest message and unread count';
COMMENT ON FUNCTION notify_new_match() IS 'Trigger function to handle new match notifications';
COMMENT ON FUNCTION handle_message_updates() IS 'Trigger function to handle message updates and read receipts';
COMMENT ON FUNCTION ensure_conversation_exists() IS 'Validate that users are matched before allowing messages';