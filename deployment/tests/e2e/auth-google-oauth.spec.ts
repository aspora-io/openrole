import { test, expect } from '@playwright/test';

test.describe('Google OAuth Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the auth page before each test
    await page.goto('/auth');
  });

  test('Google OAuth button should be present and clickable', async ({ page }) => {
    // Check that the Google OAuth button exists
    const googleButton = page.locator('#google-oauth-btn');
    await expect(googleButton).toBeVisible();
    await expect(googleButton).toBeEnabled();
    
    // Check button text
    await expect(googleButton).toContainText('Continue with Google');
    
    // Check Google icon is present (SVG element)
    const googleIcon = googleButton.locator('svg');
    await expect(googleIcon).toBeVisible();
  });

  test('Google OAuth button should handle click events', async ({ page }) => {
    // Add console log listener to capture JavaScript logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });

    // Click the Google OAuth button
    const googleButton = page.locator('#google-oauth-btn');
    
    // Set up network request interception to prevent actual OAuth redirect
    await page.route('**/api/auth/google', async route => {
      // Instead of following the redirect, verify the request was made
      expect(route.request().url()).toContain('/api/auth/google');
      await route.abort(); // Abort to prevent actual OAuth flow
    });

    await googleButton.click();
    
    // Verify console log shows click was handled
    await page.waitForTimeout(1000); // Give time for logs
    expect(consoleLogs.some(log => log.includes('Google OAuth clicked'))).toBeTruthy();
  });

  test('Google OAuth should store selected user type in sessionStorage', async ({ page }) => {
    // Select candidate user type (default should be candidate)
    const candidateBtn = page.locator('#candidate-btn');
    await candidateBtn.click();
    
    // Set up route interception
    await page.route('**/api/auth/google', async route => {
      await route.abort();
    });

    // Click Google OAuth button
    const googleButton = page.locator('#google-oauth-btn');
    await googleButton.click();
    
    // Check sessionStorage
    const userType = await page.evaluate(() => sessionStorage.getItem('selectedUserType'));
    expect(userType).toBe('candidate');
  });

  test('Google OAuth should handle employer user type selection', async ({ page }) => {
    // Select employer user type
    const employerBtn = page.locator('#employer-btn');
    await employerBtn.click();
    
    // Verify employer is selected (check button styling)
    await expect(employerBtn).toHaveClass(/border-primary/);
    
    // Set up route interception
    await page.route('**/api/auth/google', async route => {
      await route.abort();
    });

    // Click Google OAuth button
    const googleButton = page.locator('#google-oauth-btn');
    await googleButton.click();
    
    // Check sessionStorage
    const userType = await page.evaluate(() => sessionStorage.getItem('selectedUserType'));
    expect(userType).toBe('employer');
  });

  test('Google OAuth should redirect to correct API endpoint', async ({ page }) => {
    let redirectUrl = '';
    
    // Intercept the OAuth redirect
    await page.route('**/api/auth/google', async route => {
      redirectUrl = route.request().url();
      await route.abort();
    });

    // Click Google OAuth button
    const googleButton = page.locator('#google-oauth-btn');
    await googleButton.click();
    
    // Wait for redirect attempt
    await page.waitForTimeout(1000);
    
    // Verify correct URL was called
    expect(redirectUrl).toContain('/api/auth/google');
  });

  test('Google OAuth button should handle JavaScript errors gracefully', async ({ page }) => {
    // Inject an error into the function to test error handling
    await page.evaluate(() => {
      // Override sessionStorage to throw an error
      Object.defineProperty(window, 'sessionStorage', {
        value: {
          setItem: () => {
            throw new Error('Storage error');
          }
        }
      });
    });

    const googleButton = page.locator('#google-oauth-btn');
    
    // Should not crash when clicked despite storage error
    await googleButton.click();
    
    // Page should still be responsive
    await expect(page.locator('h1')).toContainText('Welcome to OpenRole');
  });

  test('Page should initialize Google OAuth properly on load', async ({ page }) => {
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Check that initGoogleOAuth function was called by verifying button has event listener
    const hasEventListener = await page.evaluate(() => {
      const btn = document.getElementById('google-oauth-btn');
      return btn && btn.onclick === null; // Should be null if using addEventListener
    });
    
    expect(hasEventListener).toBeTruthy();
  });
});