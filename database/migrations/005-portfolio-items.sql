-- Migration: Create portfolio_items table
-- Date: 2025-09-30
-- Feature: CV & Profile Tools (001-cv-profile-tools)

-- Create portfolio_items table
CREATE TABLE portfolio_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    
    -- Item Details
    title VARCHAR(200) NOT NULL CHECK (char_length(title) >= 1),
    description TEXT CHECK (char_length(description) <= 1000),
    type VARCHAR(20) NOT NULL CHECK (type IN ('project', 'article', 'design', 'code', 'document', 'link')),
    
    -- File/Link Information
    file_name VARCHAR(255),
    file_path TEXT,
    file_size INTEGER CHECK (file_size > 0),
    mime_type VARCHAR(100),
    external_url TEXT,
    
    -- Project Metadata
    technologies JSONB DEFAULT '[]'::jsonb,
    project_date DATE,
    role VARCHAR(200),
    
    -- Validation Status (FR-010)
    link_validated BOOLEAN DEFAULT false,
    last_validation_check TIMESTAMP WITH TIME ZONE,
    validation_status VARCHAR(20) DEFAULT 'pending' CHECK (
        validation_status IN ('pending', 'valid', 'invalid', 'unreachable')
    ),
    
    -- Display
    sort_order INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    
    -- Metadata
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_portfolio_items_profile_id ON portfolio_items(profile_id);
CREATE INDEX idx_portfolio_items_type ON portfolio_items(type);
CREATE INDEX idx_portfolio_items_public ON portfolio_items(is_public);
CREATE INDEX idx_portfolio_items_sort_order ON portfolio_items(profile_id, sort_order);
CREATE INDEX idx_portfolio_items_technologies ON portfolio_items USING GIN(technologies);
CREATE INDEX idx_portfolio_items_validation_status ON portfolio_items(validation_status);
CREATE INDEX idx_portfolio_items_project_date ON portfolio_items(project_date DESC);
CREATE INDEX idx_portfolio_items_external_url ON portfolio_items(external_url) WHERE external_url IS NOT NULL;

-- Add constraints
ALTER TABLE portfolio_items 
    ADD CONSTRAINT portfolio_items_file_or_url 
    CHECK (
        (file_path IS NOT NULL AND external_url IS NULL) OR
        (file_path IS NULL AND external_url IS NOT NULL) OR
        (file_path IS NULL AND external_url IS NULL AND type = 'document')
    );

ALTER TABLE portfolio_items 
    ADD CONSTRAINT portfolio_items_file_metadata_consistency 
    CHECK (
        (file_path IS NOT NULL AND file_name IS NOT NULL AND file_size IS NOT NULL AND mime_type IS NOT NULL) OR
        (file_path IS NULL)
    );

ALTER TABLE portfolio_items 
    ADD CONSTRAINT portfolio_items_external_url_validation 
    CHECK (
        external_url IS NULL OR
        external_url ~ '^https?://[^\s/$.?#].[^\s]*$'
    );

ALTER TABLE portfolio_items 
    ADD CONSTRAINT portfolio_items_project_date_reasonable 
    CHECK (
        project_date IS NULL OR 
        (project_date >= '1990-01-01' AND project_date <= CURRENT_DATE + INTERVAL '1 year')
    );

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_portfolio_items_updated_at
    BEFORE UPDATE ON portfolio_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add function to auto-set sort order
CREATE OR REPLACE FUNCTION set_portfolio_sort_order()
RETURNS TRIGGER AS $$
BEGIN
    -- If sort_order is not set, set it based on project_date (most recent first)
    IF NEW.sort_order = 0 OR NEW.sort_order IS NULL THEN
        SELECT COALESCE(MAX(sort_order), 0) + 1
        INTO NEW.sort_order
        FROM portfolio_items
        WHERE profile_id = NEW.profile_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_portfolio_sort_order_trigger
    BEFORE INSERT ON portfolio_items
    FOR EACH ROW
    EXECUTE FUNCTION set_portfolio_sort_order();

-- Add function to validate external URLs (FR-010)
CREATE OR REPLACE FUNCTION schedule_url_validation()
RETURNS TRIGGER AS $$
BEGIN
    -- Schedule URL validation for external links
    IF NEW.external_url IS NOT NULL AND (OLD.external_url IS NULL OR OLD.external_url != NEW.external_url) THEN
        -- Set initial validation status
        NEW.validation_status = 'pending';
        NEW.last_validation_check = NULL;
        NEW.link_validated = false;
        
        -- Insert into validation queue (this table would be created separately for job processing)
        INSERT INTO url_validation_queue (portfolio_item_id, url, priority, created_at)
        VALUES (NEW.id, NEW.external_url, 'normal', CURRENT_TIMESTAMP)
        ON CONFLICT DO NOTHING; -- Ignore if queue table doesn't exist
    END IF;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- If validation queue table doesn't exist, just continue
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER schedule_url_validation_trigger
    BEFORE INSERT OR UPDATE ON portfolio_items
    FOR EACH ROW
    EXECUTE FUNCTION schedule_url_validation();

-- Add function to update profile activity
CREATE OR REPLACE FUNCTION update_profile_on_portfolio_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the profile's last_active_at when portfolio is modified
    UPDATE candidate_profiles 
    SET last_active_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = COALESCE(NEW.profile_id, OLD.profile_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profile_on_portfolio_change_trigger
    AFTER INSERT OR UPDATE OR DELETE ON portfolio_items
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_on_portfolio_change();

-- Add function to get portfolio summary
CREATE OR REPLACE FUNCTION get_portfolio_summary(profile_uuid UUID)
RETURNS TABLE(
    total_items INTEGER,
    by_type JSONB,
    technologies_used JSONB,
    validation_status JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_items,
        jsonb_object_agg(type, count) as by_type,
        (
            SELECT jsonb_agg(DISTINCT tech)
            FROM portfolio_items pi,
            jsonb_array_elements_text(pi.technologies) as tech
            WHERE pi.profile_id = profile_uuid
            AND tech IS NOT NULL
        ) as technologies_used,
        jsonb_object_agg(validation_status, validation_count) as validation_status
    FROM (
        SELECT 
            type,
            COUNT(*) as count
        FROM portfolio_items 
        WHERE profile_id = profile_uuid
        GROUP BY type
    ) type_counts,
    (
        SELECT 
            validation_status,
            COUNT(*) as validation_count
        FROM portfolio_items 
        WHERE profile_id = profile_uuid
        AND external_url IS NOT NULL
        GROUP BY validation_status
    ) validation_counts;
END;
$$ LANGUAGE plpgsql;

-- Add function to update validation results
CREATE OR REPLACE FUNCTION update_portfolio_validation(
    item_id UUID,
    is_valid BOOLEAN,
    response_code INTEGER DEFAULT NULL,
    response_time_ms INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    new_status VARCHAR(20);
BEGIN
    -- Determine validation status based on results
    IF is_valid THEN
        new_status := 'valid';
    ELSIF response_code IS NOT NULL AND response_code BETWEEN 400 AND 499 THEN
        new_status := 'invalid';
    ELSE
        new_status := 'unreachable';
    END IF;
    
    -- Update portfolio item
    UPDATE portfolio_items
    SET 
        validation_status = new_status,
        link_validated = is_valid,
        last_validation_check = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = item_id;
    
    -- Log validation result
    INSERT INTO portfolio_validation_log (
        portfolio_item_id,
        validation_status,
        response_code,
        response_time_ms,
        created_at
    ) VALUES (
        item_id,
        new_status,
        response_code,
        response_time_ms,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT DO NOTHING; -- Ignore if log table doesn't exist
    
EXCEPTION WHEN OTHERS THEN
    -- If log table doesn't exist, just update the main table
    UPDATE portfolio_items
    SET 
        validation_status = new_status,
        link_validated = is_valid,
        last_validation_check = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = item_id;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE portfolio_items IS 'Work samples and project showcases with external URL validation (FR-009, FR-010)';
COMMENT ON COLUMN portfolio_items.type IS 'Portfolio item type: project, article, design, code, document, link';
COMMENT ON COLUMN portfolio_items.technologies IS 'JSONB array of technologies used in this project';
COMMENT ON COLUMN portfolio_items.validation_status IS 'External URL validation status: pending, valid, invalid, unreachable';
COMMENT ON COLUMN portfolio_items.link_validated IS 'Whether external URL has been successfully validated';
COMMENT ON FUNCTION get_portfolio_summary(UUID) IS 'Returns portfolio statistics by type, technologies, and validation status';
COMMENT ON FUNCTION update_portfolio_validation(UUID, BOOLEAN, INTEGER, INTEGER) IS 'Updates portfolio item validation results';

-- Create view for public portfolio items
CREATE VIEW public_portfolio_items AS
SELECT 
    pi.*,
    cp.privacy_level
FROM portfolio_items pi
JOIN candidate_profiles cp ON pi.profile_id = cp.id
WHERE pi.is_public = true 
AND cp.profile_visible_to_employers = true
AND cp.privacy_level != 'anonymous';

COMMENT ON VIEW public_portfolio_items IS 'Portfolio items visible to employers based on privacy settings';

-- Create optional URL validation queue table (for background job processing)
CREATE TABLE IF NOT EXISTS url_validation_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_item_id UUID NOT NULL REFERENCES portfolio_items(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    next_attempt_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(portfolio_item_id, url)
);

CREATE INDEX IF NOT EXISTS idx_url_validation_queue_next_attempt ON url_validation_queue(next_attempt_at) WHERE completed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_url_validation_queue_priority ON url_validation_queue(priority, created_at);

COMMENT ON TABLE url_validation_queue IS 'Queue for background URL validation jobs (FR-010)';

-- Create optional portfolio validation log table
CREATE TABLE IF NOT EXISTS portfolio_validation_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_item_id UUID NOT NULL REFERENCES portfolio_items(id) ON DELETE CASCADE,
    validation_status VARCHAR(20) NOT NULL,
    response_code INTEGER,
    response_time_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_portfolio_validation_log_item_date ON portfolio_validation_log(portfolio_item_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portfolio_validation_log_status ON portfolio_validation_log(validation_status);

COMMENT ON TABLE portfolio_validation_log IS 'Log of URL validation attempts and results for monitoring';