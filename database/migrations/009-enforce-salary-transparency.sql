-- Migration 009: Enforce Salary Transparency
-- Makes salary_min and salary_max NOT NULL to ensure all jobs have transparent salary information
-- This is a core requirement of the OpenRole platform

-- Step 1: Update any existing jobs without salary information
-- Set default salary ranges based on experience level for jobs missing this data
UPDATE jobs
SET salary_min = CASE
    WHEN experience_level = 'entry' THEN 30000
    WHEN experience_level = 'mid' THEN 45000
    WHEN experience_level = 'senior' THEN 65000
    WHEN experience_level = 'lead' THEN 85000
    WHEN experience_level = 'executive' THEN 100000
    ELSE 40000  -- Default for NULL experience_level
END,
salary_max = CASE
    WHEN experience_level = 'entry' THEN 45000
    WHEN experience_level = 'mid' THEN 65000
    WHEN experience_level = 'senior' THEN 95000
    WHEN experience_level = 'lead' THEN 120000
    WHEN experience_level = 'executive' THEN 180000
    ELSE 60000  -- Default for NULL experience_level
END
WHERE salary_min IS NULL OR salary_max IS NULL;

-- Step 2: Add NOT NULL constraints to enforce salary transparency going forward
ALTER TABLE jobs
    ALTER COLUMN salary_min SET NOT NULL,
    ALTER COLUMN salary_max SET NOT NULL;

-- Step 3: Add CHECK constraint to ensure min <= max
ALTER TABLE jobs
    ADD CONSTRAINT salary_range_valid
    CHECK (salary_min <= salary_max);

-- Step 4: Add CHECK constraint to ensure positive values
ALTER TABLE jobs
    ADD CONSTRAINT salary_positive
    CHECK (salary_min >= 0 AND salary_max >= 0);

-- Step 5: Create index for salary range queries (already exists but ensuring)
CREATE INDEX IF NOT EXISTS idx_jobs_salary_range ON jobs(salary_min, salary_max);

-- Migration complete
-- All jobs now have mandatory salary transparency
