/*
  # Fix Profile Interactions RLS Policies

  1. Security Updates
    - Drop existing restrictive policies on profile_interactions table
    - Create new policies that properly support upsert operations
    - Allow authenticated users to insert/update their own interactions
    - Allow users to view interactions they're involved in

  2. Changes
    - Updated INSERT policy to allow upserts with ON CONFLICT
    - Updated UPDATE policy to support upsert operations
    - Maintained security by ensuring users can only manage their own interactions
*/

-- Drop existing policies that might be causing conflicts
DROP POLICY IF EXISTS "Users can create interactions" ON profile_interactions;
DROP POLICY IF EXISTS "Users can view their interactions" ON profile_interactions;

-- Create new policies that support upsert operations
CREATE POLICY "Users can insert their own interactions"
  ON profile_interactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own interactions"
  ON profile_interactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view interactions they are involved in"
  ON profile_interactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);