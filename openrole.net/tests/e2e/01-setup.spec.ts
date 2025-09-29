import { test, expect } from '@playwright/test';

test.describe('WordPress Initial Setup', () => {
  test('should display WordPress installation or login page', async ({ page }) => {
    await page.goto('/');
    
    // Check if WordPress is installed
    const isInstalled = await page.locator('body').evaluate((el) => {
      return !el.textContent?.includes('WordPress') || !el.textContent?.includes('Install');
    });
    
    if (!isInstalled) {
      // WordPress needs installation
      expect(await page.title()).toContain('WordPress');
      expect(page.url()).toMatch(/wp-admin\/install\.php|wp-admin\/setup-config\.php/);
    } else {
      // WordPress is installed, should show site or login
      const title = await page.title();
      expect(title).toBeTruthy();
    }
  });

  test('should have Docker services running', async ({ request }) => {
    // Check if phpMyAdmin is accessible
    const phpmyadmin = await request.get('http://localhost:8081', { 
      failOnStatusCode: false 
    });
    expect(phpmyadmin.status()).toBeLessThan(500);

    // Check if MailHog is accessible
    const mailhog = await request.get('http://localhost:8025', { 
      failOnStatusCode: false 
    });
    expect(mailhog.status()).toBeLessThan(500);
  });

  test('should have proper theme structure', async ({ request }) => {
    const themeCSS = await request.get('/wp-content/themes/fairpath/style.css', {
      failOnStatusCode: false
    });
    
    if (themeCSS.ok()) {
      const content = await themeCSS.text();
      expect(content).toContain('Theme Name: FairPath');
      expect(content).toContain('transparent job platform');
    }
  });
});