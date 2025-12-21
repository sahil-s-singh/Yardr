# Database Migration Instructions

## Problem
You're getting error `pgrst204` - "could not find device_id column" when posting garage sales.

## Solution
You need to run the migration to add the `device_id` column to your database.

### Option 1: Run Migration via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard at https://supabase.com/dashboard
2. Click on your project
3. Go to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of `supabase/migrations/002_add_device_tracking.sql`
6. Click **Run** to execute the migration

### Option 2: Run Migration via Supabase CLI

If you have Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link your project (replace with your project ref)
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push
```

### Option 3: Manual SQL Execution

Run this SQL directly in the Supabase SQL Editor:

```sql
-- Add device_id column to garage_sales table for rate limiting
ALTER TABLE garage_sales
ADD COLUMN IF NOT EXISTS device_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_garage_sales_device_id ON garage_sales(device_id);
CREATE INDEX IF NOT EXISTS idx_garage_sales_device_created ON garage_sales(device_id, created_at);

-- Add reported flag for user-reported spam
ALTER TABLE garage_sales
ADD COLUMN IF NOT EXISTS reported_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_reported BOOLEAN DEFAULT FALSE;

-- Create index for filtering reported content
CREATE INDEX IF NOT EXISTS idx_garage_sales_reported ON garage_sales(is_reported) WHERE is_reported = TRUE;
```

## Verify Migration

After running the migration, verify it worked by running this query in SQL Editor:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'garage_sales';
```

You should see `device_id` in the list of columns.

## Code Changes Made

The app code has been updated to:
1. **Handle missing device_id column gracefully** - It will only include device_id if it's provided
2. **Better error handling for video analysis** - If AI analysis fails, it uses default values instead of crashing
3. **Fixed address geocoding** - Now properly uses the entered address coordinates instead of always using device location
