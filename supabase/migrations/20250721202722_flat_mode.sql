/*
  # Create profile interactions table for tracking user interactions

  1. New Tables
    - `profile_interactions`
      - `id` (uuid, primary key)
      - `sender_id` (uuid, references profiles)
      - `receiver_id` (uuid, references profiles)
      - `interaction_type` (text: 'like', 'pass', 'super_like')
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `profile_interactions` table
    - Add policies for users to manage their interactions

  3. Indexes
    - Create indexes for efficient querying
    - Unique constraint on sender_id + receiver_id
*/

-- Create profile_interactions table
CREATE TABLE IF NOT EXISTS profile_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  interaction_type text NOT NULL CHECK (interaction_type IN ('like', 'pass', 'super_like')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(sender_id, receiver_id)
);

-- Enable RLS
ALTER TABLE profile_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their sent interactions"
  ON profile_interactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id);

CREATE POLICY "Users can view their received interactions"
  ON profile_interactions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = receiver_id);

CREATE POLICY "Users can create interactions"
  ON profile_interactions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their interactions"
  ON profile_interactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profile_interactions_sender ON profile_interactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_profile_interactions_receiver ON profile_interactions(receiver_id);
CREATE INDEX IF NOT EXISTS idx_profile_interactions_type ON profile_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_profile_interactions_created_at ON profile_interactions(created_at);
CREATE INDEX IF NOT EXISTS idx_profile_interactions_sender_receiver ON profile_interactions(sender_id, receiver_id);