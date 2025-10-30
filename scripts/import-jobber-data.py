#!/usr/bin/env python3
"""
Import job data from jobber CSV into OpenRole database
Transforms Adzuna job data to OpenRole schema format
"""

import os
import sys
import csv
import json
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any
from decimal import Decimal

import psycopg2
from psycopg2.extras import Json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Database connection parameters - Production
OPENROLE_DB_PARAMS = {
    'host': '145.223.75.73',
    'port': 5432,
    'database': 'openrole',
    'user': 'postgres', 
    'password': 'postgres'
}

def parse_salary(salary_raw: str, salary_min: str, salary_max: str) -> tuple:
    """Parse salary information and convert from GBP to EUR"""
    # Conversion rate GBP to EUR (approximate)
    GBP_TO_EUR = 1.17
    
    try:
        min_val = int(float(salary_min)) if salary_min else None
        max_val = int(float(salary_max)) if salary_max else None
        
        # Convert GBP to EUR
        if min_val:
            min_val = int(min_val * GBP_TO_EUR)
        if max_val:
            max_val = int(max_val * GBP_TO_EUR)
            
        return min_val, max_val
    except (ValueError, TypeError):
        logger.warning(f"Could not parse salary: {salary_raw}")
        return None, None

def normalize_location(city: str, region: str, location_raw: str) -> tuple:
    """Normalize location to OpenRole format"""
    if city and region:
        location_precise = f"{city}, {region}"
        # Map UK regions to general areas
        if 'London' in region or 'London' in city:
            location_general = 'London'
        elif 'Dublin' in city or 'Dublin' in region:
            location_general = 'Dublin'
        else:
            location_general = region
    else:
        location_precise = location_raw
        location_general = city or region or 'UK'
    
    return location_precise, location_general

def extract_skills_from_title_description(title: str, description: str = "") -> tuple:
    """Extract skills from job title and description"""
    # Common tech skills to look for
    common_skills = [
        'Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'Go', 'Rust', 'PHP',
        'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Flask', 'Rails',
        'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP',
        'Git', 'Jenkins', 'CI/CD', 'Agile', 'Scrum', 'TDD', 'GraphQL', 'REST', 'API',
        'HTML', 'CSS', 'SASS', 'Webpack', 'Babel', 'Linux', 'DevOps', 'Microservices'
    ]
    
    text = f"{title} {description}".lower()
    found_skills = []
    
    for skill in common_skills:
        if skill.lower() in text:
            found_skills.append(skill)
    
    # Split into core vs nice-to-have (first 5 as core, rest as nice-to-have)
    core_skills = found_skills[:5] if found_skills else ["Software Development"]
    nice_to_have = found_skills[5:] if len(found_skills) > 5 else []
    
    return core_skills, nice_to_have

def map_employment_type(job_type: str) -> str:
    """Map jobber job_type to OpenRole employment_type"""
    mapping = {
        'permanent': 'full-time',
        'contract': 'contract',
        'temporary': 'contract',
        'part-time': 'part-time',
        'internship': 'internship'
    }
    return mapping.get(job_type.lower(), 'full-time') if job_type else 'full-time'

def determine_experience_level(title: str, salary_min: int) -> str:
    """Determine experience level from title and salary"""
    title_lower = title.lower()
    
    if any(word in title_lower for word in ['senior', 'lead', 'principal', 'staff']):
        return 'senior'
    elif any(word in title_lower for word in ['junior', 'graduate', 'intern', 'entry']):
        return 'entry'
    elif salary_min and salary_min > 80000:  # EUR
        return 'senior'
    elif salary_min and salary_min < 40000:  # EUR
        return 'entry'
    else:
        return 'mid'

def get_or_create_company(conn, company_name: str) -> str:
    """Get existing company or create new one"""
    with conn.cursor() as cur:
        # Check if company exists
        cur.execute("SELECT id FROM companies WHERE name = %s", (company_name,))
        result = cur.fetchone()
        
        if result:
            return result[0]
        
        # Create new company
        company_id = str(uuid.uuid4())
        cur.execute("""
            INSERT INTO companies (id, name, description, industry, size_category, verified)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            company_id,
            company_name,
            f"Company information for {company_name}",
            'Technology',  # Default industry
            'medium',      # Default size
            False          # Not verified
        ))
        
        logger.info(f"Created new company: {company_name}")
        return company_id

def import_jobs_from_csv(csv_file_path: str):
    """Import jobs from CSV file into OpenRole database"""
    logger.info(f"Starting import from {csv_file_path}")
    
    try:
        # Connect to OpenRole database
        conn = psycopg2.connect(**OPENROLE_DB_PARAMS)
        conn.autocommit = False
        
        imported_count = 0
        skipped_count = 0
        
        with open(csv_file_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            
            for row in reader:
                try:
                    # Parse salary
                    salary_min, salary_max = parse_salary(
                        row.get('salary_raw', ''),
                        row.get('salary_min', ''),
                        row.get('salary_max', '')
                    )
                    
                    # Skip jobs without salary information (OpenRole requires transparency)
                    if not salary_min:
                        skipped_count += 1
                        continue
                    
                    # Normalize location
                    location_precise, location_general = normalize_location(
                        row.get('city', ''),
                        row.get('region', ''),
                        row.get('location_raw', '')
                    )
                    
                    # Extract skills
                    core_skills, nice_to_have = extract_skills_from_title_description(
                        row.get('title', ''),
                        row.get('description', '')
                    )
                    
                    # Get or create company
                    company_id = get_or_create_company(conn, row.get('company', 'Unknown Company'))
                    
                    # Determine employment type and experience level
                    employment_type = map_employment_type(row.get('job_type', ''))
                    experience_level = determine_experience_level(row.get('title', ''), salary_min)
                    
                    # Remote type based on location
                    is_remote = row.get('is_remote', 'False').lower() == 'true'
                    remote_type = 'remote' if is_remote else 'office'
                    
                    # Create job record
                    job_data = {
                        'id': str(uuid.uuid4()),
                        'title': row.get('title', ''),
                        'description': row.get('description', '') or f"Job opportunity at {row.get('company', '')}",
                        'company_id': company_id,
                        'salary_min': salary_min,
                        'salary_max': salary_max,
                        'salary_currency': 'EUR',
                        'salary_type': 'annual',
                        'location_precise': location_precise,
                        'location_general': location_general,
                        'remote_type': remote_type,
                        'employment_type': employment_type,
                        'experience_level': experience_level,
                        'core_skills': json.dumps(core_skills),
                        'nice_to_have_skills': json.dumps(nice_to_have),
                        'status': 'active',
                        'expires_at': datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(days=30)
                    }
                    
                    # Insert job
                    with conn.cursor() as cur:
                        insert_query = """
                            INSERT INTO jobs (
                                id, title, description, company_id,
                                salary_min, salary_max, salary_currency, salary_type,
                                location_precise, location_general, remote_type,
                                employment_type, experience_level,
                                core_skills, nice_to_have_skills,
                                status, expires_at
                            ) VALUES (
                                %(id)s, %(title)s, %(description)s, %(company_id)s,
                                %(salary_min)s, %(salary_max)s, %(salary_currency)s, %(salary_type)s,
                                %(location_precise)s, %(location_general)s, %(remote_type)s,
                                %(employment_type)s, %(experience_level)s,
                                %(core_skills)s::jsonb, %(nice_to_have_skills)s::jsonb,
                                %(status)s, %(expires_at)s
                            )
                        """
                        cur.execute(insert_query, job_data)
                    
                    imported_count += 1
                    if imported_count % 10 == 0:
                        logger.info(f"Imported {imported_count} jobs...")
                        
                except Exception as e:
                    logger.error(f"Error importing job: {e}")
                    logger.error(f"Job data: {row}")
                    skipped_count += 1
                    continue
        
        # Commit all changes
        conn.commit()
        logger.info(f"Import completed! Imported: {imported_count}, Skipped: {skipped_count}")
        
    except Exception as e:
        logger.error(f"Import failed: {e}")
        if conn:
            conn.rollback()
        raise
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    # Path to the jobber CSV file
    csv_file = "/home/alan/business/jobber/uk_jobs_test_20251003_220053.csv"
    
    if not os.path.exists(csv_file):
        logger.error(f"CSV file not found: {csv_file}")
        sys.exit(1)
    
    logger.info("Starting OpenRole job import from jobber data...")
    import_jobs_from_csv(csv_file)
    logger.info("Import process completed!")