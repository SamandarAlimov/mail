-- Add columns for signatures, filters, and notification preferences to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS signatures jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS email_filters jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{"emailNotifications": true, "desktopNotifications": false, "soundAlerts": true, "dailyDigest": false}'::jsonb;