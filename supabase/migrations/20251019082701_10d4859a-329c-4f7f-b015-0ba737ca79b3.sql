-- Add emergency_monitoring_enabled column to user_settings table
ALTER TABLE public.user_settings 
ADD COLUMN IF NOT EXISTS emergency_monitoring_enabled boolean DEFAULT true;