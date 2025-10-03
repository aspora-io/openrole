# Companies House Scraper for OpenRole

This tool scrapes active UK companies from Companies House to populate the OpenRole employer database with verified businesses.

## Features

- **Simple Scraper** (`simple_scraper.py`): No API key required, uses public search
- **API Scraper** (`scraper.py`): Uses Companies House API for more detailed data
- Filters for active companies only
- Exports to CSV, JSON, and SQL formats
- Rate limiting to avoid overloading servers
- Deduplication based on company number

## Installation

```bash
pip install -r requirements.txt
```

## Usage

### Simple Scraper (No API Key Required)

```bash
python simple_scraper.py
```

This will:
1. Search for companies across multiple sectors
2. Filter for active companies only
3. Save results to timestamped CSV and JSON files
4. Create an SQL import file (`import_companies.sql`)

### API Scraper (Requires API Key)

1. Get a free API key from [Companies House](https://developer.company-information.service.gov.uk/get-started)
2. Set the environment variable:
   ```bash
   export COMPANIES_HOUSE_API_KEY="your-api-key-here"
   ```
3. Run the scraper:
   ```bash
   python scraper.py
   ```

## Output Files

- `uk_companies_YYYYMMDD_HHMMSS.csv` - CSV format for spreadsheet analysis
- `uk_companies_YYYYMMDD_HHMMSS.json` - JSON format for programmatic use
- `import_companies.sql` - SQL statements to import into OpenRole database

## Database Schema

The SQL import creates a `scraped_companies` table with:
- `company_number` - Unique Companies House number
- `company_name` - Registered company name
- `company_type` - ltd, plc, llp, etc.
- `company_status` - Active/dissolved
- `date_of_creation` - Incorporation date
- `address` - Registered address
- `sector_keyword` - Search term that found this company
- `verified` - Boolean for manual verification status

## Sectors Covered

The scraper searches for companies in these sectors:
- Technology & Software
- Consulting & Professional Services
- Recruitment & HR
- Digital Marketing
- Financial Services
- Healthcare
- Retail
- Manufacturing
- Construction
- Hospitality
- Education
- Logistics
- Media
- Telecommunications

## Rate Limiting

The scraper implements polite rate limiting:
- 1 second delay between search pages
- 2 second delay between different sectors
- Maximum 5 pages per sector by default

## Legal Considerations

- Companies House data is publicly available
- The scraper respects rate limits and robots.txt
- Data is used for legitimate business verification purposes
- Companies can opt-out by contacting OpenRole

## Integration with OpenRole

To import scraped companies into OpenRole:

1. Review the generated SQL file
2. Connect to your PostgreSQL database
3. Run the import:
   ```bash
   psql -U postgres -d openrole < import_companies.sql
   ```

## Future Enhancements

- [ ] Add company size estimation based on filing history
- [ ] Extract industry SIC codes
- [ ] Get company contact information where available
- [ ] Add company health score based on filing compliance
- [ ] Integrate with other business databases