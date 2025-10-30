-- Create jobs table for OpenRole if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop and recreate companies table
DROP TABLE IF EXISTS companies CASCADE;
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    website VARCHAR(255),
    logo_url VARCHAR(255),
    industry VARCHAR(100),
    size_category VARCHAR(50), -- 'startup', 'small', 'medium', 'large', 'enterprise'
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drop and recreate jobs table
DROP TABLE IF EXISTS jobs CASCADE;
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    
    -- Salary transparency (mandatory)
    salary_min INTEGER, -- In euros annually
    salary_max INTEGER,
    salary_currency VARCHAR(3) DEFAULT 'EUR',
    salary_type VARCHAR(20) DEFAULT 'annual', -- 'annual', 'monthly', 'daily', 'hourly'
    
    -- Location information
    location_precise VARCHAR(255), -- e.g., "Ballsbridge, Dublin 4"
    location_general VARCHAR(100), -- e.g., "South Dublin"
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

-- Create indexes for performance
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_company_id ON jobs(company_id);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX idx_jobs_location_general ON jobs(location_general);
CREATE INDEX idx_jobs_salary_range ON jobs(salary_min, salary_max);
CREATE INDEX idx_jobs_core_skills ON jobs USING GIN(core_skills);

-- Insert sample companies to start with
INSERT INTO companies (name, description, industry, size_category, verified) VALUES
('Google', 'Technology company', 'Technology', 'enterprise', true),
('Huguenot Services Limited', 'Professional services', 'Services', 'medium', false),
('QRT', 'Quantitative research and trading', 'Finance', 'medium', false),
('Anson Mccade', 'Technology recruitment', 'Recruitment', 'small', false);

SELECT 'Tables created successfully!' as status;