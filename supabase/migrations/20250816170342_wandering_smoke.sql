/*
  # Add elite_since column to profiles table

  1. Changes
    - Add `elite_since` column to `profiles` table
    - Column type: timestamptz (timestamp with timezone)
    - Column is nullable to allow existing profiles without elite membership

  2. Purpose
    - Track when a user upgraded to elite membership
    - Used by MembershipContext to display elite membership duration
*/

-- Add elite_since column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS elite_since timestamptz;