/*
  # Add notifications table and functions
  
  1. New Tables
    - `notifications` - Stores user notifications for likes, messages, views, and matches
    
  2. New Functions
    - `create_notification` - Creates a notification record
    - `mark_notification_as_read` - Marks a notification as read
    - `get_user_notifications` - Gets all notifications for a user
    
  3. Security
    - Enable RLS on notifications table
    - Add policies for secure access
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text CHECK (type IN ('like', 'match', 'message', 'view')),
  from_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_user_id_is_read_idx ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON notifications(created_at);

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_type text,
  p_from_user_id uuid,
  p_content text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id uuid;
BEGIN
  -- Validate notification type
  IF p_type NOT IN ('like', 'match', 'message', 'view') THEN
    RAISE EXCEPTION 'Invalid notification type: %', p_type;
  END IF;
  
  -- Insert notification
  INSERT INTO notifications (
    user_id,
    type,
    from_user_id,
    content,
    is_read,
    created_at
  ) VALUES (
    p_user_id,
    p_type,
    p_from_user_id,
    p_content,
    false,
    now()
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Function to mark a notification as read
CREATE OR REPLACE FUNCTION mark_notification_as_read(
  p_notification_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notifications
  SET is_read = true
  WHERE id = p_notification_id
  AND user_id = auth.uid();
  
  RETURN FOUND;
END;
$$;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_as_read(
  p_user_id uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE notifications
  SET is_read = true
  WHERE user_id = p_user_id
  AND is_read = false
  RETURNING COUNT(*) INTO updated_count;
  
  RETURN updated_count;
END;
$$;

-- Function to get user notifications
CREATE OR REPLACE FUNCTION get_user_notifications(
  p_user_id uuid,
  p_limit integer DEFAULT 20,
  p_offset integer DEFAULT 0,
  p_unread_only boolean DEFAULT false
)
RETURNS TABLE (
  id uuid,
  type text,
  from_user_id uuid,
  from_user_name text,
  from_user_image text,
  content text,
  is_read boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.type,
    n.from_user_id,
    COALESCE(p.name, p.full_name, 'Anonymous') as from_user_name,
    CASE 
      WHEN p.images IS NOT NULL AND array_length(p.images, 1) > 0 
      THEN p.images[1]
      ELSE NULL
    END as from_user_image,
    n.content,
    n.is_read,
    n.created_at
  FROM notifications n
  JOIN profiles p ON n.from_user_id = p.id
  WHERE n.user_id = p_user_id
  AND (NOT p_unread_only OR n.is_read = false)
  ORDER BY n.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_notification(uuid, text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_notification_as_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_all_notifications_as_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_notifications(uuid, integer, integer, boolean) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION create_notification(uuid, text, uuid, text) IS 'Creates a notification for a user';
COMMENT ON FUNCTION mark_notification_as_read(uuid) IS 'Marks a notification as read';
COMMENT ON FUNCTION mark_all_notifications_as_read(uuid) IS 'Marks all notifications as read for a user';
COMMENT ON FUNCTION get_user_notifications(uuid, integer, integer, boolean) IS 'Gets notifications for a user with pagination';

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- Create trigger functions to automatically create notifications
CREATE OR REPLACE FUNCTION create_like_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.interaction_type = 'like' THEN
    PERFORM create_notification(
      NEW.receiver_id,
      'like',
      NEW.sender_id,
      NULL
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION create_message_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM create_notification(
    NEW.receiver_id,
    'message',
    NEW.sender_id,
    NEW.content
  );
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION create_view_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM create_notification(
    NEW.viewed_profile_id,
    'view',
    NEW.viewer_id,
    NULL
  );
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION create_match_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create notification for user1
  PERFORM create_notification(
    NEW.user1_id,
    'match',
    NEW.user2_id,
    NULL
  );
  
  -- Create notification for user2
  PERFORM create_notification(
    NEW.user2_id,
    'match',
    NEW.user1_id,
    NULL
  );
  
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER create_like_notification_trigger
  AFTER INSERT ON profile_interactions
  FOR EACH ROW
  EXECUTE FUNCTION create_like_notification();

CREATE TRIGGER create_message_notification_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION create_message_notification();

CREATE TRIGGER create_view_notification_trigger
  AFTER INSERT ON profile_views
  FOR EACH ROW
  EXECUTE FUNCTION create_view_notification();

CREATE TRIGGER create_match_notification_trigger
  AFTER INSERT ON matches
  FOR EACH ROW
  EXECUTE FUNCTION create_match_notification();

-- Grant execute permissions for trigger functions
GRANT EXECUTE ON FUNCTION create_like_notification() TO authenticated;
GRANT EXECUTE ON FUNCTION create_message_notification() TO authenticated;
GRANT EXECUTE ON FUNCTION create_view_notification() TO authenticated;
GRANT EXECUTE ON FUNCTION create_match_notification() TO authenticated;