/*
  # Create optimized database views for common queries

  1. Views
    - `user_profile_summary` - Optimized profile data for listings
    - `user_match_summary` - Efficient match data retrieval
    - `user_stats_summary` - Pre-calculated user statistics

  2. Performance
    - Reduce query complexity
    - Pre-join common data
    - Optimize for frontend consumption
*/

-- Create view for profile summaries (used in search and listings)
CREATE OR REPLACE VIEW user_profile_summary AS
SELECT 
  p.id,
  p.full_name,
  p.name,
  p.age,
  p.gender,
  p.religion,
  p.caste,
  p.education,
  p.profession,
  p.location,
  p.images,
  p.short_bio,
  p.is_premium,
  p.membership_plan,
  p.created_at,
  -- Calculate profile completeness score
  CASE 
    WHEN p.about IS NOT NULL 
    AND p.images IS NOT NULL 
    AND jsonb_array_length(p.images) > 0
    AND p.education IS NOT NULL 
    AND p.profession IS NOT NULL 
    AND p.location IS NOT NULL
    THEN true 
    ELSE false 
  END as is_profile_complete,
  -- Calculate profile score for ranking
  (
    CASE WHEN p.about IS NOT NULL THEN 20 ELSE 0 END +
    CASE WHEN p.images IS NOT NULL AND jsonb_array_length(p.images) > 0 THEN 30 ELSE 0 END +
    CASE WHEN p.education IS NOT NULL THEN 15 ELSE 0 END +
    CASE WHEN p.profession IS NOT NULL THEN 15 ELSE 0 END +
    CASE WHEN p.location IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN p.is_premium THEN 10 ELSE 0 END
  ) as profile_score
FROM profiles p;

-- Create view for match summaries
CREATE OR REPLACE VIEW user_match_summary AS
SELECT 
  m.id as match_id,
  m.user1_id,
  m.user2_id,
  m.created_at as matched_at,
  m.is_active,
  p1.name as user1_name,
  p1.images as user1_images,
  p1.age as user1_age,
  p2.name as user2_name,
  p2.images as user2_images,
  p2.age as user2_age,
  -- Check if there are any messages between them
  EXISTS(
    SELECT 1 FROM messages 
    WHERE (sender_id = m.user1_id AND receiver_id = m.user2_id)
    OR (sender_id = m.user2_id AND receiver_id = m.user1_id)
  ) as has_messages
FROM matches m
JOIN profiles p1 ON p1.id = m.user1_id
JOIN profiles p2 ON p2.id = m.user2_id
WHERE m.is_active = true;

-- Create view for user statistics
CREATE OR REPLACE VIEW user_stats_summary AS
SELECT 
  p.id as user_id,
  p.name,
  p.created_at as joined_at,
  COALESCE(views.view_count, 0) as profile_views,
  COALESCE(likes.likes_received, 0) as likes_received,
  COALESCE(matches.match_count, 0) as total_matches,
  COALESCE(messages.unread_messages, 0) as unread_messages
FROM profiles p
LEFT JOIN (
  SELECT viewed_profile_id, COUNT(*) as view_count
  FROM profile_views
  GROUP BY viewed_profile_id
) views ON views.viewed_profile_id = p.id
LEFT JOIN (
  SELECT receiver_id, COUNT(*) as likes_received
  FROM profile_interactions
  WHERE interaction_type = 'like'
  GROUP BY receiver_id
) likes ON likes.receiver_id = p.id
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as match_count
  FROM (
    SELECT user1_id as user_id FROM matches WHERE is_active = true
    UNION ALL
    SELECT user2_id as user_id FROM matches WHERE is_active = true
  ) all_matches
  GROUP BY user_id
) matches ON matches.user_id = p.id
LEFT JOIN (
  SELECT receiver_id, COUNT(*) as unread_messages
  FROM messages
  WHERE read = false
  GROUP BY receiver_id
) messages ON messages.receiver_id = p.id;

-- Grant access to views
GRANT SELECT ON user_profile_summary TO authenticated;
GRANT SELECT ON user_match_summary TO authenticated;
GRANT SELECT ON user_stats_summary TO authenticated;