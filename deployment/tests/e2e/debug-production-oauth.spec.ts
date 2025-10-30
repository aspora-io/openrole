import { test, expect } from '@playwright/test';

test.describe('Debug Production OAuth', () => {
  // Test against the live production site
  test.use({ baseURL: 'https://openrole.net' });

  test('debug Google OAuth button click behavior', async ({ page }) => {
    // Capture all console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });

    // Capture any JavaScript errors
    const jsErrors: string[] = [];
    page.on('pageerror', error => {
      jsErrors.push(error.message);
    });

    // Navigate to auth page
    await page.goto('/auth');
    
    console.log('Page loaded, checking elements...');
    
    // Check button exists
    const googleButton = page.locator('#google-oauth-btn');
    await expect(googleButton).toBeVisible();
    console.log('Google button is visible');
    
    // Check user type selection
    const candidateBtn = page.locator('#candidate-btn');
    const employerBtn = page.locator('#employer-btn');
    await expect(candidateBtn).toBeVisible();
    await expect(employerBtn).toBeVisible();
    console.log('User type buttons are visible');
    
    // Select candidate explicitly
    await candidateBtn.click();
    console.log('Candidate selected');
    
    // Set up network monitoring
    let networkRequests: string[] = [];
    page.on('request', request => {
      networkRequests.push(`${request.method()} ${request.url()}`);
    });
    
    // Click the Google button
    console.log('Clicking Google OAuth button...');
    await googleButton.click();
    
    // Wait a bit for any actions to complete
    await page.waitForTimeout(2000);
    
    // Log everything we captured
    console.log('\n--- Console Logs ---');
    consoleLogs.forEach(log => console.log(log));
    
    console.log('\n--- JavaScript Errors ---');
    jsErrors.forEach(error => console.log(error));
    
    console.log('\n--- Network Requests ---');
    networkRequests.forEach(req => console.log(req));
    
    // Check sessionStorage
    const userType = await page.evaluate(() => sessionStorage.getItem('selectedUserType'));
    console.log('\n--- Session Storage ---');
    console.log('selectedUserType:', userType);
    
    // Check if we're still on the same page or redirected
    const currentUrl = page.url();
    console.log('\n--- Current URL ---');
    console.log('URL:', currentUrl);
    
    // Try to check if the event listener is actually attached
    const hasEventListener = await page.evaluate(() => {
      const btn = document.getElementById('google-oauth-btn');
      if (!btn) return 'Button not found';
      
      // Try to get the event listeners (this might not work in all browsers)
      const listeners = (btn as any)._events || (btn as any).onclick;
      return {
        hasOnclick: btn.onclick !== null,
        hasListeners: !!listeners,
        buttonHTML: btn.outerHTML.substring(0, 200) + '...'
      };
    });
    
    console.log('\n--- Event Listener Check ---');
    console.log('Event listener info:', hasEventListener);
    
    // Also check if initGoogleOAuth was called
    const initCalled = await page.evaluate(() => {
      return typeof (window as any).initGoogleOAuth === 'function';
    });
    
    console.log('\n--- Function Check ---');
    console.log('initGoogleOAuth exists:', initCalled);
  });

  test('check if auth API is accessible from production', async ({ page }) => {
    // Test the OAuth endpoint directly
    console.log('Testing direct API access...');
    
    const response = await page.request.get('/api/auth/google');
    console.log('API Response Status:', response.status());
    console.log('API Response Headers:', await response.allHeaders());
    
    if (response.status() === 302) {
      const location = response.headers()['location'];
      console.log('Redirect Location:', location);
      
      // Should redirect to Google OAuth
      expect(location).toContain('accounts.google.com');
    }
  });
});