#!/usr/bin/env python3
import json
import os

# Read the jobs data
with open('deployment/jobs.json', 'r') as f:
    data = json.load(f)

# Filter out market research studies
real_jobs = []
for job in data['data']['jobs']:
    if ('$225/60min' not in job['title'] and 
        'Paid Market Research Study' not in job['title'] and 
        job['company_name'] != 'Ivy Exec'):
        real_jobs.append(job)

print(f"Found {len(real_jobs)} real jobs")

# Read the template
with open('deployment/job-detail.html', 'r') as f:
    template = f.read()

# Generate a static job detail page for the first real job as a test
if real_jobs:
    job = real_jobs[0]
    
    # Replace static content with real job data
    updated_html = template.replace('Senior Software Developer', job['title'])
    updated_html = updated_html.replace('Tech Corp', job['company_name'])
    updated_html = updated_html.replace('London', job['location_general'])
    updated_html = updated_html.replace('£60,000 - £80,000', f"€{job['salary_min']//1000}k - €{job['salary_max']//1000}k")
    
    # Create a static version for this specific job
    output_file = f"deployment/job-{job['id']}.html"
    with open(output_file, 'w') as f:
        f.write(updated_html)
    
    print(f"Generated static page: {output_file}")
    print(f"Job: {job['title']} at {job['company_name']}")
    print(f"URL: https://openrole.net/job-{job['id']}")