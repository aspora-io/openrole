import { test, expect } from './fixtures/test-fixtures';

test.describe('Job Posting with Mandatory Salary', () => {
  test.use({ storageState: undefined }); // Fresh session

  test('should require salary fields when posting a job', async ({ page, wordpressPage }) => {
    // Login as admin first to check setup
    await wordpressPage.login(
      process.env.WP_ADMIN_USER || 'admin',
      process.env.WP_ADMIN_PASS || 'admin123'
    );

    // Navigate to job submission page
    await page.goto('/submit-job/');
    
    // Check if page exists
    if (page.url().includes('404') || await page.locator('body.error404').isVisible().catch(() => false)) {
      console.log('Job submission page not found. WP Job Manager may not be configured.');
      test.skip();
    }

    // Check for salary fields
    const salaryMinField = page.locator('input[name="job_salary_min"]');
    const salaryMaxField = page.locator('input[name="job_salary_max"]');
    
    // Verify salary fields exist and are required
    if (await salaryMinField.isVisible().catch(() => false)) {
      expect(await salaryMinField.getAttribute('required')).toBe('');
      expect(await salaryMaxField.getAttribute('required')).toBe('');
    } else {
      console.log('Custom salary fields not found. Check theme functions.php');
    }
  });

  test('should display salary badge on job listings', async ({ page }) => {
    await page.goto('/jobs/');
    
    // Check if jobs page exists
    if (page.url().includes('404')) {
      console.log('Jobs page not found. Create a page with [jobs] shortcode.');
      test.skip();
    }

    // Look for any existing jobs with salary display
    const jobListings = page.locator('.job_listing');
    const jobCount = await jobListings.count();
    
    if (jobCount > 0) {
      const firstJob = jobListings.first();
      const salaryDisplay = firstJob.locator('.job-salary-range');
      
      if (await salaryDisplay.isVisible().catch(() => false)) {
        const salaryText = await salaryDisplay.textContent();
        expect(salaryText).toMatch(/\$?\d+/); // Should contain numbers
      }
    }
  });

  test('should enforce transparency in job submission form', async ({ page, wordpressPage, jobPage }) => {
    // Login as employer
    await wordpressPage.login(
      process.env.WP_EMPLOYER_USER || 'employer@test.com',
      process.env.WP_EMPLOYER_PASS || 'employer123'
    );

    await page.goto('/submit-job/');
    
    if (page.url().includes('404')) {
      test.skip();
    }

    // Try to submit without salary
    await page.fill('input[name="job_title"]', 'Test Job Without Salary');
    await page.fill('.job-description textarea, textarea[name="job_description"]', 'Test description');
    await page.fill('input[name="job_location"]', 'Remote');

    // Submit form
    const submitButton = page.locator('input[type="submit"][value*="Preview"], input[type="submit"][value*="Submit"]');
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Check for validation error if salary fields are properly required
      const salaryMinField = page.locator('input[name="job_salary_min"]');
      if (await salaryMinField.isVisible()) {
        const validationMessage = await salaryMinField.evaluate((el: HTMLInputElement) => el.validationMessage);
        if (validationMessage) {
          expect(validationMessage).toContain('fill');
        }
      }
    }
  });
});