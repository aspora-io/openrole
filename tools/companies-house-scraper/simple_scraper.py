#!/usr/bin/env python3
"""
Simple Companies House Public Data Scraper
Scrapes publicly available company data without requiring API keys
"""

import requests
from bs4 import BeautifulSoup
import json
import csv
import time
import logging
from datetime import datetime
from typing import Dict, List, Optional
import re

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class SimpleCompaniesHouseScraper:
    """Simple scraper for Companies House public search"""
    
    def __init__(self):
        self.base_url = "https://find-and-update.company-information.service.gov.uk"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def search_companies(self, query: str, page: int = 1) -> List[Dict]:
        """
        Search for companies using the public search interface
        
        Args:
            query: Search term
            page: Page number for pagination
        
        Returns:
            List of company data dictionaries
        """
        companies = []
        
        # Use the public search endpoint
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
        """
        Parse a single company result from the search page
        
        Args:
            result_element: BeautifulSoup element containing company data
        
        Returns:
            Dictionary with company information
        """
        try:
            # Extract company name and number
            title_elem = result_element.find('h3', class_='heading-medium')
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
                'scraped_at': datetime.now().isoformat()
            }
            
            # Parse additional details
            for detail in details:
                text = detail.text.strip()
                
                # Check for status
                if 'Active' in text:
                    company_data['company_status'] = 'active'
                elif 'Dissolved' in text:
                    company_data['company_status'] = 'dissolved'
                    continue  # Skip dissolved companies
                
                # Check for company type
                if 'Private limited Company' in text:
                    company_data['company_type'] = 'ltd'
                elif 'Public limited Company' in text:
                    company_data['company_type'] = 'plc'
                elif 'Limited liability partnership' in text:
                    company_data['company_type'] = 'llp'
                
                # Extract address
                if detail.find('span', class_='address'):
                    address_text = detail.text.strip()
                    company_data['address'] = address_text
                
                # Extract incorporation date
                date_match = re.search(r'Incorporated on (\d{1,2} \w+ \d{4})', text)
                if date_match:
                    company_data['date_of_creation'] = date_match.group(1)
            
            # Only return active companies
            if company_data.get('company_status') == 'active':
                return company_data
            
            return None
            
        except Exception as e:
            logging.error(f"Error parsing company result: {e}")
            return None
    
    def scrape_companies_by_sector(self, sectors: List[str], max_pages: int = 10) -> List[Dict]:
        """
        Scrape companies by sector/industry keywords
        
        Args:
            sectors: List of sector keywords to search
            max_pages: Maximum pages to scrape per sector
        
        Returns:
            List of company dictionaries
        """
        all_companies = []
        seen_companies = set()  # To avoid duplicates
        
        for sector in sectors:
            logging.info(f"Scraping companies for sector: {sector}")
            
            for page in range(1, max_pages + 1):
                companies = self.search_companies(sector, page=page)
                
                if not companies:
                    break
                
                for company in companies:
                    company_number = company.get('company_number')
                    if company_number and company_number not in seen_companies:
                        seen_companies.add(company_number)
                        company['sector_keyword'] = sector
                        all_companies.append(company)
                
                logging.info(f"  Page {page}: Found {len(companies)} companies")
                
                # Rate limiting
                time.sleep(1)
            
            # Additional delay between sectors
            time.sleep(2)
        
        return all_companies
    
    def save_companies(self, companies: List[Dict], format: str = 'both'):
        """
        Save companies to file(s)
        
        Args:
            companies: List of company dictionaries
            format: 'csv', 'json', or 'both'
        """
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        if format in ['csv', 'both']:
            csv_filename = f'uk_companies_{timestamp}.csv'
            with open(csv_filename, 'w', newline='', encoding='utf-8') as f:
                if companies:
                    writer = csv.DictWriter(f, fieldnames=companies[0].keys())
                    writer.writeheader()
                    writer.writerows(companies)
            logging.info(f"Saved {len(companies)} companies to {csv_filename}")
        
        if format in ['json', 'both']:
            json_filename = f'uk_companies_{timestamp}.json'
            with open(json_filename, 'w', encoding='utf-8') as f:
                json.dump(companies, f, indent=2, ensure_ascii=False)
            logging.info(f"Saved {len(companies)} companies to {json_filename}")
    
    def create_sql_import(self, companies: List[Dict], filename: str = "import_companies.sql"):
        """
        Create SQL import file for the scraped companies
        
        Args:
            companies: List of company dictionaries
            filename: Output SQL filename
        """
        with open(filename, 'w', encoding='utf-8') as f:
            f.write("-- Companies House Active Companies Import\n")
            f.write(f"-- Generated: {datetime.now().isoformat()}\n\n")
            
            # Create table if not exists
            f.write("""
CREATE TABLE IF NOT EXISTS scraped_companies (
    id SERIAL PRIMARY KEY,
    company_number VARCHAR(20) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    company_type VARCHAR(50),
    company_status VARCHAR(50),
    date_of_creation DATE,
    address TEXT,
    sector_keyword VARCHAR(100),
    company_url TEXT,
    scraped_at TIMESTAMP,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert companies
""")
            
            for company in companies:
                company_number = company.get('company_number', '').replace("'", "''")
                company_name = company.get('company_name', '').replace("'", "''")
                company_type = company.get('company_type', '').replace("'", "''")
                address = company.get('address', '').replace("'", "''")
                sector = company.get('sector_keyword', '').replace("'", "''")
                url = company.get('company_url', '').replace("'", "''")
                
                # Parse date
                date_str = company.get('date_of_creation', '')
                if date_str:
                    # Convert "1 January 2020" to "2020-01-01"
                    try:
                        from datetime import datetime
                        date_obj = datetime.strptime(date_str, '%d %B %Y')
                        date_sql = f"'{date_obj.strftime('%Y-%m-%d')}'"
                    except:
                        date_sql = 'NULL'
                else:
                    date_sql = 'NULL'
                
                f.write(f"""
INSERT INTO scraped_companies (company_number, company_name, company_type, company_status, 
                             date_of_creation, address, sector_keyword, company_url, scraped_at)
VALUES ('{company_number}', '{company_name}', '{company_type}', 'active', 
        {date_sql}, '{address}', '{sector}', '{url}', '{company.get('scraped_at', '')}')
ON CONFLICT (company_number) DO NOTHING;
""")
        
        logging.info(f"Created SQL import file: {filename}")


def main():
    """Main function to run the simple scraper"""
    
    scraper = SimpleCompaniesHouseScraper()
    
    # Define sectors to search for
    sectors = [
        "technology",
        "software",
        "consulting",
        "recruitment",
        "digital marketing",
        "financial services",
        "healthcare",
        "retail",
        "manufacturing",
        "construction",
        "hospitality",
        "education",
        "logistics",
        "media",
        "telecommunications"
    ]
    
    logging.info("Starting Companies House scraper...")
    
    # Scrape companies
    companies = scraper.scrape_companies_by_sector(sectors, max_pages=5)
    
    logging.info(f"Total companies scraped: {len(companies)}")
    
    # Save results
    scraper.save_companies(companies, format='both')
    
    # Create SQL import file
    scraper.create_sql_import(companies)
    
    # Print summary
    print("\n=== Scraping Summary ===")
    print(f"Total active companies: {len(companies)}")
    
    # Group by sector
    sector_counts = {}
    for company in companies:
        sector = company.get('sector_keyword', 'Unknown')
        sector_counts[sector] = sector_counts.get(sector, 0) + 1
    
    print("\nCompanies by sector:")
    for sector, count in sorted(sector_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  {sector}: {count}")
    
    # Group by company type
    type_counts = {}
    for company in companies:
        comp_type = company.get('company_type', 'Unknown')
        type_counts[comp_type] = type_counts.get(comp_type, 0) + 1
    
    print("\nCompanies by type:")
    for comp_type, count in sorted(type_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  {comp_type}: {count}")


if __name__ == "__main__":
    main()