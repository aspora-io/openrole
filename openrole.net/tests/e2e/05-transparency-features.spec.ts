import { test, expect } from './fixtures/test-fixtures';

test.describe('Transparency Features', () => {
  test('should display verified employer badges', async ({ page }) => {
    await page.goto('/jobs/');
    
    if (page.url().includes('404')) {
      test.skip();
    }

    // Look for verified employer badges
    const verifiedBadges = page.locator('.verified-employer');
    const badgeCount = await verifiedBadges.count();
    
    if (badgeCount > 0) {
      const firstBadge = verifiedBadges.first();
      expect(await firstBadge.textContent()).toContain('Verified');
      
      // Check badge styling
      const backgroundColor = await firstBadge.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      expect(backgroundColor).toBeTruthy();
    }
  });

  test('should show transparency metrics on homepage', async ({ page }) => {
    await page.goto('/');
    
    // Look for transparency badge
    const transparencyBadge = page.locator('.salary-badge, .transparency-pledge');
    
    if (await transparencyBadge.isVisible()) {
      expect(await transparencyBadge.textContent()).toMatch(/salary|transparency/i);
    }
    
    // Check for "Why FairPath" section
    const whySection = page.locator('section:has-text("Why FairPath")');
    if (await whySection.isVisible()) {
      expect(await whySection.textContent()).toContain('Salary Transparency');
    }
  });

  test('should have proper schema markup for jobs', async ({ page }) => {
    // Find a job listing page
    await page.goto('/jobs/');
    
    const jobLinks = page.locator('.job_listing a[href*="job/"]');
    const linkCount = await jobLinks.count();
    
    if (linkCount > 0) {
      // Navigate to first job
      const firstJobUrl = await jobLinks.first().getAttribute('href');
      if (firstJobUrl) {
        await page.goto(firstJobUrl);
        
        // Check for schema.org JobPosting markup
        const schemaScript = await page.locator('script[type="application/ld+json"]').textContent();
        
        if (schemaScript) {
          const schema = JSON.parse(schemaScript);
          expect(schema['@type']).toBe('JobPosting');
          
          // Check for salary in schema
          if (schema.baseSalary) {
            expect(schema.baseSalary['@type']).toBe('MonetaryAmount');
            expect(schema.baseSalary.value).toHaveProperty('minValue');
            expect(schema.baseSalary.value).toHaveProperty('maxValue');
          }
        }
      }
    }
  });

  test('should enforce fair hiring practices', async ({ page }) => {
    await page.goto('/');
    
    // Check footer for transparency commitment
    const footer = page.locator('.site-footer');
    const footerText = await footer.textContent();
    
    expect(footerText).toContain('Salary Transparency');
    
    // Check for privacy and terms links (compliance)
    expect(await footer.locator('a:has-text("Privacy")').isVisible()).toBeTruthy();
    expect(await footer.locator('a:has-text("Terms")').isVisible()).toBeTruthy();
  });
});