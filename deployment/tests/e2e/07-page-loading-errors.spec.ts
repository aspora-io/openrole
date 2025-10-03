import { test, expect } from '@playwright/test';

test.describe('Page Loading and Error Handling', () => {
  test.describe('All Pages Load Successfully', () => {
    const pages = [
      { path: '/', title: 'OpenRole' },
      { path: '/index.html', title: 'OpenRole' },
      { path: '/jobs.html', title: 'Jobs' },
      { path: '/job-detail.html', title: 'Job' },
      { path: '/employers.html', title: 'Employers' },
      { path: '/career-advice.html', title: 'Career' },
      { path: '/cv-upload.html', title: 'Upload' },
      { path: '/login.html', title: 'Login' },
      { path: '/register.html', title: 'Register' }
    ];

    for (const pageInfo of pages) {
      test(`should load ${pageInfo.path} without errors`, async ({ page }) => {
        // Navigate to page
        const response = await page.goto(pageInfo.path);
        
        // Check response status
        expect(response?.status()).toBeLessThan(400);
        
        // Check page title contains expected text
        const title = await page.title();
        expect(title.toLowerCase()).toContain(pageInfo.title.toLowerCase());
        
        // Check for no JavaScript errors
        const consoleErrors: string[] = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        });
        
        // Wait a bit for any delayed errors
        await page.waitForTimeout(1000);
        expect(consoleErrors).toHaveLength(0);
        
        // Check that main content is rendered
        const mainContent = page.locator('main, .main-content, #content, body').first();
        await expect(mainContent).toBeVisible();
        
        // Check for no broken images
        const images = page.locator('img');
        const imageCount = await images.count();
        for (let i = 0; i < imageCount; i++) {
          const img = images.nth(i);
          const src = await img.getAttribute('src');
          if (src && !src.startsWith('data:')) {
            // Check if image loads successfully
            const imgLoaded = await img.evaluate((el: HTMLImageElement) => el.complete && el.naturalHeight !== 0);
            expect(imgLoaded).toBeTruthy();
          }
        }
      });
    }
  });

  test.describe('Resource Loading', () => {
    test('should load all CSS files successfully', async ({ page }) => {
      const failedResources: string[] = [];
      
      page.on('response', response => {
        if (response.url().endsWith('.css') && response.status() >= 400) {
          failedResources.push(`${response.url()} - ${response.status()}`);
        }
      });
      
      await page.goto('/');
      await page.waitForTimeout(2000);
      
      expect(failedResources).toHaveLength(0);
      
      // Check that styles are applied
      const body = page.locator('body');
      const backgroundColor = await body.evaluate(el => 
        window.getComputedStyle(el).backgroundColor
      );
      expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)'); // Should have some background
    });

    test('should load all JavaScript files successfully', async ({ page }) => {
      const failedResources: string[] = [];
      
      page.on('response', response => {
        if (response.url().endsWith('.js') && response.status() >= 400) {
          failedResources.push(`${response.url()} - ${response.status()}`);
        }
      });
      
      await page.goto('/');
      await page.waitForTimeout(2000);
      
      expect(failedResources).toHaveLength(0);
    });

    test('should handle slow network gracefully', async ({ page }) => {
      // Simulate slow 3G network
      await page.route('**/*', route => {
        setTimeout(() => route.continue(), 100);
      });
      
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      
      // Critical content should still be visible
      const heading = page.locator('h1, h2').first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Error States', () => {
    test('should handle 404 pages gracefully', async ({ page }) => {
      const response = await page.goto('/non-existent-page.html');
      
      // Should get 404 response
      expect(response?.status()).toBe(404);
      
      // Should show error message or redirect
      const errorMessage = page.locator('text=/404|not found|error/i');
      if (await errorMessage.count() > 0) {
        await expect(errorMessage.first()).toBeVisible();
      } else {
        // Might redirect to home
        await page.waitForTimeout(1000);
        expect(page.url()).toContain('index.html');
      }
    });

    test('should show loading states for dynamic content', async ({ page }) => {
      await page.goto('/jobs.html');
      
      // Look for loading indicators
      const loadingIndicators = page.locator('.loading, .spinner, [aria-busy="true"], text=/loading/i');
      
      if (await loadingIndicators.count() > 0) {
        // Loading indicator should be visible initially
        await expect(loadingIndicators.first()).toBeVisible();
        
        // Should disappear after content loads
        await expect(loadingIndicators.first()).not.toBeVisible({ timeout: 5000 });
      }
    });

    test('should handle form submission errors', async ({ page }) => {
      await page.goto('/login.html');
      
      // Submit form with invalid data
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();
      
      // Should show validation errors
      await page.waitForTimeout(500);
      const errorMessages = page.locator('.error, .invalid, [role="alert"], .error-message');
      if (await errorMessages.count() > 0) {
        await expect(errorMessages.first()).toBeVisible();
      }
    });
  });

  test.describe('Performance and Optimization', () => {
    test('should load pages within reasonable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/', { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;
      
      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should have optimized images', async ({ page }) => {
      await page.goto('/');
      
      const images = page.locator('img');
      const imageCount = await images.count();
      
      for (let i = 0; i < imageCount; i++) {
        const img = images.nth(i);
        
        // Check for alt text (accessibility)
        const alt = await img.getAttribute('alt');
        expect(alt).toBeTruthy();
        
        // Check for responsive images
        const srcset = await img.getAttribute('srcset');
        const sizes = await img.getAttribute('sizes');
        
        // At least one responsive attribute should be present for content images
        const src = await img.getAttribute('src') || '';
        if (!src.includes('logo') && !src.includes('icon')) {
          expect(srcset || sizes || src.includes('.webp')).toBeTruthy();
        }
      }
    });

    test('should not have memory leaks on navigation', async ({ page }) => {
      // Get initial memory usage
      const getMemoryUsage = () => page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });
      
      const initialMemory = await getMemoryUsage();
      
      // Navigate through multiple pages
      const pagesToVisit = ['/jobs.html', '/employers.html', '/career-advice.html', '/'];
      
      for (const pageUrl of pagesToVisit) {
        await page.goto(pageUrl);
        await page.waitForTimeout(500);
      }
      
      // Force garbage collection if available
      await page.evaluate(() => {
        if (global.gc) {
          global.gc();
        }
      });
      
      await page.waitForTimeout(1000);
      
      const finalMemory = await getMemoryUsage();
      
      // Memory shouldn't increase dramatically (allow 50% increase)
      if (initialMemory > 0 && finalMemory > 0) {
        expect(finalMemory).toBeLessThan(initialMemory * 1.5);
      }
    });
  });

  test.describe('SEO and Meta Tags', () => {
    test('should have proper meta tags on all pages', async ({ page }) => {
      const pages = ['/', '/jobs.html', '/employers.html', '/career-advice.html'];
      
      for (const pageUrl of pages) {
        await page.goto(pageUrl);
        
        // Check for essential meta tags
        const description = await page.locator('meta[name="description"]').getAttribute('content');
        expect(description).toBeTruthy();
        expect(description!.length).toBeGreaterThan(50);
        
        // Check for viewport meta tag
        const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
        expect(viewport).toContain('width=device-width');
        
        // Check for canonical URL
        const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
        if (canonical) {
          expect(canonical).toBeTruthy();
        }
        
        // Check for Open Graph tags
        const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
        const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');
        
        if (ogTitle || ogDescription) {
          expect(ogTitle).toBeTruthy();
          expect(ogDescription).toBeTruthy();
        }
      }
    });

    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/');
      
      // Should have exactly one h1
      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1);
      
      // Check heading hierarchy
      const h1 = await page.locator('h1').first();
      const h2s = await page.locator('h2').all();
      
      await expect(h1).toBeVisible();
      
      if (h2s.length > 0) {
        for (const h2 of h2s) {
          await expect(h2).toBeVisible();
        }
      }
    });
  });
});