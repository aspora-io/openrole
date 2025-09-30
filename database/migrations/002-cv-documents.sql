-- Migration: Create cv_documents table
-- Date: 2025-09-30
-- Feature: CV & Profile Tools (001-cv-profile-tools)

-- Create cv_documents table
CREATE TABLE cv_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES candidate_profiles(id) ON DELETE CASCADE,
    
    -- File Information
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL CHECK (file_size > 0 AND file_size <= 10485760), -- 10MB limit
    mime_type VARCHAR(100) NOT NULL CHECK (
        mime_type IN (
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
    ),
    
    -- Version Control (FR-006)
    version INTEGER NOT NULL DEFAULT 1,
    label VARCHAR(100) NOT NULL CHECK (char_length(label) >= 1),
    is_default BOOLEAN DEFAULT false,
    
    -- Generation Metadata (FR-008)
    generated_from_profile BOOLEAN DEFAULT false,
    template_used VARCHAR(255),
    generated_at TIMESTAMP WITH TIME ZONE,
    
    -- Security
    access_token UUID DEFAULT uuid_generate_v4(),
    token_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
    virus_scanned BOOLEAN DEFAULT false,
    scan_results JSONB DEFAULT '{}'::jsonb,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'processing' CHECK (
        status IN ('processing', 'active', 'archived', 'failed')
    ),
    
    -- Metadata
    download_count INTEGER DEFAULT 0,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_cv_document_profile_id ON cv_documents(profile_id);
CREATE INDEX idx_cv_document_status ON cv_documents(status);
CREATE INDEX idx_cv_document_access_token ON cv_documents(access_token);
CREATE INDEX idx_cv_document_version ON cv_documents(profile_id, version);
CREATE INDEX idx_cv_document_created ON cv_documents(created_at);
CREATE INDEX idx_cv_document_generated ON cv_documents(generated_from_profile);

-- Create unique constraint for default CV (only one default per profile)
CREATE UNIQUE INDEX unique_cv_document_default 
ON cv_documents(profile_id) 
WHERE is_default = true;

-- Create unique constraint for filename per profile
ALTER TABLE cv_documents 
    ADD CONSTRAINT cv_documents_filename_profile_unique 
    UNIQUE (profile_id, filename);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_cv_documents_updated_at
    BEFORE UPDATE ON cv_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add function to generate new access token
CREATE OR REPLACE FUNCTION generate_cv_access_token(cv_id UUID, expires_in_hours INTEGER DEFAULT 24)
RETURNS TABLE(access_token UUID, expires_at TIMESTAMP WITH TIME ZONE) AS $$
DECLARE
    new_token UUID;
    new_expiry TIMESTAMP WITH TIME ZONE;
BEGIN
    new_token := uuid_generate_v4();
    new_expiry := CURRENT_TIMESTAMP + (expires_in_hours || ' hours')::INTERVAL;
    
    UPDATE cv_documents 
    SET access_token = new_token,
        token_expires_at = new_expiry,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = cv_id;
    
    RETURN QUERY SELECT new_token, new_expiry;
END;
$$ LANGUAGE plpgsql;

-- Add function to automatically set version number
CREATE OR REPLACE FUNCTION set_cv_version()
RETURNS TRIGGER AS $$
DECLARE
    next_version INTEGER;
BEGIN
    -- Get the next version number for this profile
    SELECT COALESCE(MAX(version), 0) + 1
    INTO next_version
    FROM cv_documents
    WHERE profile_id = NEW.profile_id;
    
    NEW.version = next_version;
    
    -- If this is the first CV for the profile, make it default
    IF next_version = 1 THEN
        NEW.is_default = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_cv_version_trigger
    BEFORE INSERT ON cv_documents
    FOR EACH ROW
    EXECUTE FUNCTION set_cv_version();

-- Add function to ensure only one default CV per profile
CREATE OR REPLACE FUNCTION ensure_single_default_cv()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting this CV as default, unset all others for this profile
    IF NEW.is_default = true THEN
        UPDATE cv_documents 
        SET is_default = false 
        WHERE profile_id = NEW.profile_id 
        AND id != NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_default_cv_trigger
    BEFORE INSERT OR UPDATE ON cv_documents
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_default_cv();

-- Add function to update profile completion status when CV is added
CREATE OR REPLACE FUNCTION update_profile_on_cv_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the profile's last_active_at when CV is modified
    UPDATE candidate_profiles 
    SET last_active_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = COALESCE(NEW.profile_id, OLD.profile_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profile_on_cv_change_trigger
    AFTER INSERT OR UPDATE OR DELETE ON cv_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_on_cv_change();

-- Add comments for documentation
COMMENT ON TABLE cv_documents IS 'CV files and metadata with version control (FR-002, FR-006, FR-008)';
COMMENT ON COLUMN cv_documents.version IS 'Auto-incremented version number per profile';
COMMENT ON COLUMN cv_documents.is_default IS 'Only one default CV allowed per profile';
COMMENT ON COLUMN cv_documents.access_token IS 'UUID token for secure file downloads';
COMMENT ON COLUMN cv_documents.file_size IS 'File size in bytes, max 10MB (10485760 bytes)';
COMMENT ON COLUMN cv_documents.status IS 'Processing status: processing, active, archived, failed';
COMMENT ON FUNCTION generate_cv_access_token(UUID, INTEGER) IS 'Generates new access token for secure CV download';
COMMENT ON FUNCTION set_cv_version() IS 'Automatically sets version number and default status for new CVs';

-- Add check constraint for token expiry (must be in future when created)
ALTER TABLE cv_documents 
    ADD CONSTRAINT token_expiry_future 
    CHECK (token_expires_at > created_at);