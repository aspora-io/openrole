-- OpenRole Database Schema
-- Initialize development database with core tables

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (candidates and employers)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('candidate', 'employer', 'admin')),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company_name VARCHAR(255), -- For employers
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Companies table (verified employers)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    website VARCHAR(255),
    logo_url VARCHAR(255),
    industry VARCHAR(100),
    size_category VARCHAR(50), -- 'startup', 'small', 'medium', 'large', 'enterprise'
    verified BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job postings table
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    posted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Salary transparency (mandatory)
    salary_min INTEGER, -- In euros annually
    salary_max INTEGER,
    salary_currency VARCHAR(3) DEFAULT 'EUR',
    salary_type VARCHAR(20) DEFAULT 'annual', -- 'annual', 'monthly', 'daily', 'hourly'
    
    -- Location information
    location_precise VARCHAR(255), -- e.g., "Ballsbridge, Dublin 4"
    location_general VARCHAR(100), -- e.g., "South Dublin"
    location_coordinates POINT, -- For distance calculations
    remote_type VARCHAR(20) DEFAULT 'office', -- 'remote', 'hybrid', 'office'
    
    -- Job details
    employment_type VARCHAR(50), -- 'full-time', 'part-time', 'contract', 'internship'
    experience_level VARCHAR(50), -- 'entry', 'mid', 'senior', 'lead', 'executive'
    
    -- Skills (JSON arrays)
    core_skills JSONB DEFAULT '[]',
    nice_to_have_skills JSONB DEFAULT '[]',
    
    -- Job lifecycle
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'filled', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE,
    last_verified TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job applications table
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewed', 'interview', 'rejected', 'hired')),
    cover_letter TEXT,
    cv_url VARCHAR(255),
    
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(job_id, candidate_id) -- Prevent duplicate applications
);

-- User profiles (extended candidate information)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    
    headline VARCHAR(255),
    summary TEXT,
    skills JSONB DEFAULT '[]',
    experience_years INTEGER,
    location VARCHAR(255),
    willing_to_relocate BOOLEAN DEFAULT FALSE,
    remote_preference VARCHAR(20) DEFAULT 'hybrid', -- 'remote', 'hybrid', 'office'
    
    -- Salary expectations
    expected_salary_min INTEGER,
    expected_salary_max INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_company_id ON jobs(company_id);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX idx_jobs_location_general ON jobs(location_general);
CREATE INDEX idx_jobs_salary_range ON jobs(salary_min, salary_max);
CREATE INDEX idx_jobs_core_skills ON jobs USING GIN(core_skills);

CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_applications_candidate_id ON applications(candidate_id);
CREATE INDEX idx_applications_status ON applications(status);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(user_type);

-- Insert sample data for development
INSERT INTO users (email, password_hash, user_type, first_name, last_name) VALUES
('admin@openrole.net', '$2b$10$sample_hash', 'admin', 'Admin', 'User'),
('employer@test.com', '$2b$10$sample_hash', 'employer', 'John', 'Employer'),
('candidate@test.com', '$2b$10$sample_hash', 'candidate', 'Jane', 'Candidate');

INSERT INTO companies (name, description, website, industry, size_category, verified, created_by) VALUES
('OpenRole', 'Transparent job platform', 'https://openrole.net', 'Technology', 'startup', true, (SELECT id FROM users WHERE email = 'admin@openrole.net'));

-- Sample job for testing
INSERT INTO jobs (
    title, description, company_id, posted_by,
    salary_min, salary_max, 
    location_precise, location_general,
    employment_type, experience_level,
    core_skills, nice_to_have_skills,
    expires_at
) VALUES (
    'Senior Software Engineer',
    'We are looking for a Senior Software Engineer to join our growing team...',
    (SELECT id FROM companies WHERE name = 'OpenRole'),
    (SELECT id FROM users WHERE email = 'employer@test.com'),
    70000, 90000,
    'Ballsbridge, Dublin 4', 'South Dublin',
    'full-time', 'senior',
    '["TypeScript", "React", "Node.js", "PostgreSQL"]',
    '["Docker", "AWS", "GraphQL", "TDD"]',
    NOW() + INTERVAL '30 days'
);