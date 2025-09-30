-- Migration: Create work_experience table
-- Date: 2025-09-30
-- Feature: CV & Profile Tools (001-cv-profile-tools)

-- Create work_experience table
CREATE TABLE work_experience (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    
    -- Position Details
    job_title VARCHAR(200) NOT NULL CHECK (char_length(job_title) >= 2),
    company_name VARCHAR(200) NOT NULL CHECK (char_length(company_name) >= 2),
    company_website TEXT,
    location VARCHAR(255),
    
    -- Timeline
    start_date DATE NOT NULL,
    end_date DATE,
    is_current BOOLEAN NOT NULL DEFAULT false,
    
    -- Description (FR-011: Achievements vs Responsibilities)
    description TEXT NOT NULL CHECK (char_length(description) >= 10 AND char_length(description) <= 2000),
    achievements JSONB DEFAULT '[]'::jsonb,
    skills JSONB DEFAULT '[]'::jsonb,
    
    -- Display Order
    sort_order INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_work_experience_profile_id ON work_experience(profile_id);
CREATE INDEX idx_work_experience_start_date ON work_experience(start_date DESC);
CREATE INDEX idx_work_experience_current ON work_experience(is_current);
CREATE INDEX idx_work_experience_sort_order ON work_experience(profile_id, sort_order);
CREATE INDEX idx_work_experience_company ON work_experience(company_name);
CREATE INDEX idx_work_experience_skills ON work_experience USING GIN(skills);

-- Add constraints
ALTER TABLE work_experience 
    ADD CONSTRAINT work_experience_date_range_valid 
    CHECK (end_date IS NULL OR end_date >= start_date);

ALTER TABLE work_experience 
    ADD CONSTRAINT work_experience_start_date_not_future 
    CHECK (start_date <= CURRENT_DATE);

ALTER TABLE work_experience 
    ADD CONSTRAINT work_experience_current_no_end_date 
    CHECK (NOT is_current OR end_date IS NULL);

ALTER TABLE work_experience 
    ADD CONSTRAINT work_experience_achievements_limit 
    CHECK (jsonb_array_length(achievements) <= 20);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_work_experience_updated_at
    BEFORE UPDATE ON work_experience
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add function to validate achievements format
CREATE OR REPLACE FUNCTION validate_achievements(achievements_json JSONB)
RETURNS BOOLEAN AS $$
DECLARE
    achievement TEXT;
BEGIN
    -- Check if achievements is an array
    IF jsonb_typeof(achievements_json) != 'array' THEN
        RETURN false;
    END IF;
    
    -- Validate each achievement
    FOR achievement IN SELECT jsonb_array_elements_text(achievements_json)
    LOOP
        -- Each achievement should be 10-500 characters
        IF char_length(achievement) < 10 OR char_length(achievement) > 500 THEN
            RETURN false;
        END IF;
    END LOOP;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Add constraint to validate achievements format
ALTER TABLE work_experience 
    ADD CONSTRAINT work_experience_achievements_valid 
    CHECK (validate_achievements(achievements));

-- Add function to auto-set sort order
CREATE OR REPLACE FUNCTION set_work_experience_sort_order()
RETURNS TRIGGER AS $$
BEGIN
    -- If sort_order is not set, set it based on start_date (most recent first)
    IF NEW.sort_order = 0 OR NEW.sort_order IS NULL THEN
        SELECT COALESCE(MAX(sort_order), 0) + 1
        INTO NEW.sort_order
        FROM work_experience
        WHERE profile_id = NEW.profile_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_work_experience_sort_order_trigger
    BEFORE INSERT ON work_experience
    FOR EACH ROW
    EXECUTE FUNCTION set_work_experience_sort_order();

-- Add function to update profile completion status
CREATE OR REPLACE FUNCTION update_profile_on_experience_change()
RETURNS TRIGGER AS $$
DECLARE
    experience_count INTEGER;
BEGIN
    -- Count work experience entries for this profile
    SELECT COUNT(*)
    INTO experience_count
    FROM work_experience
    WHERE profile_id = COALESCE(NEW.profile_id, OLD.profile_id);
    
    -- Update profile_complete status based on having work experience
    UPDATE candidate_profiles 
    SET profile_complete = (
        headline IS NOT NULL AND
        summary IS NOT NULL AND
        location IS NOT NULL AND
        experience_years IS NOT NULL AND
        jsonb_array_length(skills) > 0 AND
        experience_count > 0
    ),
    last_active_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
    WHERE id = COALESCE(NEW.profile_id, OLD.profile_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profile_on_experience_change_trigger
    AFTER INSERT OR UPDATE OR DELETE ON work_experience
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_on_experience_change();

-- Add function to ensure current job consistency
CREATE OR REPLACE FUNCTION ensure_current_job_consistency()
RETURNS TRIGGER AS $$
BEGIN
    -- If marking as current, ensure end_date is NULL
    IF NEW.is_current = true THEN
        NEW.end_date = NULL;
    END IF;
    
    -- If setting end_date, mark as not current
    IF NEW.end_date IS NOT NULL THEN
        NEW.is_current = false;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_current_job_consistency_trigger
    BEFORE INSERT OR UPDATE ON work_experience
    FOR EACH ROW
    EXECUTE FUNCTION ensure_current_job_consistency();

-- Add function to calculate total experience
CREATE OR REPLACE FUNCTION calculate_total_experience(profile_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE
    total_months NUMERIC := 0;
    exp_record RECORD;
BEGIN
    FOR exp_record IN 
        SELECT start_date, COALESCE(end_date, CURRENT_DATE) as end_date
        FROM work_experience 
        WHERE profile_id = profile_uuid
        ORDER BY start_date
    LOOP
        total_months := total_months + 
            EXTRACT(YEAR FROM age(exp_record.end_date, exp_record.start_date)) * 12 +
            EXTRACT(MONTH FROM age(exp_record.end_date, exp_record.start_date));
    END LOOP;
    
    RETURN ROUND(total_months / 12.0, 1);
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE work_experience IS 'Professional work history with achievements vs responsibilities (FR-011)';
COMMENT ON COLUMN work_experience.achievements IS 'JSONB array of measurable achievements (max 20 items, 10-500 chars each)';
COMMENT ON COLUMN work_experience.description IS 'General job responsibilities and duties';
COMMENT ON COLUMN work_experience.skills IS 'JSONB array of skills used in this role';
COMMENT ON COLUMN work_experience.sort_order IS 'Display order for work experience entries';
COMMENT ON FUNCTION calculate_total_experience(UUID) IS 'Calculates total years of experience for a profile';
COMMENT ON FUNCTION validate_achievements(JSONB) IS 'Validates achievements array format and content length';

-- Create view for experience with calculated duration
CREATE VIEW work_experience_with_duration AS
SELECT 
    we.*,
    EXTRACT(YEAR FROM age(COALESCE(we.end_date, CURRENT_DATE), we.start_date)) * 12 +
    EXTRACT(MONTH FROM age(COALESCE(we.end_date, CURRENT_DATE), we.start_date)) as duration_months,
    ROUND(
        (EXTRACT(YEAR FROM age(COALESCE(we.end_date, CURRENT_DATE), we.start_date)) * 12 +
         EXTRACT(MONTH FROM age(COALESCE(we.end_date, CURRENT_DATE), we.start_date))) / 12.0, 
        1
    ) as duration_years
FROM work_experience we;

COMMENT ON VIEW work_experience_with_duration IS 'Work experience with calculated duration in months and years';