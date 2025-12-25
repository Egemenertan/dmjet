-- Migration: Add aile_karti column to profiles table
-- Description: Adds family card (aile kartı) information to user profiles

-- Add aile_karti column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS aile_karti TEXT;

-- Add comment to the column
COMMENT ON COLUMN profiles.aile_karti IS 'Family card number (Aile Kartı Numarası)';












