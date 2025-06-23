/*
  # Add Elite Membership Support

  1. Changes
    - Add elite_since timestamp to preferences JSONB field
    - Add function to check if user is an elite member
    - Add function to get elite membership status
    - Add index on membership_plan for faster queries

  2. Security
    - Maintain existing RLS policies
    - Add function to validate elite membership
*/

-- Create index on membership_plan for faster queries
CREATE INDEX IF NOT EXISTS profiles_membership_plan_idx ON profiles(membership_plan);

-- Create function to check if user is an elite member
CREATE OR REPLACE FUNCTION is_elite_member(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM profiles 
    WHERE id = user_id 
    AND membership_plan = 'elite'
  );
END;
$$;

-- Create function to get elite membership status
CREATE OR REPLACE FUNCTION get_elite_status(user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'is_elite', (membership_plan = 'elite'),
    'elite_since', preferences->'elite_since',
    'membership_plan', membership_plan
  ) INTO result
  FROM profiles
  WHERE id = user_id;
  
  RETURN result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION is_elite_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_elite_status(uuid) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION is_elite_member(uuid) IS 'Check if a user has elite membership';
COMMENT ON FUNCTION get_elite_status(uuid) IS 'Get elite membership status and details for a user';