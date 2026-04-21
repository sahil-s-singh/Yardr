-- Add local_notification_id column to user_reminders for cancellation support
ALTER TABLE user_reminders
ADD COLUMN IF NOT EXISTS local_notification_id TEXT;
