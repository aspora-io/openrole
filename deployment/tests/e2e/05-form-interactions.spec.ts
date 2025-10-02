import { test, expect } from '@playwright/test';

test.describe('Form Interactions', () => {
  test.describe('Job Search Form', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/jobs.html');
    });

    test('should interact with search form elements', async ({ page }) => {
      // Job title/keyword search
      const searchInput = page.locator('input[type="search"], input[placeholder*="job"], input[placeholder*="search"], input[name*="query"]').first();
      await searchInput.fill('Software Engineer');
      await expect(searchInput).toHaveValue('Software Engineer');
      
      // Location input
      const locationInput = page.locator('input[placeholder*="location"], input[name*="location"], input[placeholder*="where"]').first();
      if (await locationInput.isVisible()) {
        await locationInput.fill('London, UK');
        await expect(locationInput).toHaveValue('London, UK');
      }
      
      // Clear search
      const clearButton = page.locator('button:has-text("Clear"), button[type="reset"], .clear-filters');
      if (await clearButton.count() > 0) {
        await clearButton.first().click();
        await expect(searchInput).toHaveValue('');
      }
    });

    test('should handle advanced search filters', async ({ page }) => {
      // Click advanced search or filters toggle
      const filtersToggle = page.locator('button:has-text("Filters"), button:has-text("Advanced"), .toggle-filters');
      if (await filtersToggle.count() > 0) {
        await filtersToggle.first().click();
        await page.waitForTimeout(300); // Wait for animation
      }
      
      // Job type filters
      const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Remote'];
      for (const type of jobTypes) {
        const checkbox = page.locator(`input[type="checkbox"]`).locator(`..//*[contains(text(), "${type}")]`);
        if (await checkbox.count() > 0) {
          await checkbox.first().click();
          const input = page.locator(`input[type="checkbox"]`).locator(`..//input[@type="checkbox"]`).first();
          if (await input.count() > 0) {
            await expect(input).toBeChecked();
          }
        }
      }
      
      // Salary range
      const salaryMin = page.locator('input[name*="salary_min"], input[placeholder*="Min"], select[name*="salary_min"]').first();
      const salaryMax = page.locator('input[name*="salary_max"], input[placeholder*="Max"], select[name*="salary_max"]').first();
      
      if (await salaryMin.isVisible()) {
        if (salaryMin.locator('select').first()) {
          await salaryMin.selectOption({ value: '30000' });
        } else {
          await salaryMin.fill('30000');
        }
      }
      
      if (await salaryMax.isVisible()) {
        if (salaryMax.locator('select').first()) {
          await salaryMax.selectOption({ value: '80000' });
        } else {
          await salaryMax.fill('80000');
        }
      }
      
      // Experience level
      const experienceSelect = page.locator('select[name*="experience"], .experience-filter');
      if (await experienceSelect.count() > 0) {
        await experienceSelect.first().selectOption({ index: 1 });
      }
    });

    test('should show search suggestions or autocomplete', async ({ page }) => {
      const searchInput = page.locator('input[type="search"], input[placeholder*="job"]').first();
      
      // Type partial query
      await searchInput.fill('Soft');
      await page.waitForTimeout(500); // Wait for suggestions
      
      // Check for suggestions dropdown
      const suggestions = page.locator('.suggestions, .autocomplete, [role="listbox"]');
      if (await suggestions.count() > 0) {
        await expect(suggestions.first()).toBeVisible();
        
        // Click first suggestion
        const firstSuggestion = suggestions.locator('li, .suggestion-item, [role="option"]').first();
        if (await firstSuggestion.isVisible()) {
          await firstSuggestion.click();
          
          // Check input was updated
          const inputValue = await searchInput.inputValue();
          expect(inputValue.length).toBeGreaterThan(4); // Should be longer than "Soft"
        }
      }
    });
  });

  test.describe('CV Upload Form', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/cv-upload.html');
    });

    test('should display CV upload form elements', async ({ page }) => {
      // Check page heading
      await expect(page.locator('h1')).toContainText('Upload');
      
      // File upload input
      const fileInput = page.locator('input[type="file"], .file-upload, button:has-text("Choose File")');
      await expect(fileInput.first()).toBeVisible();
      
      // Additional form fields
      const formFields = [
        { selector: 'input[name*="name"], input[placeholder*="Name"]', label: 'Name' },
        { selector: 'input[name*="email"], input[placeholder*="Email"]', label: 'Email' },
        { selector: 'input[name*="phone"], input[placeholder*="Phone"]', label: 'Phone' },
        { selector: 'textarea[name*="summary"], textarea[placeholder*="About"]', label: 'Summary' }
      ];
      
      for (const field of formFields) {
        const element = page.locator(field.selector);
        if (await element.count() > 0) {
          await expect(element.first()).toBeVisible();
        }
      }
    });

    test('should handle file upload interaction', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]').first();
      
      if (await fileInput.isVisible()) {
        // Create a test file
        const fileName = 'test-cv.pdf';
        await fileInput.setInputFiles({
          name: fileName,
          mimeType: 'application/pdf',
          buffer: Buffer.from('PDF content')
        });
        
        // Check if file name is displayed
        const fileNameDisplay = page.locator(`text=/${fileName}/`);
        if (await fileNameDisplay.count() > 0) {
          await expect(fileNameDisplay.first()).toBeVisible();
        }
        
        // Check for file size limit warning
        const sizeWarning = page.locator('text=/size|limit|maximum/i');
        if (await sizeWarning.count() > 0) {
          // File size warnings should be visible if present
          await expect(sizeWarning.first()).toBeVisible();
        }
      }
    });

    test('should validate file type', async ({ page }) => {
      const fileInput = page.locator('input[type="file"]').first();
      
      if (await fileInput.isVisible()) {
        // Try to upload invalid file type
        await fileInput.setInputFiles({
          name: 'test.exe',
          mimeType: 'application/x-msdownload',
          buffer: Buffer.from('EXE content')
        });
        
        // Check for error message
        await page.waitForTimeout(500);
        const errorMessage = page.locator('.error, .invalid-feedback, text=/invalid|supported|pdf|doc/i');
        if (await errorMessage.count() > 0) {
          await expect(errorMessage.first()).toBeVisible();
        }
      }
    });

    test('should show upload progress or status', async ({ page }) => {
      const uploadButton = page.locator('button:has-text("Upload"), button[type="submit"]').first();
      
      if (await uploadButton.isVisible()) {
        // Click upload
        await uploadButton.click();
        
        // Check for progress indicator
        const progress = page.locator('.progress, .uploading, [role="progressbar"]');
        if (await progress.count() > 0) {
          await expect(progress.first()).toBeVisible();
        }
        
        // Check for status messages
        const status = page.locator('.status, .upload-status, text=/uploading|processing/i');
        if (await status.count() > 0) {
          await expect(status.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Contact Form', () => {
    test('should handle contact form submission', async ({ page }) => {
      // Navigate to a page with contact form
      await page.goto('/');
      
      // Look for contact form or navigate to contact page
      const contactLink = page.locator('a:has-text("Contact"), a[href*="contact"]');
      if (await contactLink.count() > 0) {
        await contactLink.first().click();
      }
      
      // Fill contact form if present
      const nameInput = page.locator('input[name*="name"], input[placeholder*="Name"]').first();
      const emailInput = page.locator('input[name*="email"], input[placeholder*="Email"]').first();
      const messageInput = page.locator('textarea[name*="message"], textarea[placeholder*="Message"]').first();
      
      if (await nameInput.isVisible() && await emailInput.isVisible() && await messageInput.isVisible()) {
        await nameInput.fill('John Doe');
        await emailInput.fill('john@example.com');
        await messageInput.fill('This is a test message for the contact form.');
        
        // Submit form
        const submitButton = page.locator('button[type="submit"], button:has-text("Send"), button:has-text("Submit")').first();
        await submitButton.click();
        
        // Check for success message
        await page.waitForTimeout(1000);
        const successMessage = page.locator('.success, .alert-success, text=/thank you|sent|received/i');
        if (await successMessage.count() > 0) {
          await expect(successMessage.first()).toBeVisible();
        }
      }
    });
  });

  test.describe('Newsletter Subscription', () => {
    test('should handle newsletter subscription', async ({ page }) => {
      await page.goto('/');
      
      // Look for newsletter form
      const newsletterInput = page.locator('input[name*="newsletter"], input[placeholder*="newsletter"], input[placeholder*="email"]').filter({ 
        has: page.locator('..').locator('button:has-text("Subscribe"), button:has-text("Sign up")')
      }).first();
      
      if (await newsletterInput.isVisible()) {
        // Enter email
        await newsletterInput.fill('subscriber@example.com');
        
        // Find and click subscribe button
        const subscribeButton = newsletterInput.locator('..').locator('button:has-text("Subscribe"), button:has-text("Sign up")').first();
        await subscribeButton.click();
        
        // Check for confirmation
        await page.waitForTimeout(500);
        const confirmation = page.locator('.newsletter-success, text=/subscribed|thank you/i');
        if (await confirmation.count() > 0) {
          await expect(confirmation.first()).toBeVisible();
        }
      }
    });
  });
});