#!/usr/bin/env python3
"""
Convert jobber CSV to SQL INSERT statements for OpenRole database
"""

import csv
import json
import uuid
from datetime import datetime, timedelta

def sanitize_sql_string(s):
    """Sanitize string for SQL insertion"""
    if not s:
        return "''"
    # Escape single quotes and backslashes
    s = str(s).replace("'", "''").replace("\\", "\\\\")
    return f"'{s}'"

def parse_salary_eur(salary_min, salary_max):
    """Convert GBP salary to EUR"""
    GBP_TO_EUR = 1.17
    try:
        min_val = int(float(salary_min) * GBP_TO_EUR) if salary_min else None
        max_val = int(float(salary_max) * GBP_TO_EUR) if salary_max else None
        return min_val, max_val
    except:
        return None, None

def extract_skills(title):
    """Extract basic skills from job title"""
    skills = []
    tech_keywords = ['python', 'javascript', 'java', 'react', 'node', 'aws', 'sql', 'api', 'software', 'engineer', 'developer']
    title_lower = title.lower()
    
    for skill in tech_keywords:
        if skill in title_lower:
            skills.append(skill.title())
    
    if not skills:
        skills = ['Software Development']
    
    return skills[:3]  # Max 3 skills

def normalize_location(city, region, location_raw):
    """Normalize location"""
    if city and region:
        precise = f"{city}, {region}"
        general = 'London' if 'London' in region or 'London' in city else region
    else:
        precise = location_raw
        general = city or region or 'UK'
    
    return precise, general

def determine_experience_level(title, salary_eur):
    """Determine experience level"""
    title_lower = title.lower()
    if any(word in title_lower for word in ['senior', 'lead', 'principal', 'staff']):
        return 'senior'
    elif any(word in title_lower for word in ['junior', 'graduate', 'intern', 'entry']):
        return 'entry'
    elif salary_eur and salary_eur > 80000:
        return 'senior'
    elif salary_eur and salary_eur < 40000:
        return 'entry'
    else:
        return 'mid'

def csv_to_sql(csv_file_path, output_file_path):
    """Convert CSV to SQL INSERT statements"""
    
    # Company mapping to avoid duplicates
    companies = {}
    job_inserts = []
    
    with open(csv_file_path, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        
        for row in reader:
            # Parse salary
            salary_min, salary_max = parse_salary_eur(
                row.get('salary_min', ''),
                row.get('salary_max', '')
            )
            
            # Skip jobs without salary (OpenRole requires transparency)
            if not salary_min:
                continue
            
            # Company handling
            company_name = row.get('company', 'Unknown Company')
            if company_name not in companies:
                company_id = str(uuid.uuid4())
                companies[company_name] = company_id
            else:
                company_id = companies[company_name]
            
            # Location
            location_precise, location_general = normalize_location(
                row.get('city', ''),
                row.get('region', ''),
                row.get('location_raw', '')
            )
            
            # Skills
            skills = extract_skills(row.get('title', ''))
            
            # Job type mapping
            job_type = row.get('job_type', '').lower()
            employment_type = 'contract' if job_type in ['contract', 'temporary'] else 'full-time'
            
            # Experience level
            experience_level = determine_experience_level(row.get('title', ''), salary_min)
            
            # Remote type
            is_remote = row.get('is_remote', 'False').lower() == 'true'
            remote_type = 'remote' if is_remote else 'office'
            
            # Expiry date (30 days from now)
            expires_at = (datetime.now() + timedelta(days=30)).strftime('%Y-%m-%d %H:%M:%S')
            
            # Build job insert
            job_id = str(uuid.uuid4())
            job_insert = f"""INSERT INTO jobs (
    id, title, description, company_id,
    salary_min, salary_max, salary_currency, salary_type,
    location_precise, location_general, remote_type,
    employment_type, experience_level,
    core_skills, nice_to_have_skills,
    status, expires_at
) VALUES (
    '{job_id}',
    {sanitize_sql_string(row.get('title', ''))},
    {sanitize_sql_string(f"Exciting opportunity at {company_name}. {row.get('title', '')} role.")},
    '{company_id}',
    {salary_min}, {salary_max}, 'EUR', 'annual',
    {sanitize_sql_string(location_precise)},
    {sanitize_sql_string(location_general)},
    '{remote_type}',
    '{employment_type}',
    '{experience_level}',
    '{json.dumps(skills)}',
    '[]',
    'active',
    '{expires_at}'
);"""
            
            job_inserts.append(job_insert)
    
    # Write SQL file
    with open(output_file_path, 'w', encoding='utf-8') as f:
        f.write("-- OpenRole Jobs Import from Jobber Data\n")
        f.write("-- Generated on: " + datetime.now().strftime('%Y-%m-%d %H:%M:%S') + "\n\n")
        
        # Company inserts
        f.write("-- Insert companies\n")
        for company_name, company_id in companies.items():
            f.write(f"""INSERT INTO companies (id, name, description, industry, size_category, verified) 
VALUES ('{company_id}', {sanitize_sql_string(company_name)}, 'Technology company', 'Technology', 'medium', false);
""")
        
        f.write("\n-- Insert jobs\n")
        for job_insert in job_inserts:
            f.write(job_insert + "\n\n")
        
        f.write(f"-- Import completed: {len(job_inserts)} jobs from {len(companies)} companies\n")
    
    print(f"Generated SQL with {len(job_inserts)} jobs from {len(companies)} companies")
    print(f"Output written to: {output_file_path}")

if __name__ == "__main__":
    csv_file = "/home/hyperdude/uk_jobs_test_20251003_220053.csv"
    sql_file = "/home/hyperdude/import_jobs.sql"
    
    csv_to_sql(csv_file, sql_file)