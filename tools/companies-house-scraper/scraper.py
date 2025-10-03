#!/usr/bin/env python3
"""
Companies House Active Business Scraper
Scrapes active UK companies from Companies House for OpenRole employer verification
"""

import requests
import json
import time
import csv
import logging
from datetime import datetime
from typing import Dict, List, Optional
import os
from urllib.parse import urlencode

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('companies_house_scraper.log'),
        logging.StreamHandler()
    ]
)

class CompaniesHouseScraper:
    """Scraper for Companies House API to get active UK businesses"""
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the scraper
        
        Args:
            api_key: Companies House API key (required for full access)
        """
        self.api_key = api_key or os.getenv('COMPANIES_HOUSE_API_KEY')
        self.base_url = "https://api.company-information.service.gov.uk"
        self.session = requests.Session()
        
        if self.api_key:
            self.session.auth = (self.api_key, '')
        else:
            logging.warning("No API key provided. Using public data only.")
        
        self.session.headers.update({
            'Accept': 'application/json',
            'User-Agent': 'OpenRole-Scraper/1.0'
        })
    
    def search_companies(self, query: str, items_per_page: int = 20, start_index: int = 0) -> Dict:
        """
        Search for companies using Companies House API
        
        Args:
            query: Search query (company name, number, etc.)
            items_per_page: Number of results per page (max 100)
            start_index: Starting index for pagination
        
        Returns:
            Dict containing search results
        """
        endpoint = f"{self.base_url}/search/companies"
        params = {
            'q': query,
            'items_per_page': min(items_per_page, 100),
            'start_index': start_index
        }
        
        try:
            response = self.session.get(endpoint, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logging.error(f"Error searching companies: {e}")
            return {}
    
    def get_company_details(self, company_number: str) -> Dict:
        """
        Get detailed information about a specific company
        
        Args:
            company_number: The company registration number
        
        Returns:
            Dict containing company details
        """
        endpoint = f"{self.base_url}/company/{company_number}"
        
        try:
            response = self.session.get(endpoint)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logging.error(f"Error getting company {company_number}: {e}")
            return {}
    
    def get_company_officers(self, company_number: str) -> Dict:
        """
        Get officers (directors) of a company
        
        Args:
            company_number: The company registration number
        
        Returns:
            Dict containing officers information
        """
        endpoint = f"{self.base_url}/company/{company_number}/officers"
        
        try:
            response = self.session.get(endpoint)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            logging.error(f"Error getting officers for {company_number}: {e}")
            return {}
    
    def scrape_active_companies_by_sic_code(self, sic_codes: List[str], max_companies: int = 1000) -> List[Dict]:
        """
        Scrape active companies by SIC (Standard Industrial Classification) codes
        
        Args:
            sic_codes: List of SIC codes to search for
            max_companies: Maximum number of companies to scrape
        
        Returns:
            List of company dictionaries
        """
        companies = []
        
        # Common SIC codes for tech companies, recruitment, etc.
        tech_related_terms = [
            "software", "technology", "digital", "consulting", "recruitment",
            "engineering", "finance", "marketing", "healthcare", "retail"
        ]
        
        for term in tech_related_terms:
            if len(companies) >= max_companies:
                break
                
            logging.info(f"Searching for companies with term: {term}")
            
            start_index = 0
            while len(companies) < max_companies:
                results = self.search_companies(term, items_per_page=100, start_index=start_index)
                
                if not results.get('items'):
                    break
                
                for item in results['items']:
                    # Only include active companies
                    if item.get('company_status') == 'active':
                        company_data = self.extract_company_data(item)
                        
                        # Get additional details if we have API access
                        if self.api_key and company_data['company_number']:
                            details = self.get_company_details(company_data['company_number'])
                            company_data.update(self.extract_detailed_data(details))
                        
                        companies.append(company_data)
                        
                        if len(companies) >= max_companies:
                            break
                
                # Check if there are more results
                total_results = results.get('total_results', 0)
                if start_index + 100 >= total_results:
                    break
                
                start_index += 100
                time.sleep(0.5)  # Rate limiting
        
        return companies
    
    def extract_company_data(self, company_item: Dict) -> Dict:
        """
        Extract relevant company data from search result
        
        Args:
            company_item: Company data from search results
        
        Returns:
            Cleaned company data dictionary
        """
        address = company_item.get('registered_office_address', {})
        
        return {
            'company_name': company_item.get('title', ''),
            'company_number': company_item.get('company_number', ''),
            'company_type': company_item.get('company_type', ''),
            'company_status': company_item.get('company_status', ''),
            'date_of_creation': company_item.get('date_of_creation', ''),
            'address_line_1': address.get('address_line_1', ''),
            'address_line_2': address.get('address_line_2', ''),
            'locality': address.get('locality', ''),
            'postal_code': address.get('postal_code', ''),
            'country': address.get('country', 'United Kingdom'),
            'sic_codes': company_item.get('sic_codes', []),
            'previous_company_names': company_item.get('previous_company_names', []),
            'scraped_at': datetime.now().isoformat()
        }
    
    def extract_detailed_data(self, details: Dict) -> Dict:
        """
        Extract additional data from detailed company information
        
        Args:
            details: Detailed company data from API
        
        Returns:
            Additional company data
        """
        return {
            'company_description': details.get('type', ''),
            'can_file': details.get('can_file', False),
            'has_charges': details.get('has_charges', False),
            'has_insolvency_history': details.get('has_insolvency_history', False),
            'registered_office_is_in_dispute': details.get('registered_office_is_in_dispute', False),
            'undeliverable_registered_office_address': details.get('undeliverable_registered_office_address', False),
            'last_accounts': details.get('accounts', {}).get('last_accounts', {}),
            'confirmation_statement': details.get('confirmation_statement', {})
        }
    
    def save_to_csv(self, companies: List[Dict], filename: str = "active_uk_companies.csv"):
        """
        Save scraped companies to CSV file
        
        Args:
            companies: List of company dictionaries
            filename: Output CSV filename
        """
        if not companies:
            logging.warning("No companies to save")
            return
        
        # Get all unique fields
        all_fields = set()
        for company in companies:
            all_fields.update(company.keys())
        
        fieldnames = sorted(list(all_fields))
        
        with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(companies)
        
        logging.info(f"Saved {len(companies)} companies to {filename}")
    
    def save_to_json(self, companies: List[Dict], filename: str = "active_uk_companies.json"):
        """
        Save scraped companies to JSON file
        
        Args:
            companies: List of company dictionaries
            filename: Output JSON filename
        """
        with open(filename, 'w', encoding='utf-8') as jsonfile:
            json.dump(companies, jsonfile, indent=2, ensure_ascii=False)
        
        logging.info(f"Saved {len(companies)} companies to {filename}")


def main():
    """Main function to run the scraper"""
    
    # Initialize scraper
    scraper = CompaniesHouseScraper()
    
    # Common SIC codes for potential employers
    # 62010 - Computer programming activities
    # 62020 - Computer consultancy activities
    # 70229 - Management consultancy activities
    # 78109 - Other human resources provision
    sic_codes = ['62010', '62020', '70229', '78109']
    
    logging.info("Starting Companies House scraper...")
    
    # Scrape active companies
    companies = scraper.scrape_active_companies_by_sic_code(
        sic_codes=sic_codes,
        max_companies=500  # Limit for demo purposes
    )
    
    # Remove duplicates based on company number
    unique_companies = {}
    for company in companies:
        company_number = company.get('company_number')
        if company_number and company_number not in unique_companies:
            unique_companies[company_number] = company
    
    companies = list(unique_companies.values())
    
    logging.info(f"Scraped {len(companies)} unique active companies")
    
    # Save to both CSV and JSON
    scraper.save_to_csv(companies)
    scraper.save_to_json(companies)
    
    # Print summary statistics
    print("\n=== Scraping Summary ===")
    print(f"Total active companies found: {len(companies)}")
    
    # Group by company type
    company_types = {}
    for company in companies:
        comp_type = company.get('company_type', 'Unknown')
        company_types[comp_type] = company_types.get(comp_type, 0) + 1
    
    print("\nCompanies by type:")
    for comp_type, count in sorted(company_types.items(), key=lambda x: x[1], reverse=True):
        print(f"  {comp_type}: {count}")
    
    # Group by location
    locations = {}
    for company in companies:
        location = company.get('locality', 'Unknown')
        if location:
            locations[location] = locations.get(location, 0) + 1
    
    print("\nTop 10 locations:")
    for location, count in sorted(locations.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  {location}: {count}")


if __name__ == "__main__":
    main()