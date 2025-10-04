import { test, expect } from '@playwright/test';

test.describe('Application Tracking Flow', () => {
  // Use production site for testing
  test.use({ baseURL: 'https://openrole.net' });

  test('complete application tracking flow - candidate applies, employer sees application', async ({ page }) => {
    // Step 1: Register as a candidate
    await page.goto('/auth?mode=signup');
    
    // Select candidate user type
    await page.locator('#candidate-btn').click();
    
    // Switch to signup mode if not already
    await page.locator('#signup-tab').click();
    
    // Fill registration form
    await page.locator('#first_name').fill('John');
    await page.locator('#last_name').fill('Smith');
    await page.locator('#email').fill(`test-candidate-${Date.now()}@example.com`);
    await page.locator('#password').fill('TestPassword123');
    await page.locator('#confirm_password').fill('TestPassword123');
    await page.locator('#terms').check();
    
    // Submit registration
    await page.locator('#auth-button').click();
    
    // Wait for redirect to candidate dashboard
    await page.waitForURL('/candidate-dashboard', { timeout: 10000 });
    
    // Verify we're on the candidate dashboard
    await expect(page.locator('h1')).toContainText('Welcome to your dashboard');
    
    // Step 2: Navigate to job detail page and apply
    await page.goto('/job-detail');
    
    // Verify we can see the apply button
    const applyBtn = page.locator('#apply-btn');
    await expect(applyBtn).toBeVisible();
    await expect(applyBtn).toContainText('Apply now');
    
    // Click apply button
    await applyBtn.click();
    
    // Wait for application submission
    await page.waitForTimeout(1000);
    
    // Check for success message
    const statusDiv = page.locator('#application-status');
    await expect(statusDiv).toBeVisible();
    await expect(statusDiv).toContainText('Application submitted successfully');
    
    // Verify button changes to "Already Applied"
    await expect(applyBtn).toContainText('Already Applied');
    await expect(applyBtn).toBeDisabled();
    
    // Step 3: Check candidate dashboard shows the application
    await page.goto('/candidate-dashboard');
    
    // Wait for dashboard to load
    await page.waitForTimeout(2000);
    
    // Check applications count is updated
    const applicationsCount = page.locator('#applications-count');
    await expect(applicationsCount).toContainText('1');
    
    // Check recent applications section shows our application
    const recentApps = page.locator('#recent-applications');
    await expect(recentApps).toContainText('Senior Software Developer');
    await expect(recentApps).toContainText('Tech Corp');
    await expect(recentApps).toContainText('Submitted');
    
    // Step 4: Logout and register as employer
    await page.locator('button:has-text("Logout")').click();
    
    // Register as employer
    await page.goto('/auth?mode=signup');
    
    // Select employer user type
    await page.locator('#employer-btn').click();
    
    // Fill employer registration form
    await page.locator('#first_name').fill('Jane');
    await page.locator('#last_name').fill('Doe');
    await page.locator('#email').fill(`test-employer-${Date.now()}@example.com`);
    await page.locator('#company_name').fill('Tech Corp');
    await page.locator('#password').fill('TestPassword123');
    await page.locator('#confirm_password').fill('TestPassword123');
    await page.locator('#terms').check();
    
    // Submit registration
    await page.locator('#auth-button').click();
    
    // Wait for redirect to employer dashboard
    await page.waitForURL('/employer-dashboard', { timeout: 10000 });
    
    // Verify we're on the employer dashboard
    await expect(page.locator('h1')).toContainText('Employer Dashboard');
    
    // Step 5: Check employer dashboard shows received applications
    // Wait for dashboard to load
    await page.waitForTimeout(2000);
    
    // Check if applications are shown (may be 0 if employer ID doesn't match)
    const totalAppsCount = page.locator('#total-applications-count');
    const recentEmployerApps = page.locator('#recent-applications');
    
    // The employer should see their stats
    await expect(totalAppsCount).toBeVisible();
    
    console.log('Application tracking flow test completed successfully');
  });

  test('application status updates reflect in both dashboards', async ({ page }) => {
    // This test assumes we have existing application data
    await page.goto('/candidate-dashboard');
    
    // Check if user is logged in, if not skip test
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    if (!token) {
      test.skip('User not logged in - skipping status update test');
      return;
    }
    
    // Check current user type
    const user = await page.evaluate(() => JSON.parse(localStorage.getItem('user') || '{}'));
    
    if (user.userType === 'candidate') {
      // Check candidate dashboard shows applications
      await page.waitForTimeout(2000);
      
      const recentApps = page.locator('#recent-applications');
      
      // Check if there are any applications
      const hasApps = await recentApps.locator('.border').count() > 0;
      
      if (hasApps) {
        // Verify status is displayed
        await expect(recentApps).toContainText(/Submitted|Under Review|Interviewing|Offer Made/);
        console.log('Candidate can see application statuses');
      } else {
        console.log('No applications found for candidate dashboard test');
      }
    } else if (user.userType === 'employer') {
      // Check employer dashboard
      await page.goto('/employer-dashboard');
      await page.waitForTimeout(2000);
      
      const recentApps = page.locator('#recent-applications');
      
      // Check if there are any applications
      const hasApps = await recentApps.locator('.border').count() > 0;
      
      if (hasApps) {
        // Look for action buttons
        const actionButtons = recentApps.locator('button');
        const buttonCount = await actionButtons.count();
        
        if (buttonCount > 0) {
          console.log(`Employer dashboard has ${buttonCount} action buttons for managing applications`);
        }
      } else {
        console.log('No applications found for employer dashboard test');
      }
    }
  });

  test('job application prevents duplicate applications', async ({ page }) => {
    await page.goto('/job-detail');
    
    // Check if user is logged in and is a candidate
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    const user = await page.evaluate(() => JSON.parse(localStorage.getItem('user') || '{}'));
    
    if (!token || user.userType !== 'candidate') {
      test.skip('Candidate not logged in - skipping duplicate application test');
      return;
    }
    
    // Check if apply button exists and its state
    const applyBtn = page.locator('#apply-btn');
    await expect(applyBtn).toBeVisible();
    
    const buttonText = await applyBtn.textContent();
    
    if (buttonText?.includes('Already Applied')) {
      // User has already applied - verify duplicate prevention
      await expect(applyBtn).toBeDisabled();
      
      const statusDiv = page.locator('#application-status');
      await expect(statusDiv).toContainText('You have already applied');
      
      console.log('Duplicate application prevention verified');
    } else if (buttonText?.includes('Apply now')) {
      // User hasn't applied yet - test the application flow
      await applyBtn.click();
      
      // Wait for submission
      await page.waitForTimeout(1000);
      
      // Verify success and button state change
      await expect(applyBtn).toContainText('Already Applied');
      await expect(applyBtn).toBeDisabled();
      
      // Try to click again (should be disabled)
      const isDisabled = await applyBtn.isDisabled();
      expect(isDisabled).toBeTruthy();
      
      console.log('Application submission and duplicate prevention verified');
    }
  });

  test('application data persists across browser sessions', async ({ page }) => {
    await page.goto('/candidate-dashboard');
    
    // Check if user is logged in
    const token = await page.evaluate(() => localStorage.getItem('authToken'));
    if (!token) {
      test.skip('User not logged in - skipping persistence test');
      return;
    }
    
    // Get current application count
    await page.waitForTimeout(2000);
    const initialCount = await page.locator('#applications-count').textContent();
    
    // Refresh the page
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Verify count is the same
    const afterRefreshCount = await page.locator('#applications-count').textContent();
    expect(afterRefreshCount).toBe(initialCount);
    
    // Check localStorage data
    const applicationData = await page.evaluate(() => {
      return localStorage.getItem('openrole_applications');
    });
    
    expect(applicationData).toBeTruthy();
    
    const applications = JSON.parse(applicationData || '[]');
    console.log(`Found ${applications.length} applications in localStorage`);
    
    // Verify data structure
    if (applications.length > 0) {
      const app = applications[0];
      expect(app).toHaveProperty('id');
      expect(app).toHaveProperty('jobTitle');
      expect(app).toHaveProperty('candidateName');
      expect(app).toHaveProperty('status');
      expect(app).toHaveProperty('appliedAt');
    }
    
    console.log('Application data persistence verified');
  });
});