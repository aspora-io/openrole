import { test, expect } from '@playwright/test';

test.describe('Authentication Mode Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
  });

  test('should default to signin mode', async ({ page }) => {
    // Check signin tab is active
    const signinTab = page.locator('#signin-tab');
    await expect(signinTab).toHaveClass(/bg-white.*text-primary/);
    
    // Check signup tab is inactive
    const signupTab = page.locator('#signup-tab');
    await expect(signupTab).toHaveClass(/text-gray-600/);
    
    // Check form button text
    const authButton = page.locator('#auth-button');
    await expect(authButton).toContainText('Sign In');
    
    // Check switch link text
    const switchLink = page.locator('#switch-link');
    await expect(switchLink).toContainText('Sign up');
  });

  test('should switch to signup mode when signup tab clicked', async ({ page }) => {
    // Click signup tab
    const signupTab = page.locator('#signup-tab');
    await signupTab.click();
    
    // Check signup tab is now active
    await expect(signupTab).toHaveClass(/bg-white.*text-primary/);
    
    // Check signin tab is now inactive
    const signinTab = page.locator('#signin-tab');
    await expect(signinTab).toHaveClass(/text-gray-600/);
    
    // Check form button text changed
    const authButton = page.locator('#auth-button');
    await expect(authButton).toContainText('Create Account');
    
    // Check additional fields are visible
    const nameFields = page.locator('#name-fields');
    await expect(nameFields).not.toHaveClass(/hidden/);
    
    const confirmPasswordField = page.locator('#confirm-password-field');
    await expect(confirmPasswordField).not.toHaveClass(/hidden/);
    
    const termsField = page.locator('#terms-field');
    await expect(termsField).not.toHaveClass(/hidden/);
  });

  test('should hide/show fields appropriately in signup mode', async ({ page }) => {
    // Switch to signup mode
    const signupTab = page.locator('#signup-tab');
    await signupTab.click();
    
    // Fields that should be visible in signup
    await expect(page.locator('#first_name')).toBeVisible();
    await expect(page.locator('#last_name')).toBeVisible();
    await expect(page.locator('#confirm_password')).toBeVisible();
    await expect(page.locator('#terms')).toBeVisible();
    
    // Fields that should be hidden in signup
    await expect(page.locator('#remember-field')).toHaveClass(/hidden/);
    await expect(page.locator('#forgot-link')).toHaveClass(/hidden/);
  });

  test('should show company field for employers in signup mode', async ({ page }) => {
    // Switch to signup mode
    await page.locator('#signup-tab').click();
    
    // Select employer user type
    const employerBtn = page.locator('#employer-btn');
    await employerBtn.click();
    
    // Company field should be visible
    const companyField = page.locator('#company-field');
    await expect(companyField).not.toHaveClass(/hidden/);
    await expect(page.locator('#company_name')).toBeVisible();
  });

  test('should hide company field for candidates in signup mode', async ({ page }) => {
    // Switch to signup mode
    await page.locator('#signup-tab').click();
    
    // Select candidate user type (should be default)
    const candidateBtn = page.locator('#candidate-btn');
    await candidateBtn.click();
    
    // Company field should be hidden
    const companyField = page.locator('#company-field');
    await expect(companyField).toHaveClass(/hidden/);
  });

  test('should handle mode switching via URL parameters', async ({ page }) => {
    // Navigate with signup mode parameter
    await page.goto('/auth?mode=signup');
    
    // Should be in signup mode
    const signupTab = page.locator('#signup-tab');
    await expect(signupTab).toHaveClass(/bg-white.*text-primary/);
    
    const authButton = page.locator('#auth-button');
    await expect(authButton).toContainText('Create Account');
  });

  test('should handle user type switching via URL parameters', async ({ page }) => {
    // Navigate with employer type parameter
    await page.goto('/auth?type=employer');
    
    // Employer should be selected
    const employerBtn = page.locator('#employer-btn');
    await expect(employerBtn).toHaveClass(/border-primary/);
    
    // Candidate should not be selected
    const candidateBtn = page.locator('#candidate-btn');
    await expect(candidateBtn).toHaveClass(/border-gray-300/);
  });

  test('should toggle between modes using switch link', async ({ page }) => {
    // Start in signin mode, click switch link to go to signup
    let switchLink = page.locator('#switch-link');
    await switchLink.click();
    
    // Should be in signup mode
    await expect(page.locator('#auth-button')).toContainText('Create Account');
    await expect(switchLink).toContainText('Sign in');
    
    // Click switch link again to go back to signin
    await switchLink.click();
    
    // Should be back in signin mode
    await expect(page.locator('#auth-button')).toContainText('Sign In');
    await expect(switchLink).toContainText('Sign up');
  });

  test('should maintain user type selection when switching modes', async ({ page }) => {
    // Select employer
    const employerBtn = page.locator('#employer-btn');
    await employerBtn.click();
    
    // Switch to signup mode
    await page.locator('#signup-tab').click();
    
    // Employer should still be selected
    await expect(employerBtn).toHaveClass(/border-primary/);
    
    // Switch back to signin mode
    await page.locator('#signin-tab').click();
    
    // Employer should still be selected
    await expect(employerBtn).toHaveClass(/border-primary/);
  });

  test('should handle form validation states between modes', async ({ page }) => {
    // Fill in email in signin mode
    await page.locator('#email').fill('test@example.com');
    
    // Switch to signup mode
    await page.locator('#signup-tab').click();
    
    // Email should be preserved
    await expect(page.locator('#email')).toHaveValue('test@example.com');
    
    // Switch back to signin
    await page.locator('#signin-tab').click();
    
    // Email should still be there
    await expect(page.locator('#email')).toHaveValue('test@example.com');
  });
});