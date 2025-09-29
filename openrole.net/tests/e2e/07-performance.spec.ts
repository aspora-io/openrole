import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('homepage should load quickly', async ({ page }) => {
    const startTime = Date.now();
    
    const response = await page.goto('/', { waitUntil: 'networkidle' });
    
    const loadTime = Date.now() - startTime;
    
    // Page should load in under 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Check response status
    expect(response?.status()).toBe(200);
    
    // Check for render-blocking resources
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      };
    });
    
    // First Contentful Paint should be under 2 seconds
    if (metrics.firstContentfulPaint > 0) {
      expect(metrics.firstContentfulPaint).toBeLessThan(2000);
    }
  });

  test('job listings page should handle pagination efficiently', async ({ page }) => {
    await page.goto('/jobs/');
    
    if (page.url().includes('404')) {
      test.skip();
    }
    
    // Measure initial load
    const startTime = Date.now();
    await page.waitForLoadState('networkidle');
    const initialLoadTime = Date.now() - startTime;
    
    // Check if pagination exists
    const paginationLinks = page.locator('.job-manager-pagination a, .pagination a');
    if (await paginationLinks.count() > 0) {
      // Click next page
      const nextPage = paginationLinks.filter({ hasText: /next|2|→/ }).first();
      if (await nextPage.isVisible()) {
        const paginationStart = Date.now();
        await nextPage.click();
        await page.waitForLoadState('networkidle');
        const paginationTime = Date.now() - paginationStart;
        
        // Pagination should be faster than initial load
        expect(paginationTime).toBeLessThan(initialLoadTime);
      }
    }
  });

  test('images should be optimized', async ({ page }) => {
    await page.goto('/');
    
    // Check all images
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const src = await img.getAttribute('src');
      if (src && !src.startsWith('data:')) {
        // Check if image loads
        const response = await page.request.get(src, { failOnStatusCode: false });
        expect(response.status()).toBe(200);
        
        // Check image size (should be reasonable for web)
        const contentLength = response.headers()['content-length'];
        if (contentLength) {
          const sizeInKB = parseInt(contentLength) / 1024;
          // Images should generally be under 500KB
          expect(sizeInKB).toBeLessThan(500);
        }
        
        // Check for lazy loading
        const loading = await img.getAttribute('loading');
        // Non-critical images should lazy load
        const isAboveFold = await img.boundingBox().then(box => box && box.y < 800);
        if (!isAboveFold && loading !== 'lazy') {
          console.warn(`Image ${src} should use lazy loading`);
        }
      }
    }
  });

  test('should have proper caching headers', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response?.headers() || {};
    
    // Check for caching headers
    if (headers['cache-control']) {
      expect(headers['cache-control']).toMatch(/max-age|s-maxage/);
    }
    
    // Check for compression
    if (headers['content-encoding']) {
      expect(['gzip', 'br', 'deflate']).toContain(headers['content-encoding']);
    }
    
    // Load a CSS file and check caching
    const cssFiles = await page.locator('link[rel="stylesheet"]').all();
    if (cssFiles.length > 0) {
      const cssHref = await cssFiles[0].getAttribute('href');
      if (cssHref) {
        const cssResponse = await page.request.get(cssHref);
        const cssHeaders = cssResponse.headers();
        
        // CSS should have long cache
        if (cssHeaders['cache-control']) {
          expect(cssHeaders['cache-control']).toMatch(/max-age=\d+/);
        }
      }
    }
  });
});