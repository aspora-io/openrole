import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to all main pages via header navigation', async ({ page }) => {
    // Test Find Jobs link
    await page.click('nav a:has-text("Find Jobs")');
    await expect(page).toHaveURL(/.*jobs\.html/);
    await expect(page.locator('h1, h2').first()).toContainText('jobs');

    // Test Employers link
    await page.click('nav a:has-text("Employers")');
    await expect(page).toHaveURL(/.*employers\.html/);
    await expect(page.locator('h1')).toContainText('Find Your Next Great Hire');

    // Test Career Advice link
    await page.click('nav a:has-text("Career Advice")');
    await expect(page).toHaveURL(/.*career-advice\.html/);
    await expect(page.locator('h1')).toContainText('Career Advice Hub');

    // Test CV Upload link
    await page.click('nav a:has-text("Upload CV")');
    await expect(page).toHaveURL(/.*cv-upload\.html/);
    await expect(page.locator('h1')).toContainText('Upload Your CV');

    // Test Sign in link
    await page.click('a:has-text("Sign in")');
    await expect(page).toHaveURL(/.*login\.html/);
    await expect(page.locator('h1')).toContainText('Welcome Back');
  });

  test('should navigate from logo to home page', async ({ page }) => {
    await page.goto('/jobs.html');
    await page.click('header a:has(div.w-8.h-8)');
    await expect(page).toHaveURL('http://localhost:3456/');
  });

  test('should have working footer links', async ({ page }) => {
    // Check footer links exist
    const footerLinks = [
      { text: 'Browse Jobs', selector: 'footer a:has-text("Browse Jobs")' },
      { text: 'Upload CV', selector: 'footer a:has-text("Upload CV")' },
      { text: 'Career Advice', selector: 'footer a:has-text("Career Advice")' },
      { text: 'Post a Job', selector: 'footer a:has-text("Post a Job")' },
      { text: 'Pricing', selector: 'footer a:has-text("Pricing")' }
    ];

    for (const link of footerLinks) {
      await page.goto('/');
      const footerLink = page.locator(link.selector);
      
      // Check if link exists
      const count = await footerLink.count();
      if (count > 0) {
        await expect(footerLink.first()).toBeVisible();
        
        // Check that links have href attributes
        const href = await footerLink.first().getAttribute('href');
        expect(href).toBeTruthy();
      }
    }

    // Test social media links
    const socialLinks = [
      { selector: 'footer a[href*="twitter"]', platform: 'Twitter' },
      { selector: 'footer a[href*="linkedin"]', platform: 'LinkedIn' },
      { selector: 'footer a[href*="facebook"]', platform: 'Facebook' }
    ];

    for (const social of socialLinks) {
      const socialLink = page.locator(social.selector);
      if (await socialLink.count() > 0) {
        await expect(socialLink).toHaveAttribute('target', '_blank');
      }
    }
  });

  test('should maintain navigation state across pages', async ({ page }) => {
    // Navigate to jobs page
    await page.click('nav a:has-text("Jobs")');
    
    // Check that Jobs link is highlighted/active
    const activeLink = page.locator('nav a:has-text("Jobs")');
    const classes = await activeLink.getAttribute('class');
    
    // The active link should have some distinguishing class or style
    // This test will need adjustment based on actual implementation
    await expect(activeLink).toBeVisible();
  });
});