import { test, expect } from '@playwright/test';

test.describe('Production Authentication Flow', () => {
  // Test against the live production site
  test.use({ baseURL: 'https://openrole.net' });

  test('production auth page should load correctly', async ({ page }) => {
    await page.goto('/auth');
    
    // Check page loads without errors
    await expect(page).toHaveTitle(/OpenRole/);
    
    // Check main elements are present
    await expect(page.locator('h1')).toContainText('Welcome to OpenRole');
    await expect(page.locator('#google-oauth-btn')).toBeVisible();
    await expect(page.locator('#auth-form')).toBeVisible();
  });

  test('production Google OAuth button should be functional', async ({ page }) => {
    await page.goto('/auth');
    
    // Check Google OAuth button
    const googleButton = page.locator('#google-oauth-btn');
    await expect(googleButton).toBeVisible();
    await expect(googleButton).toBeEnabled();
    
    // Test click (will intercept to avoid actual OAuth)
    let oauthRequested = false;
    await page.route('**/api/auth/google', async route => {
      oauthRequested = true;
      await route.abort();
    });
    
    await googleButton.click();
    
    // Verify OAuth was attempted
    await page.waitForTimeout(1000);
    expect(oauthRequested).toBeTruthy();
  });

  test('production API endpoints should be accessible', async ({ page }) => {
    // Test auth API is responding
    const response = await page.request.get('/api/auth/google');
    
    // Should redirect to Google (302) or be accessible
    expect([200, 302, 401, 403]).toContain(response.status());
  });

  test('production auth callback should exist', async ({ page }) => {
    await page.goto('/auth-callback.html');
    
    // Page should load (even if it shows an error due to missing token)
    await expect(page.locator('body')).toBeVisible();
  });

  test('production dashboard redirects should work', async ({ page }) => {
    // Test candidate dashboard exists
    const candidateResponse = await page.request.get('/candidate-dashboard');
    expect([200, 302, 401, 403]).toContain(candidateResponse.status());
    
    // Test employer dashboard exists  
    const employerResponse = await page.request.get('/employer-dashboard');
    expect([200, 302, 401, 403]).toContain(employerResponse.status());
  });

  test('production auth redirects should work', async ({ page }) => {
    // Test login redirect
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Should redirect to unified auth
    expect(page.url()).toContain('/auth');
    
    // Test register redirect
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    
    // Should redirect to unified auth in signup mode
    expect(page.url()).toContain('/auth');
  });

  test('production user type selection should persist', async ({ page }) => {
    await page.goto('/auth');
    
    // Select employer
    const employerBtn = page.locator('#employer-btn');
    await employerBtn.click();
    
    // Intercept OAuth to test sessionStorage
    await page.route('**/api/auth/google', async route => {
      await route.abort();
    });
    
    // Click Google OAuth
    const googleButton = page.locator('#google-oauth-btn');
    await googleButton.click();
    
    // Check sessionStorage was set
    const userType = await page.evaluate(() => sessionStorage.getItem('selectedUserType'));
    expect(userType).toBe('employer');
  });

  test('production form validation should work', async ({ page }) => {
    await page.goto('/auth');
    
    // Switch to signup mode
    await page.locator('#signup-tab').click();
    
    // Try to submit empty form
    const authForm = page.locator('#auth-form');
    const submitButton = page.locator('#auth-button');
    
    await submitButton.click();
    
    // Form should not submit (HTML5 validation)
    const emailField = page.locator('#email');
    const isInvalid = await emailField.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBeTruthy();
  });

  test('production error handling should work', async ({ page }) => {
    await page.goto('/auth?error=oauth_failed');
    
    // Should show error message
    const errorContainer = page.locator('#message-container');
    await expect(errorContainer).not.toHaveClass(/hidden/);
    
    const errorMessage = page.locator('#error-message');
    await expect(errorMessage).not.toHaveClass(/hidden/);
  });

  test('production mobile responsiveness', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/auth');
    
    // Check elements are still visible and functional
    await expect(page.locator('#google-oauth-btn')).toBeVisible();
    await expect(page.locator('#auth-form')).toBeVisible();
    
    // Check user type buttons are accessible
    const candidateBtn = page.locator('#candidate-btn');
    const employerBtn = page.locator('#employer-btn');
    
    await expect(candidateBtn).toBeVisible();
    await expect(employerBtn).toBeVisible();
    
    // Test switching user types on mobile
    await employerBtn.click();
    await expect(employerBtn).toHaveClass(/border-primary/);
  });

  test('production performance check', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
    
    // Check critical resources loaded
    await expect(page.locator('#google-oauth-btn')).toBeVisible();
    await expect(page.locator('#auth-form')).toBeVisible();
  });
});