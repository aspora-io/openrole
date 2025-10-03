#!/usr/bin/env python3
"""
Companies House scraper with direct PostgreSQL integration
"""

import os
import sys
import psycopg2
import requests
from bs4 import BeautifulSoup
import json
import time
import logging
from datetime import datetime
from typing import Dict, List, Optional
import re
from psycopg2.extras import RealDictCursor

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class CompaniesHouseDBScraper:
    """Companies House scraper with PostgreSQL integration"""
    
    def __init__(self, db_config=None):
        self.base_url = "https://find-and-update.company-information.service.gov.uk"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
        # Database configuration
        self.db_config = db_config or {
            'host': os.getenv('DB_HOST', '145.223.75.73'),
            'port': os.getenv('DB_PORT', 5432),
            'database': os.getenv('DB_NAME', 'openrole'),
            'user': os.getenv('DB_USER', 'postgres'),
            'password': os.getenv('DB_PASSWORD', 'postgres')
        }
        
    def connect_db(self):
        """Connect to PostgreSQL database"""
        try:
            conn = psycopg2.connect(**self.db_config)
            return conn
        except Exception as e:
            logging.error(f"Database connection error: {e}")
            raise
    
    def search_companies(self, query: str, page: int = 1) -> List[Dict]:
        """Search for companies using the public search interface"""
        companies = []
        
        search_url = f"{self.base_url}/search/companies"
        params = {
            'q': query,
            'page': page
        }
        
        try:
            response = self.session.get(search_url, params=params)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Find company results
            results = soup.find_all('li', class_='type-company')
            
            for result in results:
                company_data = self.parse_company_result(result)
                if company_data:
                    companies.append(company_data)
            
            return companies
            
        except Exception as e:
            logging.error(f"Error searching companies: {e}")
            return []
    
    def parse_company_result(self, result_element) -> Optional[Dict]:
        """Parse a single company result from the search page"""
        try:
            # Extract company name and number
            title_elem = result_element.find('h3')
            if not title_elem:
                return None
            
            company_link = title_elem.find('a')
            if not company_link:
                return None
            
            company_name = company_link.text.strip()
            company_url = company_link.get('href', '')
            
            # Extract company number from URL
            company_number_match = re.search(r'/company/([A-Z0-9]+)', company_url)
            company_number = company_number_match.group(1) if company_number_match else ''
            
            # Extract company details
            details = result_element.find_all('p')
            
            company_data = {
                'company_name': company_name,
                'company_number': company_number,
                'company_url': f"https://find-and-update.company-information.service.gov.uk{company_url}",
                'scraped_at': datetime.now()
            }
            
            # Parse additional details
            for detail in details:
                text = detail.text.strip()
                
                # Check for status
                if 'Active' in text:
                    company_data['company_status'] = 'active'
                elif 'Dissolved' in text:
                    company_data['company_status'] = 'dissolved'
                    return None  # Skip dissolved companies
                
                # Check for company type
                if 'Private limited Company' in text:
                    company_data['company_type'] = 'ltd'
                elif 'Public limited Company' in text:
                    company_data['company_type'] = 'plc'
                elif 'Limited liability partnership' in text:
                    company_data['company_type'] = 'llp'
                
                # Extract address
                if 'address' in detail.get('class', []) or any(',' in line for line in text.split('\n')):
                    company_data['address'] = text
                    # Try to extract postal code
                    postal_match = re.search(r'[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}', text)
                    if postal_match:
                        company_data['postal_code'] = postal_match.group()
                
                # Extract incorporation date
                date_match = re.search(r'Incorporated on (\d{1,2} \w+ \d{4})', text)
                if date_match:
                    date_str = date_match.group(1)
                    try:
                        date_obj = datetime.strptime(date_str, '%d %B %Y')
                        company_data['date_of_creation'] = date_obj.date()
                    except:
                        pass
            
            # Only return active companies
            if company_data.get('company_status') == 'active':
                return company_data
            
            return None
            
        except Exception as e:
            logging.error(f"Error parsing company result: {e}")
            return None
    
    def save_company_to_db(self, company: Dict, conn) -> bool:
        """Save a single company to the database"""
        try:
            cur = conn.cursor()
            
            # Prepare data
            insert_query = """
                INSERT INTO scraped_companies (
                    company_number, company_name, company_type, company_status,
                    date_of_creation, address, postal_code, sector_keyword,
                    company_url, scraped_at, data_source
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
                ON CONFLICT (company_number) DO UPDATE SET
                    company_name = EXCLUDED.company_name,
                    address = EXCLUDED.address,
                    postal_code = EXCLUDED.postal_code,
                    last_checked_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                RETURNING id
            """
            
            cur.execute(insert_query, (
                company.get('company_number'),
                company.get('company_name'),
                company.get('company_type'),
                company.get('company_status', 'active'),
                company.get('date_of_creation'),
                company.get('address'),
                company.get('postal_code'),
                company.get('sector_keyword'),
                company.get('company_url'),
                company.get('scraped_at'),
                'companies_house'
            ))
            
            result = cur.fetchone()
            conn.commit()
            cur.close()
            
            return result is not None
            
        except Exception as e:
            logging.error(f"Error saving company {company.get('company_number')}: {e}")
            conn.rollback()
            return False
    
    def scrape_and_save(self, sectors: List[str], max_pages: int = 5):
        """Scrape companies and save directly to database"""
        conn = self.connect_db()
        total_saved = 0
        sector_stats = {}
        
        try:
            for sector in sectors:
                logging.info(f"Scraping companies for sector: {sector}")
                sector_count = 0
                
                for page in range(1, max_pages + 1):
                    companies = self.search_companies(sector, page=page)
                    
                    if not companies:
                        logging.info(f"  No more results for {sector} at page {page}")
                        break
                    
                    for company in companies:
                        company['sector_keyword'] = sector
                        if self.save_company_to_db(company, conn):
                            sector_count += 1
                            total_saved += 1
                    
                    logging.info(f"  Page {page}: Found {len(companies)} companies, saved {sector_count} so far")
                    
                    # Rate limiting
                    time.sleep(1)
                
                sector_stats[sector] = sector_count
                
                # Additional delay between sectors
                time.sleep(2)
            
            # Print summary
            logging.info("\n=== Scraping Summary ===")
            logging.info(f"Total companies saved: {total_saved}")
            logging.info("\nCompanies by sector:")
            for sector, count in sorted(sector_stats.items(), key=lambda x: x[1], reverse=True):
                logging.info(f"  {sector}: {count}")
            
            # Get database statistics
            cur = conn.cursor(cursor_factory=RealDictCursor)
            cur.execute("SELECT COUNT(*) as total FROM scraped_companies WHERE company_status = 'active'")
            db_total = cur.fetchone()['total']
            
            cur.execute("""
                SELECT sector_keyword, COUNT(*) as count 
                FROM scraped_companies 
                WHERE company_status = 'active' AND sector_keyword IS NOT NULL
                GROUP BY sector_keyword 
                ORDER BY count DESC
            """)
            db_sectors = cur.fetchall()
            
            logging.info(f"\nTotal active companies in database: {db_total}")
            logging.info("Database breakdown by sector:")
            for row in db_sectors[:15]:  # Top 15 sectors
                logging.info(f"  {row['sector_keyword']}: {row['count']}")
            
            cur.close()
            
        finally:
            conn.close()
    
    def get_stats(self):
        """Get database statistics"""
        conn = self.connect_db()
        try:
            cur = conn.cursor(cursor_factory=RealDictCursor)
            
            # Total companies
            cur.execute("SELECT COUNT(*) as total FROM scraped_companies")
            total = cur.fetchone()['total']
            
            # Active companies
            cur.execute("SELECT COUNT(*) as active FROM scraped_companies WHERE company_status = 'active'")
            active = cur.fetchone()['active']
            
            # By type
            cur.execute("""
                SELECT company_type, COUNT(*) as count 
                FROM scraped_companies 
                GROUP BY company_type 
                ORDER BY count DESC
            """)
            by_type = cur.fetchall()
            
            # Recent scrapes
            cur.execute("""
                SELECT COUNT(*) as recent 
                FROM scraped_companies 
                WHERE scraped_at > CURRENT_TIMESTAMP - INTERVAL '1 day'
            """)
            recent = cur.fetchone()['recent']
            
            cur.close()
            
            print("\n=== Database Statistics ===")
            print(f"Total companies: {total}")
            print(f"Active companies: {active}")
            print(f"Recently scraped (24h): {recent}")
            print("\nBy company type:")
            for row in by_type:
                print(f"  {row['company_type'] or 'Unknown'}: {row['count']}")
            
        finally:
            conn.close()


def main():
    """Main function to run the database-integrated scraper"""
    
    # Check if we're running locally or need to connect to remote
    if len(sys.argv) > 1 and sys.argv[1] == '--local':
        db_config = {
            'host': 'localhost',
            'port': 5432,
            'database': 'openrole',
            'user': 'postgres',
            'password': 'postgres'
        }
    else:
        # Production database
        db_config = {
            'host': '145.223.75.73',
            'port': 5432,
            'database': 'openrole',
            'user': 'postgres',
            'password': 'postgres'
        }
    
    scraper = CompaniesHouseDBScraper(db_config)
    
    # Define sectors to search for
    sectors = [
        "technology London",
        "software development",
        "IT consulting",
        "recruitment agency",
        "digital marketing",
        "financial services",
        "healthcare",
        "retail",
        "manufacturing",
        "construction",
        "hospitality",
        "education",
        "logistics",
        "media production",
        "telecommunications",
        "engineering",
        "professional services",
        "property management",
        "insurance",
        "legal services"
    ]
    
    logging.info("Starting Companies House scraper with database integration...")
    logging.info(f"Database: {db_config['host']}:{db_config['port']}/{db_config['database']}")
    
    # First, show current stats
    scraper.get_stats()
    
    # Run the scraper
    scraper.scrape_and_save(sectors, max_pages=3)  # Start with 3 pages per sector
    
    # Show updated stats
    scraper.get_stats()


if __name__ == "__main__":
    main()