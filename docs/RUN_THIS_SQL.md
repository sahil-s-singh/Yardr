# FIX: "could not find device_id column" Error

## Quick Fix - Run This SQL Now!

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Open your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste this SQL:

```sql
-- Add device_id column to garage_sales table
ALTER TABLE garage_sales
ADD COLUMN IF NOT EXISTS device_id TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_garage_sales_device_id ON garage_sales(device_id);
CREATE INDEX IF NOT EXISTS idx_garage_sales_device_created ON garage_sales(device_id, created_at);

-- Add reported flags for spam prevention
ALTER TABLE garage_sales
ADD COLUMN IF NOT EXISTS reported_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_reported BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_garage_sales_reported ON garage_sales(is_reported) WHERE is_reported = TRUE;
```

6. Click **Run** (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned"

## Verify It Worked

Run this query to check the columns exist:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'garage_sales'
ORDER BY ordinal_position;
```

You should see `device_id` in the list.

## Then Restart Your App

After running the SQL:
1. Go back to your terminal
2. Stop the Expo server (Ctrl+C)
3. Restart: `npm start`
4. Try posting a garage sale again

That's it! The error should be gone.
