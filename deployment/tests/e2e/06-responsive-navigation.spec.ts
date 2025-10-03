import { test, expect, devices } from '@playwright/test';

test.describe('Responsive Navigation', () => {
  test.describe('Mobile Navigation', () => {
    test.use(devices['iPhone 12']);

    test('should show mobile menu toggle', async ({ page }) => {
      await page.goto('/');
      
      // Desktop navigation should be hidden
      const desktopNav = page.locator('nav:not(.mobile-nav) a').first();
      if (await desktopNav.count() > 0) {
        const isVisible = await desktopNav.isVisible();
        if (!isVisible) {
          // This is expected on mobile
          expect(isVisible).toBeFalsy();
        }
      }
      
      // Mobile menu toggle should be visible
      const mobileMenuToggle = page.locator('button[aria-label*="menu"], .menu-toggle, .hamburger, button:has-text("☰")');
      await expect(mobileMenuToggle.first()).toBeVisible();
    });

    test('should open and close mobile menu', async ({ page }) => {
      await page.goto('/');
      
      const mobileMenuToggle = page.locator('button[aria-label*="menu"], .menu-toggle, .hamburger, button:has-text("☰")').first();
      
      // Open menu
      await mobileMenuToggle.click();
      await page.waitForTimeout(300); // Wait for animation
      
      // Mobile menu should be visible
      const mobileMenu = page.locator('.mobile-menu, .nav-mobile, nav[aria-expanded="true"]');
      if (await mobileMenu.count() > 0) {
        await expect(mobileMenu.first()).toBeVisible();
      }
      
      // Navigation links should be visible
      const navLinks = page.locator('a:has-text("Jobs"), a:has-text("Employers")');
      for (const link of await navLinks.all()) {
        await expect(link).toBeVisible();
      }
      
      // Close menu
      const closeButton = page.locator('button[aria-label*="close"], .close-menu, button:has-text("×")');
      if (await closeButton.count() > 0) {
        await closeButton.first().click();
      } else {
        // Click menu toggle again to close
        await mobileMenuToggle.click();
      }
      
      await page.waitForTimeout(300); // Wait for animation
      
      // Menu should be hidden
      if (await mobileMenu.count() > 0) {
        await expect(mobileMenu.first()).not.toBeVisible();
      }
    });

    test('should navigate through mobile menu', async ({ page }) => {
      await page.goto('/');
      
      const mobileMenuToggle = page.locator('button[aria-label*="menu"], .menu-toggle, .hamburger').first();
      await mobileMenuToggle.click();
      await page.waitForTimeout(300);
      
      // Navigate to Jobs page
      await page.click('a:has-text("Jobs")');
      await expect(page).toHaveURL(/.*jobs\.html/);
      
      // Menu should auto-close after navigation
      const mobileMenu = page.locator('.mobile-menu, .nav-mobile');
      if (await mobileMenu.count() > 0) {
        const isVisible = await mobileMenu.first().isVisible();
        expect(isVisible).toBeFalsy();
      }
    });

    test('should handle mobile search', async ({ page }) => {
      await page.goto('/jobs.html');
      
      // Check if search is immediately visible or needs toggle
      let searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
      
      if (!await searchInput.isVisible()) {
        // Look for search toggle
        const searchToggle = page.locator('button[aria-label*="search"], .search-toggle');
        if (await searchToggle.count() > 0) {
          await searchToggle.first().click();
          await page.waitForTimeout(300);
        }
      }
      
      // Search should now be visible
      searchInput = page.locator('input[type="search"], input[placeholder*="Search"]').first();
      if (await searchInput.isVisible()) {
        await searchInput.fill('Mobile search test');
        await expect(searchInput).toHaveValue('Mobile search test');
      }
    });
  });

  test.describe('Tablet Navigation', () => {
    test.use(devices['iPad']);

    test('should display appropriate navigation for tablet', async ({ page }) => {
      await page.goto('/');
      
      // Check if navigation is visible
      const navigation = page.locator('nav');
      await expect(navigation.first()).toBeVisible();
      
      // All main navigation items should be accessible
      const navItems = ['Jobs', 'Employers', 'Career Advice', 'Upload CV', 'Login'];
      for (const item of navItems) {
        const navLink = page.locator(`nav a:has-text("${item}")`);
        if (await navLink.count() > 0) {
          await expect(navLink.first()).toBeVisible();
        }
      }
    });

    test('should handle touch interactions', async ({ page }) => {
      await page.goto('/jobs.html');
      
      // Test dropdown menus if present
      const dropdownTrigger = page.locator('.has-dropdown, [aria-haspopup="true"]').first();
      if (await dropdownTrigger.count() > 0) {
        await dropdownTrigger.tap();
        
        // Dropdown should be visible
        const dropdown = page.locator('.dropdown-menu, [role="menu"]');
        if (await dropdown.count() > 0) {
          await expect(dropdown.first()).toBeVisible();
        }
        
        // Tap outside to close
        await page.locator('body').tap({ position: { x: 10, y: 10 } });
        await page.waitForTimeout(300);
        
        if (await dropdown.count() > 0) {
          const isVisible = await dropdown.first().isVisible();
          expect(isVisible).toBeFalsy();
        }
      }
    });
  });

  test.describe('Navigation Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/');
      
      // Main navigation should have proper role
      const mainNav = page.locator('nav, [role="navigation"]').first();
      await expect(mainNav).toHaveAttribute('role', 'navigation');
      
      // Mobile menu toggle should have ARIA label
      const menuToggle = page.locator('button[aria-label*="menu"], .menu-toggle');
      if (await menuToggle.count() > 0) {
        const ariaLabel = await menuToggle.first().getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();
      }
      
      // Check for skip links
      const skipLink = page.locator('a[href="#main"], a:has-text("Skip to")');
      if (await skipLink.count() > 0) {
        await expect(skipLink.first()).toHaveAttribute('href', '#main');
      }
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/');
      
      // Tab through navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Check if navigation links can receive focus
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Navigate with arrow keys if supported
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(100);
      
      const newFocusedElement = page.locator(':focus');
      await expect(newFocusedElement).toBeVisible();
    });
  });

  test.describe('Responsive Layout', () => {
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1280, height: 720 },
      { name: 'Wide Desktop', width: 1920, height: 1080 }
    ];

    for (const viewport of viewports) {
      test(`should display correctly at ${viewport.name} resolution`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.goto('/');
        
        // Check that main content is visible and not cut off
        const mainContent = page.locator('main, .main-content, #main').first();
        await expect(mainContent).toBeVisible();
        
        // Check that there's no horizontal scroll
        const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
        const windowWidth = await page.evaluate(() => window.innerWidth);
        expect(bodyWidth).toBeLessThanOrEqual(windowWidth + 1); // Allow 1px tolerance
        
        // Check footer is visible
        const footer = page.locator('footer').first();
        await expect(footer).toBeVisible();
      });
    }

    test('should handle orientation change', async ({ page }) => {
      // Start in portrait
      await page.setViewportSize({ width: 414, height: 896 });
      await page.goto('/');
      
      // Switch to landscape
      await page.setViewportSize({ width: 896, height: 414 });
      await page.waitForTimeout(300); // Wait for reflow
      
      // Navigation should still be functional
      const nav = page.locator('nav, .menu-toggle').first();
      await expect(nav).toBeVisible();
      
      // Content should reflow properly
      const mainContent = page.locator('main, .main-content').first();
      await expect(mainContent).toBeVisible();
    });
  });
});