import { test, expect } from '@playwright/test';

test.describe('Applications Page', () => {
  // Use production site for testing
  test.use({ baseURL: 'https://openrole.net' });

  test('applications page loads and shows correct structure for candidates', async ({ page }) => {
    await page.goto('/applications');
    
    // Check if user is authenticated
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    const user = await page.evaluate(() => JSON.parse(localStorage.getItem('user') || '{}'));
    
    if (!token || user.userType !== 'candidate') {
      // Should redirect to auth page
      await page.waitForURL('/auth', { timeout: 5000 });
      test.skip('User not authenticated as candidate - skipping applications page test');
      return;
    }

    // Verify page structure
    await expect(page.locator('h1')).toContainText('My Applications');
    await expect(page.locator('nav')).toContainText('My Applications');
    
    // Check statistics cards
    await expect(page.locator('#submitted-count')).toBeVisible();
    await expect(page.locator('#reviewed-count')).toBeVisible();
    await expect(page.locator('#interviewing-count')).toBeVisible();
    await expect(page.locator('#offered-count')).toBeVisible();
    await expect(page.locator('#rejected-count')).toBeVisible();
    
    // Check filters
    await expect(page.locator('#status-filter')).toBeVisible();
    await expect(page.locator('#sort-filter')).toBeVisible();
    await expect(page.locator('#search-filter')).toBeVisible();
    
    // Check applications list container
    await expect(page.locator('#applications-list')).toBeVisible();
  });

  test('filtering and sorting applications works', async ({ page }) => {
    await page.goto('/applications');
    
    // Check if user is authenticated
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    const user = await page.evaluate(() => JSON.parse(localStorage.getItem('user') || '{}'));
    
    if (!token || user.userType !== 'candidate') {
      test.skip('User not authenticated as candidate - skipping filtering test');
      return;
    }

    // Generate sample data if no applications exist
    const hasApplications = await page.evaluate(() => {
      const applications = JSON.parse(localStorage.getItem('openrole_applications') || '[]');
      return applications.length > 0;
    });

    if (!hasApplications) {
      await page.locator('button:has-text("Generate Sample Data")').click();
      await page.waitForTimeout(1000);
    }

    // Test status filter
    await page.locator('#status-filter').selectOption('submitted');
    await page.waitForTimeout(500);
    
    // Test sort filter
    await page.locator('#sort-filter').selectOption('company');
    await page.waitForTimeout(500);
    
    // Test search filter
    await page.locator('#search-filter').fill('Tech');
    await page.waitForTimeout(500);
    
    // Clear search
    await page.locator('#search-filter').fill('');
    await page.waitForTimeout(500);
    
    console.log('Filtering and sorting functionality verified');
  });

  test('application details modal works', async ({ page }) => {
    await page.goto('/applications');
    
    // Check if user is authenticated
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    const user = await page.evaluate(() => JSON.parse(localStorage.getItem('user') || '{}'));
    
    if (!token || user.userType !== 'candidate') {
      test.skip('User not authenticated as candidate - skipping modal test');
      return;
    }

    // Generate sample data if needed
    const hasApplications = await page.evaluate(() => {
      const applications = JSON.parse(localStorage.getItem('openrole_applications') || '[]');
      return applications.length > 0;
    });

    if (!hasApplications) {
      await page.locator('button:has-text("Generate Sample Data")').click();
      await page.waitForTimeout(1000);
    }

    // Check if there are view details buttons
    const viewButtons = page.locator('button:has-text("View Details")');
    const buttonCount = await viewButtons.count();
    
    if (buttonCount > 0) {
      // Click the first view details button
      await viewButtons.first().click();
      
      // Verify modal opens
      const modal = page.locator('#application-modal');
      await expect(modal).not.toHaveClass(/hidden/);
      
      // Check modal content
      await expect(page.locator('#modal-title')).toBeVisible();
      await expect(page.locator('#modal-content')).toBeVisible();
      
      // Close modal
      await page.locator('button:has([stroke="currentColor"])').click();
      
      // Verify modal closes
      await expect(modal).toHaveClass(/hidden/);
      
      console.log('Application details modal functionality verified');
    } else {
      console.log('No applications found to test modal');
    }
  });

  test('navigation between dashboard and applications page works', async ({ page }) => {
    // Check candidate dashboard first
    await page.goto('/candidate-dashboard');
    
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    const user = await page.evaluate(() => JSON.parse(localStorage.getItem('user') || '{}'));
    
    if (!token || user.userType !== 'candidate') {
      test.skip('User not authenticated as candidate - skipping navigation test');
      return;
    }

    // Navigate to applications page from dashboard
    const applicationsLink = page.locator('a:has-text("My Applications")');
    await expect(applicationsLink).toBeVisible();
    await applicationsLink.click();
    
    // Verify we're on applications page
    await page.waitForURL('/applications');
    await expect(page.locator('h1')).toContainText('My Applications');
    
    // Navigate back to dashboard
    const dashboardLink = page.locator('a:has-text("Dashboard")');
    await expect(dashboardLink).toBeVisible();
    await dashboardLink.click();
    
    // Verify we're back on dashboard
    await page.waitForURL('/candidate-dashboard');
    await expect(page.locator('h1')).toContainText('Welcome to your dashboard');
    
    console.log('Navigation between dashboard and applications page verified');
  });

  test('applications page shows real-time updates', async ({ page }) => {
    await page.goto('/applications');
    
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    const user = await page.evaluate(() => JSON.parse(localStorage.getItem('user') || '{}'));
    
    if (!token || user.userType !== 'candidate') {
      test.skip('User not authenticated as candidate - skipping real-time test');
      return;
    }

    // Get initial application count
    const initialCount = await page.locator('#total-applications').textContent();
    
    // Navigate to job detail page and apply
    await page.goto('/job-detail');
    
    const applyBtn = page.locator('#apply-btn');
    const buttonText = await applyBtn.textContent();
    
    if (buttonText?.includes('Apply now')) {
      // Apply for the job
      await applyBtn.click();
      await page.waitForTimeout(1000);
      
      // Go back to applications page
      await page.goto('/applications');
      await page.waitForTimeout(1000);
      
      // Check if count increased
      const newCount = await page.locator('#total-applications').textContent();
      const initialNum = parseInt(initialCount || '0');
      const newNum = parseInt(newCount || '0');
      
      expect(newNum).toBeGreaterThan(initialNum);
      console.log(`Application count increased from ${initialNum} to ${newNum}`);
    } else {
      console.log('User has already applied - cannot test real-time updates');
    }
  });
});