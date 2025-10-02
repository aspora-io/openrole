import { test, expect } from '@playwright/test';

test.describe('Comprehensive Link and Page Tests', () => {
  const baseURL = 'http://localhost:3456';
  
  // All pages in our static site
  const allPages = [
    '/',
    '/index.html',
    '/static-mvp.html',
    '/jobs.html',
    '/job-detail.html',
    '/career-advice.html',
    '/cv-upload.html',
    '/employers.html',
    '/login.html',
    '/register.html'
  ];

  test('all pages should load without errors', async ({ page }) => {
    for (const pagePath of allPages) {
      console.log(`Testing page: ${pagePath}`);
      
      // Navigate to page
      const response = await page.goto(pagePath);
      
      // Check response status
      expect(response?.status()).toBeLessThan(400);
      
      // Check page has content
      const content = await page.content();
      expect(content.length).toBeGreaterThan(100);
      
      // Check for console errors
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      
      // Wait a bit to catch any async errors
      await page.waitForTimeout(1000);
      
      expect(errors).toHaveLength(0);
    }
  });

  test('all hyperlinks should be valid', async ({ page }) => {
    const visitedLinks = new Set<string>();
    const brokenLinks: { page: string, link: string, error: string }[] = [];
    
    for (const pagePath of allPages) {
      await page.goto(pagePath);
      console.log(`\nChecking links on: ${pagePath}`);
      
      // Get all links on the page
      const links = await page.$$eval('a[href]', anchors => 
        anchors.map(a => ({
          href: a.getAttribute('href') || '',
          text: a.textContent?.trim() || '',
          isExternal: a.getAttribute('href')?.startsWith('http') || false
        }))
      );
      
      console.log(`Found ${links.length} links`);
      
      for (const link of links) {
        // Skip empty hrefs, anchors, and already tested links
        if (!link.href || link.href === '#' || link.href.startsWith('#') || visitedLinks.has(link.href)) {
          continue;
        }
        
        visitedLinks.add(link.href);
        
        // Test internal links
        if (!link.isExternal) {
          try {
            const linkUrl = link.href.startsWith('/') ? link.href : `/${link.href}`;
            const response = await page.request.get(linkUrl);
            
            if (response.status() >= 400) {
              brokenLinks.push({
                page: pagePath,
                link: link.href,
                error: `Status ${response.status()}`
              });
              console.log(`  ❌ ${link.text} (${link.href}) - Status ${response.status()}`);
            } else {
              console.log(`  ✓ ${link.text} (${link.href})`);
            }
          } catch (error) {
            brokenLinks.push({
              page: pagePath,
              link: link.href,
              error: error.message
            });
            console.log(`  ❌ ${link.text} (${link.href}) - ${error.message}`);
          }
        }
      }
    }
    
    // Report broken links
    if (brokenLinks.length > 0) {
      console.log('\n❌ Broken links found:');
      brokenLinks.forEach(broken => {
        console.log(`  Page: ${broken.page}, Link: ${broken.link}, Error: ${broken.error}`);
      });
    }
    
    expect(brokenLinks).toHaveLength(0);
  });

  test('navigation menu should be consistent across all pages', async ({ page }) => {
    const expectedNavItems = ['Find Jobs', 'Upload CV', 'Employers', 'Career Advice'];
    
    for (const pagePath of allPages) {
      await page.goto(pagePath);
      
      // Check header exists
      const header = page.locator('header');
      await expect(header).toBeVisible();
      
      // Check navigation items
      for (const navItem of expectedNavItems) {
        const navLink = page.locator(`nav a:has-text("${navItem}")`);
        const count = await navLink.count();
        
        if (count === 0) {
          console.log(`Missing nav item "${navItem}" on page ${pagePath}`);
        }
        expect(count).toBeGreaterThan(0);
      }
      
      // Check login/register links
      const signinLink = page.locator('a:has-text("Sign in")');
      const registerLink = page.locator('a:has-text("Register")');
      
      // Login and register pages might have different header
      if (pagePath !== '/login.html' && pagePath !== '/register.html') {
        await expect(signinLink).toBeVisible();
        await expect(registerLink).toBeVisible();
      }
    }
  });

  test('all forms should have proper inputs and buttons', async ({ page }) => {
    // Test homepage search form
    await page.goto('/');
    const searchForm = page.locator('form').first();
    await expect(searchForm).toBeVisible();
    
    const jobInput = page.locator('input[placeholder*="Job title"]');
    await expect(jobInput).toBeVisible();
    
    // Test CV upload form
    await page.goto('/cv-upload.html');
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();
    
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    
    // Test login form
    await page.goto('/login.html');
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    
    // Test registration form
    await page.goto('/register.html');
    const firstNameInput = page.locator('input[placeholder*="First"]');
    await expect(firstNameInput).toBeVisible();
  });

  test('all images and assets should load', async ({ page }) => {
    const failedResources: { page: string, url: string, error: string }[] = [];
    
    for (const pagePath of allPages) {
      await page.goto(pagePath);
      
      // Listen for failed requests
      page.on('requestfailed', request => {
        failedResources.push({
          page: pagePath,
          url: request.url(),
          error: request.failure()?.errorText || 'Unknown error'
        });
      });
      
      // Wait for page to fully load
      await page.waitForLoadState('networkidle');
      
      // Check for broken images
      const images = await page.$$eval('img', imgs => 
        imgs.map(img => ({
          src: img.src,
          alt: img.alt,
          loaded: img.complete && img.naturalHeight !== 0
        }))
      );
      
      images.forEach(img => {
        if (!img.loaded && img.src) {
          failedResources.push({
            page: pagePath,
            url: img.src,
            error: 'Image failed to load'
          });
        }
      });
    }
    
    if (failedResources.length > 0) {
      console.log('\n❌ Failed resources:');
      failedResources.forEach(resource => {
        console.log(`  Page: ${resource.page}, URL: ${resource.url}, Error: ${resource.error}`);
      });
    }
    
    expect(failedResources).toHaveLength(0);
  });

  test('footer links should work on all pages', async ({ page }) => {
    const footerLinks = [
      'Browse Jobs',
      'Upload CV', 
      'Career Advice',
      'My Account',
      'Post a Job',
      'Pricing',
      'CV Database',
      'Employer Login',
      'About Us',
      'Contact',
      'Terms of Service',
      'Privacy Policy',
      'LinkedIn',
      'Twitter',
      'Facebook',
      'Blog'
    ];
    
    for (const pagePath of allPages) {
      await page.goto(pagePath);
      
      // Check if page has footer
      const footer = page.locator('footer');
      const footerCount = await footer.count();
      
      if (footerCount > 0) {
        console.log(`\nChecking footer links on: ${pagePath}`);
        
        for (const linkText of footerLinks) {
          const link = page.locator(`footer a:has-text("${linkText}")`);
          const count = await link.count();
          
          if (count > 0) {
            const href = await link.first().getAttribute('href');
            console.log(`  ✓ ${linkText} -> ${href}`);
          } else {
            console.log(`  ⚠️  ${linkText} not found in footer`);
          }
        }
      } else {
        console.log(`No footer on page: ${pagePath}`);
      }
    }
  });

  test('all internal navigation flows should work', async ({ page }) => {
    // Job seeker flow: Home -> Jobs -> Job Detail -> Apply
    await page.goto('/');
    await page.click('text=Find Jobs');
    await expect(page).toHaveURL(/jobs\.html/);
    
    await page.click('text=View details');
    await expect(page).toHaveURL(/job-detail\.html/);
    
    await page.click('text=Apply now');
    await expect(page).toHaveURL(/login\.html/);
    
    // Employer flow: Home -> Employers -> Post Job
    await page.goto('/');
    await page.click('nav >> text=Employers');
    await expect(page).toHaveURL(/employers\.html/);
    
    // CV Upload flow
    await page.goto('/');
    await page.click('text=Upload CV');
    await expect(page).toHaveURL(/cv-upload\.html/);
    
    // Career advice navigation
    await page.goto('/career-advice.html');
    
    // Check internal anchor links
    await page.click('a[href="#cv-tips"]');
    await expect(page).toHaveURL(/career-advice\.html#cv-tips/);
    
    await page.click('a[href="#interview-prep"]');
    await expect(page).toHaveURL(/career-advice\.html#interview-prep/);
  });

  test('search functionality should work', async ({ page }) => {
    await page.goto('/');
    
    // Fill search form
    await page.fill('input[placeholder*="Job title"]', 'Developer');
    await page.fill('input[placeholder*="Location"]', 'London');
    
    // Submit search
    await page.click('button:has-text("Search")');
    
    // Should redirect to jobs page with parameters
    await expect(page).toHaveURL(/jobs\.html/);
    
    const url = page.url();
    expect(url).toContain('query=Developer');
    expect(url).toContain('location=London');
  });

  test('responsive menu should work on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Check if mobile menu exists (if implemented)
    const mobileMenu = page.locator('[data-mobile-menu], button:has-text("Menu")');
    const mobileMenuCount = await mobileMenu.count();
    
    if (mobileMenuCount > 0) {
      await mobileMenu.click();
      
      // Check if navigation items are visible
      const navItems = page.locator('nav a');
      const firstNavItem = navItems.first();
      await expect(firstNavItem).toBeVisible();
    }
    
    // Reset viewport
    await page.setViewportSize({ width: 1280, height: 720 });
  });
});