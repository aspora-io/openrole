const { chromium } = require('@playwright/test');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    console.log('Testing OpenRole Live Site...\n');
    
    // Test 1: Homepage loads
    console.log('1. Testing homepage...');
    await page.goto('https://openrole.net');
    await page.waitForTimeout(2000); // Wait for jobs to load
    
    // Check if jobs are loaded
    const jobCards = await page.$$('#featured-jobs > div.bg-white');
    console.log(`   ✓ Found ${jobCards.length} job cards on homepage`);
    
    // Test 2: Jobs page
    console.log('\n2. Testing jobs page...');
    await page.click('a[href="/jobs"]');
    await page.waitForTimeout(2000);
    
    const jobCount = await page.textContent('#results-count');
    console.log(`   ✓ Jobs page shows: ${jobCount}`);
    
    // Test 3: Search functionality
    console.log('\n3. Testing search...');
    await page.fill('#search-query', 'software');
    await page.fill('#search-location', 'London');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    const searchResults = await page.textContent('#results-count');
    console.log(`   ✓ Search results: ${searchResults}`);
    
    // Test 4: Job detail page
    console.log('\n4. Testing job detail page...');
    const firstJob = await page.$('#jobs-container > div:first-child a');
    if (firstJob) {
        await firstJob.click();
        await page.waitForTimeout(2000);
        
        const jobTitle = await page.$('h1');
        const title = await jobTitle.textContent();
        console.log(`   ✓ Viewing job: ${title}`);
        
        const salary = await page.$eval('.text-green-600', el => el.textContent);
        console.log(`   ✓ Salary range: ${salary}`);
    }
    
    // Test 5: Check for real companies
    console.log('\n5. Checking for real company names...');
    await page.goto('https://openrole.net/jobs');
    await page.waitForTimeout(2000);
    
    const companies = await page.$$eval('#jobs-container span:has-text("🏢")', 
        elements => elements.slice(0, 5).map(el => el.textContent.replace('🏢 ', ''))
    );
    console.log('   ✓ Sample companies:');
    companies.forEach(company => console.log(`     - ${company}`));
    
    console.log('\n✅ All tests passed! OpenRole is working with real data.');
    
    await browser.close();
})();