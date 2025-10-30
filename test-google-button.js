const { chromium } = require('playwright');

async function testGoogleButton() {
  console.log('🚀 Starting Google button test...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen for console messages and errors
  page.on('console', msg => {
    console.log(`📋 Console ${msg.type()}: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.log(`❌ Page error: ${error.message}`);
  });

  try {
    console.log('📖 Navigating to login page...');
    await page.goto('https://openrole.net/login', { waitUntil: 'networkidle' });
    
    console.log('🔍 Looking for Google button...');
    const googleButton = await page.locator('button:has-text("Google")').first();
    
    if (await googleButton.count() === 0) {
      console.log('❌ Google button not found!');
      return;
    }
    
    console.log('✅ Google button found, checking if clickable...');
    
    // Check if button is visible and enabled
    const isVisible = await googleButton.isVisible();
    const isEnabled = await googleButton.isEnabled();
    
    console.log(`👀 Button visible: ${isVisible}`);
    console.log(`🖱️  Button enabled: ${isEnabled}`);
    
    if (!isVisible || !isEnabled) {
      console.log('❌ Button not clickable');
      return;
    }

    // Get the onclick attribute
    const onclickAttr = await googleButton.getAttribute('onclick');
    console.log(`🔗 Button onclick: ${onclickAttr}`);

    // Test if the function exists in the page
    const functionExists = await page.evaluate(() => {
      return typeof window.loginWithGoogle === 'function';
    });
    console.log(`🔧 loginWithGoogle function exists: ${functionExists}`);

    // Test if API_BASE_URL is defined
    const apiBaseUrl = await page.evaluate(() => {
      return typeof window.API_BASE_URL !== 'undefined' ? window.API_BASE_URL : 'undefined';
    });
    console.log(`🌐 API_BASE_URL: ${apiBaseUrl}`);

    // Try to click the button and see what happens
    console.log('🖱️  Clicking Google button...');
    
    // Listen for navigation
    const navigationPromise = page.waitForNavigation({ timeout: 5000 }).catch(() => null);
    
    await googleButton.click();
    
    const navigationResult = await navigationPromise;
    
    if (navigationResult) {
      console.log(`✅ Navigation occurred to: ${navigationResult.url()}`);
    } else {
      console.log('❌ No navigation occurred after button click');
      
      // Check for any JavaScript errors
      const errors = await page.evaluate(() => {
        return window.jsErrors || [];
      });
      
      if (errors.length > 0) {
        console.log('🐛 JavaScript errors found:', errors);
      }
    }

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  } finally {
    await browser.close();
  }
}

testGoogleButton();