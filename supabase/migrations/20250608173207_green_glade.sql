/*
  # Disable email confirmation for seamless registration

  1. Configuration Changes
    - Disable email confirmation requirement
    - Allow immediate login after registration
    - Update existing unconfirmed users

  2. Security
    - Maintain RLS policies
    - Keep user authentication secure
*/

-- Confirm all existing unconfirmed users
UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;

-- Note: The following settings need to be configured in Supabase Dashboard:
-- 1. Go to Authentication > Settings
-- 2. Set "Enable email confirmations" to OFF
-- 3. This will disable the MAILER_AUTOCONFIRM requirement

-- For now, we'll handle this in the application logic by not requiring email confirmation