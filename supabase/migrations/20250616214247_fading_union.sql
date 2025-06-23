/*
  # Add optimized indexes for notification queries
  
  1. Performance Improvements
    - Add composite indexes for notification queries
    - Optimize profile_interactions, messages, matches, and profile_views queries
    - Avoid including large columns (like images array) in indexes
    
  2. Index Strategy
    - Use composite indexes for common query patterns
    - Focus on filtering and ordering columns only
    - Separate indexes for different notification types
*/

-- Add composite index for profile_interactions notification queries
-- This covers the main query: receiver_id + interaction_type + created_at ordering
CREATE INDEX IF NOT EXISTS profile_interactions_receiver_type_created_idx 
ON profile_interactions (receiver_id, interaction_type, created_at DESC);

-- Add index for profile_interactions sender lookups
CREATE INDEX IF NOT EXISTS profile_interactions_sender_created_idx 
ON profile_interactions (sender_id, created_at DESC);

-- Add composite index for message notification queries
-- This covers: receiver_id + read status + created_at ordering
CREATE INDEX IF NOT EXISTS messages_receiver_read_created_idx 
ON messages (receiver_id, read, created_at DESC);

-- Add index for message sender lookups
CREATE INDEX IF NOT EXISTS messages_sender_created_idx 
ON messages (sender_id, created_at DESC);

-- Add composite index for profile view notification queries
-- This covers: viewed_profile_id + created_at ordering
CREATE INDEX IF NOT EXISTS profile_views_viewed_created_idx 
ON profile_views (viewed_profile_id, created_at DESC);

-- Add index for profile view viewer lookups
CREATE INDEX IF NOT EXISTS profile_views_viewer_created_idx 
ON profile_views (viewer_id, created_at DESC);

-- Add composite index for match notification queries
-- This covers both user1_id and user2_id with created_at ordering
CREATE INDEX IF NOT EXISTS matches_user1_created_idx 
ON matches (user1_id, created_at DESC);

CREATE INDEX IF NOT EXISTS matches_user2_created_idx 
ON matches (user2_id, created_at DESC);

-- Add optimized index for profile lookups (without large columns)
-- This helps with joins but avoids the images array that causes size issues
CREATE INDEX IF NOT EXISTS profiles_name_lookup_idx 
ON profiles (id, name, full_name) WHERE name IS NOT NULL;

-- Add index for profile email lookups (commonly used in joins)
CREATE INDEX IF NOT EXISTS profiles_email_lookup_idx 
ON profiles (email) WHERE email IS NOT NULL;

-- Add partial index for active profiles only
CREATE INDEX IF NOT EXISTS profiles_active_lookup_idx 
ON profiles (id, name, full_name) WHERE created_at IS NOT NULL;