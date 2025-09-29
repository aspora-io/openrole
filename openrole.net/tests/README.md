# OpenRole.net Playwright Tests

Comprehensive end-to-end testing suite for the OpenRole.net WordPress job platform.

## Setup

1. **Install dependencies**:
```bash
cd tests
npm install
npx playwright install
```

2. **Configure test environment**:
- Copy `.env.test.example` to `.env.test`
- Update credentials and URLs as needed

3. **Ensure WordPress is running**:
```bash
cd ..
./setup-local-dev.sh
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests with UI mode
```bash
npm run test:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:headed
```

### Debug tests
```bash
npm run test:debug
```

### Generate test code
```bash
npm run codegen
```

### View test report
```bash
npm run report
```

## Test Structure

- `01-setup.spec.ts` - Verifies WordPress installation and services
- `02-user-registration.spec.ts` - Tests user registration with roles
- `03-job-posting.spec.ts` - Tests mandatory salary fields
- `04-application-tracking.spec.ts` - Tests application status system
- `05-transparency-features.spec.ts` - Tests transparency features
- `06-mobile-responsive.spec.ts` - Tests mobile responsiveness
- `07-performance.spec.ts` - Tests page load performance

## Key Test Scenarios

### 1. Mandatory Salary Transparency
- Validates that salary fields are required
- Checks salary display on job listings
- Verifies schema markup includes salary

### 2. User Roles
- Tests employer vs job seeker registration
- Validates role-based permissions
- Checks dashboard access

### 3. Application Tracking
- Tests application submission
- Validates status updates
- Checks email notifications

### 4. Mobile Experience
- Tests responsive design
- Validates touch interactions
- Checks performance on mobile

## Writing New Tests

Use the test fixtures for common operations:

```typescript
import { test, expect } from './fixtures/test-fixtures';

test('should do something', async ({ page, wordpressPage, jobPage }) => {
  // Login
  await wordpressPage.login('admin', 'password');
  
  // Post a job
  await jobPage.postJob({
    title: 'Test Job',
    salaryMin: 50000,
    salaryMax: 80000,
    // ...
  });
});
```

## CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
- name: Run Playwright tests
  run: |
    cd tests
    npm ci
    npx playwright install
    npm test
  env:
    WP_BASE_URL: ${{ secrets.WP_BASE_URL }}
    WP_ADMIN_USER: ${{ secrets.WP_ADMIN_USER }}
    WP_ADMIN_PASS: ${{ secrets.WP_ADMIN_PASS }}
```

## Troubleshooting

1. **Tests failing to find pages**: Ensure WordPress pages are created with correct shortcodes
2. **Login failures**: Check user credentials in `.env.test`
3. **Timeout errors**: Increase timeout in `playwright.config.ts`
4. **Docker not accessible**: Ensure Docker Desktop is running

## Best Practices

1. Always check if elements exist before interacting
2. Use data-testid attributes for critical elements
3. Write tests that work on fresh WordPress installations
4. Include performance metrics in critical user flows
5. Test both logged-in and anonymous user experiences