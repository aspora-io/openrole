-- Create job postings for scraped companies
-- This script selects random companies and creates realistic job postings

-- First, let's migrate some scraped companies to the main companies table
INSERT INTO companies (name, description, website, industry, size_category, verified, created_at)
SELECT 
    company_name,
    'A ' || COALESCE(company_type, 'company') || ' operating in the ' || sector_keyword || ' sector',
    company_url,
    sector_keyword,
    CASE 
        WHEN company_type = 'plc' THEN 'large'
        WHEN RANDOM() < 0.3 THEN 'small'
        WHEN RANDOM() < 0.7 THEN 'medium'
        ELSE 'large'
    END,
    true, -- Mark as verified since they're from Companies House
    CURRENT_TIMESTAMP
FROM scraped_companies
WHERE company_status = 'active'
    AND company_name NOT IN (SELECT name FROM companies)
ORDER BY RANDOM()
LIMIT 50;

-- Update scraped_companies to mark them as imported
UPDATE scraped_companies 
SET imported_to_companies = true,
    imported_at = CURRENT_TIMESTAMP
WHERE company_name IN (SELECT name FROM companies);

-- Create various job postings for different sectors
WITH job_templates AS (
    SELECT * FROM (VALUES
        -- Technology jobs
        ('Senior Software Engineer', 'technology', 60000, 90000, 'We are looking for an experienced software engineer to join our growing team. You will work on challenging projects using modern technologies.', 'full-time', 'senior', 'office'),
        ('Full Stack Developer', 'technology', 45000, 70000, 'Join our development team to build scalable web applications. Experience with React and Node.js required.', 'full-time', 'mid', 'hybrid'),
        ('DevOps Engineer', 'technology', 55000, 80000, 'Help us build and maintain our cloud infrastructure. AWS experience essential.', 'full-time', 'senior', 'remote'),
        ('Junior Developer', 'technology', 28000, 35000, 'Great opportunity for a graduate or junior developer to join our team and learn from experienced professionals.', 'full-time', 'junior', 'office'),
        
        -- Software jobs
        ('Python Developer', 'software', 50000, 75000, 'We need a Python expert to work on data processing and API development projects.', 'full-time', 'mid', 'hybrid'),
        ('Mobile App Developer', 'software', 45000, 65000, 'Create amazing iOS and Android applications for our clients. React Native experience a plus.', 'full-time', 'mid', 'remote'),
        ('QA Engineer', 'software', 35000, 50000, 'Ensure the quality of our software products through comprehensive testing strategies.', 'full-time', 'mid', 'office'),
        
        -- Finance jobs
        ('Financial Analyst', 'finance', 40000, 60000, 'Analyze financial data and provide insights to support business decisions. CFA qualification preferred.', 'full-time', 'mid', 'office'),
        ('Accountant', 'finance', 35000, 50000, 'Manage company accounts and ensure compliance with financial regulations. ACCA/ACA qualified.', 'full-time', 'mid', 'hybrid'),
        ('Finance Manager', 'finance', 55000, 75000, 'Lead our finance team and oversee all financial operations. Strong leadership skills required.', 'full-time', 'senior', 'office'),
        
        -- Healthcare jobs
        ('Healthcare Administrator', 'healthcare', 28000, 40000, 'Support the smooth running of our healthcare facility. Excellent organizational skills needed.', 'full-time', 'mid', 'office'),
        ('Clinical Research Coordinator', 'healthcare', 35000, 50000, 'Coordinate clinical trials and research projects. Science degree required.', 'full-time', 'mid', 'office'),
        
        -- Marketing jobs
        ('Digital Marketing Manager', 'marketing', 40000, 55000, 'Lead our digital marketing efforts across all channels. SEO and PPC experience essential.', 'full-time', 'senior', 'hybrid'),
        ('Content Creator', 'marketing', 28000, 38000, 'Create engaging content for our social media and website. Creative writing skills essential.', 'full-time', 'junior', 'remote'),
        ('Marketing Executive', 'marketing', 25000, 35000, 'Support our marketing team with campaigns and events. Great opportunity for career growth.', 'full-time', 'junior', 'office'),
        
        -- Recruitment jobs
        ('Recruitment Consultant', 'recruitment', 25000, 45000, 'Build relationships with clients and candidates. Uncapped commission structure.', 'full-time', 'mid', 'office'),
        ('Senior Recruiter', 'recruitment', 35000, 55000, 'Lead recruitment for key accounts. Proven track record in recruitment required.', 'full-time', 'senior', 'hybrid'),
        
        -- Retail jobs
        ('Store Manager', 'retail', 28000, 40000, 'Manage our retail location and lead a team to deliver excellent customer service.', 'full-time', 'mid', 'office'),
        ('Retail Buyer', 'retail', 35000, 50000, 'Select and purchase products for our stores. Fashion retail experience preferred.', 'full-time', 'mid', 'hybrid'),
        
        -- Consulting jobs
        ('Management Consultant', 'consulting', 45000, 70000, 'Advise clients on business transformation projects. MBA preferred.', 'full-time', 'mid', 'office'),
        ('Business Analyst', 'consulting', 35000, 55000, 'Analyze business processes and recommend improvements. Strong analytical skills required.', 'full-time', 'mid', 'hybrid'),
        
        -- Manufacturing jobs
        ('Production Manager', 'manufacturing', 40000, 55000, 'Oversee manufacturing operations and ensure quality standards. Lean Six Sigma experience valued.', 'full-time', 'senior', 'office'),
        ('Quality Control Inspector', 'manufacturing', 25000, 35000, 'Ensure products meet quality standards. Attention to detail essential.', 'full-time', 'mid', 'office'),
        
        -- Construction jobs
        ('Project Manager', 'construction', 45000, 65000, 'Manage construction projects from start to finish. PRINCE2 certification preferred.', 'full-time', 'senior', 'office'),
        ('Site Supervisor', 'construction', 35000, 50000, 'Supervise construction sites and ensure safety compliance. CSCS card required.', 'full-time', 'mid', 'office')
    ) AS t(title, sector, salary_min, salary_max, description, employment_type, experience_level, remote_type)
),
matched_companies AS (
    SELECT 
        c.id as company_id,
        c.name as company_name,
        c.industry,
        ROW_NUMBER() OVER (PARTITION BY c.industry ORDER BY RANDOM()) as rn
    FROM companies c
    WHERE c.verified = true
)
INSERT INTO jobs (
    title,
    description,
    company_id,
    salary_min,
    salary_max,
    salary_currency,
    location_general,
    location_precise,
    remote_type,
    employment_type,
    experience_level,
    status,
    created_at
)
SELECT 
    jt.title,
    jt.description || E'\n\nAbout ' || mc.company_name || ':\n' || 
    'We are a ' || COALESCE(mc.industry, 'business') || ' company committed to excellence and innovation. ' ||
    'Join our team and be part of our success story.',
    mc.company_id,
    jt.salary_min,
    jt.salary_max,
    'GBP',
    CASE (RANDOM() * 10)::INT
        WHEN 0 THEN 'London'
        WHEN 1 THEN 'Manchester'
        WHEN 2 THEN 'Birmingham'
        WHEN 3 THEN 'Leeds'
        WHEN 4 THEN 'Glasgow'
        WHEN 5 THEN 'Edinburgh'
        WHEN 6 THEN 'Bristol'
        WHEN 7 THEN 'Liverpool'
        WHEN 8 THEN 'Newcastle'
        ELSE 'London'
    END,
    NULL, -- No precise location for now
    jt.remote_type,
    jt.employment_type,
    jt.experience_level,
    'active',
    CURRENT_TIMESTAMP - (RANDOM() * INTERVAL '30 days')
FROM job_templates jt
JOIN matched_companies mc ON mc.industry = jt.sector
WHERE mc.rn <= 5 -- Up to 5 companies per sector get jobs
    AND NOT EXISTS (
        SELECT 1 FROM jobs j 
        WHERE j.company_id = mc.company_id 
        AND j.title = jt.title
    );

-- Add some contract and part-time positions
INSERT INTO jobs (
    title,
    description,
    company_id,
    salary_min,
    salary_max,
    salary_currency,
    location_general,
    remote_type,
    employment_type,
    experience_level,
    status,
    created_at
)
SELECT 
    'Contract ' || title,
    'This is a 6-month contract position. ' || description,
    company_id,
    salary_min * 1.2, -- Contract rates typically higher
    salary_max * 1.2,
    salary_currency,
    location_general,
    remote_type,
    'contract',
    experience_level,
    'active',
    created_at + INTERVAL '1 day'
FROM jobs
WHERE employment_type = 'full-time'
ORDER BY RANDOM()
LIMIT 15;

-- Summary of what was created
SELECT 'Companies imported from scraper:' as summary, COUNT(*) as count FROM companies WHERE verified = true
UNION ALL
SELECT 'Total active jobs created:', COUNT(*) FROM jobs WHERE status = 'active'
UNION ALL
SELECT 'Jobs by employment type:', employment_type || ': ' || COUNT(*) FROM jobs GROUP BY employment_type
UNION ALL
SELECT 'Jobs by location:', location_general || ': ' || COUNT(*) FROM jobs GROUP BY location_general ORDER BY COUNT(*) DESC LIMIT 5;