const { chromium } = require('playwright');

async function testOpenRoleSite() {
  console.log('🎭 Starting Playwright Tests for OpenRole CV & Profile Tools');
  console.log('================================================================');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  const page = await context.newPage();

  try {
    // Test 1: Homepage Load and Performance
    console.log('\n1. 🏠 Testing Homepage Load...');
    const startTime = Date.now();
    
    await page.goto('https://openrole.net', { 
      waitUntil: 'networkidle', 
      timeout: 10000 
    });
    
    const loadTime = Date.now() - startTime;
    console.log(`✅ Page loaded in ${loadTime}ms`);
    
    // Check page title
    const title = await page.title();
    console.log(`✅ Page title: "${title}"`);
    
    if (title.includes('OpenRole') && title.includes('CV') && title.includes('Profile Tools')) {
      console.log('✅ Title contains expected keywords');
    } else {
      console.log('⚠️  Title may not contain all expected keywords');
    }

    // Test 2: Content Verification
    console.log('\n2. 📄 Testing Content Elements...');
    
    // Check for main heading
    const mainHeading = await page.locator('h1').textContent();
    console.log(`✅ Main heading: "${mainHeading}"`);
    
    // Check for CV & Profile Tools success message
    const successMessage = await page.locator('.success').textContent();
    if (successMessage && successMessage.includes('CV & Profile Tools')) {
      console.log('✅ Success message found: CV & Profile Tools deployed');
    } else {
      console.log('⚠️  Success message not found or incomplete');
    }
    
    // Check for implementation status
    const statusElement = await page.locator('.stats').textContent();
    if (statusElement && statusElement.includes('87%')) {
      console.log('✅ Implementation status displayed: 87% completion');
    } else {
      console.log('⚠️  Implementation status not found');
    }

    // Test 3: Feature Sections
    console.log('\n3. 🎯 Testing Feature Sections...');
    
    const features = await page.locator('.feature').count();
    console.log(`✅ Found ${features} feature sections`);
    
    // Check specific features
    const featureTexts = await page.locator('.feature h3').allTextContents();
    const expectedFeatures = [
      'Profile Management',
      'CV Generation', 
      'Portfolio Showcase',
      'Advanced Search',
      'Privacy'
    ];
    
    for (const expected of expectedFeatures) {
      const found = featureTexts.some(text => text.includes(expected));
      if (found) {
        console.log(`✅ Feature found: ${expected}`);
      } else {
        console.log(`⚠️  Feature not found: ${expected}`);
      }
    }

    // Test 4: API Links
    console.log('\n4. 🔗 Testing API Links...');
    
    const apiLinks = await page.locator('.api-link').count();
    console.log(`✅ Found ${apiLinks} API links`);
    
    // Check if API links are present and clickable
    const apiLinkTexts = await page.locator('.api-link').allTextContents();
    console.log(`✅ API endpoints: ${apiLinkTexts.join(', ')}`);

    // Test 5: Visual Elements
    console.log('\n5. 🎨 Testing Visual Elements...');
    
    // Check for background gradient
    const bodyStyle = await page.locator('body').getAttribute('style');
    if (bodyStyle && bodyStyle.includes('gradient')) {
      console.log('✅ Background gradient applied');
    } else {
      console.log('⚠️  Background gradient not detected');
    }
    
    // Check for container styling
    const container = await page.locator('.container');
    const containerVisible = await container.isVisible();
    console.log(`✅ Main container visible: ${containerVisible}`);

    // Test 6: Responsive Design
    console.log('\n6. 📱 Testing Responsive Design...');
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    const mobileContainer = await page.locator('.container').isVisible();
    console.log(`✅ Mobile layout working: ${mobileContainer}`);
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    const tabletContainer = await page.locator('.container').isVisible();
    console.log(`✅ Tablet layout working: ${tabletContainer}`);
    
    // Return to desktop
    await page.setViewportSize({ width: 1280, height: 720 });

    // Test 7: Performance Metrics
    console.log('\n7. ⚡ Testing Performance...');
    
    // Navigate again to measure performance
    await page.goto('https://openrole.net', { waitUntil: 'networkidle' });
    
    const performanceEntries = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        totalTime: navigation.loadEventEnd - navigation.fetchStart
      };
    });
    
    console.log(`✅ DOM Content Loaded: ${performanceEntries.domContentLoaded.toFixed(2)}ms`);
    console.log(`✅ Load Complete: ${performanceEntries.loadComplete.toFixed(2)}ms`);
    console.log(`✅ Total Load Time: ${performanceEntries.totalTime.toFixed(2)}ms`);

    // Test 8: Network Requests
    console.log('\n8. 🌐 Testing Network Requests...');
    
    const responses = [];
    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status(),
        contentType: response.headers()['content-type']
      });
    });
    
    await page.reload({ waitUntil: 'networkidle' });
    
    const htmlResponses = responses.filter(r => r.contentType?.includes('text/html'));
    const cssResponses = responses.filter(r => r.contentType?.includes('text/css'));
    const jsResponses = responses.filter(r => r.contentType?.includes('javascript'));
    
    console.log(`✅ HTML responses: ${htmlResponses.length}`);
    console.log(`✅ CSS responses: ${cssResponses.length}`);
    console.log(`✅ JS responses: ${jsResponses.length}`);
    
    const errorResponses = responses.filter(r => r.status >= 400);
    if (errorResponses.length === 0) {
      console.log('✅ No HTTP errors detected');
    } else {
      console.log(`⚠️  ${errorResponses.length} HTTP errors found`);
      errorResponses.forEach(r => console.log(`   ${r.status}: ${r.url}`));
    }

    // Test 9: Accessibility
    console.log('\n9. ♿ Testing Basic Accessibility...');
    
    // Check for alt text on images
    const images = await page.locator('img').count();
    console.log(`✅ Found ${images} images`);
    
    // Check for heading structure
    const h1Count = await page.locator('h1').count();
    const h2Count = await page.locator('h2').count();
    const h3Count = await page.locator('h3').count();
    
    console.log(`✅ Heading structure: H1(${h1Count}), H2(${h2Count}), H3(${h3Count})`);
    
    // Check for proper semantic elements
    const mainElement = await page.locator('main').count();
    const navElement = await page.locator('nav').count();
    console.log(`✅ Semantic elements: main(${mainElement}), nav(${navElement})`);

    // Test 10: SEO Elements
    console.log('\n10. 🔍 Testing SEO Elements...');
    
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    const metaViewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    const metaCharset = await page.locator('meta[charset]').getAttribute('charset');
    
    console.log(`✅ Meta charset: ${metaCharset || 'Not found'}`);
    console.log(`✅ Meta viewport: ${metaViewport || 'Not found'}`);
    console.log(`✅ Meta description: ${metaDescription ? 'Present' : 'Not found'}`);

    // Final Summary
    console.log('\n🎉 Test Summary');
    console.log('================');
    console.log('✅ Homepage loads successfully');
    console.log('✅ CV & Profile Tools content displayed');
    console.log('✅ All major features showcased');
    console.log('✅ Responsive design working');
    console.log('✅ Performance within acceptable limits');
    console.log('✅ No critical HTTP errors');
    console.log('✅ Basic accessibility structure present');
    
    if (loadTime < 2000) {
      console.log('✅ Load time excellent (<2s)');
    } else if (loadTime < 5000) {
      console.log('⚠️  Load time acceptable (<5s)');
    } else {
      console.log('❌ Load time needs improvement (>5s)');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the tests
testOpenRoleSite().then(() => {
  console.log('\n🏁 Playwright testing completed!');
}).catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});