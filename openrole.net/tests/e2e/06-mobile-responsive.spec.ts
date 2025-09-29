import { test, expect, devices } from '@playwright/test';

test.describe('Mobile Responsiveness', () => {
  test.use({ ...devices['iPhone 12'] });

  test('should display properly on mobile devices', async ({ page }) => {
    await page.goto('/');
    
    // Check viewport meta tag
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
    
    // Check mobile menu
    const mobileMenu = page.locator('.mobile-menu, .menu-toggle, button[aria-label*="menu"]');
    const isMobileMenuVisible = await mobileMenu.isVisible().catch(() => false);
    
    if (isMobileMenuVisible) {
      await mobileMenu.click();
      await expect(page.locator('.main-navigation, nav')).toBeVisible();
    }
  });

  test('job listings should be scrollable on mobile', async ({ page }) => {
    await page.goto('/jobs/');
    
    if (page.url().includes('404')) {
      test.skip();
    }

    // Check job cards are properly stacked
    const jobListings = page.locator('.job_listing');
    const count = await jobListings.count();
    
    if (count >= 2) {
      const firstJob = await jobListings.nth(0).boundingBox();
      const secondJob = await jobListings.nth(1).boundingBox();
      
      if (firstJob && secondJob) {
        // Jobs should be stacked vertically on mobile
        expect(secondJob.y).toBeGreaterThan(firstJob.y);
        // Width should be similar (full width)
        expect(Math.abs(firstJob.width - secondJob.width)).toBeLessThan(10);
      }
    }
  });

  test('job application form should be usable on mobile', async ({ page }) => {
    await page.goto('/submit-job/');
    
    if (page.url().includes('404')) {
      test.skip();
    }

    // Check form fields are accessible
    const titleInput = page.locator('input[name="job_title"]');
    if (await titleInput.isVisible()) {
      const box = await titleInput.boundingBox();
      if (box) {
        // Input should be reasonably sized for mobile
        expect(box.width).toBeGreaterThan(250);
        expect(box.height).toBeGreaterThan(30);
      }
      
      // Test that we can interact with it
      await titleInput.click();
      await titleInput.type('Test Mobile Job');
      expect(await titleInput.inputValue()).toBe('Test Mobile Job');
    }
  });
});

test.describe('Tablet Responsiveness', () => {
  test.use({ ...devices['iPad'] });

  test('should display grid layout on tablets', async ({ page }) => {
    await page.goto('/');
    
    // Check features grid
    const featuresGrid = page.locator('.features-grid');
    if (await featuresGrid.isVisible()) {
      const features = featuresGrid.locator('.feature');
      const count = await features.count();
      
      if (count >= 2) {
        const first = await features.nth(0).boundingBox();
        const second = await features.nth(1).boundingBox();
        
        if (first && second) {
          // On tablet, features might be side by side
          if (Math.abs(first.y - second.y) < 10) {
            // They are in the same row
            expect(second.x).toBeGreaterThan(first.x);
          }
        }
      }
    }
  });
});