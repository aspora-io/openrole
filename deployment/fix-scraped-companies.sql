-- Fix scraped_companies table
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
    verified_by UUID REFERENCES users(id), -- Fixed to UUID type
    verification_notes TEXT,
    
    -- Integration status
    imported_to_companies BOOLEAN DEFAULT FALSE,
    imported_at TIMESTAMP,
    import_notes TEXT,
    
    -- Metadata
    scraped_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_checked_at TIMESTAMP,
    data_source VARCHAR(50) DEFAULT 'companies_house',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scraped_companies_status ON scraped_companies(company_status);
CREATE INDEX IF NOT EXISTS idx_scraped_companies_verified ON scraped_companies(verified);
CREATE INDEX IF NOT EXISTS idx_scraped_companies_imported ON scraped_companies(imported_to_companies);
CREATE INDEX IF NOT EXISTS idx_scraped_companies_sector ON scraped_companies(sector_keyword);
CREATE INDEX IF NOT EXISTS idx_scraped_companies_name ON scraped_companies(company_name);
CREATE INDEX IF NOT EXISTS idx_scraped_companies_postal ON scraped_companies(postal_code);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_scraped_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_scraped_companies_timestamp
    BEFORE UPDATE ON scraped_companies
    FOR EACH ROW
    EXECUTE FUNCTION update_scraped_companies_updated_at();