-- Migration: Create education table
-- Date: 2025-09-30
-- Feature: CV & Profile Tools (001-cv-profile-tools)

-- Create education table
CREATE TABLE education (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    
    -- Institution Details
    institution_name VARCHAR(200) NOT NULL CHECK (char_length(institution_name) >= 2),
    degree VARCHAR(200) NOT NULL CHECK (char_length(degree) >= 2),
    field_of_study VARCHAR(200) NOT NULL CHECK (char_length(field_of_study) >= 2),
    location VARCHAR(255),
    
    -- Timeline
    start_date DATE NOT NULL,
    end_date DATE,
    is_ongoing BOOLEAN NOT NULL DEFAULT false,
    
    -- Academic Details
    grade VARCHAR(100),
    description TEXT CHECK (char_length(description) <= 1000),
    
    -- Display Order
    sort_order INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_education_profile_id ON education(profile_id);
CREATE INDEX idx_education_start_date ON education(start_date DESC);
CREATE INDEX idx_education_ongoing ON education(is_ongoing);
CREATE INDEX idx_education_sort_order ON education(profile_id, sort_order);
CREATE INDEX idx_education_institution ON education(institution_name);
CREATE INDEX idx_education_degree ON education(degree);
CREATE INDEX idx_education_field ON education(field_of_study);

-- Add constraints
ALTER TABLE education 
    ADD CONSTRAINT education_date_range_valid 
    CHECK (end_date IS NULL OR end_date >= start_date);

ALTER TABLE education 
    ADD CONSTRAINT education_start_date_reasonable 
    CHECK (start_date >= '1950-01-01' AND start_date <= CURRENT_DATE + INTERVAL '10 years');

ALTER TABLE education 
    ADD CONSTRAINT education_ongoing_no_end_date 
    CHECK (NOT is_ongoing OR end_date IS NULL);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_education_updated_at
    BEFORE UPDATE ON education
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add function to auto-set sort order
CREATE OR REPLACE FUNCTION set_education_sort_order()
RETURNS TRIGGER AS $$
BEGIN
    -- If sort_order is not set, set it based on start_date (most recent first)
    IF NEW.sort_order = 0 OR NEW.sort_order IS NULL THEN
        SELECT COALESCE(MAX(sort_order), 0) + 1
        INTO NEW.sort_order
        FROM education
        WHERE profile_id = NEW.profile_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_education_sort_order_trigger
    BEFORE INSERT ON education
    FOR EACH ROW
    EXECUTE FUNCTION set_education_sort_order();

-- Add function to ensure ongoing education consistency
CREATE OR REPLACE FUNCTION ensure_ongoing_education_consistency()
RETURNS TRIGGER AS $$
BEGIN
    -- If marking as ongoing, ensure end_date is NULL
    IF NEW.is_ongoing = true THEN
        NEW.end_date = NULL;
    END IF;
    
    -- If setting end_date, mark as not ongoing
    IF NEW.end_date IS NOT NULL THEN
        NEW.is_ongoing = false;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_ongoing_education_consistency_trigger
    BEFORE INSERT OR UPDATE ON education
    FOR EACH ROW
    EXECUTE FUNCTION ensure_ongoing_education_consistency();

-- Add function to update profile completion status
CREATE OR REPLACE FUNCTION update_profile_on_education_change()
RETURNS TRIGGER AS $$
DECLARE
    education_count INTEGER;
    experience_count INTEGER;
BEGIN
    -- Count education entries for this profile
    SELECT COUNT(*)
    INTO education_count
    FROM education
    WHERE profile_id = COALESCE(NEW.profile_id, OLD.profile_id);
    
    -- Count work experience entries for this profile
    SELECT COUNT(*)
    INTO experience_count
    FROM work_experience
    WHERE profile_id = COALESCE(NEW.profile_id, OLD.profile_id);
    
    -- Update profile_complete status based on having both education and experience
    UPDATE candidate_profiles 
    SET profile_complete = (
        headline IS NOT NULL AND
        summary IS NOT NULL AND
        location IS NOT NULL AND
        experience_years IS NOT NULL AND
        jsonb_array_length(skills) > 0 AND
        experience_count > 0 AND
        education_count > 0
    ),
    last_active_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
    WHERE id = COALESCE(NEW.profile_id, OLD.profile_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profile_on_education_change_trigger
    AFTER INSERT OR UPDATE OR DELETE ON education
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_on_education_change();

-- Add function to validate education timeline
CREATE OR REPLACE FUNCTION validate_education_timeline()
RETURNS TRIGGER AS $$
DECLARE
    overlapping_count INTEGER;
BEGIN
    -- Check for overlapping education periods (warn but don't prevent)
    -- This is informational and could be used for data quality checks
    
    -- Count overlapping education entries for this profile
    SELECT COUNT(*)
    INTO overlapping_count
    FROM education e
    WHERE e.profile_id = NEW.profile_id
    AND e.id != NEW.id
    AND (
        -- New education overlaps with existing
        (NEW.start_date BETWEEN e.start_date AND COALESCE(e.end_date, CURRENT_DATE + INTERVAL '10 years'))
        OR
        (COALESCE(NEW.end_date, CURRENT_DATE + INTERVAL '10 years') BETWEEN e.start_date AND COALESCE(e.end_date, CURRENT_DATE + INTERVAL '10 years'))
        OR
        -- Existing education is completely within new education
        (e.start_date >= NEW.start_date AND COALESCE(e.end_date, CURRENT_DATE + INTERVAL '10 years') <= COALESCE(NEW.end_date, CURRENT_DATE + INTERVAL '10 years'))
    );
    
    -- Log warning if overlapping education found (for data quality)
    IF overlapping_count > 0 THEN
        INSERT INTO data_quality_warnings (table_name, record_id, warning_type, message, created_at)
        VALUES (
            'education', 
            NEW.id, 
            'overlapping_education', 
            'Education period overlaps with ' || overlapping_count || ' other education entries',
            CURRENT_TIMESTAMP
        )
        ON CONFLICT DO NOTHING; -- Ignore if warnings table doesn't exist
    END IF;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- If warnings table doesn't exist, just continue
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_education_timeline_trigger
    AFTER INSERT OR UPDATE ON education
    FOR EACH ROW
    EXECUTE FUNCTION validate_education_timeline();

-- Add function to get highest education level
CREATE OR REPLACE FUNCTION get_highest_education_level(profile_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    highest_degree TEXT;
    degree_hierarchy TEXT[] := ARRAY[
        'Certificate', 'Diploma', 'Associate', 'Bachelor', 'Master', 'MBA', 'PhD', 'Doctorate'
    ];
    degree_record RECORD;
    max_level INTEGER := 0;
    current_level INTEGER;
BEGIN
    highest_degree := 'Not specified';
    
    FOR degree_record IN 
        SELECT degree FROM education WHERE profile_id = profile_uuid
    LOOP
        -- Find the position of this degree in the hierarchy
        SELECT array_position(degree_hierarchy, degree_record.degree)
        INTO current_level;
        
        -- If not found in hierarchy, try partial matches
        IF current_level IS NULL THEN
            FOR i IN 1..array_length(degree_hierarchy, 1) LOOP
                IF degree_record.degree ILIKE '%' || degree_hierarchy[i] || '%' THEN
                    current_level := i;
                    EXIT;
                END IF;
            END LOOP;
        END IF;
        
        -- Update highest if this is higher
        IF current_level IS NOT NULL AND current_level > max_level THEN
            max_level := current_level;
            highest_degree := degree_hierarchy[current_level];
        END IF;
    END LOOP;
    
    RETURN highest_degree;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE education IS 'Educational background and qualifications';
COMMENT ON COLUMN education.grade IS 'Academic grade/GPA (e.g., "First Class Honours", "3.8 GPA")';
COMMENT ON COLUMN education.description IS 'Achievements, relevant coursework, honors, etc.';
COMMENT ON COLUMN education.sort_order IS 'Display order for education entries (most recent first)';
COMMENT ON FUNCTION get_highest_education_level(UUID) IS 'Returns the highest education level for a profile';
COMMENT ON FUNCTION validate_education_timeline() IS 'Validates education timeline and logs data quality warnings';

-- Create view for education with calculated duration
CREATE VIEW education_with_duration AS
SELECT 
    e.*,
    EXTRACT(YEAR FROM age(COALESCE(e.end_date, CURRENT_DATE), e.start_date)) * 12 +
    EXTRACT(MONTH FROM age(COALESCE(e.end_date, CURRENT_DATE), e.start_date)) as duration_months,
    ROUND(
        (EXTRACT(YEAR FROM age(COALESCE(e.end_date, CURRENT_DATE), e.start_date)) * 12 +
         EXTRACT(MONTH FROM age(COALESCE(e.end_date, CURRENT_DATE), e.start_date))) / 12.0, 
        1
    ) as duration_years,
    CASE 
        WHEN e.is_ongoing THEN 'Ongoing'
        WHEN e.end_date IS NULL THEN 'Unknown'
        ELSE 'Completed'
    END as status
FROM education e;

COMMENT ON VIEW education_with_duration IS 'Education with calculated duration and status';

-- Create optional data quality warnings table (for development/monitoring)
CREATE TABLE IF NOT EXISTS data_quality_warnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    warning_type VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_data_quality_warnings_table_record ON data_quality_warnings(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_data_quality_warnings_type ON data_quality_warnings(warning_type);
CREATE INDEX IF NOT EXISTS idx_data_quality_warnings_resolved ON data_quality_warnings(resolved);

COMMENT ON TABLE data_quality_warnings IS 'Data quality warnings and validation issues for monitoring';