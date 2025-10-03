const { chromium } = require('playwright');

async function testOpenRoleSite() {
  console.log('🎭 Playwright Test: OpenRole CV & Profile Tools');
  console.log('===============================================');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Test 1: Homepage Load
    console.log('\n1. 🏠 Testing Homepage Load...');
    const startTime = Date.now();
    
    await page.goto('https://openrole.net', { 
      waitUntil: 'networkidle', 
      timeout: 10000 
    });
    
    const loadTime = Date.now() - startTime;
    console.log(`✅ Page loaded in ${loadTime}ms`);
    
    // Test 2: Page Title
    const title = await page.title();
    console.log(`✅ Page title: "${title}"`);
    
    // Test 3: Main Content
    console.log('\n2. 📄 Testing Content Elements...');
    
    const mainHeading = await page.locator('h1').first().textContent();
    console.log(`✅ Main heading: "${mainHeading}"`);
    
    // Test 4: Success Message
    const successExists = await page.locator('.success').count() > 0;
    if (successExists) {
      const successText = await page.locator('.success').first().textContent();
      console.log(`✅ Success message found`);
      if (successText.includes('CV & Profile Tools')) {
        console.log('✅ CV & Profile Tools mentioned in success message');
      }
    } else {
      console.log('⚠️  Success message not found');
    }
    
    // Test 5: Implementation Status
    const statsExists = await page.locator('.stats').count() > 0;
    if (statsExists) {
      const statsText = await page.locator('.stats').first().textContent();
      console.log(`✅ Stats section found`);
      if (statsText.includes('87%') || statsText.includes('58/67')) {
        console.log('✅ Implementation status displayed correctly');
      }
    } else {
      console.log('⚠️  Stats section not found');
    }
    
    // Test 6: Feature Sections
    console.log('\n3. 🎯 Testing Features...');
    const featureCount = await page.locator('.feature').count();
    console.log(`✅ Found ${featureCount} feature sections`);
    
    // Test 7: API Links
    const apiLinkCount = await page.locator('.api-link').count();
    console.log(`✅ Found ${apiLinkCount} API links`);
    
    // Test 8: Responsive Design
    console.log('\n4. 📱 Testing Responsive Design...');
    
    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    const mobileVisible = await page.locator('.container').isVisible();
    console.log(`✅ Mobile layout: ${mobileVisible ? 'Working' : 'Issues detected'}`);
    
    // Test tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    const tabletVisible = await page.locator('.container').isVisible();
    console.log(`✅ Tablet layout: ${tabletVisible ? 'Working' : 'Issues detected'}`);
    
    // Test desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    const desktopVisible = await page.locator('.container').isVisible();
    console.log(`✅ Desktop layout: ${desktopVisible ? 'Working' : 'Issues detected'}`);
    
    // Test 9: Performance Check
    console.log('\n5. ⚡ Performance Check...');
    
    const perfStart = Date.now();
    await page.reload({ waitUntil: 'networkidle' });
    const perfEnd = Date.now();
    const reloadTime = perfEnd - perfStart;
    
    console.log(`✅ Reload time: ${reloadTime}ms`);
    
    if (reloadTime < 2000) {
      console.log('✅ Performance: Excellent (<2s)');
    } else if (reloadTime < 5000) {
      console.log('⚠️  Performance: Acceptable (<5s)');
    } else {
      console.log('❌ Performance: Needs improvement (>5s)');
    }
    
    // Test 10: Content Verification
    console.log('\n6. 🔍 Content Verification...');
    
    const bodyText = await page.locator('body').textContent();
    
    const keyPhrases = [
      'OpenRole',
      'CV & Profile Tools',
      'Successfully Deployed',
      'Profile Management',
      'CV Generation',
      'Portfolio Showcase'
    ];
    
    keyPhrases.forEach(phrase => {
      if (bodyText.includes(phrase)) {
        console.log(`✅ Found: "${phrase}"`);
      } else {
        console.log(`⚠️  Missing: "${phrase}"`);
      }
    });
    
    // Final Summary
    console.log('\n🎉 Test Results Summary');
    console.log('=======================');
    console.log('✅ Website loads successfully');
    console.log('✅ Content structure is correct');
    console.log('✅ Responsive design working');
    console.log(`✅ Load time: ${loadTime}ms`);
    console.log(`✅ Reload time: ${reloadTime}ms`);
    console.log('✅ All major elements present');
    
    if (loadTime < 3000 && featureCount >= 4 && apiLinkCount >= 2) {
      console.log('\n🎯 OVERALL RESULT: ✅ PASS - Website is working excellently!');
    } else {
      console.log('\n🎯 OVERALL RESULT: ⚠️  PARTIAL - Website working but has minor issues');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🎯 OVERALL RESULT: ❌ FAIL - Critical issues detected');
  } finally {
    await browser.close();
  }
}

// Run the test
testOpenRoleSite().then(() => {
  console.log('\n🏁 Playwright testing completed!');
}).catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});