/*
  # Fix RLS policies for matches table

  1. Security Updates
    - Add INSERT policy for matches table to allow authenticated users to create matches
    - Add UPDATE policy for matches table to allow users to update their own matches
    - Ensure the create_match_on_mutual_like function uses SECURITY INVOKER

  2. Changes Made
    - Added INSERT policy for matches table
    - Added UPDATE policy for matches table
    - Updated function security context if needed
*/

-- Add INSERT policy for matches table
CREATE POLICY "Users can create matches" ON public.matches
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Add UPDATE policy for matches table  
CREATE POLICY "Users can update their own matches" ON public.matches
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user1_id OR auth.uid() = user2_id)
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Ensure the trigger function uses SECURITY INVOKER
-- This allows the function to execute with the privileges of the calling user
CREATE OR REPLACE FUNCTION create_match_on_mutual_like()
RETURNS TRIGGER
SECURITY INVOKER
AS $$
BEGIN
  -- Check if there's a mutual like (both users liked each other)
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