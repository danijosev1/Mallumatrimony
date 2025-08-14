-- Investigation queries to identify the constraint issue

-- 1. Check the structure of extended_profiles table
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'extended_profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check all constraints on extended_profiles table
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    tc.is_deferrable,
    tc.initially_deferred
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'extended_profiles' 
AND tc.table_schema = 'public';

-- 3. Check unique indexes on extended_profiles
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'extended_profiles' 
AND schemaname = 'public';

-- 4. Check if there are any unique constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    conkey as column_positions,
    confkey as foreign_column_positions
FROM pg_constraint 
WHERE conrelid = 'public.extended_profiles'::regclass;

-- 5. Check the profiles table structure for comparison
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;