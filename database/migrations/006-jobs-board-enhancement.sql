-- Job Board Enhancement Migration
-- Extends existing jobs schema with modern job board features
-- Run after existing migrations 001-005

-- Create enhanced job analytics table
CREATE TABLE job_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    views INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    applications INTEGER DEFAULT 0,
    qualified_applications INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    source_breakdown JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(job_id, date)
);

-- Enhance existing jobs table with additional columns
ALTER TABLE jobs 
    ADD COLUMN IF NOT EXISTS requirements TEXT[],
    ADD COLUMN IF NOT EXISTS responsibilities TEXT[],
    ADD COLUMN IF NOT EXISTS benefits TEXT[],
    ADD COLUMN IF NOT EXISTS equity_offered BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS department VARCHAR(100),
    ADD COLUMN IF NOT EXISTS certifications_required JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS application_deadline DATE,
    ADD COLUMN IF NOT EXISTS external_application_url TEXT,
    ADD COLUMN IF NOT EXISTS requires_cover_letter BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS requires_portfolio BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS custom_questions JSONB DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS urgent BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS filled_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS application_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS slug VARCHAR(255),
    ADD COLUMN IF NOT EXISTS meta_description TEXT,
    ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]';

-- Update jobs status enum to include draft
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_status_check 
    CHECK (status IN ('draft', 'active', 'paused', 'filled', 'expired'));

-- Create enhanced application pipeline table
CREATE TABLE application_pipeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES users(id) ON DELETE CASCADE,
    profile_id UUID, -- Will reference candidate_profiles when available
    
    -- Application data
    cv_document_id UUID, -- Will reference cv_documents when available
    cover_letter TEXT,
    portfolio_items UUID[] DEFAULT '{}',
    custom_responses JSONB DEFAULT '{}',
    
    -- Enhanced tracking & status
    status VARCHAR(30) DEFAULT 'submitted' CHECK (status IN (
        'submitted', 'screening', 'phone_interview', 'technical_interview',
        'final_interview', 'reference_check', 'offer_extended', 
        'hired', 'rejected', 'withdrawn'
    )),
    status_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status_updated_by UUID REFERENCES users(id),
    
    -- Interview scheduling
    interview_scheduled_at TIMESTAMP WITH TIME ZONE,
    interview_type VARCHAR(20) CHECK (interview_type IN ('phone', 'video', 'in_person', 'technical')),
    interview_notes TEXT,
    
    -- Feedback & rejection
    rejection_reason VARCHAR(100),
    rejection_feedback TEXT,
    feedback_shared_with_candidate BOOLEAN DEFAULT false,
    
    -- Scoring & evaluation
    recruiter_rating INTEGER CHECK (recruiter_rating BETWEEN 1 AND 5),
    hiring_manager_rating INTEGER CHECK (hiring_manager_rating BETWEEN 1 AND 5),
    technical_score INTEGER CHECK (technical_score BETWEEN 1 AND 100),
    culture_fit_score INTEGER CHECK (culture_fit_score BETWEEN 1 AND 5),
    
    -- Compliance & diversity
    diversity_source VARCHAR(50),
    referral_source VARCHAR(100),
    
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(job_id, candidate_id) -- Prevent duplicate applications
);

-- Candidate saved jobs and alerts
CREATE TABLE saved_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID REFERENCES users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    saved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(candidate_id, job_id)
);

CREATE TABLE job_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID REFERENCES users(id) ON DELETE CASCADE,
    alert_name VARCHAR(255) NOT NULL,
    search_criteria JSONB NOT NULL,
    frequency VARCHAR(20) DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
    is_active BOOLEAN DEFAULT true,
    last_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Job view tracking for analytics
CREATE TABLE job_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for anonymous views
    session_id VARCHAR(255), -- For anonymous tracking
    user_agent TEXT,
    ip_address INET,
    referrer TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Company ratings and reviews (for transparency)
CREATE TABLE company_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Review content
    overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    culture_rating INTEGER CHECK (culture_rating BETWEEN 1 AND 5),
    leadership_rating INTEGER CHECK (leadership_rating BETWEEN 1 AND 5),
    compensation_rating INTEGER CHECK (compensation_rating BETWEEN 1 AND 5),
    benefits_rating INTEGER CHECK (benefits_rating BETWEEN 1 AND 5),
    
    review_title VARCHAR(255),
    review_text TEXT,
    pros TEXT,
    cons TEXT,
    advice_to_management TEXT,
    
    -- Review metadata
    employment_status VARCHAR(50) CHECK (employment_status IN ('current', 'former')),
    position_title VARCHAR(255),
    employment_length_months INTEGER,
    location VARCHAR(255),
    
    -- Moderation
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
    moderated_by UUID REFERENCES users(id),
    moderated_at TIMESTAMP WITH TIME ZONE,
    
    -- Anonymous posting option
    is_anonymous BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Job board metrics and KPIs
CREATE TABLE job_board_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    
    -- Daily totals
    total_jobs_posted INTEGER DEFAULT 0,
    total_applications INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    total_unique_visitors INTEGER DEFAULT 0,
    
    -- Quality metrics
    average_time_to_fill_days DECIMAL(5,2) DEFAULT 0,
    application_completion_rate DECIMAL(5,2) DEFAULT 0,
    employer_response_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Popular categories
    top_skills JSONB DEFAULT '[]',
    top_locations JSONB DEFAULT '[]',
    top_companies JSONB DEFAULT '[]',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance indexes
CREATE INDEX idx_job_analytics_job_date ON job_analytics(job_id, date);
CREATE INDEX idx_job_analytics_date ON job_analytics(date DESC);

CREATE INDEX idx_application_pipeline_job_id ON application_pipeline(job_id);
CREATE INDEX idx_application_pipeline_candidate_id ON application_pipeline(candidate_id);
CREATE INDEX idx_application_pipeline_status ON application_pipeline(status);
CREATE INDEX idx_application_pipeline_applied_at ON application_pipeline(applied_at DESC);

CREATE INDEX idx_saved_jobs_candidate_id ON saved_jobs(candidate_id);
CREATE INDEX idx_saved_jobs_job_id ON saved_jobs(job_id);

CREATE INDEX idx_job_alerts_candidate_id ON job_alerts(candidate_id);
CREATE INDEX idx_job_alerts_active ON job_alerts(is_active, frequency);

CREATE INDEX idx_job_views_job_id ON job_views(job_id);
CREATE INDEX idx_job_views_viewed_at ON job_views(viewed_at DESC);
CREATE INDEX idx_job_views_session ON job_views(session_id, viewed_at);

CREATE INDEX idx_company_reviews_company_id ON company_reviews(company_id);
CREATE INDEX idx_company_reviews_status ON company_reviews(status);
CREATE INDEX idx_company_reviews_rating ON company_reviews(overall_rating DESC);

CREATE INDEX idx_jobs_enhanced_slug ON jobs(slug) WHERE slug IS NOT NULL;
CREATE INDEX idx_jobs_enhanced_featured ON jobs(featured, status) WHERE featured = true;
CREATE INDEX idx_jobs_enhanced_urgent ON jobs(urgent, status) WHERE urgent = true;
CREATE INDEX idx_jobs_enhanced_department ON jobs(department);
CREATE INDEX idx_jobs_enhanced_tags ON jobs USING GIN(tags);
CREATE INDEX idx_jobs_enhanced_view_count ON jobs(view_count DESC);
CREATE INDEX idx_jobs_enhanced_application_count ON jobs(application_count DESC);

-- Add trigger to update job application count
CREATE OR REPLACE FUNCTION update_job_application_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE jobs SET application_count = application_count + 1 WHERE id = NEW.job_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE jobs SET application_count = application_count - 1 WHERE id = OLD.job_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_job_application_count
    AFTER INSERT OR DELETE ON application_pipeline
    FOR EACH ROW EXECUTE FUNCTION update_job_application_count();

-- Add trigger to update view count
CREATE OR REPLACE FUNCTION update_job_view_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE jobs SET view_count = view_count + 1 WHERE id = NEW.job_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_job_view_count
    AFTER INSERT ON job_views
    FOR EACH ROW EXECUTE FUNCTION update_job_view_count();

-- Migration complete
INSERT INTO job_board_metrics (date, total_jobs_posted) 
VALUES (CURRENT_DATE, (SELECT COUNT(*) FROM jobs WHERE status = 'active'))
ON CONFLICT (date) DO NOTHING;

COMMENT ON TABLE job_analytics IS 'Daily analytics for individual job postings';
COMMENT ON TABLE application_pipeline IS 'Enhanced application tracking with ATS-style workflow';
COMMENT ON TABLE saved_jobs IS 'Candidate saved jobs for later application';
COMMENT ON TABLE job_alerts IS 'Automated job alerts based on search criteria';
COMMENT ON TABLE job_views IS 'Detailed view tracking for analytics and personalization';
COMMENT ON TABLE company_reviews IS 'Transparent company reviews from employees';
COMMENT ON TABLE job_board_metrics IS 'Platform-wide job board performance metrics';