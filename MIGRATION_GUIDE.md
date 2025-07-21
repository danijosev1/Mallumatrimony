# Supabase Migration Guide

## Overview
This guide will help you migrate your Mallu Matrimony project from the old Supabase account to the new one connected to Bolt.

## Step 1: Document Current Setup ✅
Based on your project files, here's what we've documented:

### Current Tables:
- `profiles` - Main user profiles
- `extended_profiles` - Detailed profile information  
- `profile_interactions` - User likes/passes
- `profile_views` - Profile view tracking
- `matches` - Mutual matches
- `messages` - Chat messages
- `contact_messages` - Contact form submissions

### Current Functions:
- `get_recommendations()` - Smart matching algorithm
- `get_user_matches()` - User's mutual matches
- `get_conversation_list()` - Chat conversations
- `get_user_dashboard_stats()` - Dashboard statistics
- `search_profiles()` - Advanced profile search
- `mark_messages_read()` - Mark messages as read

## Step 2: Clean Up Old Supabase Account

### Actions to take in your OLD Supabase account:
1. **Revoke API Keys:**
   - Go to Project Settings → API
   - Regenerate or delete the `anon` key
   - Regenerate or delete the `service_role` key

2. **Disable Authentication:**
   - Go to Authentication → Settings
   - Disable all auth providers (Google, email, etc.)

3. **Remove Webhooks:**
   - Go to Database → Webhooks
   - Delete any existing webhooks

4. **Export Data (if needed):**
   ```sql
   -- Run these queries in your old Supabase SQL editor to export data
   SELECT * FROM profiles;
   SELECT * FROM extended_profiles;
   SELECT * FROM profile_interactions;
   SELECT * FROM matches;
   SELECT * FROM messages;
   ```

## Step 3: Set Up New Supabase Account ✅

The migration SQL file (`complete_schema_migration.sql`) will:
- Create all necessary tables with proper schemas
- Set up Row Level Security (RLS) policies
- Create all required database functions
- Add proper indexes for performance
- Set up triggers for automatic match creation

## Step 4: Update Project Configuration

### Environment Variables:
Your `.env` file should already be updated with the new Supabase credentials. Verify these are correct:
```
VITE_SUPABASE_URL=https://your-new-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-new-anon-key
```

### Authentication Setup:
1. **Enable Email Authentication:**
   - Go to Authentication → Settings
   - Enable "Enable email confirmations" if desired
   - Set up email templates

2. **Enable Google OAuth (if used):**
   - Go to Authentication → Providers
   - Enable Google provider
   - Add your Google OAuth credentials

3. **Configure Allowed Origins:**
   - Go to Authentication → URL Configuration
   - Add your development URL: `http://localhost:5173`
   - Add your production URL when ready

## Step 5: Data Migration (Optional)

If you have existing user data to migrate:

1. **Export from old account:**
   ```bash
   # Use Supabase CLI or manual export
   supabase db dump --db-url "old-connection-string" > old_data.sql
   ```

2. **Import to new account:**
   ```bash
   # After running the schema migration
   psql "new-connection-string" < old_data.sql
   ```

## Step 6: Testing and Validation

### Test Checklist:
- [ ] User registration works
- [ ] User login works  
- [ ] Profile creation/editing works
- [ ] Profile search and filtering works
- [ ] Messaging system works
- [ ] Match creation works
- [ ] Real-time updates work
- [ ] All RLS policies are working correctly

### Validation Commands:
Run these in your new Supabase SQL editor:

```sql
-- Test table creation
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Test RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- Test functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
```

## Step 7: Go Live

1. **Update Production Environment:**
   - Update production environment variables
   - Deploy the updated application
   - Test all functionality in production

2. **Monitor:**
   - Check Supabase dashboard for any errors
   - Monitor authentication logs
   - Watch for any RLS policy violations

## Troubleshooting

### Common Issues:
1. **CORS Errors:** Add your domain to allowed origins in Supabase dashboard
2. **RLS Violations:** Check that policies allow the intended operations
3. **Function Errors:** Verify all functions were created successfully
4. **Auth Issues:** Ensure auth providers are properly configured

### Support:
- Check Supabase logs in the dashboard
- Review the migration SQL file for any failed operations
- Test individual components to isolate issues

## Security Notes:
- Never commit API keys to version control
- Use environment variables for all sensitive data
- Regularly rotate API keys
- Monitor access logs for suspicious activity
- Keep RLS policies restrictive and test thoroughly