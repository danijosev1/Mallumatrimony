-- Fix ambiguous column reference errors by properly managing function dependencies

-- Step 1: Drop all dependent policies first
DROP POLICY IF EXISTS "Users can send messages to matches" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can view their conversations" ON messages;
DROP POLICY IF EXISTS "Users can mark their received messages as read" ON messages;

-- Step 2: Drop all triggers that depend on functions
DROP TRIGGER IF EXISTS validate_message_trigger ON messages;
DROP TRIGGER IF EXISTS handle_message_updates_trigger ON messages;
DROP TRIGGER IF EXISTS create_match_trigger ON profile_interactions;
DROP TRIGGER IF EXISTS notify_match_trigger ON matches;

-- Step 3: Now we can safely drop the functions
DROP FUNCTION IF EXISTS are_users_matched(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS ensure_conversation_exists() CASCADE;
DROP FUNCTION IF EXISTS create_match_on_mutual_like() CASCADE;
DROP FUNCTION IF EXISTS handle_message_updates() CASCADE;
DROP FUNCTION IF EXISTS notify_new_match() CASCADE;

-- Step 4: Recreate the are_users_matched function with proper column qualification
CREATE FUNCTION are_users_matched(user_a uuid, user_b uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM matches m
    WHERE m.is_active = true 
    AND (
      (m.user1_id = user_a AND m.user2_id = user_b) OR 
      (m.user1_id = user_b AND m.user2_id = user_a)
    )
  );
END;
$$;

-- Step 5: Create the ensure_conversation_exists function
CREATE FUNCTION ensure_conversation_exists()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if users are matched before allowing message
  IF NOT are_users_matched(NEW.sender_id, NEW.receiver_id) THEN
    RAISE EXCEPTION 'Users must be matched to send messages';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 6: Create the create_match_on_mutual_like function with proper column qualification
CREATE FUNCTION create_match_on_mutual_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only proceed if this is a 'like' interaction
  IF NEW.interaction_type = 'like' THEN
    -- Check if the other user has also liked this user
    IF EXISTS (
      SELECT 1 
      FROM profile_interactions pi
      WHERE pi.sender_id = NEW.receiver_id 
      AND pi.receiver_id = NEW.sender_id 
      AND pi.interaction_type = 'like'
    ) THEN
      -- Create a match (ensure user1_id < user2_id for consistency)
      INSERT INTO matches (user1_id, user2_id)
      VALUES (
        LEAST(NEW.sender_id, NEW.receiver_id),
        GREATEST(NEW.sender_id, NEW.receiver_id)
      )
      ON CONFLICT (user1_id, user2_id) DO NOTHING;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 7: Create the handle_message_updates function
CREATE FUNCTION handle_message_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function handles message-related updates
  -- Currently just returns the new record
  RETURN NEW;
END;
$$;

-- Step 8: Create the notify_new_match function
CREATE FUNCTION notify_new_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This function handles new match notifications
  -- For now, it just returns the new record
  -- In the future, you could add notification logic here
  RETURN NEW;
END;
$$;

-- Step 9: Recreate RLS policies for messages using the corrected functions
CREATE POLICY "Users can send messages to matches"
ON messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id 
  AND are_users_matched(sender_id, receiver_id)
);

CREATE POLICY "Users can view their conversations"
ON messages
FOR SELECT
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can mark their received messages as read"
ON messages
FOR UPDATE
TO authenticated
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

-- Step 10: Recreate triggers to ensure they use the updated functions
CREATE TRIGGER validate_message_trigger
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION ensure_conversation_exists();

CREATE TRIGGER handle_message_updates_trigger
  AFTER INSERT OR UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION handle_message_updates();

CREATE TRIGGER create_match_trigger
  AFTER INSERT ON profile_interactions
  FOR EACH ROW
  EXECUTE FUNCTION create_match_on_mutual_like();

CREATE TRIGGER notify_match_trigger
  AFTER INSERT ON matches
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_match();

-- Step 11: Grant necessary permissions
GRANT EXECUTE ON FUNCTION are_users_matched(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION ensure_conversation_exists() TO authenticated;
GRANT EXECUTE ON FUNCTION create_match_on_mutual_like() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_message_updates() TO authenticated;
GRANT EXECUTE ON FUNCTION notify_new_match() TO authenticated;

-- Step 12: Add helpful comments
COMMENT ON FUNCTION are_users_matched(uuid, uuid) IS 'Check if two users are matched and can send messages to each other';
COMMENT ON FUNCTION ensure_conversation_exists() IS 'Validate that users are matched before allowing messages';
COMMENT ON FUNCTION create_match_on_mutual_like() IS 'Create matches when users mutually like each other';
COMMENT ON FUNCTION handle_message_updates() IS 'Handle message updates and read receipts';
COMMENT ON FUNCTION notify_new_match() IS 'Trigger function to handle new match notifications';