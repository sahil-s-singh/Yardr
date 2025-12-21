# Supabase Setup Guide for Garage Sale Finder

Follow these steps to set up your Supabase backend:

## Step 1: Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project" and sign up (free account is fine)
3. Create a new project:
   - Give it a name (e.g., "garage-sale-finder")
   - Set a strong database password (save this!)
   - Choose a region close to you
   - Wait for the project to be provisioned (~2 minutes)

## Step 2: Set Up the Database

1. In your Supabase dashboard, click on the **SQL Editor** in the left sidebar
2. Click **+ New query**
3. Copy the entire contents of `supabase/schema.sql` file
4. Paste it into the SQL editor
5. Click **Run** to execute the SQL
6. You should see "Success. No rows returned" message

This will:
- Create the `garage_sales` table
- Set up Row Level Security (RLS) policies
- Add indexes for performance
- Insert 5 sample garage sales in Saskatoon

## Step 3: Get Your API Credentials

1. In your Supabase dashboard, click on **Settings** (gear icon) in the left sidebar
2. Click on **API** under Project Settings
3. Find these two values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** key (under "Project API keys")

## Step 4: Configure Your App

1. Open the file `lib/supabase.ts`
2. Replace the placeholder values:
   ```typescript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL';  // Replace with your Project URL
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';  // Replace with your anon key
   ```

## Step 5: Test the Connection

1. Save all files
2. The app will automatically reload
3. You should now see the garage sales from your Supabase database!
4. Check the console logs to confirm it's loading from Supabase

## Verify Database

To verify your data was inserted correctly:

1. In Supabase dashboard, click on **Table Editor**
2. Select the `garage_sales` table
3. You should see 5 rows of sample data

## Security Notes

- The `anon` key is safe to use in your mobile app
- Row Level Security (RLS) is enabled to protect your data
- Currently, anyone can read active garage sales and create new ones
- You can add authentication later to restrict who can create/edit sales

## Next Steps

### Add User Authentication (Optional)

1. In Supabase dashboard, go to **Authentication** > **Providers**
2. Enable your preferred auth method (Email, Google, etc.)
3. Update the RLS policies to require authentication for creating sales

### Add Storage for Images (Optional)

1. In Supabase dashboard, go to **Storage**
2. Create a new bucket called "garage-sale-images"
3. Set up policies to allow public reads and authenticated uploads
4. Update the app to handle image uploads

## Troubleshooting

### "Failed to load garage sales" error
- Check that your Supabase URL and anon key are correct
- Verify the SQL schema was executed successfully
- Check the browser/app console for detailed error messages

### No garage sales showing on map
- Verify data exists in the `garage_sales` table
- Check that `is_active` is set to `true`
- Make sure your location permissions are enabled

### TypeScript errors
- Run `npm install` to ensure all dependencies are installed
- Restart the Metro bundler if needed

## API Documentation

Your service (`services/garageSaleService.ts`) provides these methods:

- `getAllGarageSales()` - Get all active garage sales
- `getGarageSalesNearby(lat, lng, radius)` - Get sales within radius (km)
- `getGarageSaleById(id)` - Get a specific garage sale
- `addGarageSale(sale)` - Create a new garage sale
- `updateGarageSale(id, updates)` - Update an existing sale
- `deleteGarageSale(id)` - Deactivate a garage sale

All methods return Promises and handle errors gracefully.
