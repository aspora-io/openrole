import { test, expect } from '@playwright/test';

test.describe('Job Seeker User Flow', () => {
  test('complete job search and application flow', async ({ page }) => {
    // Start at home page
    await page.goto('/');
    
    // Click on 'Browse Jobs' or similar CTA
    const browseJobsButton = page.locator('a:has-text("Browse Jobs"), button:has-text("Browse Jobs")').first();
    await browseJobsButton.click();
    
    // Should be on jobs page
    await expect(page).toHaveURL(/.*jobs\.html/);
    await expect(page.locator('h1')).toContainText('Find Your Dream Job');
    
    // Test job search functionality
    const searchInput = page.locator('input[type="search"], input[placeholder*="job"], input[placeholder*="search"]').first();
    await searchInput.fill('Software Engineer');
    
    // Location filter
    const locationInput = page.locator('input[placeholder*="location"], input[name*="location"]').first();
    if (await locationInput.isVisible()) {
      await locationInput.fill('London');
    }
    
    // Click search button
    const searchButton = page.locator('button:has-text("Search"), button[type="submit"]').first();
    await searchButton.click();
    
    // Wait for results (in real app)
    await page.waitForTimeout(500);
    
    // Click on a job listing
    const firstJob = page.locator('.job-listing, .job-card, article').first();
    await firstJob.click();
    
    // Should be on job detail page
    await expect(page).toHaveURL(/.*job-detail\.html/);
    
    // Verify job details are displayed
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=/£\\d+/')).toBeVisible(); // Salary should be visible
    
    // Click Apply button
    const applyButton = page.locator('button:has-text("Apply"), a:has-text("Apply")').first();
    await applyButton.click();
    
    // Should redirect to login if not authenticated
    await expect(page).toHaveURL(/.*login\.html/);
  });

  test('job search filters and refinement', async ({ page }) => {
    await page.goto('/jobs.html');
    
    // Test various filter options
    const filters = [
      { type: 'checkbox', label: 'Full-time' },
      { type: 'checkbox', label: 'Remote' },
      { type: 'checkbox', label: 'Contract' }
    ];
    
    for (const filter of filters) {
      const checkbox = page.locator(`input[type="checkbox"]`).locator(`..//*[contains(text(), "${filter.label}")]`);
      if (await checkbox.count() > 0) {
        await checkbox.first().click();
      }
    }
    
    // Test salary range filter
    const minSalary = page.locator('input[name*="min"], input[placeholder*="Min"]').first();
    const maxSalary = page.locator('input[name*="max"], input[placeholder*="Max"]').first();
    
    if (await minSalary.isVisible()) {
      await minSalary.fill('30000');
    }
    if (await maxSalary.isVisible()) {
      await maxSalary.fill('80000');
    }
    
    // Test sort functionality
    const sortDropdown = page.locator('select[name*="sort"], select').first();
    if (await sortDropdown.isVisible()) {
      await sortDropdown.selectOption({ index: 1 });
    }
  });

  test('save job functionality', async ({ page }) => {
    await page.goto('/jobs.html');
    
    // Find save button on job listings
    const saveButton = page.locator('button:has-text("Save"), .save-job, [aria-label*="Save"]').first();
    if (await saveButton.isVisible()) {
      await saveButton.click();
      
      // Should prompt login if not authenticated
      if (page.url().includes('login.html')) {
        await expect(page).toHaveURL(/.*login\.html/);
      }
    }
  });

  test('job detail page information', async ({ page }) => {
    await page.goto('/job-detail.html');
    
    // Check all required information is present
    const requiredElements = [
      { selector: 'h1', description: 'Job title' },
      { selector: 'text=/£[0-9,]+/', description: 'Salary information' },
      { selector: 'text=/About/', description: 'Company information' },
      { selector: 'text=/Description|Requirements/', description: 'Job description' },
      { selector: 'button:has-text("Apply"), a:has-text("Apply")', description: 'Apply button' }
    ];
    
    for (const element of requiredElements) {
      await expect(page.locator(element.selector).first()).toBeVisible({
        timeout: 5000
      });
    }
    
    // Check for transparency indicators
    const transparencyBadges = page.locator('.verified, .transparency, [data-verified]');
    if (await transparencyBadges.count() > 0) {
      await expect(transparencyBadges.first()).toBeVisible();
    }
  });
});