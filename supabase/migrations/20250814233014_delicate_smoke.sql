/*
  # Fix Missing Database Functions
  
  This migration adds the missing database functions that are referenced in the application
  but may not have been properly deployed.
  
  ## Functions Added:
  1. get_conversation_messages - Get messages between two users
  2. Ensure get_conversation_list exists with correct signature
*/

-- Function to get conversation messages between two users
CREATE OR REPLACE FUNCTION get_conversation_messages(
  current_user_id uuid,
  other_user_id uuid,
  limit_count integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  sender_id uuid,
  receiver_id uuid,
  content text,
  read boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.sender_id,
    m.receiver_id,
    m.content,
    m.read,
    m.created_at
  FROM messages m
  WHERE (
    (m.sender_id = current_user_id AND m.receiver_id = other_user_id) OR
    (m.sender_id = other_user_id AND m.receiver_id = current_user_id)
  )
  ORDER BY m.created_at ASC
  LIMIT limit_count;
END;
$$;

-- Ensure get_conversation_list function exists (recreate if needed)
CREATE OR REPLACE FUNCTION get_conversation_list(current_user_id uuid)
RETURNS TABLE (
  other_user_id uuid,
  other_user_name text,
  other_user_images text[],
  last_message text,
  last_message_time timestamptz,
  unread_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH conversation_users AS (
    SELECT DISTINCT
      CASE 
        WHEN sender_id = current_user_id THEN receiver_id
        ELSE sender_id
      END as other_user_id
    FROM messages
    WHERE sender_id = current_user_id OR receiver_id = current_user_id
  ),
  last_messages AS (
    SELECT DISTINCT ON (
      CASE 
        WHEN sender_id = current_user_id THEN receiver_id
        ELSE sender_id
      END
    )
      CASE 
        WHEN sender_id = current_user_id THEN receiver_id
        ELSE sender_id
      END as other_user_id,
      content as last_message,
      created_at as last_message_time
    FROM messages
    WHERE sender_id = current_user_id OR receiver_id = current_user_id
    ORDER BY 
      CASE 
        WHEN sender_id = current_user_id THEN receiver_id
        ELSE sender_id
      END,
      created_at DESC
  ),
  unread_counts AS (
    SELECT 
      sender_id as other_user_id,
      COUNT(*) as unread_count
    FROM messages
    WHERE receiver_id = current_user_id AND read = false
    GROUP BY sender_id
  )
  SELECT 
    cu.other_user_id,
    COALESCE(p.name, p.full_name, 'Unknown') as other_user_name,
    p.images as other_user_images,
    lm.last_message,
    lm.last_message_time,
    COALESCE(uc.unread_count, 0) as unread_count
  FROM conversation_users cu
  LEFT JOIN profiles p ON cu.other_user_id = p.id
  LEFT JOIN last_messages lm ON cu.other_user_id = lm.other_user_id
  LEFT JOIN unread_counts uc ON cu.other_user_id = uc.other_user_id
  ORDER BY lm.last_message_time DESC NULLS LAST;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_conversation_messages(uuid, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversation_list(uuid) TO authenticated;