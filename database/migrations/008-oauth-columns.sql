-- Migration: Add OAuth columns to users table
-- Date: 2025-10-03
-- Description: Add Google and LinkedIn OAuth ID columns for SSO authentication

-- Add OAuth ID columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin_id VARCHAR(255) UNIQUE;

-- Create indexes for OAuth lookups
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_linkedin_id ON users(linkedin_id) WHERE linkedin_id IS NOT NULL;

-- Update password_hash to be nullable for OAuth-only accounts
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Add constraint to ensure either password or OAuth ID exists
ALTER TABLE users ADD CONSTRAINT check_auth_method 
  CHECK (
    password_hash IS NOT NULL OR 
    google_id IS NOT NULL OR 
    linkedin_id IS NOT NULL
  );

-- Add OAuth provider tracking (optional for analytics)
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'email';

-- Update existing users to have 'email' as auth provider
UPDATE users SET auth_provider = 'email' WHERE auth_provider IS NULL;