-- Migration: Add scraped companies table for employer verification
-- This stores UK companies scraped from Companies House

-- Create scraped companies table
CREATE TABLE IF NOT EXISTS scraped_companies (
    id SERIAL PRIMARY KEY,
    company_number VARCHAR(20) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    company_type VARCHAR(50),
    company_status VARCHAR(50) DEFAULT 'active',
    date_of_creation DATE,
    address TEXT,
    locality VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'United Kingdom',
    sector_keyword VARCHAR(100),
    sic_codes TEXT[], -- Array of SIC codes
    company_url TEXT,
    website_url TEXT,
    employee_count_estimate VARCHAR(50),
    
    -- Verification fields
    verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    verified_by INTEGER REFERENCES users(id),
    verification_notes TEXT,
    
    -- Integration status
    imported_to_companies BOOLEAN DEFAULT FALSE,
    imported_at TIMESTAMP,
    import_notes TEXT,
    
    -- Metadata
    scraped_at TIMESTAMP NOT NULL,
    last_checked_at TIMESTAMP,
    data_source VARCHAR(50) DEFAULT 'companies_house',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_scraped_companies_status ON scraped_companies(company_status);
CREATE INDEX idx_scraped_companies_verified ON scraped_companies(verified);
CREATE INDEX idx_scraped_companies_imported ON scraped_companies(imported_to_companies);
CREATE INDEX idx_scraped_companies_sector ON scraped_companies(sector_keyword);
CREATE INDEX idx_scraped_companies_name ON scraped_companies(company_name);
CREATE INDEX idx_scraped_companies_postal ON scraped_companies(postal_code);

-- Add trigger for updated_at
CREATE TRIGGER update_scraped_companies_updated_at
    BEFORE UPDATE ON scraped_companies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create a view for easily finding companies to verify
CREATE VIEW companies_to_verify AS
SELECT 
    sc.*,
    CASE 
        WHEN sc.company_type = 'ltd' THEN 'Private Limited Company'
        WHEN sc.company_type = 'plc' THEN 'Public Limited Company'
        WHEN sc.company_type = 'llp' THEN 'Limited Liability Partnership'
        ELSE sc.company_type
    END as company_type_full,
    DATE_PART('year', AGE(CURRENT_DATE, sc.date_of_creation)) as years_active
FROM scraped_companies sc
WHERE 
    sc.verified = FALSE 
    AND sc.company_status = 'active'
    AND sc.imported_to_companies = FALSE
ORDER BY 
    sc.scraped_at DESC,
    sc.company_name;

-- Create a function to import verified companies to main companies table
CREATE OR REPLACE FUNCTION import_scraped_company(scraped_company_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    new_company_id INTEGER;
    scraped_record RECORD;
BEGIN
    -- Get the scraped company record
    SELECT * INTO scraped_record 
    FROM scraped_companies 
    WHERE id = scraped_company_id AND verified = TRUE AND imported_to_companies = FALSE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Company not found or not eligible for import';
    END IF;
    
    -- Insert into companies table
    INSERT INTO companies (
        name,
        registration_number,
        description,
        website,
        size,
        location,
        verified,
        verified_at,
        active
    ) VALUES (
        scraped_record.company_name,
        scraped_record.company_number,
        COALESCE(scraped_record.company_type_full, 'UK Registered Company'),
        scraped_record.website_url,
        COALESCE(scraped_record.employee_count_estimate, '1-10'),
        COALESCE(scraped_record.locality, scraped_record.postal_code, 'United Kingdom'),
        TRUE,
        CURRENT_TIMESTAMP,
        TRUE
    ) RETURNING id INTO new_company_id;
    
    -- Mark as imported
    UPDATE scraped_companies 
    SET 
        imported_to_companies = TRUE,
        imported_at = CURRENT_TIMESTAMP,
        import_notes = 'Imported to companies table with ID: ' || new_company_id
    WHERE id = scraped_company_id;
    
    RETURN new_company_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to bulk verify companies by sector
CREATE OR REPLACE FUNCTION bulk_verify_companies_by_sector(
    p_sector VARCHAR(100),
    p_verifier_id INTEGER,
    p_limit INTEGER DEFAULT 100
)
RETURNS INTEGER AS $$
DECLARE
    verified_count INTEGER := 0;
BEGIN
    UPDATE scraped_companies
    SET 
        verified = TRUE,
        verified_at = CURRENT_TIMESTAMP,
        verified_by = p_verifier_id,
        verification_notes = 'Bulk verified by sector: ' || p_sector
    WHERE 
        sector_keyword = p_sector
        AND verified = FALSE
        AND company_status = 'active'
        AND id IN (
            SELECT id 
            FROM scraped_companies 
            WHERE sector_keyword = p_sector 
                AND verified = FALSE 
                AND company_status = 'active'
            ORDER BY date_of_creation DESC
            LIMIT p_limit
        );
    
    GET DIAGNOSTICS verified_count = ROW_COUNT;
    RETURN verified_count;
END;
$$ LANGUAGE plpgsql;

-- Add some sample data for testing
INSERT INTO scraped_companies (
    company_number, company_name, company_type, company_status,
    date_of_creation, address, locality, postal_code,
    sector_keyword, scraped_at
) VALUES 
    ('12345678', 'Tech Innovators Ltd', 'ltd', 'active', 
     '2020-01-15', '123 Tech Street', 'London', 'EC1A 1BB',
     'technology', CURRENT_TIMESTAMP),
    
    ('87654321', 'Digital Solutions PLC', 'plc', 'active',
     '2018-06-20', '456 Digital Avenue', 'Manchester', 'M1 1AD',
     'software', CURRENT_TIMESTAMP),
    
    ('11223344', 'HR Recruitment Services LLP', 'llp', 'active',
     '2019-03-10', '789 Business Park', 'Birmingham', 'B1 1AA',
     'recruitment', CURRENT_TIMESTAMP)
ON CONFLICT (company_number) DO NOTHING;

-- Create a dashboard view for scraped companies statistics
CREATE VIEW scraped_companies_stats AS
SELECT 
    COUNT(*) as total_companies,
    COUNT(*) FILTER (WHERE verified = TRUE) as verified_companies,
    COUNT(*) FILTER (WHERE imported_to_companies = TRUE) as imported_companies,
    COUNT(DISTINCT sector_keyword) as unique_sectors,
    COUNT(DISTINCT locality) as unique_locations,
    MIN(scraped_at) as oldest_scrape,
    MAX(scraped_at) as latest_scrape,
    COUNT(*) FILTER (WHERE date_of_creation > CURRENT_DATE - INTERVAL '1 year') as companies_under_1_year,
    COUNT(*) FILTER (WHERE date_of_creation > CURRENT_DATE - INTERVAL '5 years') as companies_under_5_years
FROM scraped_companies
WHERE company_status = 'active';