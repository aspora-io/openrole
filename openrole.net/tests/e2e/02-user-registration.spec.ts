import { test, expect } from '@playwright/test';

test.describe('User Registration', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/wp-login.php?action=register');
  });

  test('should display registration form with user type selection', async ({ page }) => {
    // Check if registration is enabled
    const registrationEnabled = await page.locator('#registerform').isVisible().catch(() => false);
    
    if (!registrationEnabled) {
      console.log('Registration is disabled. Enable it in WordPress settings.');
      test.skip();
    }

    // Check for custom user type field
    const userTypeField = page.locator('select[name="user_type"]');
    const fieldExists = await userTypeField.isVisible().catch(() => false);
    
    if (fieldExists) {
      expect(await userTypeField.locator('option').count()).toBeGreaterThan(1);
      expect(await userTypeField.locator('option[value="candidate"]').textContent()).toContain('Job Seeker');
      expect(await userTypeField.locator('option[value="employer"]').textContent()).toContain('Employer');
    }
  });

  test('should register as job seeker', async ({ page }) => {
    const registrationEnabled = await page.locator('#registerform').isVisible().catch(() => false);
    
    if (!registrationEnabled) {
      test.skip();
    }

    const uniqueId = Date.now();
    const username = `jobseeker${uniqueId}`;
    const email = `jobseeker${uniqueId}@test.com`;

    await page.fill('#user_login', username);
    await page.fill('#user_email', email);
    
    const userTypeField = page.locator('select[name="user_type"]');
    if (await userTypeField.isVisible().catch(() => false)) {
      await userTypeField.selectOption('candidate');
    }

    await page.click('#wp-submit');

    // Check for success message
    await expect(page.locator('.message')).toContainText(/Registration complete|Check your email/i);
  });

  test('should register as employer', async ({ page }) => {
    const registrationEnabled = await page.locator('#registerform').isVisible().catch(() => false);
    
    if (!registrationEnabled) {
      test.skip();
    }

    const uniqueId = Date.now();
    const username = `employer${uniqueId}`;
    const email = `employer${uniqueId}@test.com`;

    await page.fill('#user_login', username);
    await page.fill('#user_email', email);
    
    const userTypeField = page.locator('select[name="user_type"]');
    if (await userTypeField.isVisible().catch(() => false)) {
      await userTypeField.selectOption('employer');
    }

    await page.click('#wp-submit');

    // Check for success message
    await expect(page.locator('.message')).toContainText(/Registration complete|Check your email/i);
  });
});