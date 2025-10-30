#!/usr/bin/env python3
"""
Export jobs from database to JSON file for static serving
"""

import json
import psycopg2
from datetime import datetime

# Database connection parameters - Production
DB_PARAMS = {
    'host': 'localhost',
    'port': 5432,
    'database': 'openrole',
    'user': 'postgres', 
    'password': 'postgres'
}

def export_jobs_to_json():
    """Export all active jobs to JSON file"""
    try:
        conn = psycopg2.connect(**DB_PARAMS)
        
        query = """
            SELECT 
                j.id,
                j.title,
                j.description,
                c.name as company_name,
                j.salary_min,
                j.salary_max,
                j.salary_currency,
                j.location_precise,
                j.location_general,
                j.remote_type,
                j.employment_type,
                j.experience_level,
                j.core_skills,
                j.nice_to_have_skills,
                j.created_at::text as created_at,
                j.expires_at::text as expires_at
            FROM jobs j 
            JOIN companies c ON j.company_id = c.id 
            WHERE j.status = 'active'
            ORDER BY j.created_at DESC
        """
        
        with conn.cursor() as cur:
            cur.execute(query)
            rows = cur.fetchall()
            
            # Convert to list of dictionaries
            columns = [desc[0] for desc in cur.description]
            jobs = []
            
            for row in rows:
                job_dict = dict(zip(columns, row))
                # Parse JSON fields
                if job_dict['core_skills']:
                    job_dict['core_skills'] = json.loads(job_dict['core_skills'])
                if job_dict['nice_to_have_skills']:
                    job_dict['nice_to_have_skills'] = json.loads(job_dict['nice_to_have_skills'])
                jobs.append(job_dict)
        
        # Create response structure
        response = {
            'success': True,
            'generated_at': datetime.now().isoformat(),
            'total': len(jobs),
            'data': {
                'jobs': jobs
            }
        }
        
        # Write to JSON file
        output_file = '/home/hyperdude/jobs.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(response, f, indent=2, ensure_ascii=False)
        
        print(f"Exported {len(jobs)} jobs to {output_file}")
        
    except Exception as e:
        print(f"Export failed: {e}")
        raise
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    export_jobs_to_json()