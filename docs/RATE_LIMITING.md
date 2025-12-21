# Rate Limiting System

## Overview

This app implements a simple device-based rate limiting system to prevent spam without requiring user authentication.

## How It Works

### Device Tracking
- Each device is identified using `expo-device`'s unique device ID
- Device IDs are stored with each garage sale post
- No personal information is collected

### Rate Limits

**Daily Limit:** 3 posts per device per 24 hours
**Hourly Limit:** 2 posts per device per hour

These limits help prevent:
- Spam posting
- Duplicate listings
- Abuse of the platform

### Implementation

1. **Before Posting:** The app checks if the device has exceeded posting limits
2. **If Limit Reached:** User sees a friendly message explaining the limit
3. **If Allowed:** Post is created normally with device ID attached

## Database Schema

The `garage_sales` table includes:
- `device_id` - Unique identifier for the posting device
- `reported_count` - Number of times a post has been reported
- `is_reported` - Flag for posts that need moderation

## Future Enhancements

When you're ready to add user authentication, you can:
1. Keep anonymous posting with limits
2. Allow authenticated users higher limits
3. Enable authenticated users to edit/delete their posts
4. Build a reputation system for trusted sellers

## Running Migrations

To apply the database changes:

```bash
# Using Supabase CLI
supabase db push

# Or manually run the SQL in Supabase dashboard:
# Go to SQL Editor and run: supabase/migrations/002_add_device_tracking.sql
```

## Adjusting Limits

To change the limits, edit `/services/rateLimitService.ts`:

```typescript
const MAX_POSTS_PER_DAY = 3;  // Change to your preferred daily limit
const MAX_POSTS_PER_HOUR = 2; // Change to your preferred hourly limit
```

## Testing Rate Limits

To test the rate limiting:

1. Post 2 garage sales quickly (within an hour)
2. Try to post a 3rd - you should see the hourly limit message
3. Post 3 garage sales throughout the day
4. Try to post a 4th - you should see the daily limit message

## Privacy Note

Device IDs are stored only for spam prevention. They don't contain personal information and can't be used to identify individual users.
