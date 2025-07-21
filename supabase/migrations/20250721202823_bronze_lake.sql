/*
  # Create RPC functions for optimized data retrieval

  1. RPC Functions
    - `search_profiles()` - Optimized profile search with filters
    - `get_recommendations()` - Get profile recommendations for a user
    - `get_conversation_list()` - Get user's conversation list
    - `mark_messages_read()` - Bulk mark messages as read

  2. Performance
    - Reduce multiple round trips
    - Server-side filtering and sorting
    - Optimized queries with proper indexes
*/

-- Function to search profiles with filters
CREATE OR REPLACE FUNCTION search_profiles(
  current_user_id uuid,
  search_text text DEFAULT '',
  min_age integer DEFAULT 18,
  max_age integer DEFAULT 60,
  gender_filter text DEFAULT '',
  religion_filter text DEFAULT '',
  education_filter text DEFAULT '',
  location_filter text DEFAULT '',
  limit_count integer DEFAULT 20,
  offset_count integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  full_name text,
  name text,
  age integer,
  gender text,
  religion text,
  education text,
  profession text,
  location text,
  images jsonb,
  short_bio text,
  is_premium boolean,
  profile_score integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ups.id,
    ups.full_name,
    ups.name,
    ups.age,
    ups.gender,
    ups.religion,
    ups.education,
    ups.profession,
    ups.location,
    ups.images,
    ups.short_bio,
    ups.is_premium,
    ups.profile_score
  FROM user_profile_summary ups
  WHERE ups.id != current_user_id
  AND ups.is_profile_complete = true
  AND (ups.age BETWEEN min_age AND max_age)
  AND (gender_filter = '' OR ups.gender = gender_filter)
  AND (religion_filter = '' OR ups.religion = religion_filter)
  AND (education_filter = '' OR ups.education = education_filter)
  AND (location_filter = '' OR ups.location ILIKE '%' || location_filter || '%')
  AND (
    search_text = '' OR 
    ups.full_name ILIKE '%' || search_text || '%' OR
    ups.profession ILIKE '%' || search_text || '%' OR
    ups.location ILIKE '%' || search_text || '%'
  )
  ORDER BY ups.profile_score DESC, ups.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get profile recommendations
CREATE OR REPLACE FUNCTION get_recommendations(current_user_id uuid, limit_count integer DEFAULT 10)
RETURNS TABLE (
  id uuid,
  full_name text,
  name text,
  age integer,
  gender text,
  religion text,
  education text,
  profession text,
  location text,
  images jsonb,
  short_bio text,
  is_premium boolean,
  compatibility_score integer
) AS $$
DECLARE
  user_profile RECORD;
BEGIN
  -- Get current user's profile for matching
  SELECT p.gender, p.religion, p.age, p.location, p.education
  INTO user_profile
  FROM profiles p
  WHERE p.id = current_user_id;
  
  -- Determine opposite gender
  DECLARE opposite_gender text;
  BEGIN
    opposite_gender := CASE 
      WHEN user_profile.gender = 'Male' THEN 'Female'
      WHEN user_profile.gender = 'Female' THEN 'Male'
      ELSE 'Other'
    END;
  END;
  
  RETURN QUERY
  SELECT 
    ups.id,
    ups.full_name,
    ups.name,
    ups.age,
    ups.gender,
    ups.religion,
    ups.education,
    ups.profession,
    ups.location,
    ups.images,
    ups.short_bio,
    ups.is_premium,
    -- Calculate compatibility score
    (
      CASE WHEN ups.religion = user_profile.religion THEN 30 ELSE 0 END +
      CASE WHEN ups.location = user_profile.location THEN 20 ELSE 0 END +
      CASE WHEN ups.education = user_profile.education THEN 15 ELSE 0 END +
      CASE WHEN ABS(ups.age - user_profile.age) <= 5 THEN 20 ELSE 10 END +
      CASE WHEN ups.is_premium THEN 15 ELSE 0 END
    ) as compatibility_score
  FROM user_profile_summary ups
  WHERE ups.id != current_user_id
  AND ups.gender = opposite_gender
  AND ups.is_profile_complete = true
  -- Exclude users already interacted with
  AND NOT EXISTS (
    SELECT 1 FROM profile_interactions pi 
    WHERE pi.sender_id = current_user_id 
    AND pi.receiver_id = ups.id
  )
  ORDER BY compatibility_score DESC, ups.profile_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get conversation list
CREATE OR REPLACE FUNCTION get_conversation_list(current_user_id uuid)
RETURNS TABLE (
  other_user_id uuid,
  other_user_name text,
  other_user_images jsonb,
  last_message text,
  last_message_time timestamptz,
  unread_count bigint,
  is_matched boolean
) AS $$
BEGIN
  RETURN QUERY
  WITH conversations AS (
    SELECT DISTINCT
      CASE 
        WHEN m.sender_id = current_user_id THEN m.receiver_id 
        ELSE m.sender_id 
      END as other_user_id
    FROM messages m
    WHERE m.sender_id = current_user_id OR m.receiver_id = current_user_id
  ),
  last_messages AS (
    SELECT DISTINCT ON (
      CASE 
        WHEN m.sender_id = current_user_id THEN m.receiver_id 
        ELSE m.sender_id 
      END
    )
      CASE 
        WHEN m.sender_id = current_user_id THEN m.receiver_id 
        ELSE m.sender_id 
      END as other_user_id,
      m.content as last_message,
      m.created_at as last_message_time
    FROM messages m
    WHERE m.sender_id = current_user_id OR m.receiver_id = current_user_id
    ORDER BY 
      CASE 
        WHEN m.sender_id = current_user_id THEN m.receiver_id 
        ELSE m.sender_id 
      END,
      m.created_at DESC
  )
  SELECT 
    c.other_user_id,
    p.name as other_user_name,
    p.images as other_user_images,
    lm.last_message,
    lm.last_message_time,
    COALESCE(unread.count, 0) as unread_count,
    EXISTS(
      SELECT 1 FROM matches 
      WHERE (user1_id = current_user_id AND user2_id = c.other_user_id)
      OR (user1_id = c.other_user_id AND user2_id = current_user_id)
    ) as is_matched
  FROM conversations c
  JOIN profiles p ON p.id = c.other_user_id
  LEFT JOIN last_messages lm ON lm.other_user_id = c.other_user_id
  LEFT JOIN (
    SELECT 
      sender_id,
      COUNT(*) as count
    FROM messages 
    WHERE receiver_id = current_user_id AND read = false
    GROUP BY sender_id
  ) unread ON unread.sender_id = c.other_user_id
  ORDER BY lm.last_message_time DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_read(
  current_user_id uuid,
  other_user_id uuid
)
RETURNS void AS $$
BEGIN
  UPDATE messages 
  SET read = true 
  WHERE receiver_id = current_user_id 
  AND sender_id = other_user_id 
  AND read = false;
END;
$$ LANGUAGE plpgsql;

-- Function to get user statistics efficiently
CREATE OR REPLACE FUNCTION get_user_dashboard_stats(current_user_id uuid)
RETURNS TABLE (
  profile_views bigint,
  likes_received bigint,
  total_matches bigint,
  unread_messages bigint,
  daily_views_used bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(stats.profile_views, 0) as profile_views,
    COALESCE(stats.likes_received, 0) as likes_received,
    COALESCE(stats.total_matches, 0) as total_matches,
    COALESCE(stats.unread_messages, 0) as unread_messages,
    get_daily_view_count(current_user_id) as daily_views_used
  FROM user_stats_summary stats
  WHERE stats.user_id = current_user_id;
END;
$$ LANGUAGE plpgsql;