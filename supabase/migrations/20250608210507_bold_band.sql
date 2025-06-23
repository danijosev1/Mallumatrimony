/*
  # Create get_profile_view_count function

  1. New Functions
    - `get_profile_view_count(user_id, start_date)`
      - Counts profile views for a specific user from a given start date
      - Used for tracking daily and monthly view limits
      - Returns integer count of views

  2. Purpose
    - Enables membership system to track profile view usage
    - Supports daily and monthly view limit enforcement
    - Required for MembershipContext functionality
*/

CREATE OR REPLACE FUNCTION public.get_profile_view_count(
    user_id uuid,
    start_date timestamp with time zone
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    view_count integer;
BEGIN
    SELECT COUNT(*)
    INTO view_count
    FROM public.profile_views
    WHERE viewer_id = user_id
      AND created_at >= start_date;

    RETURN view_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_profile_view_count(uuid, timestamp with time zone) TO authenticated;