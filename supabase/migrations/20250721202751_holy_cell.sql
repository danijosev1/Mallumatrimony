/*
  # Create database functions and triggers for automation

  1. Functions
    - `create_match_on_mutual_like()` - Creates matches when users like each other
    - `get_user_matches()` - Optimized function to get user matches
    - `get_profile_stats()` - Get profile statistics efficiently

  2. Triggers
    - Trigger to create matches automatically
    - Trigger to update profile stats

  3. Performance
    - Optimized queries to reduce database load
    - Efficient match detection
*/

-- Function to create matches when users like each other
CREATE OR REPLACE FUNCTION create_match_on_mutual_like()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process 'like' interactions
  IF NEW.interaction_type = 'like' THEN
    -- Check if the receiver has also liked the sender
    IF EXISTS (
      SELECT 1 FROM profile_interactions 
      WHERE sender_id = NEW.receiver_id 
      AND receiver_id = NEW.sender_id 
      AND interaction_type = 'like'
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
$$ LANGUAGE plpgsql;

-- Create trigger for automatic match creation
DROP TRIGGER IF EXISTS trigger_create_match_on_mutual_like ON profile_interactions;
CREATE TRIGGER trigger_create_match_on_mutual_like
  AFTER INSERT ON profile_interactions
  FOR EACH ROW
  EXECUTE FUNCTION create_match_on_mutual_like();

-- Function to get user matches efficiently
CREATE OR REPLACE FUNCTION get_user_matches(user_uuid uuid)
RETURNS TABLE (
  match_id uuid,
  other_user_id uuid,
  other_user_name text,
  other_user_images jsonb,
  other_user_age integer,
  other_user_profession text,
  other_user_location text,
  match_created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id as match_id,
    CASE 
      WHEN m.user1_id = user_uuid THEN m.user2_id 
      ELSE m.user1_id 
    END as other_user_id,
    p.name as other_user_name,
    p.images as other_user_images,
    p.age as other_user_age,
    p.profession as other_user_profession,
    p.location as other_user_location,
    m.created_at as match_created_at
  FROM matches m
  JOIN profiles p ON (
    CASE 
      WHEN m.user1_id = user_uuid THEN p.id = m.user2_id 
      ELSE p.id = m.user1_id 
    END
  )
  WHERE (m.user1_id = user_uuid OR m.user2_id = user_uuid)
  AND m.is_active = true
  ORDER BY m.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get profile statistics
CREATE OR REPLACE FUNCTION get_profile_stats(user_uuid uuid)
RETURNS TABLE (
  profile_views_count bigint,
  likes_received_count bigint,
  matches_count bigint,
  messages_received_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM profile_views WHERE viewed_profile_id = user_uuid) as profile_views_count,
    (SELECT COUNT(*) FROM profile_interactions WHERE receiver_id = user_uuid AND interaction_type = 'like') as likes_received_count,
    (SELECT COUNT(*) FROM matches WHERE (user1_id = user_uuid OR user2_id = user_uuid) AND is_active = true) as matches_count,
    (SELECT COUNT(*) FROM messages WHERE receiver_id = user_uuid) as messages_received_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get daily view count for a user
CREATE OR REPLACE FUNCTION get_daily_view_count(user_uuid uuid)
RETURNS bigint AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM profile_views 
    WHERE viewer_id = user_uuid 
    AND created_at >= date_trunc('day', now())
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check if users are matched
CREATE OR REPLACE FUNCTION are_users_matched(user1_uuid uuid, user2_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM matches 
    WHERE ((user1_id = user1_uuid AND user2_id = user2_uuid) 
       OR (user1_id = user2_uuid AND user2_id = user1_uuid))
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql;