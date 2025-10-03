import { test, expect } from '@playwright/test';

test.describe('Footer Links and Content', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500); // Wait for any lazy-loaded content
  });

  test('should display footer on all pages', async ({ page }) => {
    const pages = ['/', '/jobs.html', '/employers.html', '/career-advice.html', '/login.html', '/register.html'];
    
    for (const pageUrl of pages) {
      await page.goto(pageUrl);
      const footer = page.locator('footer');
      await expect(footer).toBeVisible();
      
      // Footer should contain some content
      const footerText = await footer.textContent();
      expect(footerText).toBeTruthy();
      expect(footerText!.length).toBeGreaterThan(50);
    }
  });

  test('should have working company links', async ({ page }) => {
    const companyLinks = [
      { text: 'About Us', expectedUrl: /about/ },
      { text: 'How It Works', expectedUrl: /how|work/ },
      { text: 'Careers', expectedUrl: /career/ },
      { text: 'Press', expectedUrl: /press|news/ },
      { text: 'Blog', expectedUrl: /blog/ }
    ];

    for (const link of companyLinks) {
      const footerLink = page.locator(`footer a:has-text("${link.text}")`);
      
      if (await footerLink.count() > 0) {
        // Check link exists and has href
        await expect(footerLink.first()).toBeVisible();
        const href = await footerLink.first().getAttribute('href');
        expect(href).toBeTruthy();
        
        // Check if it's a valid link (not just #)
        expect(href).not.toBe('#');
        
        // For external links, check target="_blank"
        if (href?.startsWith('http') && !href.includes('openrole')) {
          await expect(footerLink.first()).toHaveAttribute('target', '_blank');
        }
      }
    }
  });

  test('should have working job seeker links', async ({ page }) => {
    const jobSeekerSection = page.locator('footer').filter({ hasText: /job seeker|candidate/i });
    
    if (await jobSeekerSection.count() > 0) {
      const jobSeekerLinks = [
        { text: 'Search Jobs', expectedUrl: /jobs/ },
        { text: 'Career Advice', expectedUrl: /career|advice/ },
        { text: 'Upload CV', expectedUrl: /cv|upload/ },
        { text: 'Job Alerts', expectedUrl: /alert/ },
        { text: 'Salary Guide', expectedUrl: /salary/ }
      ];

      for (const link of jobSeekerLinks) {
        const footerLink = page.locator(`footer a:has-text("${link.text}")`);
        
        if (await footerLink.count() > 0) {
          await expect(footerLink.first()).toBeVisible();
          const href = await footerLink.first().getAttribute('href');
          expect(href).toBeTruthy();
        }
      }
    }
  });

  test('should have working employer links', async ({ page }) => {
    const employerSection = page.locator('footer').filter({ hasText: /employer|hire|recruit/i });
    
    if (await employerSection.count() > 0) {
      const employerLinks = [
        { text: 'Post a Job', expectedUrl: /post|job/ },
        { text: 'Pricing', expectedUrl: /pricing/ },
        { text: 'Employer Dashboard', expectedUrl: /dashboard|employer/ },
        { text: 'Recruitment Tips', expectedUrl: /tips|guide/ }
      ];

      for (const link of employerLinks) {
        const footerLink = page.locator(`footer a:has-text("${link.text}")`);
        
        if (await footerLink.count() > 0) {
          await expect(footerLink.first()).toBeVisible();
          const href = await footerLink.first().getAttribute('href');
          expect(href).toBeTruthy();
        }
      }
    }
  });

  test('should have legal and policy links', async ({ page }) => {
    const legalLinks = [
      { text: 'Privacy Policy', required: true },
      { text: 'Terms of Service', required: true },
      { text: 'Cookie Policy', required: false },
      { text: 'Terms & Conditions', required: false },
      { text: 'Accessibility', required: false }
    ];

    for (const link of legalLinks) {
      const footerLink = page.locator(`footer a:has-text("${link.text}")`);
      
      if (link.required) {
        // Required links must exist
        expect(await footerLink.count()).toBeGreaterThan(0);
        await expect(footerLink.first()).toBeVisible();
        
        // Should have valid href
        const href = await footerLink.first().getAttribute('href');
        expect(href).toBeTruthy();
        expect(href).not.toBe('#');
      } else if (await footerLink.count() > 0) {
        // Optional links - check if they work when present
        await expect(footerLink.first()).toBeVisible();
      }
    }
  });

  test('should have working social media links', async ({ page }) => {
    const socialPlatforms = [
      { name: 'Facebook', urlPattern: /facebook\.com/ },
      { name: 'Twitter', urlPattern: /twitter\.com|x\.com/ },
      { name: 'LinkedIn', urlPattern: /linkedin\.com/ },
      { name: 'Instagram', urlPattern: /instagram\.com/ },
      { name: 'YouTube', urlPattern: /youtube\.com/ }
    ];

    for (const platform of socialPlatforms) {
      // Look for social links by platform name or URL
      const socialLink = page.locator(`footer a[href*="${platform.name.toLowerCase()}"], footer a[aria-label*="${platform.name}"]`);
      
      if (await socialLink.count() > 0) {
        const link = socialLink.first();
        await expect(link).toBeVisible();
        
        // Should open in new tab
        await expect(link).toHaveAttribute('target', '_blank');
        
        // Should have proper URL
        const href = await link.getAttribute('href');
        expect(href).toMatch(platform.urlPattern);
        
        // Should have rel="noopener" for security
        const rel = await link.getAttribute('rel');
        if (rel) {
          expect(rel).toContain('noopener');
        }
      }
    }
  });

  test('should have contact information', async ({ page }) => {
    const footer = page.locator('footer');
    const footerText = await footer.textContent();
    
    // Check for email
    const emailPattern = /[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}/;
    const hasEmail = emailPattern.test(footerText || '');
    
    if (hasEmail) {
      const emailLink = footer.locator('a[href^="mailto:"]');
      if (await emailLink.count() > 0) {
        await expect(emailLink.first()).toBeVisible();
        const href = await emailLink.first().getAttribute('href');
        expect(href).toMatch(/^mailto:/);
      }
    }
    
    // Check for phone number
    const phonePattern = /[\d\s()-]+\d{4,}/;
    const hasPhone = phonePattern.test(footerText || '');
    
    if (hasPhone) {
      const phoneLink = footer.locator('a[href^="tel:"]');
      if (await phoneLink.count() > 0) {
        await expect(phoneLink.first()).toBeVisible();
        const href = await phoneLink.first().getAttribute('href');
        expect(href).toMatch(/^tel:/);
      }
    }
    
    // Check for address
    const addressKeywords = ['Street', 'Road', 'Avenue', 'London', 'UK', 'United Kingdom'];
    const hasAddress = addressKeywords.some(keyword => 
      footerText?.includes(keyword)
    );
    
    if (hasAddress) {
      // Address should be in a specific element
      const address = footer.locator('address, .address, [itemtype*="PostalAddress"]');
      if (await address.count() > 0) {
        await expect(address.first()).toBeVisible();
      }
    }
  });

  test('should have copyright information', async ({ page }) => {
    const footer = page.locator('footer');
    const footerText = await footer.textContent();
    
    // Should contain copyright symbol and year
    expect(footerText).toMatch(/©|Copyright/i);
    expect(footerText).toMatch(/202[0-9]/); // Matches 2020-2029
    expect(footerText).toMatch(/OpenRole/i);
  });

  test('should have newsletter signup in footer', async ({ page }) => {
    const newsletterForm = page.locator('footer form, footer .newsletter');
    
    if (await newsletterForm.count() > 0) {
      // Should have email input
      const emailInput = newsletterForm.locator('input[type="email"], input[placeholder*="email"]').first();
      await expect(emailInput).toBeVisible();
      
      // Should have submit button
      const submitButton = newsletterForm.locator('button[type="submit"], button:has-text("Subscribe")').first();
      await expect(submitButton).toBeVisible();
      
      // Test newsletter signup
      await emailInput.fill('test@example.com');
      await submitButton.click();
      
      // Should show some feedback
      await page.waitForTimeout(1000);
      const feedback = page.locator('.newsletter-success, .success-message, text=/thank|subscribed/i');
      if (await feedback.count() > 0) {
        await expect(feedback.first()).toBeVisible();
      }
    }
  });

  test('should maintain footer consistency across breakpoints', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'mobile' },
      { width: 768, height: 1024, name: 'tablet' },
      { width: 1920, height: 1080, name: 'desktop' }
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto('/');
      
      // Scroll to footer
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      
      const footer = page.locator('footer');
      await expect(footer).toBeVisible();
      
      // Footer should not be cut off
      const footerBounds = await footer.boundingBox();
      expect(footerBounds).toBeTruthy();
      expect(footerBounds!.width).toBeGreaterThan(100);
      expect(footerBounds!.height).toBeGreaterThan(50);
      
      // Key links should still be accessible
      const importantLinks = ['Privacy Policy', 'Terms'];
      for (const linkText of importantLinks) {
        const link = footer.locator(`a:has-text("${linkText}")`).first();
        if (await link.count() > 0) {
          await expect(link).toBeVisible();
        }
      }
    }
  });

  test('should have accessible footer navigation', async ({ page }) => {
    const footer = page.locator('footer');
    
    // Footer should have proper landmarks
    const footerRole = await footer.getAttribute('role');
    if (!footerRole) {
      // HTML5 footer element has implicit role="contentinfo"
      const tagName = await footer.evaluate(el => el.tagName.toLowerCase());
      expect(tagName).toBe('footer');
    }
    
    // Links should be grouped logically
    const navSections = footer.locator('nav, [role="navigation"], ul');
    if (await navSections.count() > 0) {
      // Each section should have proper heading
      for (let i = 0; i < await navSections.count(); i++) {
        const section = navSections.nth(i);
        const heading = section.locator('h2, h3, h4, [role="heading"]');
        
        if (await heading.count() > 0) {
          await expect(heading.first()).toBeVisible();
        }
      }
    }
  });
});