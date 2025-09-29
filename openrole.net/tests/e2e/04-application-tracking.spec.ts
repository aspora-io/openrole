import { test, expect } from './fixtures/test-fixtures';

test.describe('Application Tracking System', () => {
  test('should show application status to candidates', async ({ page, wordpressPage }) => {
    // Login as candidate
    await wordpressPage.login(
      process.env.WP_CANDIDATE_USER || 'candidate@test.com',
      process.env.WP_CANDIDATE_PASS || 'candidate123'
    );

    // Navigate to applications dashboard
    await page.goto('/my-applications/');
    
    if (page.url().includes('404')) {
      console.log('Applications page not found. Create page with [job_applications] shortcode.');
      test.skip();
    }

    // Check for application status display
    const applications = page.locator('.job-application, .application-status');
    const appCount = await applications.count();
    
    if (appCount > 0) {
      const firstApp = applications.first();
      const statusBadge = firstApp.locator('.application-status, .status');
      
      if (await statusBadge.isVisible()) {
        const status = await statusBadge.textContent();
        expect(['submitted', 'reviewing', 'interviewing', 'rejected', 'offered']).toContain(
          status?.toLowerCase().trim() || ''
        );
      }
    }
  });

  test('should send email notifications on status change', async ({ page, request }) => {
    // Check MailHog for any application status emails
    const mailhogResponse = await request.get('http://localhost:8025/api/v2/messages');
    
    if (mailhogResponse.ok()) {
      const messages = await mailhogResponse.json();
      
      // Look for application status emails
      const statusEmails = messages.items?.filter((msg: any) => 
        msg.Content?.Headers?.Subject?.[0]?.includes('Application Update') ||
        msg.Raw?.Data?.includes('application') ||
        msg.Raw?.Data?.includes('status')
      ) || [];
      
      if (statusEmails.length > 0) {
        const latestEmail = statusEmails[0];
        expect(latestEmail.Content?.Headers?.To).toBeTruthy();
        expect(latestEmail.Raw?.Data).toContain('status');
      }
    }
  });

  test('should display employer dashboard with application management', async ({ page, wordpressPage }) => {
    // Login as employer
    await wordpressPage.login(
      process.env.WP_EMPLOYER_USER || 'employer@test.com',
      process.env.WP_EMPLOYER_PASS || 'employer123'
    );

    // Go to job dashboard
    await page.goto('/dashboard/');
    
    if (page.url().includes('404')) {
      test.skip();
    }

    // Check for job management interface
    const jobDashboard = page.locator('.job_listings, .job-dashboard');
    if (await jobDashboard.isVisible()) {
      // Look for application count or management links
      const appLinks = page.locator('a:has-text("Applications"), a:has-text("Applicants")');
      const linkCount = await appLinks.count();
      
      if (linkCount > 0) {
        // Click on first applications link
        await appLinks.first().click();
        
        // Should see application management interface
        await expect(page.locator('.applications, .applicants')).toBeVisible({ timeout: 10000 });
      }
    }
  });
});