-- Migration: Create candidate_profiles table
-- Date: 2025-09-30
-- Feature: CV & Profile Tools (001-cv-profile-tools)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create candidate_profiles table
CREATE TABLE candidate_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    
    -- Basic Information
    headline VARCHAR(255) NOT NULL CHECK (char_length(headline) >= 10),
    summary TEXT CHECK (char_length(summary) <= 2000),
    location VARCHAR(255),
    phone_number VARCHAR(50),
    portfolio_url TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    
    -- Professional Details
    experience_years INTEGER NOT NULL CHECK (experience_years >= 0 AND experience_years <= 50),
    skills JSONB DEFAULT '[]'::jsonb CHECK (jsonb_array_length(skills) <= 50),
    industries JSONB DEFAULT '[]'::jsonb,
    
    -- Preferences
    salary_expectation_min INTEGER NOT NULL CHECK (salary_expectation_min >= 20000),
    salary_expectation_max INTEGER NOT NULL CHECK (salary_expectation_max >= 20000),
    available_from DATE,
    willing_to_relocate BOOLEAN DEFAULT false,
    remote_preference VARCHAR(10) NOT NULL CHECK (remote_preference IN ('remote', 'hybrid', 'office')),
    
    -- Privacy Controls (FR-003)
    privacy_level VARCHAR(20) NOT NULL DEFAULT 'semi-private' CHECK (privacy_level IN ('public', 'semi-private', 'anonymous')),
    profile_visible_to_employers BOOLEAN DEFAULT true,
    contact_info_visible BOOLEAN DEFAULT false,
    salary_visible BOOLEAN DEFAULT true,
    
    -- Verification Status (FR-012)
    email_verified BOOLEAN DEFAULT false,
    profile_complete BOOLEAN DEFAULT false,
    id_verified BOOLEAN DEFAULT false,
    
    -- Metadata
    profile_views INTEGER DEFAULT 0,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add constraints
ALTER TABLE candidate_profiles 
    ADD CONSTRAINT salary_range_valid 
    CHECK (salary_expectation_min <= salary_expectation_max);

-- Create indexes
CREATE INDEX idx_candidate_profile_user_id ON candidate_profiles(user_id);
CREATE INDEX idx_candidate_profile_privacy ON candidate_profiles(privacy_level);
CREATE INDEX idx_candidate_profile_location ON candidate_profiles(location);
CREATE INDEX idx_candidate_profile_salary ON candidate_profiles(salary_expectation_min, salary_expectation_max);
CREATE INDEX idx_candidate_profile_skills ON candidate_profiles USING GIN(skills);
CREATE INDEX idx_candidate_profile_experience ON candidate_profiles(experience_years);
CREATE INDEX idx_candidate_profile_remote ON candidate_profiles(remote_preference);
CREATE INDEX idx_candidate_profile_active ON candidate_profiles(last_active_at);

-- Create unique constraint for user_id (one profile per user)
ALTER TABLE candidate_profiles 
    ADD CONSTRAINT candidate_profiles_user_id_unique 
    UNIQUE (user_id);

-- Add function to calculate verified badge
CREATE OR REPLACE FUNCTION calculate_verified_badge(profile_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    email_verified BOOLEAN;
    profile_complete BOOLEAN;
    id_verified BOOLEAN;
BEGIN
    SELECT cp.email_verified, cp.profile_complete, cp.id_verified
    INTO email_verified, profile_complete, id_verified
    FROM candidate_profiles cp
    WHERE cp.id = profile_id;
    
    RETURN email_verified AND profile_complete AND id_verified;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_candidate_profiles_updated_at
    BEFORE UPDATE ON candidate_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to update profile_complete status
CREATE OR REPLACE FUNCTION update_profile_complete_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if profile has minimum required data for completion
    NEW.profile_complete = (
        NEW.headline IS NOT NULL AND
        NEW.summary IS NOT NULL AND
        NEW.location IS NOT NULL AND
        NEW.experience_years IS NOT NULL AND
        jsonb_array_length(NEW.skills) > 0
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profile_complete_trigger
    BEFORE INSERT OR UPDATE ON candidate_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_complete_status();

-- Add comments for documentation
COMMENT ON TABLE candidate_profiles IS 'Extended professional profile information for job seekers (FR-001, FR-003, FR-012)';
COMMENT ON COLUMN candidate_profiles.privacy_level IS 'Profile privacy level: public, semi-private, or anonymous (FR-003)';
COMMENT ON COLUMN candidate_profiles.profile_complete IS 'Calculated field indicating if profile meets completion criteria';
COMMENT ON FUNCTION calculate_verified_badge(UUID) IS 'Calculates verified badge status based on email_verified AND profile_complete AND id_verified (FR-012)';

-- Add sample data for development (can be removed in production)
-- This will be handled by database seeds instead