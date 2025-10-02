# OpenRole Static Site - Playwright Test Suite

This comprehensive test suite validates all functionality of the OpenRole static site using Playwright.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install
```

Or use the combined setup command:
```bash
npm run test:setup
```

## Running Tests

### Run all tests with local server
```bash
npm run test:all
```

### Run tests manually

1. Start the static server in one terminal:
```bash
npm run serve
```

2. Run tests in another terminal:
```bash
npm test
```

### Other test commands

- **Headed mode** (see browser): `npm run test:headed`
- **UI mode** (interactive): `npm run test:ui`
- **Debug mode**: `npm run test:debug`
- **View test report**: `npm run test:report`

## Test Coverage

The test suite includes:

1. **Navigation Tests** (`01-navigation.spec.ts`)
   - Main navigation links
   - Footer navigation
   - Logo navigation
   - Navigation persistence

2. **Job Seeker Flow** (`02-job-seeker-flow.spec.ts`)
   - Complete job search journey
   - Job filtering and search
   - Job detail page
   - Save job functionality

3. **Employer Flow** (`03-employer-flow.spec.ts`)
   - Employer journey from home to pricing
   - Registration flow
   - Pricing page elements
   - Benefits and features

4. **Authentication** (`04-authentication-flow.spec.ts`)
   - Login form and validation
   - Registration form and validation
   - User type selection (job seeker/employer)
   - Password requirements
   - Navigation between login/register

5. **Form Interactions** (`05-form-interactions.spec.ts`)
   - Job search form
   - Advanced filters
   - CV upload form
   - File upload validation
   - Contact form
   - Newsletter subscription

6. **Responsive Navigation** (`06-responsive-navigation.spec.ts`)
   - Mobile menu functionality
   - Tablet navigation
   - Keyboard navigation
   - Multiple viewport sizes
   - Orientation changes

7. **Page Loading & Errors** (`07-page-loading-errors.spec.ts`)
   - All pages load successfully
   - Resource loading (CSS/JS)
   - 404 error handling
   - Performance metrics
   - SEO meta tags

8. **Footer Links** (`08-footer-links.spec.ts`)
   - Company links
   - Job seeker links
   - Employer links
   - Legal/policy links
   - Social media links
   - Contact information

## Configuration

Tests are configured in `playwright.config.ts` with:
- Multiple browser support (Chrome, Firefox, Safari, Edge)
- Mobile device testing
- Automatic screenshot/video on failure
- HTML reporting
- Local server integration

## Debugging Failed Tests

1. **View test report**:
```bash
npm run test:report
```

2. **Run specific test file**:
```bash
npx playwright test e2e/01-navigation.spec.ts
```

3. **Run with debug mode**:
```bash
npx playwright test --debug
```

4. **Check screenshots/videos** in:
   - `test-results/` - Failed test artifacts
   - `playwright-report/` - HTML report with all details

## CI/CD Integration

The tests can be integrated into CI/CD pipelines. Example GitHub Actions workflow:

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run tests
  run: npm run test:all

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## Troubleshooting

### Port already in use
If port 8080 is already in use, change it in:
- `serve-static.js` - Update `PORT` variable
- `playwright.config.ts` - Update `baseURL` and `webServer.url`

### Tests timing out
Increase timeout in `playwright.config.ts`:
```typescript
use: {
  timeout: 60000, // 60 seconds
}
```

### Browser not installed
Run: `npx playwright install <browser-name>`

## Adding New Tests

1. Create new test file in `e2e/` directory
2. Follow naming convention: `XX-feature-name.spec.ts`
3. Import Playwright test utilities:
```typescript
import { test, expect } from '@playwright/test';
```

4. Structure tests with describe blocks:
```typescript
test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    // Test implementation
  });
});
```