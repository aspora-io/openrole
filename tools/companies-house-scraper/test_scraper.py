#!/usr/bin/env python3
"""
Test script for Companies House scraper
Tests basic functionality with a small dataset
"""

from simple_scraper import SimpleCompaniesHouseScraper
import json

def test_scraper():
    """Test the scraper with a limited dataset"""
    
    print("Testing Companies House Scraper...")
    print("=" * 50)
    
    scraper = SimpleCompaniesHouseScraper()
    
    # Test with just a few sectors and 1 page each
    test_sectors = ["technology london", "software manchester", "recruitment birmingham"]
    
    all_companies = []
    
    for sector in test_sectors:
        print(f"\nSearching for: {sector}")
        companies = scraper.search_companies(sector, page=1)
        
        print(f"Found {len(companies)} companies")
        
        for company in companies[:3]:  # Show first 3
            print(f"  - {company.get('company_name')} ({company.get('company_number')})")
            if company.get('address'):
                print(f"    Address: {company.get('address')}")
        
        all_companies.extend(companies)
    
    # Save test results
    if all_companies:
        test_filename = "test_results.json"
        with open(test_filename, 'w', encoding='utf-8') as f:
            json.dump(all_companies, f, indent=2)
        
        print(f"\nSaved {len(all_companies)} companies to {test_filename}")
        
        # Show summary
        print("\nTest Summary:")
        print(f"Total companies found: {len(all_companies)}")
        
        # Company types
        types = {}
        for company in all_companies:
            comp_type = company.get('company_type', 'Unknown')
            types[comp_type] = types.get(comp_type, 0) + 1
        
        print("\nBy type:")
        for comp_type, count in types.items():
            print(f"  {comp_type}: {count}")
    else:
        print("\nNo companies found. This might indicate:")
        print("  1. Network connection issues")
        print("  2. Changes to Companies House website structure")
        print("  3. Rate limiting")

if __name__ == "__main__":
    test_scraper()