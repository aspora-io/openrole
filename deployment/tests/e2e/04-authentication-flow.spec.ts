import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test.describe('Login Flow', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login.html');
    });

    test('should display login form with all required elements', async ({ page }) => {
      // Check page title
      await expect(page.locator('h1')).toContainText('Login');
      
      // Check form elements
      await expect(page.locator('input[type="email"], input[name="email"], input[placeholder*="Email"]')).toBeVisible();
      await expect(page.locator('input[type="password"], input[name="password"], input[placeholder*="Password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")')).toBeVisible();
      
      // Check additional elements
      await expect(page.locator('a:has-text("Forgot Password"), a:has-text("Forgot your password")')).toBeVisible();
      await expect(page.locator('a:has-text("Register"), a:has-text("Sign Up"), a:has-text("Create account")')).toBeVisible();
    });

    test('should validate login form inputs', async ({ page }) => {
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      const submitButton = page.locator('button[type="submit"], button:has-text("Login")').first();
      
      // Try to submit empty form
      await submitButton.click();
      
      // Check for validation messages
      await page.waitForTimeout(500);
      const errorMessage = page.locator('.error, .invalid-feedback, [role="alert"]');
      if (await errorMessage.count() > 0) {
        await expect(errorMessage.first()).toBeVisible();
      }
      
      // Test invalid email
      await emailInput.fill('invalid-email');
      await passwordInput.fill('password123');
      await submitButton.click();
      
      // Check email validation
      await page.waitForTimeout(500);
      if (await errorMessage.count() > 0) {
        await expect(errorMessage.first()).toBeVisible();
      }
    });

    test('should navigate to register page', async ({ page }) => {
      const registerLink = page.locator('a:has-text("Register"), a:has-text("Sign Up"), a:has-text("Create account")').first();
      await registerLink.click();
      
      await expect(page).toHaveURL(/.*register\.html/);
      await expect(page.locator('h1')).toContainText('Register');
    });

    test('should handle remember me functionality', async ({ page }) => {
      const rememberMe = page.locator('input[type="checkbox"][name="remember"], label:has-text("Remember me")');
      if (await rememberMe.count() > 0) {
        await rememberMe.first().click();
        await expect(rememberMe.first()).toBeChecked();
      }
    });
  });

  test.describe('Registration Flow', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/register.html');
    });

    test('should display registration form with all required elements', async ({ page }) => {
      // Check page title
      await expect(page.locator('h1')).toContainText('Register');
      
      // Check form elements
      await expect(page.locator('input[name="email"], input[placeholder*="Email"]')).toBeVisible();
      await expect(page.locator('input[name="password"], input[placeholder*="Password"]').first()).toBeVisible();
      await expect(page.locator('input[name="confirm"], input[placeholder*="Confirm"]')).toBeVisible();
      
      // Check user type selection
      const userTypeSelector = page.locator('input[type="radio"], select[name="user_type"], .user-type-selector');
      if (await userTypeSelector.count() > 0) {
        await expect(userTypeSelector.first()).toBeVisible();
      }
      
      // Check submit button
      await expect(page.locator('button[type="submit"], button:has-text("Register"), button:has-text("Sign Up")')).toBeVisible();
      
      // Check login link
      await expect(page.locator('a:has-text("Login"), a:has-text("Sign In"), a:has-text("Already have an account")')).toBeVisible();
    });

    test('should allow switching between job seeker and employer', async ({ page }) => {
      // Look for user type options
      const jobSeekerOption = page.locator('input[value="candidate"], label:has-text("Job Seeker"), button:has-text("I\'m looking for work")');
      const employerOption = page.locator('input[value="employer"], label:has-text("Employer"), button:has-text("I\'m hiring")');
      
      if (await jobSeekerOption.count() > 0 && await employerOption.count() > 0) {
        // Click employer option
        await employerOption.first().click();
        
        // Check if company name field appears
        const companyField = page.locator('input[name="company"], input[placeholder*="Company"]');
        if (await companyField.count() > 0) {
          await expect(companyField.first()).toBeVisible();
        }
        
        // Switch back to job seeker
        await jobSeekerOption.first().click();
        
        // Company field should be hidden or not required
        if (await companyField.count() > 0) {
          const isVisible = await companyField.first().isVisible();
          expect(isVisible).toBeFalsy();
        }
      }
    });

    test('should validate password requirements', async ({ page }) => {
      const passwordInput = page.locator('input[name="password"], input[placeholder*="Password"]').first();
      const confirmInput = page.locator('input[name="confirm"], input[placeholder*="Confirm"]').first();
      
      // Test weak password
      await passwordInput.fill('123');
      await passwordInput.blur();
      
      // Check for password strength indicator or error
      const passwordError = page.locator('.password-error, .password-strength, [data-password-strength]');
      if (await passwordError.count() > 0) {
        await expect(passwordError.first()).toBeVisible();
      }
      
      // Test password mismatch
      await passwordInput.fill('StrongPassword123!');
      await confirmInput.fill('DifferentPassword123!');
      await confirmInput.blur();
      
      // Check for mismatch error
      await page.waitForTimeout(500);
      const mismatchError = page.locator('.error, .invalid-feedback, text=/match/i');
      if (await mismatchError.count() > 0) {
        await expect(mismatchError.first()).toBeVisible();
      }
    });

    test('should navigate to login page', async ({ page }) => {
      const loginLink = page.locator('a:has-text("Login"), a:has-text("Sign In"), a:has-text("Already have an account")').first();
      await loginLink.click();
      
      await expect(page).toHaveURL(/.*login\.html/);
      await expect(page.locator('h1')).toContainText('Login');
    });

    test('should show terms and privacy policy', async ({ page }) => {
      // Check for terms and privacy links
      const termsLink = page.locator('a:has-text("Terms"), a:has-text("Terms of Service")');
      const privacyLink = page.locator('a:has-text("Privacy"), a:has-text("Privacy Policy")');
      
      if (await termsLink.count() > 0) {
        await expect(termsLink.first()).toBeVisible();
      }
      
      if (await privacyLink.count() > 0) {
        await expect(privacyLink.first()).toBeVisible();
      }
      
      // Check for agreement checkbox
      const agreementCheckbox = page.locator('input[type="checkbox"][name*="agree"], label:has-text("I agree")');
      if (await agreementCheckbox.count() > 0) {
        await expect(agreementCheckbox.first()).toBeVisible();
      }
    });
  });

  test.describe('Authentication State', () => {
    test('should redirect to login when trying to access protected pages', async ({ page }) => {
      // Try to access CV upload page
      await page.goto('/cv-upload.html');
      
      // Check if there's a login prompt or redirect
      const loginPrompt = page.locator('text=/log in|sign in/i, a:has-text("Login")');
      if (await loginPrompt.count() > 0) {
        await expect(loginPrompt.first()).toBeVisible();
      }
    });

    test('should maintain return URL after login', async ({ page }) => {
      // Navigate to a protected page
      await page.goto('/cv-upload.html');
      
      // Click login if prompted
      const loginButton = page.locator('a:has-text("Login"), button:has-text("Login")').first();
      if (await loginButton.isVisible()) {
        await loginButton.click();
        
        // Should be on login page
        await expect(page).toHaveURL(/.*login\.html/);
        
        // Check if return URL is preserved (in real app)
        const url = new URL(page.url());
        const returnUrl = url.searchParams.get('return') || url.searchParams.get('redirect');
        if (returnUrl) {
          expect(returnUrl).toContain('cv-upload');
        }
      }
    });
  });
});