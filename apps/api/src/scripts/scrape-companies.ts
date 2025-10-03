#!/usr/bin/env node
/**
 * Script to scrape UK companies from Companies House
 * This can be run as a cron job or manually to update the employer database
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { db } from '../lib/database';

async function runPythonScraper(): Promise<string> {
  const scraperPath = path.join(__dirname, '../../../../tools/companies-house-scraper/simple_scraper.py');
  
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python3', [scraperPath]);
    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      console.log(text);
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.error(`Scraper error: ${data}`);
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Scraper exited with code ${code}: ${errorOutput}`));
      }
    });
  });
}

async function importSQLFile(sqlFilePath: string): Promise<void> {
  try {
    const sqlContent = await fs.readFile(sqlFilePath, 'utf-8');
    
    // Split SQL commands and execute them
    const commands = sqlContent
      .split(';')
      .filter(cmd => cmd.trim())
      .map(cmd => cmd.trim() + ';');

    for (const command of commands) {
      if (command.includes('INSERT INTO') || command.includes('CREATE TABLE')) {
        await db.execute(command);
      }
    }

    console.log(`Successfully imported ${commands.length} SQL commands`);
  } catch (error) {
    console.error('Error importing SQL file:', error);
    throw error;
  }
}

async function getScrapingStats(): Promise<void> {
  const stats = await db.query(`
    SELECT 
      COUNT(*) as total_companies,
      COUNT(*) FILTER (WHERE verified = TRUE) as verified_companies,
      COUNT(*) FILTER (WHERE imported_to_companies = TRUE) as imported_companies,
      COUNT(DISTINCT sector_keyword) as unique_sectors,
      COUNT(DISTINCT locality) as unique_locations
    FROM scraped_companies
    WHERE company_status = 'active'
  `);

  console.log('\n=== Scraping Statistics ===');
  console.log(`Total active companies: ${stats.rows[0].total_companies}`);
  console.log(`Verified companies: ${stats.rows[0].verified_companies}`);
  console.log(`Imported to main table: ${stats.rows[0].imported_companies}`);
  console.log(`Unique sectors: ${stats.rows[0].unique_sectors}`);
  console.log(`Unique locations: ${stats.rows[0].unique_locations}`);
}

async function autoVerifyTechCompanies(): Promise<void> {
  // Auto-verify technology companies that meet certain criteria
  const result = await db.query(`
    UPDATE scraped_companies
    SET 
      verified = TRUE,
      verified_at = CURRENT_TIMESTAMP,
      verification_notes = 'Auto-verified: Technology sector with valid registration'
    WHERE 
      sector_keyword IN ('technology', 'software', 'digital', 'consulting')
      AND verified = FALSE
      AND company_status = 'active'
      AND company_number IS NOT NULL
      AND LENGTH(company_number) >= 8
      AND date_of_creation < CURRENT_DATE - INTERVAL '6 months'
    RETURNING id, company_name
  `);

  console.log(`\nAuto-verified ${result.rowCount} technology companies`);
}

async function importVerifiedCompanies(): Promise<void> {
  // Import all verified companies that haven't been imported yet
  const companies = await db.query(`
    SELECT id, company_name 
    FROM scraped_companies 
    WHERE verified = TRUE 
      AND imported_to_companies = FALSE 
      AND company_status = 'active'
    LIMIT 50
  `);

  let importedCount = 0;
  
  for (const company of companies.rows) {
    try {
      await db.query('SELECT import_scraped_company($1)', [company.id]);
      importedCount++;
      console.log(`Imported: ${company.company_name}`);
    } catch (error) {
      console.error(`Failed to import ${company.company_name}:`, error.message);
    }
  }

  console.log(`\nSuccessfully imported ${importedCount} companies`);
}

async function main() {
  console.log('Starting Companies House scraper...\n');

  try {
    // Check if Python and required packages are installed
    const pythonCheck = spawn('python3', ['--version']);
    pythonCheck.on('error', () => {
      console.error('Python 3 is not installed. Please install Python 3 and run:');
      console.error('pip install -r tools/companies-house-scraper/requirements.txt');
      process.exit(1);
    });

    // Run the scraper
    console.log('Running Python scraper...');
    await runPythonScraper();

    // Import the generated SQL file
    console.log('\nImporting scraped data to database...');
    const sqlFilePath = path.join(__dirname, '../../../../tools/companies-house-scraper/import_companies.sql');
    
    // Check if SQL file exists
    try {
      await fs.access(sqlFilePath);
      await importSQLFile(sqlFilePath);
    } catch (error) {
      console.log('No SQL file found. Scraper may have failed.');
    }

    // Auto-verify technology companies
    console.log('\nAuto-verifying technology companies...');
    await autoVerifyTechCompanies();

    // Import verified companies
    console.log('\nImporting verified companies to main table...');
    await importVerifiedCompanies();

    // Show statistics
    await getScrapingStats();

    console.log('\n✅ Scraping process completed successfully!');

  } catch (error) {
    console.error('Error in scraping process:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { runPythonScraper, importSQLFile, autoVerifyTechCompanies, importVerifiedCompanies };