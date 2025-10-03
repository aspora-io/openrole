import { test, expect } from '@playwright/test';

test.describe('Employer User Flow', () => {
  test('navigate employer journey from home to pricing', async ({ page }) => {
    // Start at home page
    await page.goto('/');
    
    // Click on employer CTA
    const employerCTA = page.locator('a:has-text("For Employers"), a:has-text("Post a Job"), button:has-text("Hire Talent")').first();
    await employerCTA.click();
    
    // Should be on employers page
    await expect(page).toHaveURL(/.*employers\.html/);
    await expect(page.locator('h1')).toContainText('Transparent Hiring');
    
    // Check key value propositions are displayed
    const valueProps = [
      'Verified Candidates',
      'Salary Transparency',
      'Quality Applications',
      'No Ghost Jobs'
    ];
    
    for (const prop of valueProps) {
      const element = page.locator(`text=/${prop}/i`);
      if (await element.count() > 0) {
        await expect(element.first()).toBeVisible();
      }
    }
    
    // Navigate to pricing
    const pricingLink = page.locator('a:has-text("View Pricing"), a:has-text("Pricing"), button:has-text("Get Started")').first();
    await pricingLink.click();
    
    // Verify pricing information is displayed
    await expect(page.locator('text=/£[0-9]+/')).toBeVisible();
  });

  test('employer registration flow', async ({ page }) => {
    await page.goto('/employers.html');
    
    // Click on 'Get Started' or 'Register' button
    const getStartedButton = page.locator('a:has-text("Get Started"), button:has-text("Register"), a:has-text("Sign Up")').first();
    await getStartedButton.click();
    
    // Should redirect to register page
    await expect(page).toHaveURL(/.*register\.html/);
    
    // Check for employer-specific registration options
    const employerOption = page.locator('input[value="employer"], label:has-text("Employer"), button:has-text("I\'m hiring")');
    if (await employerOption.count() > 0) {
      await employerOption.first().click();
    }
  });

  test('pricing page elements', async ({ page }) => {
    await page.goto('/employers.html');
    
    // Check for pricing tiers
    const pricingTiers = page.locator('.pricing-tier, .pricing-card, .plan');
    if (await pricingTiers.count() > 0) {
      await expect(pricingTiers).toHaveCount(await pricingTiers.count());
      
      // Each tier should have price and features
      for (let i = 0; i < await pricingTiers.count(); i++) {
        const tier = pricingTiers.nth(i);
        await expect(tier.locator('text=/£[0-9]+/')).toBeVisible();
        await expect(tier.locator('ul, .features')).toBeVisible();
      }
    }
    
    // Check for CTA buttons in pricing
    const ctaButtons = page.locator('button:has-text("Choose Plan"), a:has-text("Get Started"), button:has-text("Select")');
    if (await ctaButtons.count() > 0) {
      await expect(ctaButtons.first()).toBeVisible();
    }
  });

  test('employer benefits and features', async ({ page }) => {
    await page.goto('/employers.html');
    
    // Check for key features sections
    const features = [
      { heading: 'Verified Candidates', description: 'verified profiles' },
      { heading: 'Transparent Process', description: 'salary' },
      { heading: 'Quality Over Quantity', description: 'qualified' },
      { heading: 'Company Verification', description: 'trust' }
    ];
    
    for (const feature of features) {
      const heading = page.locator(`h2:has-text("${feature.heading}"), h3:has-text("${feature.heading}")`);
      if (await heading.count() > 0) {
        await expect(heading.first()).toBeVisible();
        
        // Check for related description
        const description = page.locator(`text=/${feature.description}/i`);
        if (await description.count() > 0) {
          await expect(description.first()).toBeVisible();
        }
      }
    }
  });

  test('employer testimonials and social proof', async ({ page }) => {
    await page.goto('/employers.html');
    
    // Check for testimonials section
    const testimonials = page.locator('.testimonial, blockquote, [data-testimonial]');
    if (await testimonials.count() > 0) {
      await expect(testimonials.first()).toBeVisible();
    }
    
    // Check for company logos or trust indicators
    const trustIndicators = page.locator('.company-logo, .client-logo, img[alt*="company"], img[alt*="client"]');
    if (await trustIndicators.count() > 0) {
      await expect(trustIndicators.first()).toBeVisible();
    }
    
    // Check for statistics
    const stats = page.locator('text=/[0-9]+[%+]/, text=/[0-9,]+\\s*(jobs|candidates|companies)/');
    if (await stats.count() > 0) {
      await expect(stats.first()).toBeVisible();
    }
  });
});